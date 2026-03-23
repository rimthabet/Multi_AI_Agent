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

_ROUTES_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../..", "..", "src", "app", "app.routes.ts")
)

mcp = FastMCP(
    name="navigation-agent",
    instructions="Serveur MCP navigation. Utilise les outils pour trouver les IDs et retourner des actions JSON.",
)

def _rows_to_list(rows) -> list[dict]:
    return [dict(r) for r in (rows or [])]


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


# ──────────────────────────────────────────────
# Outil 1 : Chercher un fonds par nom
# ──────────────────────────────────────────────
@mcp.tool()
def find_fonds(name: str) -> str:
    """
    Cherche un fonds par son nom et retourne son ID et sa dénomination.
    Utilise cet outil quand l'utilisateur veut naviguer vers un fonds spécifique.

    Args:
        name: Nom (ou partie du nom) du fonds.

    Returns:
        JSON avec id et denomination du fonds trouvé.
    """
    sql = """
        SELECT id, denomination, etat_id
        FROM fonds
        WHERE LOWER(denomination) LIKE LOWER(%s)
        ORDER BY denomination
        LIMIT 5
    """
    rows = execute_data_readonly(sql, [f"%{name}%"])
    result = _rows_to_list(rows)

    if not result:
        return json.dumps(
            {"message": f"Aucun fonds trouvé pour : '{name}'"},
            ensure_ascii=False,
        )
    return json.dumps(result, ensure_ascii=False, default=str)


# ──────────────────────────────────────────────
# Outil 2 : Chercher un projet par nom
# ──────────────────────────────────────────────
@mcp.tool()
def find_projet(name: str) -> str:
    """
    Cherche un projet par son nom et retourne son ID et son nom.
    Utilise cet outil quand l'utilisateur veut naviguer vers un projet spécifique.

    Args:
        name: Nom (ou partie du nom) du projet.

    Returns:
        JSON avec id et nom du projet trouvé.
    """
    sql = """
        SELECT p.id, p.nom, ea.libelle AS etat
        FROM projet p
        LEFT JOIN etat_avancement ea ON ea.id = p.etat_id
        WHERE LOWER(p.nom) LIKE LOWER(%s)
        ORDER BY p.nom
        LIMIT 5
    """
    rows = execute_data_readonly(sql, [f"%{name}%"])
    result = _rows_to_list(rows)

    if not result:
        return json.dumps(
            {"message": f"Aucun projet trouvé pour : '{name}'"},
            ensure_ascii=False,
        )
    return json.dumps(result, ensure_ascii=False, default=str)


# ──────────────────────────────────────────────
# Outil 3 : Lister les routes disponibles
# ──────────────────────────────────────────────
@mcp.tool()
def list_routes() -> str:
    """
    Retourne la liste des routes disponibles dans l'application.
    Utilise cet outil quand l'utilisateur veut naviguer vers une section
    sans mentionner un élément spécifique.

    Returns:
        JSON avec les routes disponibles.
    """
    routes = _load_routes_from_ts()
    if not routes:
        return json.dumps([], ensure_ascii=False)

    return json.dumps([
        {"route": r, "label": r, "description": ""}
        for r in routes
    ], ensure_ascii=False)


if __name__ == "__main__":
    mcp.run(transport="stdio")