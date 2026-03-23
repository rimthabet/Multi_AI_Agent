import asyncio
import json
import re
import sys
import os
import warnings

warnings.filterwarnings("ignore", message=".*create_react_agent.*")
warnings.filterwarnings("ignore", message=".*LangGraphDeprecated.*")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from langchain_ollama import ChatOllama
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from app.config import Config

from app.mcp.docs_server import list_documents as _list_documents
from app.mcp.docs_server import search_docs as _search_docs

_MCP_SERVER_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../mcp/docs_server.py")
)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

_SYSTEM_PROMPT = """Tu es un agent francophone spécialisé dans les documents de fonds d'investissement tunisiens.
LANGUE : Tu réponds EXCLUSIVEMENT en français. Jamais en anglais, jamais en arabe, jamais en chinois.
COMPORTEMENT OBLIGATOIRE :
- Pour toute question sur le contenu → appelle search_docs()
- Pour lister les documents → appelle list_documents()
- Ne réponds JAMAIS sans avoir appelé un outil d'abord

RÈGLES STRICTES :
- Tu utilises UNIQUEMENT les informations présentes dans les extraits retournés par les outils
- Tu n'inventes JAMAIS de données (montants, dates, durées, pourcentages)
- Cite toujours la source (titre du document, page si disponible)

RÈGLE CRITIQUE — SI LE DOCUMENT DEMANDÉ N'EST PAS TROUVÉ :
Si l'utilisateur demande un type de document (bilan, rapport annuel, états financiers, PV...)
et que les outils retournent un document d'un autre type (prospectus, règlement intérieur...),
tu DOIS répondre exactement selon ce modèle :

"Le document disponible pour ce fonds est le [NOM DU DOCUMENT TROUVÉ] ([détails si disponibles]),
qui contient [ce que le document contient réellement] — pas [ce qui était demandé].
Si vous souhaitez [ce qui était demandé], il faut ingérer ce document dans le système."

EXEMPLES DE RÉPONSES CORRECTES :
- Demande : "bilan de FCPR MAXULA JASMIN" → documents trouvés : prospectus
  Réponse : "Le document disponible pour ce fonds est le Prospectus (agréé par le CMF le 15 juin 2017),
  qui contient la politique d'investissement, les frais, les modalités de souscription et de rachat
  — pas un bilan financier.
  Si vous souhaitez le bilan financier, il faut ingérer les états financiers annuels du fonds."

- Demande : "rapport annuel de FCPR MAX ESPOIR" → aucun document trouvé
  Réponse : "Aucun document n'est disponible pour le fonds FCPR MAX ESPOIR dans le système.
  Si vous souhaitez consulter le rapport annuel, il faut l'ingérer dans le système."

- Demande : "PV du comité" → documents trouvés : règlement intérieur
  Réponse : "Le document disponible est le Règlement Intérieur, qui contient les modalités
  de fonctionnement du fonds — pas les PV du comité.
  Si vous souhaitez consulter les PV, il faut les ingérer dans le système."
"""

_REQUESTED_DOC_PATTERNS = [
    ("bilan financier", r"\b(bilan|etats?\s+financiers|etats?\s+financi[eè]rs|états?\s+financiers)\b"),
    ("rapport annuel", r"\b(rapport\s+annuel|rapport)\b"),
    ("pv", r"\b(pv|proc[eè]s[-\s]?verbal|proces[-\s]?verbal)\b"),
    ("prospectus", r"\bprospectus\b"),
    ("reglement interieur", r"\b(règlement|reglement)\b"),
    ("situation annuelle", r"\bsituation\s+annuelle\b"),
]

_DOC_KIND_DESCRIPTIONS = {
    "prospectus": "la politique d'investissement, les frais, les modalités de souscription et de rachat",
    "reglement interieur": "les modalités de fonctionnement du fonds",
    "pv": "les décisions et résolutions du comité",
    "rapport annuel": "les informations de gestion et résultats de l'exercice",
    "bilan financier": "les états financiers annuels du fonds",
    "situation annuelle": "la situation annuelle du fonds",
    "document": "des informations générales sur le fonds",
}

_REQUESTED_DOC_LABELS = {
    "bilan financier": "un bilan financier",
    "rapport annuel": "un rapport annuel",
    "pv": "les PV du comité",
    "prospectus": "le prospectus",
    "reglement interieur": "le règlement intérieur",
    "situation annuelle": "la situation annuelle",
}

_REQUESTED_DOC_INGEST_HINTS = {
    "bilan financier": "les états financiers annuels du fonds",
    "rapport annuel": "le rapport annuel du fonds",
    "pv": "les PV du comité",
    "prospectus": "le prospectus du fonds",
    "reglement interieur": "le règlement intérieur du fonds",
    "situation annuelle": "la situation annuelle du fonds",
}


def _augment_question(question: str) -> str:
    q = question.lower().strip()

    if any(w in q for w in ["liste", "quels documents", "disponible", "lister"]):
        return (
            f"{question}\n\n"
            "[ACTION : appelle list_documents() pour lister les documents disponibles. "
            "Réponds en français.]"
        )

    return (
        f"{question}\n\n"
        "[ACTION : appelle search_docs() avec la question et le nom du fonds si mentionné. "
        "Si le document trouvé n'est pas celui demandé, explique ce qui est disponible "
        "et ce qui manque selon le modèle défini. Réponds UNIQUEMENT en français.]"
    )

def _is_list_documents_question(question: str) -> bool:
    q = (question or "").lower()
    return any(w in q for w in ["liste", "lister", "documents", "document", "disponible", "disponibles"])


def _extract_fund_name(question: str) -> str:
    q = (question or "").strip()

    m = re.search(r"\b(FCPR|FCP|FCPI|SICAV)\s+([A-Za-z0-9\-\s]+)", q, re.IGNORECASE)
    if m:
        name = (m.group(1) + " " + m.group(2)).strip()
    else:
        m = re.search(r"\bfonds?\s+(?P<name>.+)$", q, re.IGNORECASE)
        name = m.group("name").strip() if m else ""

    if not name:
        return ""

    name = re.split(r"\b(document|documents|disponible|disponibles|liste|lister|rapport|bilan|prospectus|pv|pdf)\b", name, 1, flags=re.IGNORECASE)[0]
    name = re.sub(r"[?.!,;]+$", "", name).strip()
    return name


def _format_documents_list(result_json: str) -> str:
    try:
        data = json.loads(result_json)
    except Exception:
        return "Aucun document trouvé."

    if isinstance(data, dict) and data.get("message"):
        return data["message"]

    if not isinstance(data, list) or not data:
        return "Aucun document trouvé."

    lines = ["Voici les documents disponibles :\n"]
    for i, row in enumerate(data, 1):
        
        title = row.get("titre") or row.get("title") or "Document"

        
        title = re.sub(r"\.pdf$", "", title, flags=re.IGNORECASE)

       
        title = title.replace("_", " ").strip()

        lines.append(f"{i}. {title}")

    return "\n".join(lines)


def _extract_requested_doc_kind(question: str) -> str:
    q = (question or "").lower()
    for kind, pattern in _REQUESTED_DOC_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE):
            return kind
    return ""


def _infer_doc_kind(title: str, doc_type: str) -> str:
    haystack = f"{title} {doc_type}".lower()
    for kind, pattern in _REQUESTED_DOC_PATTERNS:
        if re.search(pattern, haystack, re.IGNORECASE):
            return kind
    return "document"


def _parse_documents_list(result_json: str) -> list[dict]:
    try:
        data = json.loads(result_json)
    except Exception:
        return []

    if isinstance(data, dict):
        return []

    if isinstance(data, list):
        return data

    return []


def _format_doc_details(doc: dict) -> str:
    parts = []
    doc_type = (doc.get("type") or "").strip()
    doc_date = (doc.get("date") or "").strip()
    doc_page = doc.get("page")
    if doc_type:
        parts.append(f"type: {doc_type}")
    if doc_date:
        parts.append(f"date: {doc_date}")
    if doc_page:
        parts.append(f"page: {doc_page}")
    return ", ".join(parts)


def _doc_matches_requested(doc: dict, requested_kind: str) -> bool:
    title = doc.get("titre") or doc.get("title") or doc.get("source") or ""
    doc_type = doc.get("type") or ""
    haystack = f"{title} {doc_type}".lower()
    for kind, pattern in _REQUESTED_DOC_PATTERNS:
        if kind == requested_kind and re.search(pattern, haystack, re.IGNORECASE):
            return True
    return False


def _parse_search_docs(result_json: str) -> list[dict]:
    try:
        data = json.loads(result_json)
    except Exception:
        return []

    if isinstance(data, dict):
        return []

    if not isinstance(data, list):
        return []

    docs = []
    seen = set()
    for row in data:
        title = row.get("source") or row.get("title") or ""
        if not title:
            continue
        if title in seen:
            continue
        seen.add(title)
        docs.append({
            "title": title,
            "page": row.get("page"),
            "type": row.get("source_type") or "",
        })
    return docs


def _get_available_documents(fonds_name: str, question: str) -> list[dict]:
    list_json = _list_documents(fonds_name=fonds_name, doc_type="")
    docs = _parse_documents_list(list_json)
    if docs:
        return docs

    search_json = _search_docs(query=question, fonds_name=fonds_name, top_k=8)
    return _parse_search_docs(search_json)


def _format_missing_requested_doc(
    fonds_name: str,
    requested_kind: str,
    available_doc: dict | None,
) -> str:
    requested_label = _REQUESTED_DOC_LABELS.get(requested_kind, requested_kind)
    ingest_hint = _REQUESTED_DOC_INGEST_HINTS.get(requested_kind, requested_label)

    if not available_doc:
        if fonds_name:
            return (
                f"Aucun document n'est disponible pour le fonds {fonds_name} dans le système. "
                f"Si vous souhaitez {requested_label}, il faut ingérer {ingest_hint}."
            )
        return (
            "Aucun document n'est disponible dans le système. "
            f"Si vous souhaitez {requested_label}, il faut ingérer {ingest_hint}."
        )

    doc_title = available_doc.get("titre") or available_doc.get("title") or "Document"
    details = _format_doc_details(available_doc)
    doc_label = f"{doc_title} ({details})" if details else doc_title
    doc_kind = _infer_doc_kind(doc_title, available_doc.get("type") or "")
    doc_description = _DOC_KIND_DESCRIPTIONS.get(doc_kind, _DOC_KIND_DESCRIPTIONS["document"])

    return (
        f"Le document disponible pour ce fonds est le {doc_label}, "
        f"qui contient {doc_description} — pas {requested_label}.\n"
        f"Si vous souhaitez {requested_label}, il faut ingérer {ingest_hint}."
    )


async def ask_docs_agent(question: str, max_iterations: int = 10) -> str:
    """
    Pose une question à l'agent documents et retourne la réponse.

    Args:
        question: Question en langage naturel sur les documents.

    Returns:
        Réponse basée sur le contenu des PDFs.
    """
    # Fast path: list documents deterministically without LLM
    if _is_list_documents_question(question):
        fonds_name = _extract_fund_name(question)
        result_json = _list_documents(fonds_name=fonds_name, doc_type="")
        formatted = _format_documents_list(result_json)
        if not formatted.startswith("Aucun document"):
            return formatted

        # Fallback: use vector search and build a document list from chunks
        search_json = _search_docs(query=fonds_name or question, fonds_name=fonds_name, top_k=12)
        try:
            chunks = json.loads(search_json)
        except Exception:
            chunks = []

        titles = []
        seen = set()
        if isinstance(chunks, list):
            for c in chunks:
                title = c.get("source") or c.get("title")
                if title and title not in seen:
                    seen.add(title)
                    titles.append(title)

        if titles:
            return "\n".join(["- " + t for t in titles])

        return formatted

    requested_kind = _extract_requested_doc_kind(question)
    if requested_kind:
        fonds_name = _extract_fund_name(question)
        docs = _get_available_documents(fonds_name, question)
        if not docs:
            return _format_missing_requested_doc(fonds_name, requested_kind, None)

        if not any(_doc_matches_requested(doc, requested_kind) for doc in docs):
            return _format_missing_requested_doc(fonds_name, requested_kind, docs[0])

    llm = ChatOllama(
        base_url=Config.OLLAMA_BASE_URL,
        model=Config.LLM_MODEL,
        temperature=0,
        disable_streaming=True,
        async_client_kwargs={"timeout": Config.LLM_TIMEOUT_S},
    )

    mcp_client = MultiServerMCPClient(
        {
            "docs": {
                "command": sys.executable,
                "args":    [_MCP_SERVER_PATH],
                "transport": "stdio",
                "env": {
                    **os.environ,
                    "PYTHONPATH": _PROJECT_ROOT,
                    "PYTHONUTF8": "1",
                    "PYTHONIOENCODING": "utf-8",
                },
            }
        }
    )

    tools = await mcp_client.get_tools()

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=_SYSTEM_PROMPT,
    )

    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": _augment_question(question)}]},
        config={"recursion_limit": max_iterations},
    )

    messages = result.get("messages", [])
    for msg in reversed(messages):
        content = None
        if hasattr(msg, "role") and getattr(msg, "role", None) == "assistant":
            content = msg.content
        elif hasattr(msg, "type") and msg.type == "ai":
            content = msg.content
        elif isinstance(msg, dict) and msg.get("role") == "assistant":
            content = msg.get("content", "")
        if content and content.strip():
            return content.strip()

    # Fallback: attempt direct search if tool wasn't called
    fonds_name = _extract_fund_name(question)
    result_json = _search_docs(query=question, fonds_name=fonds_name, top_k=6)
    try:
        data = json.loads(result_json)
        if isinstance(data, dict) and data.get("message"):
            return data["message"]
    except Exception:
        pass

    return "Aucun document trouvé pour cette question."


def ask_docs_agent_sync(question: str) -> str:
    """Version synchrone utilisable depuis Flask."""
    return asyncio.run(ask_docs_agent(question))


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Liste les documents disponibles"
    print(f"\nQuestion : {q}\n")
    answer = ask_docs_agent_sync(q)
    print(f"Réponse : {answer}\n")