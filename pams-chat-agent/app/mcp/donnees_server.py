import json
import sys
import os

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from mcp.server.fastmcp import FastMCP
from app.services.db import execute_data_readonly
from app.services.doc_search import doc_search

mcp = FastMCP(
    name="donnees-agent",
    instructions="Serveur MCP données. Appelle execute_sql() directement.",
)

def _rows_to_list(rows) -> list[dict]:
    return [dict(r) for r in (rows or [])]


# ── Requêtes pour construire le schéma (utilisé par donnees_agent.py) ──────

_COLUMNS_SQL = """
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = ANY(%s::text[])
ORDER BY table_name, ordinal_position;
"""

_FKS_SQL = """
SELECT
  src.relname AS source_table,
  a_src.attname AS source_column,
  tgt.relname AS target_table,
  a_tgt.attname AS target_column
FROM pg_constraint c
JOIN pg_class src ON src.oid = c.conrelid
JOIN pg_namespace nsrc ON nsrc.oid = src.relnamespace
JOIN pg_class tgt ON tgt.oid = c.confrelid
JOIN pg_namespace ntgt ON ntgt.oid = tgt.relnamespace
JOIN unnest(c.conkey) WITH ORDINALITY AS sc(attnum, ord) ON true
JOIN unnest(c.confkey) WITH ORDINALITY AS tc(attnum, ord) ON sc.ord = tc.ord
JOIN pg_attribute a_src ON a_src.attrelid = src.oid AND a_src.attnum = sc.attnum
JOIN pg_attribute a_tgt ON a_tgt.attrelid = tgt.oid AND a_tgt.attnum = tc.attnum
WHERE c.contype = 'f'
  AND nsrc.nspname = 'public'
  AND ntgt.nspname = 'public'
  AND src.relname = ANY(%s::text[])
  AND tgt.relname = ANY(%s::text[])
ORDER BY source_table;
"""

_METIER_TABLES = [
    "fonds", "etat_fonds", "banque",
    "souscription", "souscripteur",
    "projet", "etat_avancement", "promoteur",
    "financement", "financement_fonds",
    "secteur", "projet_secteur",
    "inv_souscription_action", "inv_liberation_action",
    "inv_souscription_oca",    "inv_liberation_oca",
    "inv_souscription_cca",    "inv_liberation_cca",
]


def _build_schema_dynamic() -> str:
    """
    Construit le schéma compact des tables métier.
    Appelé par donnees_agent.py pour l'injecter dans le system prompt.
    """

    # Annotations explicatives pour aider le LLM à comprendre les jointures
    _TABLE_ANNOTATIONS = {
        "financement_fonds": (
            "-- JOINTURE M-N fonds↔projets. "
            "Colonnes exactes : financement_id, fonds_id. "
            "PAS de colonne projet_id ici. "
            "Chemin obligatoire : fonds→financement_fonds→financement→projet"
        ),
        "financement": (
            "-- Lien financement↔projet. "
            "Contient projet_id. "
            "Chemin complet : fonds→financement_fonds(fonds_id)→financement(financement_id)→projet(projet_id)"
        ),
        "projet_secteur": (
            "-- JOINTURE M-N projets↔secteurs. "
            "Colonnes exactes : projet_id, secteur_id"
        ),
        "inv_liberation_action": "-- Montants réellement libérés en actions",
        "inv_liberation_oca":    "-- Montants réellement libérés en OCA",
        "inv_liberation_cca":    "-- Montants réellement libérés en CCA",
        "inv_souscription_action": "-- Souscriptions investissement actions, liée à fonds via fonds_id",
        "inv_souscription_oca":    "-- Souscriptions investissement OCA, liée à fonds via fonds_id",
        "inv_souscription_cca":    "-- Souscriptions investissement CCA, liée à fonds via fonds_id",
    }

    # Vérifie quelles tables existent vraiment dans la DB
    rows = execute_data_readonly(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' AND table_type='BASE TABLE'"
    )
    existing = {r.get("table_name") for r in rows}
    tables = [t for t in _METIER_TABLES if t in existing]

    if not tables:
        return "Aucune table métier trouvée."

    cols = execute_data_readonly(_COLUMNS_SQL, [tables])
    fks  = execute_data_readonly(_FKS_SQL, [tables, tables])

    by_table: dict = {}
    for r in cols:
        by_table.setdefault(r["table_name"], []).append(r["column_name"])

    fk_by_table: dict = {}
    for r in fks:
        fk_by_table.setdefault(r["source_table"], []).append(
            f"{r['source_column']}→{r['target_table']}"
        )

    lines = []
    for t in tables:
        if t not in by_table:
            continue
        cols_str = ", ".join(by_table[t])
        fk_str = ""
        if t in fk_by_table:
            fk_str = "  [" + ", ".join(fk_by_table[t]) + "]"
        annotation = _TABLE_ANNOTATIONS.get(t, "")
        if annotation:
            lines.append(f"{t}({cols_str}){fk_str}  {annotation}")
        else:
            lines.append(f"{t}({cols_str}){fk_str}")

    return "\n".join(lines)

# ──────────────────────────────────────────────
# Outil unique : Exécution SQL
# ──────────────────────────────────────────────
@mcp.tool()
def execute_sql(query: object = None, limit: int | None = 100) -> str:
    """
    Exécute une requête SQL SELECT sur la base de données.
    Couvre : fonds, projets, souscriptions, financements, secteurs, promoteurs.

    Args:
        query: Requête SQL SELECT valide.
        limit: Nombre max de résultats (défaut 100).

    Returns:
        JSON array des résultats.
    """
    q = str(query or "").strip().rstrip(";")
    if not q:
        return json.dumps({"error": "Paramètre 'query' requis."}, ensure_ascii=False)

    try:
        limit_val = int(limit) if limit is not None else 100
    except (TypeError, ValueError):
        limit_val = 100

    forbidden = ["insert", "update", "delete", "drop", "truncate", "alter", "create"]
    q_lower = q.lower()
    for kw in forbidden:
        if kw in q_lower:
            return json.dumps(
                {"error": f"Opération '{kw}' interdite. SELECT uniquement."},
                ensure_ascii=False,
            )

    if "limit" not in q_lower:
        q = f"{q} LIMIT {limit_val}"

    try:
        rows = execute_data_readonly(q)
        result = _rows_to_list(rows)
        return json.dumps(result, ensure_ascii=False, default=str)
    except Exception as e:
        return json.dumps({"error": str(e), "query": q}, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run(transport="stdio")