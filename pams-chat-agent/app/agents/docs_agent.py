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

from app.mcp.docs_server import list_documents as _list_documents
from app.mcp.docs_server import search_docs as _search_docs

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
- Si la question demande un résumé ou une synthèse, la réponse doit être en TEXTE BRUT UNIQUEMENT (aucun markdown, pas de gras, pas de listes, pas de tirets, pas de tableaux, pas d'étoiles, pas de #, etc.).


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
❌ N'invente JAMAIS de chiffres, dates ou montants qui ne sont pas dans les extraits
❌ Ne mélange JAMAIS des données de différents exercices/années/fonds
❌ Si un chiffre n'est pas dans les chunks retournés, dis explicitement "Non trouvé"
❌ Ne généralise pas, ne complète pas, ne suppose pas
❌ N'utilise JAMAIS des données d'un autre document que celui demandé

VÉRIFICATION OBLIGATOIRE AVANT CHAQUE RÉPONSE :
✓ Le chiffre vient-il EXACTEMENT d'un chunk retourné ?
✓ L'année/date correspond-elle exactement à la question ?
✓ Le nom du fonds correspond-il exactement ?
✓ Le document source correspond-il à celui demandé ?

══════════════════════════════════════════════════
RÈGLE N°3 — QUAND UN DOCUMENT EST CIBLÉ
══════════════════════════════════════════════════
Si l'utilisateur mentionne un nom de document spécifique :
"à partir du document nommé X" / "dans le fichier X" / "du document X" / etc.
→ Concentre-toi UNIQUEMENT sur les chunks provenant de ce document.
→ Ignore TOUS les extraits provenant d'autres documents.
→ Si aucun chunk ne provient du document demandé, réponds : "Aucune information trouvée dans le document [NOM]."

═══════════════════════════════════════════════════
RÈGLE N°4 — RÉSUMÉ STRICTEMENT FACTUEL
═══════════════════════════════════════════════════
Si la question demande un résumé ou une synthèse :
- Rédige le résumé UNIQUEMENT à partir des extraits/textes réellement trouvés dans les chunks.
- Structure le résumé avec les sections présentes dans les chunks (Bilan, État de résultat, Notes, etc.)
- Cite les chiffres EXACTS trouvés dans les chunks (actif net, valeur liquidative, etc.)
- N'invente JAMAIS d'information, ne complète pas, ne généralise pas, ne mélange pas avec d'autres documents ou années.
- Si aucune information n'est trouvée dans les chunks, réponds explicitement : "Aucune information trouvée dans le document sélectionné."

EXEMPLE DE BON RÉSUMÉ :
"Résumé du document **FCPR_Max_Espoir_2014.pdf** :

**Informations générales :**
- Fonds : FCPR MaxEspoir
- Exercice clos : 31 décembre 2014
- Gestionnaire : MAXULA GESTION
- Dépositaire : AMEN BANK

**Données financières clés :**
- Actif net : 6 956 502 DT
- Valeur liquidative : 1 041,081 DT par part
- Nombre de parts : 6 682

**Performance :**
- Résultat net : 141 003 DT
- Taux de rendement annuel : 2,238%

[Uniquement les informations présentes dans les chunks]"

══════════════════════════════════════════════════
RÈGLE N°5 — SI LA VALEUR N'EST PAS TROUVÉE
══════════════════════════════════════════════════
Si la valeur demandée est absente des extraits retournés, répond :
"La valeur de [libellé demandé] n'a pas été trouvée dans les documents disponibles pour [nom du fonds].
Les documents disponibles sont : [liste des sources retournées par search_docs]."

══════════════════════════════════════════════════
RÈGLE N°6 — DOCUMENTS MANQUANTS
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
        r"dans le document\s*[\"«]([^\"»\n]+)[\"»]\s*:",
        r"du document\s+[\"«]?([a-zA-Z0-9_\-\.]+(?:\s+[a-zA-Z0-9_\-\.]+)*)[\"»]?",
        r"(?:à partir du document|depuis le document|dans le document|le document)\s+(?:nommé|intitulé|appelé|qui s'appelle)?\s*[\"«]?([\w\s\-\.]+?)[\"»]?(?:\s+donne|\s+calcule|\s+indique|\s+quel|\.pdf|$)",
        r"(?:document|fichier)\s+[\"«]([^\"»\n]+)[\"»]",
        r"document\s+(?:nommé|intitulé)\s+\"?([\w\s\-\.]+?)\"?(?:\s+donne|$)",
    ]
    for p in patterns:
        m = re.search(p, question, re.IGNORECASE)
        if m:
            doc_name = m.group(1).strip().strip('"\'')
            doc_name = re.sub(r'\b(fais|un|résumé|resume|synthèse|synthese)\b', '', doc_name, flags=re.IGNORECASE).strip()
            return doc_name
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
    """Normalise le texte pour comparaison (minuscules, sans accents, sans espaces multiples)."""
    cleaned = (text or "").lower()
    cleaned = unicodedata.normalize("NFD", cleaned)
    cleaned = "".join(ch for ch in cleaned if unicodedata.category(ch) != "Mn")
    cleaned = cleaned.replace("_", " ")
    cleaned = re.sub(r"\.pdf$", "", cleaned)  
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _filter_chunks_by_doc_name(chunks: list[dict], doc_name: str) -> list[dict]:
    """Filtre les chunks pour ne garder que ceux du document spécifié."""
    if not chunks or not doc_name:
        return chunks
    
    doc_norm = _normalize_text(doc_name)
    filtered = []
    
    for chunk in chunks:
        source = chunk.get("source") or chunk.get("title") or ""
        source_norm = _normalize_text(source)
        
        # Matching flexible : contient le nom OU le nom contient la source
        if doc_norm in source_norm or source_norm in doc_norm:
            filtered.append(chunk)
    
    return filtered


def _extract_requested_label(question: str) -> str:
    """Extrait le libellé de la valeur recherchée dans la question."""
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
            # Nettoyer les prépositions finales
            label = re.sub(r'\s+(au|du|pour|de|la)\s*$', '', label, flags=re.IGNORECASE).strip()
            return label
    return ""


def _extract_value_from_chunks(chunks: list[dict], label: str) -> tuple[str, str, str] | None:
    """Extrait une valeur numérique d'un chunk dont le contenu matche le libellé."""
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
            
            # Le libellé doit être présent dans la ligne
            if label_norm and label_norm in line_norm:
                matches = number_pattern.findall(line)
                if not matches:
                    continue
                
                # Prendre le dernier nombre de la ligne (généralement la valeur)
                value = matches[-1].strip()
                
                # Ignorer les dates (contiennent des /)
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
        "résumé", "resume", "synthèse", "synthese",
    ])
    if has_extraction_intent:
        return False
    # Sinon, vrais mots de listage
    return any(w in q for w in ["liste des documents", "lister", "quels documents", "quels sont les documents", "documents disponibles"])


def _is_summary_question(question: str) -> bool:
    """Détecte si la question demande un résumé ou une synthèse."""
    q = (question or "").lower()
    return any(w in q for w in [
        "résumé", "resume", "résume", "synthèse", "synthese", 
        "présente", "overview", "aperçu", "aperu",
        "fais un résumé", "donne un résumé", "synthétise", "synthetise","résume le document"
    ])


def _extract_fund_name(question: str) -> str:
    """Extrait le nom du fonds de la question."""
    q = (question or "").strip()

    # Patterns FCPR/SICAV/FCP + nom
    m = re.search(r"\b(FCPR|FCP|FCPI|SICAV)\s+([A-Za-z0-9\-\s]+)", q, re.IGNORECASE)
    if m:
        name = (m.group(1) + " " + m.group(2)).strip()
    else:
        m = re.search(r"\bfonds?\s+(?P<name>.+)$", q, re.IGNORECASE)
        name = m.group("name").strip() if m else ""

    if not name:
        return ""

    # Nettoyer les mots-clés parasites
    name = re.split(r"\b(document|documents|disponible|disponibles|liste|lister|rapport|bilan|prospectus|pv|pdf)\b", name, 1, flags=re.IGNORECASE)[0]
    name = re.sub(r"[?.!,;]+$", "", name).strip()
    return name


def _format_documents_list(result_json: str) -> str:
    """Formate la liste des documents de manière lisible."""
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
    """Détecte le type de document demandé (bilan, PV, etc.)."""
    q = (question or "").lower()
    for kind, pattern in _REQUESTED_DOC_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE):
            return kind
    return ""


def _infer_doc_kind(title: str, doc_type: str) -> str:
    """Infère le type de document à partir de son titre et type."""
    haystack = f"{title} {doc_type}".lower()
    for kind, pattern in _REQUESTED_DOC_PATTERNS:
        if re.search(pattern, haystack, re.IGNORECASE):
            return kind
    return "document"


def _parse_documents_list(result_json: str) -> list[dict]:
    """Parse la réponse JSON de list_documents."""
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
    """Formate les détails d'un document."""
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
    """Vérifie si un document correspond au type demandé."""
    title = doc.get("titre") or doc.get("title") or doc.get("source") or ""
    doc_type = doc.get("type") or ""
    haystack = f"{title} {doc_type}".lower()
    for kind, pattern in _REQUESTED_DOC_PATTERNS:
        if kind == requested_kind and re.search(pattern, haystack, re.IGNORECASE):
            return True
    return False


def _parse_search_docs(result_json: str) -> list[dict]:
    """Parse la réponse JSON de search_docs et extrait les documents uniques."""
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
    """Récupère la liste des documents disponibles."""
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
    """Formate un message indiquant qu'un document demandé n'est pas disponible."""
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
    """Extrait l'année mentionnée dans la question (2014, 2020, etc.)."""
    # Pattern pour dates complètes
    m = re.search(r'\b(31[/\-\.]12[/\-\.](\d{4}))\b', question)
    if m:
        return m.group(2)
    
    # Pattern pour années seules
    m = re.search(r'\b(20\d{2})\b', question)
    if m:
        return m.group(1)
    
    return None


def _extract_year_from_source(source: str) -> Optional[str]:
    """Extrait l'année du nom du fichier source."""
    m = re.search(r'\b(20\d{2})\b', source)
    if m:
        return m.group(1)
    return None


def _build_summary_from_chunks(chunks: list[dict], doc_name: str = "") -> str:
    """Construit un résumé structuré à partir des chunks réels."""
    if not chunks:
        return f"Aucune information trouvée dans le document{' ' + doc_name if doc_name else ''}."
    
    # Identifier le document source
    source = chunks[0].get("source", "Document")
    
    # Extraire les informations clés des chunks
    summary_sections = {
        "informations_generales": [],
        "donnees_financieres": [],
        "performance": [],
        "portefeuille": [],
        "autres": []
    }
    
    for chunk in chunks[:15]:  
        content = chunk.get("contenu", "").strip()
        if not content:
            continue
        
        content_lower = content.lower()
        
        # Catégoriser le contenu
        if any(kw in content_lower for kw in ["fcpr", "fonds", "gestionnaire", "dépositaire", "depositaire", "durée", "duree", "agrément"]):
            summary_sections["informations_generales"].append(content)
        elif any(kw in content_lower for kw in ["actif net", "valeur liquidative", "capital", "nombre de parts"]):
            summary_sections["donnees_financieres"].append(content)
        elif any(kw in content_lower for kw in ["résultat", "resultat", "rendement", "performance", "dividende"]):
            summary_sections["performance"].append(content)
        elif any(kw in content_lower for kw in ["portefeuille", "actions", "placement", "sicav", "participation"]):
            summary_sections["portefeuille"].append(content)
        else:
            summary_sections["autres"].append(content)
    
    # Construire le résumé en texte brut (SANS MARKDOWN)
    summary_parts = [f"Résumé du document {source} :\n"]
    
    if summary_sections["informations_generales"]:
        summary_parts.append("INFORMATIONS GÉNÉRALES :")
        for info in summary_sections["informations_generales"][:5]:
            lines = [l.strip() for l in info.split('\n') if l.strip()]
            summary_parts.extend(f"  {line}" for line in lines[:2])
        summary_parts.append("")
    
    if summary_sections["donnees_financieres"]:
        summary_parts.append("DONNÉES FINANCIÈRES CLÉS :")
        for info in summary_sections["donnees_financieres"][:5]:
            lines = [l.strip() for l in info.split('\n') if l.strip()]
            summary_parts.extend(f"  {line}" for line in lines[:2])
        summary_parts.append("")
    
    if summary_sections["performance"]:
        summary_parts.append("PERFORMANCE :")
        for info in summary_sections["performance"][:5]:
            lines = [l.strip() for l in info.split('\n') if l.strip()]
            summary_parts.extend(f"  {line}" for line in lines[:2])
        summary_parts.append("")
    
    if summary_sections["portefeuille"]:
        summary_parts.append("COMPOSITION DU PORTEFEUILLE :")
        for info in summary_sections["portefeuille"][:5]:
            lines = [l.strip() for l in info.split('\n') if l.strip()]
            summary_parts.extend(f"  {line}" for line in lines[:2])
        summary_parts.append("")
    
    # Si aucune section identifiée, afficher les premiers chunks bruts
    if not any(summary_sections.values()):
        summary_parts.append("CONTENU EXTRAIT :")
        for chunk in chunks[:5]:
            content = chunk.get("contenu", "").strip()
            if content:
                summary_parts.append(f"  {content[:200]}...")
    
    return "\n".join(summary_parts)


async def ask_docs_agent(question: str, max_iterations: int = 10) -> str:
    """
    Pose une question à l'agent documents et retourne la réponse.

    Args:
        question: Question en langage naturel sur les documents.
        max_iterations: Nombre max d'itérations pour l'agent LLM.

    Returns:
        Réponse basée sur le contenu des PDFs.
    """
    
    # DEBUG: Logger la question
    print(f"\n{'='*80}")
    print(f"QUESTION: {question}")
    print(f"{'='*80}\n")
    
    # Fast path 1: Liste de documents
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
            return "Voici les documents disponibles :\n" + "\n".join([f"- {t}" for t in titles])

        return formatted

    # Fast path 2: Résumé de document
    if _is_summary_question(question):
        fonds_name = _extract_fund_name(question)
        doc_name = _extract_document_name(question)

        print(f"DEBUG: Résumé demandé")
        print(f"  - Fonds: {fonds_name}")
        print(f"  - Document: {doc_name}")

        # Rechercher avec plus de contexte pour le résumé
        result_json = _search_docs(query=question, fonds_name=fonds_name, top_k=30)

        try:
            chunks = json.loads(result_json)
        except Exception:
            chunks = []

        print(f"  - Chunks trouvés: {len(chunks) if isinstance(chunks, list) else 0}")

        if isinstance(chunks, list):
            # Filtrer par document si spécifié
            if doc_name:
                original_count = len(chunks)
                chunks = _filter_chunks_by_doc_name(chunks, doc_name)
                print(f"  - Après filtrage par doc '{doc_name}': {len(chunks)} chunks")

                if not chunks:
                    return f"Aucun extrait trouvé pour le document '{doc_name}'."

            # DEBUG: Afficher les sources trouvées
            sources = set(c.get("source", "") for c in chunks[:10])
            print(f"  - Sources principales: {list(sources)[:3]}")

            # Construire le résumé brut à partir des chunks réels
            raw_summary = _build_summary_from_chunks(chunks, doc_name)

            # Retourner le résumé brut sans markdown ni LLM
            return raw_summary

        return f"Aucune information trouvée pour générer un résumé."

    # Vérifier si un type de document spécifique est demandé
    requested_kind = _extract_requested_doc_kind(question)
    if requested_kind:
        fonds_name = _extract_fund_name(question)
        docs = _get_available_documents(fonds_name, question)
        if not docs:
            return _format_missing_requested_doc(fonds_name, requested_kind, None)

        if not any(_doc_matches_requested(doc, requested_kind) for doc in docs):
            return _format_missing_requested_doc(fonds_name, requested_kind, docs[0])

    # Fast path 3: Extraction deterministe d'une valeur specifique
    if any(w in (question or "").lower() for w in ["valeur", "montant", "au ", "au 31", "au 30", "quel est", "quelle est"]):
        fonds_name = _extract_fund_name(question)
        doc_name = _extract_document_name(question)
        label = _extract_requested_label(question)
        question_year = _extract_year_from_question(question)
        
        print(f"DEBUG: Extraction de valeur")
        print(f"  - Fonds: {fonds_name}")
        print(f"  - Document: {doc_name}")
        print(f"  - Label recherché: {label}")
        print(f"  - Année demandée: {question_year}")
        
        result_json = _search_docs(query=question, fonds_name=fonds_name, top_k=12)
        
        try:
            chunks = json.loads(result_json)
        except Exception:
            chunks = []

        if isinstance(chunks, list):
            print(f"  - Chunks trouvés: {len(chunks)}")
            
            # Filtrer par document si spécifié
            if doc_name:
                original_count = len(chunks)
                chunks = _filter_chunks_by_doc_name(chunks, doc_name)
                print(f"  - Après filtrage par doc '{doc_name}': {len(chunks)} chunks (avant: {original_count})")
                
                if not chunks:
                    return f"Aucun extrait trouvé pour le document '{doc_name}'."
            
            # Filtrer par année si mentionnée dans la question
            if question_year:
                year_filtered_chunks = []
                for c in chunks:
                    source = c.get("source", "")
                    source_year = _extract_year_from_source(source)
                    if source_year == question_year:
                        year_filtered_chunks.append(c)
                
                if year_filtered_chunks:
                    print(f"  - Après filtrage par année {question_year}: {len(year_filtered_chunks)} chunks")
                    chunks = year_filtered_chunks
                else:
                    print(f"  - ATTENTION: Année {question_year} demandée mais aucun chunk ne correspond")
            
            # DEBUG: Afficher les 3 premiers chunks
            for i, c in enumerate(chunks[:3]):
                print(f"  - Chunk {i}: source={c.get('source')}, page={c.get('page')}")
                print(f"    Contenu: {c.get('contenu', '')[:150]}...")
            
            # Extraire la valeur
            found = _extract_value_from_chunks(chunks, label)
            if found:
                source, page, value = found
                page_text = f"page {page}" if page else "page inconnue"
                
                # Vérifier la cohérence de l'année
                source_year = _extract_year_from_source(source)
                if question_year and source_year and source_year != question_year:
                    print(f"  - ALERTE: Année trouvée ({source_year}) != année demandée ({question_year})")
                    return (
                        f"⚠️ Attention : La valeur trouvée provient de l'année {source_year}, "
                        f"mais vous avez demandé l'année {question_year}.\n\n"
                        f"D'après **{source}**, {page_text} :\n"
                        f"**{label} : {value} DT**\n\n"
                        f"Si vous souhaitez la valeur pour {question_year}, veuillez vérifier que le document existe."
                    )
                
                print(f"  - ✓ Valeur trouvée: {value}")
                return (
                    f"D'après **{source}**, {page_text} :\n"
                    f"**{label} : {value} DT**"
                )

            # Construire la liste des sources disponibles
            sources = []
            seen = set()
            for c in chunks:
                title = c.get("source") or c.get("title")
                if title and title not in seen:
                    seen.add(title)
                    sources.append(title)

            if label:
                sources_text = ", ".join(sources) if sources else "aucune source"
                year_info = f" pour l'année {question_year}" if question_year else ""
                return (
                    f"La valeur de **{label}** n'a pas été trouvée dans les documents disponibles"
                    f" pour {fonds_name or 'ce fonds'}{year_info}.\n\n"
                    f"Documents consultés : {sources_text}."
                )

    # Si aucun fast-path n'a matché, utiliser l'agent LLM
    print(f"DEBUG: Aucun fast-path, utilisation de l'agent LLM")
    
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