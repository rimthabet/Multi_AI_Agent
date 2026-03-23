import re
import sys
import os
import json
import unicodedata

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.db import execute_data_readonly

_FORM_ENTITY_TABLES = {
    "fonds": "fonds",
    "projet": "projet",
    "souscription": "souscription",
}

_FORM_ROUTES = {
    "fonds": "funds/creation-funds",
    "projet": "projects/creation",
    "souscription": "funds/subscriptions",
}

_ENTITY_KEYWORDS = {
    "fonds": ["fonds", "fcpr", "fund"],
    "projet": ["projet", "project"],
    "souscription": ["souscription", "subscription"],
}

_ROUTES_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../..", "..", "src", "app", "app.routes.ts")
)


def _load_routes_from_ts() -> list[str]:
    if not os.path.exists(_ROUTES_PATH):
        return []

    try:
        with open(_ROUTES_PATH, "r", encoding="utf-8") as fh:
            content = fh.read()
    except Exception:
        return []

    paths = re.findall(r"path\s*:\s*['\"]([^'\"]+)['\"]", content)
    seen = set()
    ordered = []
    for p in paths:
        if p in seen:
            continue
        seen.add(p)
        ordered.append(p)
    return ordered


_ALL_ROUTES = _load_routes_from_ts()


def _load_db_schema() -> dict[str, set[str]]:
    try:
        rows = execute_data_readonly(
            "SELECT table_name, column_name FROM information_schema.columns "
            "WHERE table_schema = 'public'"
        )
    except Exception:
        return {}

    schema: dict[str, set[str]] = {}
    for row in rows or []:
        table = (row.get("table_name") or "").lower()
        column = (row.get("column_name") or "").lower()
        if not table or not column:
            continue
        schema.setdefault(table, set()).add(column)
    return schema


_DB_SCHEMA = _load_db_schema()


def _normalize_key(value: str) -> str:
    v = (value or "").strip().lower()
    v = unicodedata.normalize("NFD", v)
    v = "".join(ch for ch in v if unicodedata.category(ch) != "Mn")
    v = re.sub(r"[\s\-]+", "_", v)
    v = re.sub(r"[^a-z0-9_]+", "", v)
    return v


def _parse_key_values(question: str) -> dict[str, str]:
    payload_text = question
    if ":" in question:
        payload_text = question.split(":", 1)[1]

    pairs = re.findall(r"([\w\s\-À-ÿ]+)\s*[:=]\s*([^,;\n]+)", payload_text, re.UNICODE)
    result: dict[str, str] = {}
    for key, value in pairs:
        k = _normalize_key(key)
        v = value.strip().strip("\"'")
        if k and v:
            result[k] = v
    return result


def _detect_entity(question: str, keys: list[str]) -> str:
    q = (question or "").lower()
    for entity, words in _ENTITY_KEYWORDS.items():
        if any(w in q for w in words):
            return entity

    best_entity = ""
    best_score = 0
    for entity, table in _FORM_ENTITY_TABLES.items():
        columns = _DB_SCHEMA.get(table, set())
        score = sum(1 for k in keys if k in columns)
        if score > best_score:
            best_score = score
            best_entity = entity

    return best_entity

# ── Toutes les routes Angular ──────────────────────────────────────────────

_SIMPLE_ROUTES = [

    # Dashboard
    (r"\bdashboard\b|\btableau\s+de\s+bord\b",                                          "dashboard"),

    # Fonds
    (r"\bliste\s+des\s+fonds\b|\brepertoire\b|\brepository\b|\bfiche\s+fonds\b",        "repository"),
    (r"\bajouter?\s+(?:un\s+)?fonds\b|\bcr[eé]{1,2}r?\s+(?:un\s+)?fonds\b|\bnouveau\s+fonds\b|\bformulaire\s+.*fonds\b|\bajout\s+.*fonds\b", "funds/creation-funds"),
    (r"\bsouscripteurs?\b",                                                              "funds/subscribers"),
    (r"\bsouscriptions?\b",                                                              "funds/subscriptions"),
    (r"\bsouscripteur.souscriptions?\b",                                                 "funds/subscriber-subscriptions"),
    (r"\bcomit[eé]\s+investissement\b",                                                  "funds/comite-investment"),
    (r"\bcomit[eé]\s+strat[eé]gique?\b",                                                 "funds/comite-strategic"),
    (r"\bcomit[eé]\s+interne\b",                                                         "funds/comite-interne"),
    (r"\bcomit[eé]\s+valorisation\b",                                                    "funds/comite-valuation"),

    # Projets
    (r"\bliste\s+des\s+projets\b|\binventaire\s+projets?\b",                            "projects/inventory"),
    (r"\bajouter?\s+(?:un\s+)?projet\b|\bcr[eé]{1,2}r?\s+(?:un\s+)?projet\b|\bnouveau\s+projet\b|\bformulaire\s+.*projet\b|\bajout\s+.*projet\b", "projects/creation"),
    (r"\bajouter?\s+(?:un\s+)?projets\b|\bcr[eé]{1,2}r?\s+(?:un\s+)?projets\b|\bnouveau\s+projets\b|\bformulaire\s+.*projets\b|\bajout\s+.*projets\b", "projects/creation"),
    (r"\bpromoteurs?\b",                                                                 "projects/promotors"),
    (r"\bcontacts?\s+projets?\b",                                                        "projects/contacts"),
    (r"\bprojets?\s+en\s+[eé]tude\b|\bunder.study\b",                                   "projects/under-study"),

    # Investissements
    (r"\bcollecte\s+documents?\b|\bdocuments?\s+collecte\b",                            "investments/collecte-documents"),
    (r"\bsouscription\s+investissement\b|\binvestissement\s+souscription\b",             "investments/subscription"),
    (r"\bvesting\b|\blib[eé]rations?\s+investissement\b",                               "investments/vesting"),
    (r"\binvestissements?\s+projets?\b|\bprojets?\s+investis\b",                        "investments/projects"),

    # Suivi
    (r"\bsuivi\s+des?\s+projets?\b|\btracking\s+projets?\b",                            "tracking/projects"),
    (r"\badministration\s+gestion\b|\bcontr[oô]le\s+gestion\b",                         "tracking/administration"),
    (r"\bstructure\s+(?:du\s+)?capital\b|\bcapital\s+structure\b",                      "tracking/capital-structure"),
    (r"\bsuivi\s+r[eé]unions?\b|\br[eé]unions?\b|\bmeetings?\b",                        "tracking/meetings"),
    (r"\bd[eé]cisions?\s+r[eé]solutions?\b|\bsuivi\s+d[eé]cisions?\b",                  "tracking/followup-decisions-resolutions"),
    (r"\bmeeting\s+tracking\b|\bsuivi\s+meeting\b",                                     "tracking/meeting-tracking"),
    (r"\b[eé]tats?\s+financiers?\b|\bfinancial\s+statements?\b",                        "tracking/financial-statements"),
    (r"\bbusiness\s*plan\b|\bsuivi\s+bp\b",                                             "tracking/bp"),
    (r"\bcomparaison\s+r[eé]alisations?\b|\bcomparaison.*bp\b",                         "tracking/comparaison-realisations-bp"),
    (r"\bcomparaison\s+sch[eé]ma\b|\bcomparaison.*investissement\b",                    "tracking/comparaison-schema-investissement-realisations"),
    (r"\bfaits?\s+marquants?\b|\blandmark\b",                                           "tracking/faits-marquants"),

    # Désinvestissement
    (r"\bd[eé]sinvestissements?\s+r[eé]alis[eé]s?\b|\bd[eé]sinvestissement\b",          "divestment/realized-divestments"),
    (r"\bparticipations?\s+actions?\b|\bshares\b",                                      "divestment/shares_participations"),
    (r"\bparticipations?\s+oca\b",                                                      "divestment/oca_participations"),
    (r"\bparticipations?\s+cca\b",                                                      "divestment/cca_participations"),
    (r"\bremboursements?\s+conversions?\s+oca\b",                                       "divestment/refunds-conversions-ocas"),
    (r"\bremboursements?\s+conversions?\s+cca\b",                                       "divestment/refunds-conversions-ccas"),

    # Rapports — Ratios réglementaires
    (r"\bratios?\s+(?:r[eé]glementaires?\s+)?fonds?\b|\bfund.ratios?\b",                "reports/fund-ratios"),
    (r"\bratios?\s+historiques?\s+fonds?\b",                                            "reports/historical-fund-ratios"),
    (r"\bratios?\s+souscripteurs?\b|\bsubscriber.ratios?\b",                            "reports/subscriber-ratios"),
    (r"\bratios?\s+historiques?\s+souscripteurs?\b",                                    "reports/historical-subscriber-ratios"),

    # Rapports — Ratios de conformité
    (r"\bmarché\s+alternatif\b|\balternative\s+market\b",                               "reports/alternative-market"),
    (r"\bconformit[eé]\s+oca\b|\boca.compliance\b",                                     "reports/oca-compliance-ratios"),
    (r"\bqfp\b|\bquasi\s+fonds\s+propres?\b|\bratios?\s+conformit[eé]\b",               "reports/ratios-conformity-qfp"),
    (r"\bsecteur\s+activit[eé]\b|\bsector.activity\b",                                  "reports/sector-activity"),

    # Rapports — Portefeuille
    (r"\bportefeuille\b|\bfonds?\s+soci[eé]t[eé]s?\b|\bfunds.companies\b",             "reports/funds-companies"),
    (r"\binvestissements?\s+approuv[eé]s?\s+ci\b|\binv.approves.ci\b",                 "reports/inv-approves-ci"),
    (r"\binvestissements?\s+approuv[eé]s?\s+lib[eé]r[eé]s?\b",                         "reports/inv-approved-released"),

    # Documentation
    (r"\bdocumentation\b|\baide\b|\bguide\b",                                           "documentation"),

    # SOTUGAR
    (r"\bsotugar\b",                                                                     "sotugar"),

    # Paramètres
    (r"\bcat[eé]gorie\s+documents?\b",                                                  "settings/document-category"),
    (r"\btype\s+documents?\b",                                                          "settings/document-type"),
    (r"\bconformit[eé]\s+documents?\b",                                                 "settings/document-compliance"),
    (r"\bchecklist\s+documents?\b",                                                     "settings/document-checklist"),
    (r"\bphase\s+traitement\b|\btreatment.phase\b",                                     "settings/treatment-phase"),
    (r"\bt[aâ]che\s+traitement\b|\btreatment.task\b",                                   "settings/treatment-task"),
    (r"\b[eé]tat\s+fonds?\b|\bstatut\s+fonds?\b|\bfunds.status\b",                     "settings/funds-status"),
    (r"\b[eé]tat\s+avancement\b|\bprogress.status\b",                                  "settings/project-progress-status"),
    (r"\b[eé]tat\s+r[eé]union\b|\bprogress.meeting\b",                                 "settings/progress-status-meeting"),
    (r"\bm[eé]thode\s+[eé]valuation\b|\bevaluation.method\b",                          "settings/evaluation-method"),
    (r"\bsecteurs?\s+param[eè]tres?\b|\bsector\s+settings?\b",                         "settings/sector"),
    (r"\bcadre\s+investissement\b|\binvestment.framework\b",                            "settings/investment-framework"),
    (r"\bnature\s+fonds?\b|\bfunds.nature\b",                                           "settings/funds-nature"),
    (r"\bforme\s+l[eé]gale?\b|\blegal.form\b",                                         "settings/legal-form"),
    (r"\bbanques?\s+param[eè]tres?\b|\bbank\s+settings?\b",                             "settings/bank"),
    (r"\bauditeur\s+fonds?\b|\bfunds.auditor\b",                                        "settings/funds-auditor"),
    (r"\bauditeur\s+projets?\b|\bproject.auditor\b",                                    "settings/project-auditor"),
    (r"\binstitution\b",                                                                 "settings/institution"),
    (r"\bnature\s+investissement\b|\binvestment.nature\b",                              "settings/investment-nature"),
    (r"\btype\s+investissement\b|\binvestment.type\b",                                  "settings/investment-type"),
    (r"\bcharge\s+investissement\b|\binvestment.charge\b",                              "settings/investment-charge"),
    (r"\bcrit[eè]res?\s+pr[eé]s[eé]lection\b|\bpreselection\b",                        "settings/preselection-criteria"),
    (r"\btype\s+contribution\b|\bcontribution.types?\b",                                "settings/contribution-types"),
    (r"\btype\s+r[eé]union\b|\bmeeting.type\b",                                        "settings/meeting-type"),
    (r"\btype\s+sortie\b|\bexit.type\b|\boutput.type\b",                                "settings/output-type"),
    (r"\btype\s+[eé]lection\b|\belection.type\b",                                      "settings/election-type"),
    (r"\b[eé]l[eé]ments?\s+financiers?\b|\bfinancial.items?\b",                        "settings/financial-items"),
    (r"\btri\b|\btaux\s+retour\s+interne\b|\btri.calcul\b",                             "settings/tri"),
]


def _extract_amount(question: str) -> float | None:
    q = question.lower()
    m = re.search(
        r"(\d[\d\s.,]*)\s*(million|milliard|mille|k|dt|tnd|dinars?)?",
        q,
        re.IGNORECASE,
    )
    if not m:
        return None

    raw = m.group(1)
    unit = (m.group(2) or "").lower()

    raw = raw.replace(" ", "").replace("\u202f", "").replace("\xa0", "")
    raw = raw.replace(",", ".")
    try:
        value = float(raw)
    except ValueError:
        return None

    multiplier = 1.0
    if unit in ("million",):
        multiplier = 1_000_000.0
    elif unit in ("milliard",):
        multiplier = 1_000_000_000.0
    elif unit in ("mille", "k"):
        multiplier = 1_000.0

    return value * multiplier


def _extract_fund_creation_payload(question: str) -> dict:
    q = question.strip()
    name = ""

    name_match = re.search(
        r"fonds\s+(?:nomm[eé]|appel[eé])?\s*([^,;]+?)(?:\s+(?:avec|pour|montant|d'|de)\b|$)",
        q,
        re.IGNORECASE,
    )
    if name_match:
        name = name_match.group(1).strip()

    amount = _extract_amount(q)

    payload = {}
    if name:
        payload["denomination"] = name
    if amount is not None:
        payload["montant"] = amount

    return payload


def _find_fonds_id(name: str) -> int | None:
    try:
        rows = execute_data_readonly(
            "SELECT id FROM fonds WHERE denomination ILIKE %s LIMIT 1",
            [f"%{name}%"]
        )
        if rows:
            return dict(rows[0])["id"]
    except Exception:
        pass
    return None


def _find_projet_id(name: str) -> int | None:
    try:
        rows = execute_data_readonly(
            "SELECT id FROM projet WHERE nom ILIKE %s LIMIT 1",
            [f"%{name}%"]
        )
        if rows:
            return dict(rows[0])["id"]
    except Exception:
        pass
    return None


def _extract_name(question: str, entity: str) -> str:
    q = question.strip()

    if entity == "fonds":
        patterns = [
            r"(?:ouvre|affiche|montre|navigue\s+vers?|va\s+sur)\s+(?:le\s+fonds?|le\s+fcpr)?\s*(.+?)(?:\s*\?|$)",
            r"(?:fonds?|fcpr)\s+(.+?)(?:\s*\?|$)",
            r"dashboard\s+(?:du\s+)?fonds?\s+(.+?)(?:\s*\?|$)",
        ]
    else:
        patterns = [
            r"(?:ouvre|affiche|montre|navigue\s+vers?|va\s+sur)\s+(?:le\s+projet)?\s*(.+?)(?:\s*\?|$)",
            r"projet\s+(.+?)(?:\s*\?|$)",
            r"dashboard\s+(?:du\s+)?projet\s+(.+?)(?:\s*\?|$)",
        ]

    for pattern in patterns:
        m = re.search(pattern, q, re.IGNORECASE)
        if m:
            name = m.group(1).strip()
            name = re.sub(r"^(le|la|les|du|de|un|une)\s+", "", name, flags=re.IGNORECASE)
            return name.strip()

    return ""


def ask_navigation_agent_sync(question: str) -> str:
    q = question.lower().strip()

    # 0. Creation de fonds avec prefill
    if any(w in q for w in ["creer", "créer", "creation", "ajouter", "ajout"]):
        payload = _parse_key_values(question)
        entity = _detect_entity(question, list(payload.keys()))
        if entity and entity in _FORM_ROUTES:
            return json.dumps({
                "action": "navigate",
                "route": _FORM_ROUTES[entity],
                "label": f"Creation {entity}",
                "params": payload,
            }, ensure_ascii=False)

    # 1. Fonds avec ID
    if any(w in q for w in ["ouvre", "ouvrir", "affiche", "montre", "dashboard"]):
        if any(w in q for w in ["fonds", "fcpr", "fund"]):
            name = _extract_name(question, "fonds")
            if name:
                fonds_id = _find_fonds_id(name)
                if fonds_id:
                    return json.dumps({
                        "action": "navigate",
                        "route":  f"dashboard/funds/{fonds_id}",
                        "label":  f"Ouverture du fonds {name}",
                    }, ensure_ascii=False)
                return json.dumps({
                    "action":  "error",
                    "message": f"Aucun fonds trouvé pour : '{name}'",
                }, ensure_ascii=False)

        # 2. Projet avec ID
        if any(w in q for w in ["projet", "project"]):
            name = _extract_name(question, "projet")
            if name:
                projet_id = _find_projet_id(name)
                if projet_id:
                    return json.dumps({
                        "action": "navigate",
                        "route":  f"dashboard/projects/{projet_id}",
                        "label":  f"Ouverture du projet {name}",
                    }, ensure_ascii=False)
                return json.dumps({
                    "action":  "error",
                    "message": f"Aucun projet trouvé pour : '{name}'",
                }, ensure_ascii=False)

    # 3. Routes explicites (match sur le chemin)
    for route in _ALL_ROUTES:
        if route == "**":
            continue
        if route.lower() in q:
            return json.dumps({
                "action": "navigate",
                "route": route,
                "label": f"Navigation vers {route}",
            }, ensure_ascii=False)

    # 4. Routes simples
    for pattern, route in _SIMPLE_ROUTES:
        if re.search(pattern, q, re.IGNORECASE):
            return json.dumps({
                "action": "navigate",
                "route":  route,
                "label":  f"Navigation vers {route}",
            }, ensure_ascii=False)

    # 5. Non reconnu
    return json.dumps({
        "action":  "unknown",
        "message": "Je n'ai pas compris cette action de navigation.",
    }, ensure_ascii=False)


if __name__ == "__main__":
    tests = [
        "Ouvre le fonds FCPR MAX ESPOIR",
        "Va sur la liste des fonds",
        "Ajouter un fonds",
        "Va sur le formulaire d'ajout de fonds",
        "Créer un nouveau projet",
        "Affiche les souscriptions",
        "Va sur le dashboard",
        "Affiche les états financiers",
        "Va sur les ratios fonds",
        "Ouvre le projet TECHNOLATEX",
        "Va sur les paramètres secteur",
        "Affiche le suivi des réunions",
    ]
    for q in tests:
        result = json.loads(ask_navigation_agent_sync(q))
        status = "✓" if result["action"] == "navigate" else "✗"
        print(f"{status} '{q}' → {result.get('route') or result.get('message')}")