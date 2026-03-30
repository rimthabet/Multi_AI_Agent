import json
import sys
import os
import re

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from mcp.server.fastmcp import FastMCP
from app.services.doc_search import doc_search
from app.services.db import get_rag_conn

mcp = FastMCP(
    name="docs-agent",
    instructions="Serveur MCP documents. Utilise search_docs pour répondre aux questions sur les PDFs, list_documents pour lister les documents disponibles, get_document_chunks pour récupérer tous les chunks d'un document précis.",
)


@mcp.tool()
def search_docs(query: str, fonds_name: str = "", top_k: int = 6) -> str:
    """
    Recherche sémantique/vectorielle dans les documents PDF.
    """
    combined = f"{fonds_name} {query}".strip() if fonds_name else query
    chunks = doc_search(combined, top_k=top_k)

    if not chunks:
        return json.dumps(
            {"message": f"Aucun document trouvé pour : '{combined}'"},
            ensure_ascii=False,
        )

    results = []
    for c in chunks:
        results.append({
            "source":  c.get("title", "Document inconnu"),
            "page":    c.get("page_start"),
            "score":   round(c.get("score", 0), 3),
            "contenu": c.get("text", "")[:2000],
        })

    return json.dumps(results, ensure_ascii=False, default=str)


@mcp.tool()
def list_documents(fonds_name: str = "", doc_type: str = "") -> str:
    try:
        with get_rag_conn() as conn:
            with conn.cursor() as cur:

                if fonds_name.strip():
                    words = [w for w in fonds_name.strip().split() if len(w) > 2]
                    if words:
                        conditions = " AND ".join(
                            ["LOWER(title) LIKE LOWER(%s)"] * len(words)
                        )
                        params = [f"%{w}%" for w in words]
                        cur.execute(
                            f"""
                            SELECT id, title, source_path, created_at, sha256
                            FROM doc_document
                            WHERE {conditions}
                            ORDER BY created_at DESC
                            LIMIT 50
                            """,
                            params,
                        )
                    else:
                        cur.execute(
                            """
                            SELECT id, title, source_path, created_at, sha256
                            FROM doc_document
                            WHERE LOWER(title) LIKE LOWER(%s)
                            ORDER BY created_at DESC
                            LIMIT 50
                            """,
                            (f"%{fonds_name.strip()}%",),
                        )
                else:
                    cur.execute(
                        """
                        SELECT id, title, source_path, created_at, sha256
                        FROM doc_document
                        ORDER BY created_at DESC
                        LIMIT 50
                        """
                    )

                rows = cur.fetchall()

                if not rows:
                    msg = "Aucun document trouvé"
                    if fonds_name:
                        msg += f" pour le fonds '{fonds_name}'"
                    return json.dumps({"message": msg}, ensure_ascii=False)

                results = []
                for row in rows:
                    results.append({
                        "id": row[0],
                        "titre": row[1],
                        "path": row[2],
                        "date": str(row[3]) if row[3] else None,
                        "sha256": row[4],
                    })

                return json.dumps(results, ensure_ascii=False, default=str)

    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)


@mcp.tool()
def get_document_chunks(document_title: str = "", sha256: str = "") -> str:
    """
    Récupère TOUS les chunks d'un document précis, sans ranking sémantique.

    Priorité :
    1. sha256 si fourni
    2. sinon title exact / proche
    """
    try:
        with get_rag_conn() as conn:
            with conn.cursor() as cur:
                if sha256.strip():
                    cur.execute(
                        """
                        SELECT
                            d.id,
                            d.title,
                            d.sha256,
                            c.page_start,
                            c.page_end,
                            c.text,
                            c.metadata
                        FROM doc_document d
                        JOIN doc_chunk c ON c.document_id = d.id
                        WHERE LOWER(d.sha256) = LOWER(%s)
                        ORDER BY c.page_start ASC NULLS LAST, c.id ASC
                        """,
                        (sha256.strip(),),
                    )
                elif document_title.strip():
                    normalized_title = document_title.strip()

                    cur.execute(
                        """
                        SELECT
                            d.id,
                            d.title,
                            d.sha256,
                            c.page_start,
                            c.page_end,
                            c.text,
                            c.metadata
                        FROM doc_document d
                        JOIN doc_chunk c ON c.document_id = d.id
                        WHERE LOWER(REPLACE(d.title, '_', ' ')) LIKE LOWER(%s)
                        ORDER BY c.page_start ASC NULLS LAST, c.id ASC
                        """,
                        (f"%{normalized_title.replace('_', ' ')}%",),
                    )
                else:
                    return json.dumps(
                        {"message": "Aucun identifiant de document fourni."},
                        ensure_ascii=False,
                    )

                rows = cur.fetchall()

                if not rows:
                    return json.dumps(
                        {"message": "Aucun chunk trouvé pour ce document."},
                        ensure_ascii=False,
                    )

                results = []
                for row in rows:
                    metadata = row[6] if isinstance(row[6], dict) else {}
                    results.append({
                        "document_id": row[0],
                        "source": row[1],
                        "sha256": row[2],
                        "page": row[3],
                        "page_end": row[4],
                        "contenu": row[5] or "",
                        "metadata": metadata,
                    })

                return json.dumps(results, ensure_ascii=False, default=str)

    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run(transport="stdio")