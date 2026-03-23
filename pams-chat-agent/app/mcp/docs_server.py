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
from app.services.doc_search import doc_search
from app.services.db import get_rag_conn

mcp = FastMCP(
    name="docs-agent",
    instructions="Serveur MCP documents. Utilise search_docs pour répondre aux questions sur les PDFs, list_documents pour lister les documents disponibles.",
)


# ──────────────────────────────────────────────
# Outil 1 : Recherche dans les documents
# ──────────────────────────────────────────────
@mcp.tool()
def search_docs(query: str, fonds_name: str = "", top_k: int = 6) -> str:
    """
    Recherche dans les documents PDF (rapports annuels, bilans, prospectus, PV)
    via recherche vectorielle (RAG).

    Utiliser pour :
    - Politique d'investissement d'un fonds
    - Données financières d'un rapport (bilan, résultat, actif net)
    - Procédures, règlements, situations annuelles
    - Tout contenu documentaire non disponible en base structurée

    Args:
        query:      Question ou terme à rechercher dans les documents.
        fonds_name: Nom du fonds pour cibler les documents (optionnel).
        top_k:      Nombre de passages à retourner (défaut 6).

    Returns:
        JSON array des passages pertinents avec source, page et score.
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


# ──────────────────────────────────────────────
# Outil 2 : Lister les documents d'un fonds
# ──────────────────────────────────────────────
@mcp.tool()
def list_documents(fonds_name: str = "", doc_type: str = "") -> str:
    try:
        from app.services.db import get_rag_conn

        with get_rag_conn() as conn:
            with conn.cursor() as cur:

                if fonds_name.strip():
                    # Cherche chaque mot du nom du fonds séparément
                    # pour éviter les faux positifs
                    words = [w for w in fonds_name.strip().split() if len(w) > 2]
                    if words:
                        conditions = " AND ".join(
                            ["LOWER(title) LIKE LOWER(%s)"] * len(words)
                        )
                        params = [f"%{w}%" for w in words]
                        cur.execute(
                            f"""
                            SELECT id, title, source_path, created_at
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
                            SELECT id, title, source_path, created_at
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
                        SELECT id, title, source_path, created_at
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
                        "id":    row[0],
                        "titre": row[1],
                        "path":  row[2],
                        "date":  str(row[3]) if row[3] else None,
                    })

                return json.dumps(results, ensure_ascii=False, default=str)

    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run(transport="stdio")