import asyncio
import json
import re
import sys
import os
import warnings
import unicodedata
from typing import Optional

warnings.filterwarnings("ignore", message=".*create_react_agent.*")
warnings.filterwarnings("ignore", message=".*LangGraphDeprecated.*")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from langchain_ollama import ChatOllama
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from app.config import Config

from app.mcp.docs_server import (
    list_documents as _list_documents,
    search_docs as _search_docs,
    get_document_chunks as _get_document_chunks,
)

_MCP_SERVER_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../mcp/docs_server.py")
)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

_SYSTEM_PROMPT = """
═══════════════════════════════════════════════════
RÈGLES DE PRÉSENTATION (CRITIQUE)
═══════════════════════════════════════════════════
- Par défaut, utilise le format Markdown : listes (1. ou -), gras (**), et tableaux (|) pour une présentation claire et structurée.
- IMPORTANT : laisse TOUJOURS une ligne vide avant de commencer une liste ou un tableau Markdown.
- Présente SYSTÉMATIQUEMENT tout groupement de données sous forme de liste ou de tableau Markdown bien organisé.
- Tout montant doit être suivi de "DT" (ex: 1 000 000 DT).

EXCEPTION :
- Si la question demande un résumé ou une synthèse, la réponse doit être en TEXTE BRUT UNIQUEMENT.
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


def _extract_sha256(question: str) -> str:
    m = re.search(r"\[SHA256:([a-fA-F0-9]{32,64})\]", question or "")
    return m.group(1) if m else ""


def _extract_document_name(question: str) -> str:
    patterns = [
        r'dans le document\s*["«]([^"»\n]+)["»]\s*:',
        r"du document\s+[\"«]?([a-zA-Z0-9_\-\.]+(?:\s+[a-zA-Z0-9_\-\.]+)*)[\"»]?",
        r"(?:à partir du document|depuis le document|dans le document|le document)\s+(?:nommé|intitulé|appelé|qui s'appelle)?\s*[\"«]?([\w\s\-\.]+?)[\"»]?(?:\s+donne|\s+calcule|\s+indique|\s+quel|\.pdf|$)",
        r"(?:document|fichier)\s+[\"«]([^\"»\n]+)[\"»]",
        r"document\s+(?:nommé|intitulé)\s+\"?([\w\s\-\.]+?)\"?(?:\s+donne|$)",
    ]
    for p in patterns:
        m = re.search(p, question, re.IGNORECASE)
        if m:
            doc_name = m.group(1).strip().strip("\"'")
            doc_name = re.sub(
                r"\b(fais|un|résumé|resume|résume|synthèse|synthese)\b",
                "",
                doc_name,
                flags=re.IGNORECASE,
            ).strip()
            return doc_name
    return ""


def _normalize_text(text: str) -> str:
    cleaned = (text or "").lower()
    cleaned = unicodedata.normalize("NFD", cleaned)
    cleaned = "".join(ch for ch in cleaned if unicodedata.category(ch) != "Mn")
    cleaned = cleaned.replace("_", " ")
    cleaned = re.sub(r"\.pdf$", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _normalize_for_intent(text: str) -> str:
    text = (text or "").lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"\s+", " ", text)
    return text


def _clean_question_for_search(question: str) -> str:
    q = question or ""
    q = re.sub(r"\[SHA256:[^\]]+\]\s*", "", q, flags=re.IGNORECASE)
    q = re.sub(r'dans le document\s*["«][^"»]+["»]\s*:\s*', "", q, flags=re.IGNORECASE)
    return q.strip()


def _extract_requested_label(question: str) -> str:
    q = (question or "").strip()
    patterns = [
        r"\bvaleur\s+de\s+(?:la\s+)?(.+?)(?:\s+au\b|\s+pour\b|\s+du\b|$)",
        r"\bmontant\s+de\s+(?:la\s+)?(.+?)(?:\s+au\b|\s+pour\b|\s+du\b|$)",
        r"\bquel(?:le)?\s+est\s+(?:la\s+)?(.+?)(?:\s+au\b|\s+pour\b|\s+du\b|\?|$)",
    ]
    for pattern in patterns:
        m = re.search(pattern, q, re.IGNORECASE)
        if m:
            label = m.group(1).strip().strip("\"' ")
            label = re.sub(r"\s+(au|du|pour|de|la)\s*$", "", label, flags=re.IGNORECASE).strip()
            return label
    return ""


def _extract_value_from_chunks(
    chunks: list[dict],
    label: str,
    question_year: str | None = None
) -> tuple[str, str, str] | None:
    """
    Extrait une valeur numérique d'un chunk en tenant compte de la bonne colonne année.
    """
    if not chunks or not label:
        return None

    label_norm = _normalize_text(label)

    for chunk in chunks:
        if not isinstance(chunk, dict):
            continue

        content = chunk.get("contenu") or ""
        source = chunk.get("source") or chunk.get("title") or "Document"
        page = chunk.get("page")
        lines = [l.strip() for l in content.splitlines() if l.strip()]

        header_years = None
        for line in lines:
            cols = [c.strip() for c in line.split("|")]
            years = []
            year_count = 0

            for c in cols:
                m = re.search(r"\b(20\d{2})\b", c)
                if m:
                    years.append(m.group(1))
                    year_count += 1
                else:
                    years.append("")

            if year_count >= 2:
                header_years = years
                break

        for line in lines:
            line_norm = _normalize_text(line)
            if label_norm and label_norm in line_norm:
                cols = [c.strip() for c in line.split("|")]

                if question_year and header_years and len(cols) == len(header_years):
                    for idx, y in enumerate(header_years):
                        if y == question_year and idx < len(cols):
                            value = cols[idx].strip()
                            if re.search(r"\d", value):
                                return source, page, value

                matches = re.findall(r"\b\d[\d\s.,%]*\b", line)
                if matches:
                    value = matches[0].strip() if len(matches) == 1 else matches[-1].strip()
                    if "/" not in value:
                        return source, page, value

    return None


def _is_list_documents_question(question: str) -> bool:
    q = (question or "").lower()

    has_extraction_intent = any(w in q for w in [
        "valeur", "montant", "quel est", "quelle est", "donne moi",
        "variation", "résultat", "total", "actif net", "redevance",
        "bilan", "combien", "chiffre", "données par part", "flux",
        "résumé", "resume", "synthèse", "synthese",
    ])
    if has_extraction_intent:
        return False

    return any(w in q for w in ["liste des documents", "lister", "quels documents", "quels sont les documents", "documents disponibles"])


def _is_summary_question(question: str) -> bool:
    q = _normalize_for_intent(question)
    return any(w in q for w in [
        "resume",
        "resumer",
        "fais un resume",
        "donne un resume",
        "resume le document",
        "resumé",
        "résumé",
        "résume",
        "synthese",
        "synthetise",
        "apercu",
        "overview",
    ])


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

    name = re.split(
        r"\b(document|documents|disponible|disponibles|liste|lister|rapport|bilan|prospectus|pv|pdf)\b",
        name,
        1,
        flags=re.IGNORECASE,
    )[0]
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
        if not isinstance(row, dict):
            continue
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


def _extract_year_from_question(question: str) -> Optional[str]:
    m = re.search(r"\b(31[/\-\.]12[/\-\.](\d{4}))\b", question)
    if m:
        return m.group(2)

    m = re.search(r"\b(20\d{2})\b", question)
    if m:
        return m.group(1)

    return None


def _extract_year_from_source(source: str) -> Optional[str]:
    m = re.search(r"\b(20\d{2})\b", source)
    if m:
        return m.group(1)
    return None


def _question_keywords(question: str) -> list[str]:
    q = _normalize_for_intent(_clean_question_for_search(question))

    stopwords = {
        "le", "la", "les", "de", "du", "des", "un", "une", "et", "ou",
        "pour", "dans", "ce", "cette", "au", "aux", "a", "est", "sont",
        "donne", "moi", "quelle", "quel", "quelles", "quels", "resume",
        "resumer", "document", "fonds", "sur", "avec", "par", "qui",
        "que", "quoi", "ceci", "cela"
    }

    words = re.findall(r"[a-zA-Z0-9]+", q)
    words = [w for w in words if len(w) > 2 and w not in stopwords]
    return words


def _score_line_against_question(line: str, keywords: list[str]) -> int:
    line_norm = _normalize_for_intent(line)
    score = 0

    for kw in keywords:
        if kw in line_norm:
            score += 2

    if "|" in line:
        score += 1
    if re.search(r"\d", line):
        score += 1

    return score


def _find_best_matching_lines(question: str, chunks: list[dict], top_n: int = 5) -> list[dict]:
    keywords = _question_keywords(question)
    candidates = []

    for chunk in chunks:
        if not isinstance(chunk, dict):
            continue

        source = chunk.get("source") or chunk.get("title") or "Document"
        page = chunk.get("page")
        content = chunk.get("contenu") or ""

        lines = [line.strip() for line in content.splitlines() if line.strip()]
        if not lines:
            lines = re.split(r"(?<=[\.\!\?])\s+", content)

        for line in lines:
            line = line.strip()
            if not line:
                continue

            score = _score_line_against_question(line, keywords)
            if score > 0:
                candidates.append({
                    "source": source,
                    "page": page,
                    "line": line,
                    "score": score,
                })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:top_n]


def _answer_question_from_document_chunks(question: str, chunks: list[dict]) -> str:
    matches = _find_best_matching_lines(question, chunks, top_n=5)

    if not matches:
        return "Je n'ai pas trouvé d'information pertinente dans le document sélectionné."

    best = matches[0]
    source = best["source"]
    page = best["page"]
    line = best["line"].strip()
    page_text = f"page {page}" if page else "page inconnue"

    if "|" in line:
        cols = [c.strip() for c in line.split("|") if c.strip()]
        if len(cols) >= 2:
            label = cols[0]
            value = cols[1]
            return f"D'après **{source}**, {page_text} :\n**{label} : {value}**"

    return f"D'après **{source}**, {page_text} :\n{line}"


def _build_summary_from_chunks(chunks: list[dict], doc_name: str = "") -> str:
    """
    Produit un résumé court + points clés.
    Gère :
    - états financiers
    - prospectus / agréments
    - règlements intérieurs / documents descriptifs
    """
    if not chunks:
        return f"Aucune information trouvée dans le document{' ' + doc_name if doc_name else ''}."

    source = chunks[0].get("source", doc_name or "Document")

    raw_texts = []
    for c in chunks:
        if isinstance(c, dict):
            txt = (c.get("contenu") or "").strip()
            if txt:
                raw_texts.append(txt)

    if not raw_texts:
        return f"Aucune information exploitable trouvée dans le document{' ' + doc_name if doc_name else ''}."

    full_text = "\n".join(raw_texts)
    lower_text = full_text.lower()

    def clean(v: str) -> str:
        return re.sub(r"\s+", " ", (v or "").strip()).strip(" :-;,.|")

    def clean_entity(v: str) -> str:
        v = clean(v)
        v = re.sub(r"^l['’]\s*", "", v, flags=re.IGNORECASE)
        v = re.sub(
            r"\b(Adresse|Tél|Tel|Fax|Site web|Montant du fonds|Divisé en|Président Directeur Général|Article|Fiscalité|Orientation du fonds)\b.*$",
            "",
            v,
            flags=re.IGNORECASE,
        )
        v = clean(v)
        if len(v) <= 1:
            return ""
        return v

    def find_first(patterns: list[str], text: str) -> str:
        for pattern in patterns:
            m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if m:
                return clean(m.group(1))
        return ""

    def add_dt(v: str) -> str:
        if not v:
            return ""
        return v if ("dt" in v.lower() or "tnd" in v.lower()) else f"{v} DT"

    def first_sentence_containing(keywords: list[str], text: str) -> str:
        sentences = re.split(r"(?<=[\.\!\?])\s+", text)
        for s in sentences:
            low = s.lower()
            if all(k.lower() in low for k in keywords):
                return clean(s)
        return ""

    financial_markers = [
        "actif net",
        "valeur liquidative",
        "résultat net",
        "resultat net",
        "résultat d'exploitation",
        "resultat d'exploitation",
        "bilan",
        "état de résultat",
        "etat de resultat",
        "données par part",
        "total actifs",
    ]
    financial_score = sum(1 for m in financial_markers if m in lower_text)

    is_financial = financial_score >= 3
    is_reglement = (
        "règlement intérieur" in lower_text
        or "reglement interieur" in lower_text
        or "article 1" in lower_text
        or "article 2" in lower_text
        or "article 3" in lower_text
    )

    fonds = find_first([
        r"\bDénomination du fonds\s*[:\-]?\s*([A-Z0-9\s\-_]+?)(?:\s{2,}|\n|Article|Gestionnaire|Dépositaire|Montant|$)",
        r"\bnom du fonds\s*[:\-]?\s*([A-Z0-9\s\-_]+?)(?:\s{2,}|\n|Article|Gestionnaire|Dépositaire|Montant|$)",
        r"\bFCPR\s+([A-Z0-9\s\-_]+?)(?:\s{2,}|\n|Gestionnaire|Dépositaire|Montant du fonds|Article|Fiscalité|$)",
    ], full_text)
    fonds = clean_entity(fonds)

    gestionnaire = find_first([
        r"\bGestionnaire\s*[:\-]?\s*([A-Z][A-Za-z0-9«»\"\s\-_&\.]+?)(?:\s{2,}|\n|Dépositaire|Adresse|Tél|Tel|Fax|Site web|Article|Montant|$)",
        r"\ble gestionnaire(?:\s+étant|\s+du fonds est|\s*[:\-])\s*([^\n\.]+)",
    ], full_text)
    gestionnaire = clean_entity(gestionnaire)

    depositaire = find_first([
        r"\bDépositaire\s*[:\-]?\s*([A-Z][A-Za-z0-9«»\"\s\-_&\.,]+?)(?:\s{2,}|\n|Adresse|Tél|Tel|Fax|Site web|Article|Montant|$)",
        r"\ble dépositaire(?:\s+de\s+ce\s+fonds\s+est|\s+du fonds est|\s*[:\-])\s*([^\n\.]+)",
    ], full_text)
    depositaire = clean_entity(depositaire)

    commissaire = find_first([
        r"\bCommissaire aux comptes\s*[:\-]?\s*([A-Z][A-Za-z0-9«»\"\s\-_&\.]+?)(?:\s{2,}|\n|Adresse|Article|$)",
    ], full_text)
    commissaire = clean_entity(commissaire)

    duree = find_first([
        r"\bLa durée du fonds est de\s*([^.]+)",
        r"\bDurée de vie du fonds\s*([^.]+)",
        r"\bDurée de blocage[^.]*?(\d+\s*ans[^.]*)",
    ], full_text)
    duree = clean_entity(duree)

    montant_fonds = find_first([
        r"\bMontant du fonds\s*:\s*([\d\s\.,]+(?:TND|DT)?)",
        r"\bcapital(?:\s+initial)?\s*[:\-]?\s*([\d\s\.,]+(?:TND|DT)?)",
    ], full_text)

    if is_financial:
        exercice = find_first([
            r"arr[êe]t[ée]s?\s+au\s+31\s+d[ée]cembre\s+(20\d{2})",
            r"exercice clos le\s+31[/\-.]12[/\-.](20\d{2})",
            r"au\s+31[/\-.]12[/\-.](20\d{2})",
        ], full_text)

        actif_net = find_first([
            r"ACTIF NET\s*\|\s*\|\s*([\d\s\.,]+)",
            r"actif net[^0-9]{0,40}([\d\s\.,]+)",
        ], full_text)

        valeur_liquidative = find_first([
            r"VALEUR LIQUIDATIVE\s*\|\s*([\d\s\.,%]+)",
            r"valeur liquidative[^0-9]{0,40}([\d\s\.,]+)",
        ], full_text)

        nb_parts = find_first([
            r"b\s*-\s*en fin d'exercice\s*\|\s*([\d\s\.,]+)",
            r"Nombre de part[s]?\s*\|\s*([\d\s\.,]+)",
        ], full_text)

        total_actifs = find_first([r"TOTAL ACTIFS\s*\|\s*\|\s*([\d\s\.,]+)"], full_text)
        total_passifs = find_first([r"TOTAL PASSIFS\s*\|\s*\|\s*([\d\s\.,]+)"], full_text)
        portefeuille = find_first([r"AC 1 - Portefeuille titre\s*\|\s*AC1\s*\|\s*([\d\s\.,]+)"], full_text)
        disponibilites = find_first([r"b\s*-\s*Disponibilités\s*\|\s*([\d\s\.,]+)"], full_text)

        resultat_net = find_first([
            r"R[ÉE]SULTAT NET\s*\|\s*\|\s*DE L'EXERCICE\s*\|\s*\|\s*([\d\s\.,\-\(\)]+)",
            r"R[ée]sultat net de l'exercice.*?\|\s*([\d\s\.,\-\(\)]+)",
        ], full_text)

        resultat_exploitation = find_first([
            r"R[ÉE]SULTAT D'EXPLOITATION\s*\|\s*\|\s*([\d\s\.,\-\(\)]+)",
            r"R[ée]sultat d'exploitation\s*\(1\)\s*\|\s*([\d\s\.,\-\(\)]+)",
        ], full_text)

        taux_rendement = find_first([
            r"TAUX DE RENDEMENT ANNUEL\s*\|\s*([\d\s\.,%]+)",
            r"AN 6 - TAUX DE RENDEMENT ANNUEL\s*\|\s*([\d\s\.,%]+)",
        ], full_text)

        observation = first_sentence_containing(["seuil", "15%"], full_text)

        resume_sentences = []
        if fonds and exercice:
            resume_sentences.append(f"Ce document présente les états financiers du fonds {fonds} arrêtés au 31 décembre {exercice}.")
        elif exercice:
            resume_sentences.append(f"Ce document présente les états financiers arrêtés au 31 décembre {exercice}.")
        else:
            resume_sentences.append(f"Ce document présente les principaux éléments financiers figurant dans {source}.")

        indicateurs = []
        if actif_net:
            indicateurs.append(f"un actif net de {add_dt(actif_net)}")
        if valeur_liquidative:
            indicateurs.append(f"une valeur liquidative de {add_dt(valeur_liquidative)}")
        if nb_parts:
            indicateurs.append(f"{nb_parts} parts en fin d'exercice")
        if indicateurs:
            resume_sentences.append("Les principaux indicateurs montrent " + ", ".join(indicateurs) + ".")

        perf = []
        if resultat_net:
            perf.append(f"un résultat net de {add_dt(resultat_net)}")
        if resultat_exploitation:
            perf.append(f"un résultat d'exploitation de {add_dt(resultat_exploitation)}")
        if taux_rendement:
            perf.append(f"un taux de rendement annuel de {taux_rendement}")
        if perf:
            resume_sentences.append("La performance ressort avec " + ", ".join(perf) + ".")

        structure = []
        if portefeuille:
            structure.append(f"un portefeuille titres de {add_dt(portefeuille)}")
        if disponibilites:
            structure.append(f"des disponibilités de {add_dt(disponibilites)}")
        if structure:
            resume_sentences.append("La structure de l'actif comprend " + ", ".join(structure) + ".")

        if observation:
            resume_sentences.append(f"Le document signale aussi une observation importante : {observation}")

        points = []

        def push(label: str, value: str, dt: bool = False):
            if value:
                points.append(f"- {label} : {add_dt(value) if dt else value}")

        push("Fonds", fonds)
        push("Exercice clos", f"31 décembre {exercice}" if exercice else "")
        push("Gestionnaire", gestionnaire)
        push("Dépositaire", depositaire)
        push("Actif net", actif_net, True)
        push("Valeur liquidative", valeur_liquidative, True)
        push("Nombre de parts", nb_parts)
        push("Résultat net", resultat_net, True)
        push("Résultat d'exploitation", resultat_exploitation, True)
        push("Taux de rendement annuel", taux_rendement)
        push("Total actifs", total_actifs, True)
        push("Total passifs", total_passifs, True)
        push("Portefeuille titres", portefeuille, True)
        push("Disponibilités", disponibilites, True)

        if observation:
            points.append(f"- Observation : {observation}")

    elif is_reglement:
        orientation = first_sentence_containing(["principalement pour objet"], full_text)
        if not orientation:
            orientation = first_sentence_containing(["orientation du fonds"], full_text)

        blocage = first_sentence_containing(["durée de blocage"], full_text)
        if not blocage and duree:
            blocage = f"La durée du fonds est de {duree}."

        fiscalite = first_sentence_containing(["fiscal"], full_text)

        resume_sentences = []
        if fonds:
            resume_sentences.append(f"Ce document présente le règlement intérieur du fonds {fonds}.")
        else:
            resume_sentences.append(f"Ce document présente les règles de fonctionnement du fonds décrit dans {source}.")

        general = []
        if gestionnaire:
            general.append(f"le gestionnaire est {gestionnaire}")
        if depositaire:
            general.append(f"le dépositaire est {depositaire}")
        if duree:
            general.append(f"la durée du fonds est de {duree}")
        if montant_fonds:
            general.append(f"le montant du fonds est de {montant_fonds}")
        if general:
            resume_sentences.append("Il précise notamment que " + ", ".join(general) + ".")

        if orientation:
            resume_sentences.append(orientation)
        if blocage and blocage not in resume_sentences:
            resume_sentences.append(blocage)
        if fiscalite:
            resume_sentences.append(fiscalite)

        points = []

        def push(label: str, value: str):
            if value:
                points.append(f"- {label} : {value}")

        push("Fonds", fonds)
        push("Gestionnaire", gestionnaire)
        push("Dépositaire", depositaire)
        push("Commissaire aux comptes", commissaire)
        push("Durée", duree)
        push("Montant du fonds", montant_fonds)

        if orientation:
            points.append(f"- Objet : {orientation}")
        if blocage:
            points.append(f"- Blocage / durée : {blocage}")

    else:
        identity_texts = [t for t in raw_texts if "sommaire" not in t.lower()]
        identity_text = "\n".join(identity_texts) if identity_texts else full_text

        fonds = find_first([
            r"\bDénomination du fonds\s+([A-Z0-9\s\-]+)",
            r"\bFonds commun de placement à risque\s*:\s*([A-Z0-9\s\-]+)",
            r"\bPROSPECTUS\s+FONDS COMMUN DE PLACEMENT A RISQUE\s+([A-Z0-9\s\-]+?)\s+Gestionnaire\b",
            r"\b(FCPR\s+[A-Z0-9\s\-]+?)(?:\s+Gestionnaire|\s+Dépositaire|\s+Montant du fonds|\s*$)",
        ], identity_text)
        fonds = clean_entity(fonds)
        fonds = re.sub(r"\b\d+(?:\.\d+)+.*$", "", fonds).strip()

        gestionnaire = find_first([
            r"\bGestionnaire\s+([A-Z][A-Z\s\-]+?)(?:\s+Dépositaire|\s+Adresse|\s+Fax|\s+Site web|\s+Montant du fonds|\s*$)",
        ], identity_text)
        gestionnaire = clean_entity(gestionnaire)

        depositaire = find_first([
            r"\bDépositaire\s+([A-Z][A-Z\s\-]+?)(?:\s+Adresse|\s+Tél|\s+Tel|\s+Fax|\s+Site web|\s+Montant du fonds|\s*$)",
        ], identity_text)
        depositaire = clean_entity(depositaire)

        duree = find_first([
            r"\bLa durée du fonds est de\s*([^.]+)",
            r"\bDurée de blocage[^.]*soit\s*([^.]+)",
        ], full_text)
        duree = clean_entity(duree)

        montant_fonds = find_first([
            r"\bMontant du fonds\s*:\s*([\d\s\.,]+(?:TND|DT)?)",
        ], identity_text)

        objectif = first_sentence_containing(["principalement pour objet"], full_text)
        risque = first_sentence_containing(["placements", "risqués"], full_text)
        if not risque:
            risque = first_sentence_containing(["durée de blocage", "10"], full_text)

        resume_sentences = []
        if fonds:
            resume_sentences.append(f"Ce document présente le fonds {fonds}.")
        else:
            resume_sentences.append(f"Ce document décrit les principales caractéristiques du fonds présenté dans {source}.")

        details = []
        if gestionnaire:
            details.append(f"il est géré par {gestionnaire}")
        if depositaire:
            details.append(f"son dépositaire est {depositaire}")
        if duree:
            details.append(f"sa durée est de {duree}")
        if montant_fonds:
            details.append(f"le montant du fonds est de {montant_fonds}")

        if details:
            resume_sentences.append("Sur le plan général, " + ", ".join(details) + ".")

        if objectif:
            resume_sentences.append(objectif)
        if risque:
            resume_sentences.append(risque)

        points = []

        def push(label: str, value: str):
            if value:
                points.append(f"- {label} : {value}")

        push("Fonds", fonds)
        push("Gestionnaire", gestionnaire)
        push("Dépositaire", depositaire)
        push("Durée", duree)
        push("Montant du fonds", montant_fonds)

        if objectif:
            points.append(f"- Objet : {objectif}")
        if risque:
            points.append(f"- Point d'attention : {risque}")

    final_points = []
    seen = set()
    for p in points:
        key = p.lower()
        if key not in seen:
            seen.add(key)
            final_points.append(p)

    parts = [f"Résumé du document {source} :", ""]
    parts.append(" ".join(resume_sentences[:4]))
    parts.append("")
    parts.append("Points clés :")
    parts.extend(final_points[:10] if final_points else ["- Aucun point clé exploitable n'a été extrait."])

    return "\n".join(parts).strip()


def _load_all_chunks_for_selected_document(question: str) -> tuple[list[dict], str, str]:
    sha256 = _extract_sha256(question)
    doc_name = _extract_document_name(question)

    print("DEBUG: Chargement direct des chunks du document")
    print(f"  - sha256: {sha256}")
    print(f"  - doc_name: {doc_name}")

    result_json = _get_document_chunks(
        document_title=doc_name,
        sha256=sha256,
    )

    try:
        data = json.loads(result_json)
    except Exception:
        data = []

    if isinstance(data, dict):
        print("DEBUG: get_document_chunks a retourné un dict:", data)
        return [], sha256, doc_name

    if not isinstance(data, list):
        print("DEBUG: get_document_chunks a retourné un format inattendu:", type(data))
        return [], sha256, doc_name

    valid_chunks = [c for c in data if isinstance(c, dict) and (c.get("contenu") or "").strip()]
    print(f"  - Chunks directs récupérés: {len(valid_chunks)}")

    return valid_chunks, sha256, doc_name


async def ask_docs_agent(question: str, max_iterations: int = 10) -> str:
    print("[DEBUG] ask_docs_agent appelée avec question:", question, flush=True)

    print(f"\n{'='*80}")
    print(f"QUESTION: {question}")
    print(f"{'='*80}\n")

    if _is_list_documents_question(question):
        fonds_name = _extract_fund_name(question)
        result_json = _list_documents(fonds_name=fonds_name, doc_type="")
        formatted = _format_documents_list(result_json)

        if not formatted.startswith("Aucun document"):
            return formatted

        search_json = _search_docs(query=fonds_name or question, fonds_name=fonds_name, top_k=12)
        try:
            chunks = json.loads(search_json)
        except Exception:
            chunks = []

        titles = []
        seen = set()
        if isinstance(chunks, list):
            for c in chunks:
                if not isinstance(c, dict):
                    continue
                title = c.get("source") or c.get("title")
                if title and title not in seen:
                    seen.add(title)
                    titles.append(title)

        if titles:
            return "Voici les documents disponibles :\n" + "\n".join([f"- {t}" for t in titles])

        return formatted

    if _is_summary_question(question):
        chunks, sha256, doc_name = _load_all_chunks_for_selected_document(question)

        if not chunks:
            if doc_name:
                return f"Aucun extrait trouvé pour le document '{doc_name}'."
            return "Aucune information trouvée dans le document sélectionné."

        print("\n===== CHUNKS UTILISÉS POUR LE RÉSUMÉ =====")
        for i, c in enumerate(chunks[:20]):
            print(f"Chunk {i+1}:")
            print(f"  Source: {c.get('source')}")
            print(f"  Page: {c.get('page')}")
            print(f"  Contenu: {c.get('contenu', '')[:500]}")
            print("----------------------------------------")
        print("===== FIN DES CHUNKS =====\n")

        return _build_summary_from_chunks(chunks, doc_name)

    requested_kind = _extract_requested_doc_kind(question)
    if requested_kind:
        fonds_name = _extract_fund_name(question)
        docs = _get_available_documents(fonds_name, question)
        if not docs:
            return _format_missing_requested_doc(fonds_name, requested_kind, None)

        if not any(_doc_matches_requested(doc, requested_kind) for doc in docs):
            return _format_missing_requested_doc(fonds_name, requested_kind, docs[0])

    selected_chunks, sha256, doc_name = _load_all_chunks_for_selected_document(question)
    if selected_chunks:
        question_year = _extract_year_from_question(question)
        label = _extract_requested_label(question)

        print("DEBUG: QA générique sur document sélectionné")
        print(f"  - sha256: {sha256}")
        print(f"  - doc_name: {doc_name}")
        print(f"  - question_year: {question_year}")
        print(f"  - label: {label}")

        if label:
            chunks_for_value = selected_chunks
            if question_year:
                year_filtered_chunks = []
                for c in chunks_for_value:
                    if not isinstance(c, dict):
                        continue
                    source = c.get("source", "")
                    source_year = _extract_year_from_source(source)
                    if source_year == question_year:
                        year_filtered_chunks.append(c)
                if year_filtered_chunks:
                    chunks_for_value = year_filtered_chunks

            found = _extract_value_from_chunks(chunks_for_value, label, question_year)
            if found:
                source, page, value = found
                page_text = f"page {page}" if page else "page inconnue"
                return f"D'après **{source}**, {page_text} :\n**{label} : {value} DT**"

        return _answer_question_from_document_chunks(question, selected_chunks)

    print("DEBUG: Aucun fast-path, utilisation de l'agent LLM")

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
                "args": [_MCP_SERVER_PATH],
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
        {"messages": [{"role": "user", "content": question}]},
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

    return "Aucun document trouvé pour cette question."


def ask_docs_agent_sync(question: str) -> str:
    return asyncio.run(ask_docs_agent(question))


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Liste les documents disponibles"
    print(f"\nQuestion : {q}\n")
    answer = ask_docs_agent_sync(q)
    print(f"Réponse : {answer}\n")