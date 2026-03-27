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


@mcp.tool()
def total_actif(nom_fonds: str = None) -> str:
    """
    Retourne le total actif, qui est la somme de montant_souscription dans la table souscription.
    Peut être global (tous les fonds) ou filtré pour un fonds spécifique en utilisant nom_fonds.
    """
    if nom_fonds:
        q = """
            SELECT f.denomination, COALESCE(SUM(s.montant_souscription), 0) as total_actif 
            FROM souscription s 
            JOIN fonds f ON s.fonds_id = f.id 
            WHERE f.denomination ILIKE %s 
            GROUP BY f.denomination
        """
        rows = execute_data_readonly(q, [f"%{nom_fonds}%"])
    else:
        q = "SELECT COALESCE(SUM(montant_souscription), 0) as total_actif_global FROM souscription"
        rows = execute_data_readonly(q)

    return json.dumps(_rows_to_list(rows), ensure_ascii=False, default=str)


@mcp.tool()
def total_investi(type_investissement: str = "tous", nom_fonds: str = None) -> str:
    """
    Retourne le total investi (montant_liberation) dans inv_liberation_oca, inv_liberation_cca, inv_liberation_action.
    On peut filtrer par type_investissement ('oca', 'cca', 'action', ou 'tous') et/ou par nom_fonds.
    """
    t = (type_investissement or "tous").lower().strip()
    
    if nom_fonds:
        q_act = """SELECT COALESCE(SUM(ila.montant_liberation), 0) as total
                   FROM fonds f
                   JOIN inv_souscription_action isa ON isa.fonds_id = f.id
                   JOIN inv_liberation_action ila ON ila.souscription_id = isa.id
                   WHERE f.denomination ILIKE %s"""
        q_oca = """SELECT COALESCE(SUM(ilo.montant_liberation), 0) as total
                   FROM fonds f
                   JOIN inv_souscription_oca iso ON iso.fonds_id = f.id
                   JOIN inv_liberation_oca ilo ON ilo.souscription_id = iso.id
                   WHERE f.denomination ILIKE %s"""
        q_cca = """SELECT COALESCE(SUM(ilc.montant_liberation), 0) as total
                   FROM fonds f
                   JOIN inv_souscription_cca isc ON isc.fonds_id = f.id
                   JOIN inv_liberation_cca ilc ON ilc.souscription_id = isc.id
                   WHERE f.denomination ILIKE %s"""

        if t == "oca":
            rows = execute_data_readonly(q_oca, [f"%{nom_fonds}%"])
            res = {"fonds": nom_fonds, "total_investi_oca": rows[0]["total"] if rows else 0}
        elif t == "cca":
            rows = execute_data_readonly(q_cca, [f"%{nom_fonds}%"])
            res = {"fonds": nom_fonds, "total_investi_cca": rows[0]["total"] if rows else 0}
        elif t in ["action", "actions"]:
            rows = execute_data_readonly(q_act, [f"%{nom_fonds}%"])
            res = {"fonds": nom_fonds, "total_investi_action": rows[0]["total"] if rows else 0}
        else:
            r_act = execute_data_readonly(q_act, [f"%{nom_fonds}%"])
            r_oca = execute_data_readonly(q_oca, [f"%{nom_fonds}%"])
            r_cca = execute_data_readonly(q_cca, [f"%{nom_fonds}%"])
            v_act = r_act[0]["total"] if r_act else 0
            v_oca = r_oca[0]["total"] if r_oca else 0
            v_cca = r_cca[0]["total"] if r_cca else 0
            res = {
                "fonds": nom_fonds,
                "total_investi_action": v_act,
                "total_investi_oca": v_oca,
                "total_investi_cca": v_cca,
                "total_investi_global": v_act + v_oca + v_cca
            }
        return json.dumps([res], ensure_ascii=False, default=str)
    else:
        if t == "oca":
            q = "SELECT COALESCE(SUM(montant_liberation), 0) AS total_investi_oca FROM inv_liberation_oca"
            rows = execute_data_readonly(q)
        elif t == "cca":
            q = "SELECT COALESCE(SUM(montant_liberation), 0) AS total_investi_cca FROM inv_liberation_cca"
            rows = execute_data_readonly(q)
        elif t in ("action", "actions"):
            q = "SELECT COALESCE(SUM(montant_liberation), 0) AS total_investi_action FROM inv_liberation_action"
            rows = execute_data_readonly(q)
        else:
            q = """
                SELECT 
                  (SELECT COALESCE(SUM(montant_liberation), 0) FROM inv_liberation_action) AS total_investi_action,
                  (SELECT COALESCE(SUM(montant_liberation), 0) FROM inv_liberation_oca) AS total_investi_oca,
                  (SELECT COALESCE(SUM(montant_liberation), 0) FROM inv_liberation_cca) AS total_investi_cca,
                  (SELECT COALESCE(SUM(montant_liberation), 0) FROM inv_liberation_action) +
                  (SELECT COALESCE(SUM(montant_liberation), 0) FROM inv_liberation_oca) +
                  (SELECT COALESCE(SUM(montant_liberation), 0) FROM inv_liberation_cca) AS total_investi_global
            """
            rows = execute_data_readonly(q)
        
        return json.dumps(_rows_to_list(rows), ensure_ascii=False, default=str)


if __name__ == "__main__":
    mcp.run(transport="stdio")