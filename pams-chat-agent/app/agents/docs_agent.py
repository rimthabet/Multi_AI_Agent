import asyncio
import json
import re
import sys
import os
import warnings
import unicodedata

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

_SYSTEM_PROMPT = """
Tu es un expert en extraction de données financières à partir de documents PDF de fonds d'investissement tunisiens.
LANGUE : EXCLUSIVEMENT en français. JAMAIS en anglais, arabe ou autre langue.

══════════════════════════════════════════════════
RÈGLE ABSOLUE N°1 — EXTRACTION DE VALEUR PRÉCISE
══════════════════════════════════════════════════
Si la question demande une valeur, un montant, un résultat ou un chiffre spécifique :
1. Appelle search_docs() avec la question complète.
2. Cherche dans les TABLEAUX retournés la ligne dont le libellé correspond exactement.
3. Retourne la valeur trouvée avec ce format OBLIGATOIRE :

   "D'après **[TITRE DU DOCUMENT]**, page [X] :
   **[Libellé exact du tableau] : [VALEUR] DT**"

EXEMPLE CORRECT :
   Question : "valeur de VARIATION DE L'ACTIF NET au 31.12.2020 du fonds FCPR MAXULA CROISSANCE ENTREPRISES"
   search_docs() retourne un tableau avec : "VARIATION DE L'ACTIF NET RÉSULTANT DES OPÉRATIONS D'EXPLOITATION | 1 234 567"
   Réponse : "D'après **comite_valorisation_2020_fcpr_maxula_croissance_entreprises_2020.pdf**, page 5 :\n**Variation de l'actif net résultant des opérations d'exploitation : 1 234 567 DT**"

══════════════════════════════════════════════════
RÈGLE ABSOLUE N°2 — INTERDICTIONS STRICTES
══════════════════════════════════════════════════
- Tu ne dois JAMAIS afficher des scores de similarité (ex: "Score : 1.14").
- Tu ne dois JAMAIS afficher une liste de documents au lieu de répondre à la question.
- Tu ne dois JAMAIS mélanger des chiffres provenant de documents différents.
- Tu ne dois JAMAIS inventer une valeur si elle n'est pas dans les extraits.

══════════════════════════════════════════════════
RÈGLE N°3 — QUAND UN DOCUMENT EST CIBLÉ
══════════════════════════════════════════════════
Si l'utilisateur mentionne un nom de document spécifique :
"à partir du document nommé X" / "dans le fichier X" / etc.
→ Concentre-toi UNIQUEMENT sur les chunks provenant de ce document.
→ Ignore les extraits provenant d'autres documents.

══════════════════════════════════════════════════
RÈGLE N°4 — SI LA VALEUR N'EST PAS TROUVÉE
══════════════════════════════════════════════════
Si la valeur demandée est absente des extraits retournés, répond :
"La valeur de [libellé demandé] n'a pas été trouvée dans les documents disponibles pour [nom du fonds].
Les documents disponibles sont : [liste des sources retournées par search_docs]."

══════════════════════════════════════════════════
RÈGLE N°5 — DOCUMENTS MANQUANTS
══════════════════════════════════════════════════
Si l'utilisateur demande un type de document non disponible (bilan, PV, rapport annuel...),
utilise ce modèle :
"Le document disponible pour ce fonds est le [NOM TROUVÉ], qui contient [contenu réel]
— pas [ce qui était demandé]. Pour consulter [ce qui était demandé], il faut l'ingérer."
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


def _extract_document_name(question: str) -> str:
    """Extrait le nom de document si l'utilisateur le spécifie explicitement."""
    patterns = [
        r"(?:à partir du document|du document|depuis le document|dans le document)\s+(?:nommé|intitulé|appelé|qui s'appelle)?\s*[\"«]?([\w\s\-\.]+?)[\"»]?(?:\s+donne|\s+calcule|\s+indique|\s+quel|$)",
        r"(?:document|fichier)\s+[\"«]([^\"»\n]+)[\"»]",
        r"document\s+(?:nommé|intitulé)\s+\"?([\w\s\-\.]+?)\"?(?:\s+donne|$)",
    ]
    for p in patterns:
        m = re.search(p, question, re.IGNORECASE)
        if m:
            return m.group(1).strip().strip('"\'')
    return ""


def _augment_question(question: str) -> str:
    q = question.lower().strip()
    doc_name = _extract_document_name(question)

    if any(w in q for w in ["liste", "quels documents", "lister"]) and not any(
        w in q for w in ["valeur", "montant", "résultat", "variation", "total", "actif net", "quel est", "quelle est"]
    ):
        return (
            f"{question}\n\n"
            "[ACTION : appelle list_documents() pour lister les documents disponibles. "
            "Réponds en français.]"
        )

    # Demande d'extraction de valeur
    doc_hint = f" Concentre-toi sur les chunks du document '{doc_name}'." if doc_name else ""
    return (
        f"{question}\n\n"
        f"[ACTION : appelle search_docs() avec la question complète et le nom du fonds.{doc_hint} "
        "Cherche dans les tableaux retournés la valeur exacte demandée. "
        "Retourne la valeur et sa source. INTERDICTION d'afficher des scores ou une liste de documents. "
        "Réponds UNIQUEMENT en français.]"
    )


def _normalize_text(text: str) -> str:
    cleaned = (text or "").lower()
    cleaned = unicodedata.normalize("NFD", cleaned)
    cleaned = "".join(ch for ch in cleaned if unicodedata.category(ch) != "Mn")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_requested_label(question: str) -> str:
    q = (question or "").strip()
    patterns = [
        r"\bvaleur\s+de\s+(.+?)(?:\s+au\b|\s+pour\b|\s+du\b|$)",
        r"\bmontant\s+de\s+(.+?)(?:\s+au\b|\s+pour\b|\s+du\b|$)",
    ]
    for pattern in patterns:
        m = re.search(pattern, q, re.IGNORECASE)
        if m:
            return m.group(1).strip().strip("\"' ")
    return ""


def _extract_value_from_chunks(chunks: list[dict], label: str) -> tuple[str, str, str] | None:
    if not chunks or not label:
        return None

    label_norm = _normalize_text(label)
    number_pattern = re.compile(r"\b\d[\d\s.,]*\b")

    for chunk in chunks:
        content = chunk.get("contenu") or ""
        source = chunk.get("source") or chunk.get("title") or "Document"
        page = chunk.get("page")
        lines = content.splitlines()
        for line in lines:
            line_norm = _normalize_text(line)
            if label_norm and label_norm in line_norm:
                matches = number_pattern.findall(line)
                if not matches:
                    continue
                value = matches[-1].strip()
                if "/" in value:
                    continue
                return source, page, value

    return None


def _is_list_documents_question(question: str) -> bool:
    """Retourne True seulement si c'est une vraie demande de liste de documents."""
    q = (question or "").lower()
    # Si la question veut une valeur/extraction → ce n'est PAS une liste
    has_extraction_intent = any(w in q for w in [
        "valeur", "montant", "quel est", "quelle est", "donne moi",
        "variation", "résultat", "total", "actif net", "redevance",
        "bilan", "combien", "chiffre", "données par part", "flux",
    ])
    if has_extraction_intent:
        return False
    # Sinon, vrais mots de listage
    return any(w in q for w in ["liste des documents", "lister", "quels documents", "quels sont les documents", "documents disponibles"])


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

    # Extraction deterministe d'une valeur specifique
    if any(w in (question or "").lower() for w in ["valeur", "montant", "au ", "au 31", "au 30"]):
        fonds_name = _extract_fund_name(question)
        label = _extract_requested_label(question)
        result_json = _search_docs(query=question, fonds_name=fonds_name, top_k=8)
        try:
            chunks = json.loads(result_json)
        except Exception:
            chunks = []

        if isinstance(chunks, list):
            found = _extract_value_from_chunks(chunks, label)
            if found:
                source, page, value = found
                page_text = f"page {page}" if page else "page inconnue"
                return (
                    f"D'après **{source}**, {page_text} :\n"
                    f"**{label} : {value} DT**"
                )

            sources = []
            seen = set()
            for c in chunks:
                title = c.get("source") or c.get("title")
                if title and title not in seen:
                    seen.add(title)
                    sources.append(title)

            if label:
                sources_text = ", ".join(sources) if sources else "aucune source"
                return (
                    f"La valeur de {label} n'a pas été trouvée dans les documents disponibles"
                    f" pour {fonds_name or 'ce fonds'}. Les documents disponibles sont : {sources_text}."
                )

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