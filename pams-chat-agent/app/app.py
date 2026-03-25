from __future__ import annotations

import glob
import json
import os
import time
import uuid
import traceback
from typing import Any

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

from app.agents.agent_router import ask_auto_agent_sync
from app.services.db import get_rag_conn
from app.services.llm_client import llm_generate

app = Flask(__name__)


def _json_error(msg: str, code: int = 400):
    return jsonify({"error": msg}), code


def _read_json_payload() -> dict:
    payload = request.get_json(force=True, silent=True)
    if payload is not None:
        return payload

    raw = request.get_data(cache=False) or b""
    try:
        return json.loads(raw.decode("utf-8", errors="strict"))
    except Exception:
        try:
            return json.loads(raw.decode("utf-8", errors="replace"))
        except Exception:
            return {}


def _openai_response(content: str, model: str = "pams-agent"):
    return jsonify(
        {
            "id": f"chatcmpl-{uuid.uuid4().hex}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": content},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }
    )


@app.errorhandler(Exception)
def handle_exception(e):
    return (
        jsonify(
            {
                "error": str(e),
                "type": e.__class__.__name__,
                "trace": traceback.format_exc().splitlines()[-30:],
            }
        ),
        500,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# RAG ingest - async background jobs
# ---------------------------------------------------------------------------
_ingest_jobs: dict[str, Any] = {}


def _run_ingest_job(job_id: str, new_files: list[str], skipped: int, force: bool):
    """Background thread: ingest PDFs without request timeout."""
    from app.services.doc_ingest import ingest_pdf

    _ingest_jobs[job_id]["status"] = "running"
    ingested, errors = 0, []
    for path in new_files:
        try:
            ingest_pdf(path, force=force)
            ingested += 1
        except Exception as exc:
            errors.append({"file": os.path.basename(path), "error": str(exc)})
    _ingest_jobs[job_id].update(
        {
            "status": "done",
            "result": {
                "total": len(new_files) + skipped,
                "new": ingested,
                "skipped": skipped,
                "errors": errors,
                "new_files": [os.path.basename(p) for p in new_files],
            },
        }
    )


@app.post("/ingest/sync")
def ingest_sync():
    """Detect new PDFs and ingest in background. Returns 202 + job_id."""
    import threading
    from app.services.doc_ingest import sha256_file

    payload = _read_json_payload()
    directory = (payload.get("dir") or "data/docs").strip()
    force = bool(payload.get("force", False))

    if not os.path.isabs(directory):
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        directory = os.path.join(project_root, directory)

    pdfs = sorted(glob.glob(os.path.join(directory, "*.pdf")))
    if not pdfs:
        return (
            jsonify(
                {
                    "total": 0,
                    "new": 0,
                    "skipped": 0,
                    "errors": [],
                    "message": f"No PDF found in '{directory}'",
                }
            ),
            200,
        )

    new_files, skipped = [], 0
    if not force:
        try:
            conn = get_rag_conn()
            try:
                with conn.cursor() as cur:
                    for path in pdfs:
                        sha = sha256_file(path)
                        cur.execute(
                            """
                            SELECT d.id
                            FROM doc_document d
                            WHERE d.sha256 = %s
                              AND EXISTS (
                                  SELECT 1 FROM doc_chunk c WHERE c.document_id = d.id
                              )
                            """,
                            (sha,),
                        )
                        if cur.fetchone():
                            skipped += 1
                        else:
                            new_files.append(path)
            finally:
                conn.close()
        except Exception as exc:
            app.logger.warning(f"[ingest/sync] DB check failed ({exc}), ingesting all.")
            new_files = list(pdfs)
            skipped = 0
    else:
        new_files = list(pdfs)

    if not new_files:
        return (
            jsonify(
                {
                    "total": len(pdfs),
                    "new": 0,
                    "skipped": skipped,
                    "errors": [],
                    "new_files": [],
                    "directory": directory,
                    "message": "All PDFs already ingested.",
                }
            ),
            200,
        )

    job_id = uuid.uuid4().hex
    _ingest_jobs[job_id] = {"status": "pending", "result": None}

    t = threading.Thread(
        target=_run_ingest_job,
        args=(job_id, new_files, skipped, force),
        daemon=True,
    )
    t.start()

    return (
        jsonify(
            {
                "job_id": job_id,
                "status": "pending",
                "new": len(new_files),
                "new_files": [os.path.basename(p) for p in new_files],
                "skipped": skipped,
                "directory": directory,
                "status_url": f"/ingest/status/{job_id}",
            }
        ),
        202,
    )


@app.get("/ingest/status/<job_id>")
def ingest_status(job_id: str):
    job = _ingest_jobs.get(job_id)
    if job is None:
        return _json_error(f"Job '{job_id}' not found.", 404)
    return jsonify({"job_id": job_id, **job})


# ---------------------------------------------------------------------------
# Document upload + listing
# ---------------------------------------------------------------------------
@app.post("/documents/upload")
def documents_upload():
    file = request.files.get("file")
    if not file:
        return _json_error("file is required", 400)

    filename = secure_filename(file.filename or "")
    if not filename:
        return _json_error("invalid filename", 400)

    title = (request.form.get("title") or filename).strip()
    directory = (request.form.get("dir") or "data/docs").strip()

    if not os.path.isabs(directory):
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        directory = os.path.join(project_root, directory)

    os.makedirs(directory, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path = os.path.join(directory, unique_name)
    file.save(save_path)

    from app.services.doc_ingest import ingest_pdf
    doc_id = ingest_pdf(save_path, title=title)

    return jsonify({
        "id": doc_id,
        "title": title,
        "filename": unique_name,
        "path": save_path,
    })


@app.get("/documents/list")
def documents_list():
    query = (request.args.get("q") or "").strip()

    with get_rag_conn() as conn:
        with conn.cursor() as cur:
            if query:
                cur.execute(
                    """
                    SELECT id, title, source_path, created_at
                    FROM doc_document
                    WHERE LOWER(title) LIKE LOWER(%s)
                    ORDER BY created_at DESC NULLS LAST, id DESC
                    LIMIT 200
                    """,
                    (f"%{query}%",),
                )
            else:
                cur.execute(
                    """
                    SELECT id, title, source_path, created_at
                    FROM doc_document
                    ORDER BY created_at DESC NULLS LAST, id DESC
                    LIMIT 200
                    """
                )

            rows = cur.fetchall()

    # Ajout du sha256 dans la requête SQL et la réponse
    # Il faut modifier la requête SQL pour sélectionner sha256
    # On adapte les deux requêtes ci-dessus
    with get_rag_conn() as conn:
        with conn.cursor() as cur:
            if query:
                cur.execute(
                    """
                    SELECT id, title, source_path, created_at, sha256
                    FROM doc_document
                    WHERE LOWER(title) LIKE LOWER(%s)
                    ORDER BY created_at DESC NULLS LAST, id DESC
                    LIMIT 200
                    """,
                    (f"%{query}%",),
                )
            else:
                cur.execute(
                    """
                    SELECT id, title, source_path, created_at, sha256
                    FROM doc_document
                    ORDER BY created_at DESC NULLS LAST, id DESC
                    LIMIT 200
                    """
                )

            rows = cur.fetchall()

    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "title": row[1],
            "path": row[2],
            "date": str(row[3]) if row[3] else None,
            "sha256": row[4],
        })

    return jsonify(results)


# ---------------------------------------------------------------------------
# Agent API
# ---------------------------------------------------------------------------
@app.post("/agents/ask")
def agents_ask():
    """Route question to the right agent (fonds or projet)."""
    payload = _read_json_payload()
    question = (payload.get("question") or "").strip()
    if not question:
        return _json_error("Field 'question' is required.", 400)

    try:
        answer, agent_used = ask_auto_agent_sync(question)
        return jsonify({"answer": answer, "agent": agent_used})
    except Exception as exc:
        import traceback
        print("\n--- Exception in /agents/ask ---")
        print(traceback.format_exc())
        print("-------------------------------\n")
        return _json_error(f"Agent error: {exc}", 500)


@app.get("/llm-health")
def llm_health():
    out = llm_generate("Reply only with OK.")
    return jsonify({"ok": True, "reply": out})


@app.get("/v1/models")
def v1_models():
    _ts = int(time.time())
    return jsonify(
        {
            "object": "list",
            "data": [
                {
                    "id": "pams-agent",
                    "object": "model",
                    "created": _ts,
                    "owned_by": "local",
                    "description": "Agent PAMS: routes to fonds or projet agents.",
                },
                {
                    "id": "pams-chat-agent",
                    "object": "model",
                    "created": _ts,
                    "owned_by": "local",
                    "description": "Alias of pams-agent for compatibility.",
                },
            ],
        }
    )


@app.post("/v1/chat/completions")
def v1_chat_completions():
    payload = _read_json_payload()
    messages = payload.get("messages") or []
    model = payload.get("model") or "pams-agent"

    user_text = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            user_text = (m.get("content") or "").strip()
            break

    if not user_text:
        return _json_error("No user message found", 400)

    answer, _agent_used = ask_auto_agent_sync(user_text)
    return _openai_response(answer, model=model)


@app.post("/chat")
def chat():
    payload = _read_json_payload()
    question = (payload.get("question") or "").strip()
    if not question:
        return _json_error("question is required", 400)

    answer, agent_used = ask_auto_agent_sync(question)
    return jsonify({"answer": answer, "agent": agent_used})
