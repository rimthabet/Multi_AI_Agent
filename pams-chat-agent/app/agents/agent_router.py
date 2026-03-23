from __future__ import annotations

import re
from app.services.llm_client import llm_generate

# ─── Patterns de détection ────────────────────────────────────────────────────

_DOC_KEYWORDS = [
    "document", "rapport", "bilan", "prospectus", "pv",
    "politique", "règlement", "reglement", "situation annuelle",
    "actif net", "résultat", "pdf", "liste des documents", "disponible",
    "frais", "commission", "souscription", "rachat", "cession",
    "durée de blocage", "duree de blocage", "blocage",
    "politique d'investissement", "stratégie d'investissement",
    "modalité", "modalite", "montant minimum",
    "secteur", "peut-il investir", "peut investir",
    "agrément", "agrement", "visa cmf",
]

_DOC_PATTERNS = re.compile(
    r"\b("
    r"document(s)?\b|rapport(s)?\b|bilan(s)?\b|prospectus\b|"
    r"politique.d.investissement|règlement|reglement|"
    r"situation.annuelle|actif.net|"
    r"pv\b|procès.verbal|proces.verbal|"
    r"résultat(s)?\b|resultat(s)?\b|"
    r"pdf\b|fichier(s)?\b"
    r")",
    re.IGNORECASE,
)

_NAV_PATTERNS = re.compile(
    r"\b("
    r"ouvre|ouvrir|navigue|naviguer|va\s+sur|aller\s+sur|"
    r"cr[eé]e?r?|cr[eé]ation|ajoute?r?|ajout|"
    r"affiche\s+(?:le\s+)?(?:fonds|projet|dashboard|liste)|"
    r"montre\s+(?:le\s+)?(?:fonds|projet)|"
    r"liste\s+des\s+fonds|liste\s+des\s+projets|"
    r"répertoire|repertoire|repository|"
    r"dashboard\s+(?:du\s+)?(?:fonds|projet)"
    r")",
    re.IGNORECASE,
)

_LLM_ROUTER_PROMPT = """\
Tu es un routeur. Tu dois répondre UNIQUEMENT par un seul mot : "donnees" ou "documents".

Règles :
- "donnees"   si la question porte sur des données structurées (fonds, projets, souscriptions, financements, promoteurs, secteurs, statistiques, classements…)
- "documents" si la question porte sur le contenu de documents PDF (rapports, bilans, prospectus, politiques, PV…)

Question : {question}

Réponse (un seul mot) :"""


# ─── Fonctions de routage ─────────────────────────────────────────────────────

def _route_by_llm(question: str) -> str:
    """Utilise le LLM comme arbitre quand les patterns sont ambigus."""
    prompt = _LLM_ROUTER_PROMPT.format(question=question)
    raw = llm_generate(prompt, max_tokens=10).strip().lower()
    if "document" in raw:
        return "documents"
    return "donnees"


def _detect_agent(question: str) -> str:
    q = question.lower()

    # 0. Priorite creation/ajout -> navigation
    if re.search(r"\b(ajoute?r?|ajout|cr[eé]e?r?|cr[eé]ation)\b", q):
        if "fonds" in q or "projet" in q:
            return "navigation"

    # 0b. Requetes de donnees avec annee explicite
    if re.search(r"\b20\d{2}\b", q):
        if "fonds" in q or "projet" in q:
            return "donnees"

    # 1. Navigation en priorité absolue
    if _NAV_PATTERNS.search(question):
        return "navigation"

    # 2. Documents
    if any(w in q for w in _DOC_KEYWORDS):
        return "documents"
    if _DOC_PATTERNS.search(question):
        return "documents"

    # 3. Données par défaut
    return "donnees"


# ─── Point d'entrée principal ─────────────────────────────────────────────────

def ask_auto_agent_sync(question: str) -> tuple[str, str]:
    """
    Détecte automatiquement l'agent et retourne (réponse, agent_utilisé).
    """
    agent = _detect_agent(question)

    if agent == "navigation":
        from app.agents.navigation_agent import ask_navigation_agent_sync
        answer = ask_navigation_agent_sync(question)
        return answer, "navigation"

    if agent == "documents":
        from app.agents.docs_agent import ask_docs_agent_sync
        answer = ask_docs_agent_sync(question)
        return answer, "documents"

    from app.agents.donnees_agent import ask_donnees_agent_sync
    answer = ask_donnees_agent_sync(question)
    return answer, "donnees"


# ─── Test en ligne de commande ────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Liste tous les fonds"
    print(f"\nQuestion      : {q}")
    agent = _detect_agent(q)
    print(f"Agent détecté : {agent}")
    answer, agent_used = ask_auto_agent_sync(q)
    print(f"Agent utilisé : {agent_used}")
    print(f"Réponse       : {answer}\n")