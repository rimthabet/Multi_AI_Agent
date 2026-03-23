import json
import sys
import os


_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from mcp.server.fastmcp import FastMCP
from app.services.db import execute_data_readonly
from app.services.doc_search import doc_search

# Création du serveur MCP
mcp = FastMCP(
    name="fonds-agent",
    instructions=(
        "Serveur MCP spécialisé dans les fonds d'investissement. "
        "Utilise ces outils pour répondre aux questions sur les fonds, "
        "leurs souscriptions, leurs projets et leurs statistiques."
    ),
)


# Utilitaire 

def _rows_to_list(rows) -> list[dict]:
    """Convertit les RealDictRow psycopg2 en list[dict] sérialisables."""
    return [dict(r) for r in (rows or [])]


# Outil 1 : Lister tous les fonds 

@mcp.tool()
def list_fonds(limit: int = 50) -> str:
    """
    Liste tous les fonds d'investissement avec leurs informations principales :
    dénomination, montant AUTORISÉ (fonds.montant = capital cible du fonds, pas le montant investi),
    durée, état et banque dépositaire.
    Utiliser cet outil pour : "montant de chaque fonds", "capital de chaque fonds", "liste des fonds".

    Args:
        limit: Nombre maximum de fonds à retourner (défaut : 50).

    Returns:
        JSON array des fonds avec le champ 'montant' = montant autorisé en TND.
    """
    limit = limit if isinstance(limit, int) and limit > 0 else 50
    sql = """
        SELECT
            f.id,
            f.denomination,
            f.montant,
            f.duree,
            ef.libelle  AS etat,
            b.libelle   AS banque_depositaire
        FROM fonds f
        LEFT JOIN etat_fonds ef ON ef.id = f.etat_id
        LEFT JOIN banque      b  ON b.id  = f.banque_id
        ORDER BY f.denomination
        LIMIT %s
    """
    rows = execute_data_readonly(sql, [limit])
    result = _rows_to_list(rows)
    return json.dumps(result, ensure_ascii=False, default=str)


# Outil 2 : Rechercher un fonds par nom 

@mcp.tool()
def get_fonds_by_name(name: str) -> str:
    """
    Recherche un ou plusieurs fonds par leur dénomination (recherche partielle).

    Args:
        name: Nom (ou partie du nom) du fonds à chercher.

    Returns:
        JSON array des fonds correspondants avec tous leurs détails.
    """
    sql = """
        SELECT
            f.id,
            f.denomination,
            f.montant,
            f.duree,
            f.date_lancement,
            ef.libelle  AS etat,
            b.libelle   AS banque_depositaire
        FROM fonds f
        LEFT JOIN etat_fonds ef ON ef.id = f.etat_id
        LEFT JOIN banque      b  ON b.id  = f.banque_id
        WHERE f.denomination ILIKE %s
        ORDER BY f.denomination
        LIMIT 20
    """
    rows = execute_data_readonly(sql, [f"%{name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps({"message": f"Aucun fonds trouvé pour le nom : '{name}'"}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, default=str)


#Outil 3 : Statistiques globales des fonds 

@mcp.tool()
def get_fonds_stats() -> str:
    """
    Retourne des statistiques globales sur les fonds d'investissement :
    - Nombre total de fonds
    - Répartition par état (en cours, liquidé, pré-liquidation, etc.)
    - Montant total et montant moyen

    Returns:
        JSON object avec les statistiques.
    """
    # Nombre total + montant global
    sql_summary = """
        SELECT
            COUNT(*)              AS nb_total,
            SUM(f.montant)        AS montant_total,
            AVG(f.montant)        AS montant_moyen
        FROM fonds f
    """
    summary = execute_data_readonly(sql_summary)

    # Répartition par état
    sql_etat = """
        SELECT
            COALESCE(ef.libelle, 'Non défini') AS etat,
            COUNT(f.id)                         AS nombre
        FROM fonds f
        LEFT JOIN etat_fonds ef ON ef.id = f.etat_id
        GROUP BY ef.libelle
        ORDER BY nombre DESC
    """
    by_etat = execute_data_readonly(sql_etat)

    result = {
        "resume": _rows_to_list(summary)[0] if summary else {},
        "repartition_par_etat": _rows_to_list(by_etat),
    }
    return json.dumps(result, ensure_ascii=False, default=str)


#  Outil 4 : Souscriptions d'un fonds 

@mcp.tool()
def get_fonds_souscriptions(fonds_name: str) -> str:
    """
    Retourne la liste des souscriptions pour un fonds donné.

    Args:
        fonds_name: Nom (ou partie du nom) du fonds.

    Returns:
        JSON array des souscriptions (souscripteur, montant, date).
    """
    sql = """
        SELECT
            f.denomination          AS fonds,
            s.montant_souscription  AS montant_souscrit,
            s.date_souscription,
            s.souscripteur_id
        FROM souscription s
        JOIN fonds f ON f.id = s.fonds_id
        WHERE f.denomination ILIKE %s
        ORDER BY s.date_souscription DESC
        LIMIT 100
    """
    rows = execute_data_readonly(sql, [f"%{fonds_name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps(
            {"message": f"Aucune souscription trouvée pour le fonds : '{fonds_name}'"},
            ensure_ascii=False,
        )
    return json.dumps(result, ensure_ascii=False, default=str)


# Outil 5 : Projets financés par un fonds 

@mcp.tool()
def get_fonds_projects(fonds_name: str) -> str:
    """
    Retourne les projets financés par un fonds donné.

    Args:
        fonds_name: Nom (ou partie du nom) du fonds.

    Returns:
        JSON array des projets (nom, secteur, montant investi, état, promoteur).
    """
    sql = """
        SELECT
            f.denomination          AS fonds,
            p.nom                   AS projet,
            fin.montant             AS montant_investi,
            ea.libelle              AS etat_avancement,
            pr.nom                  AS promoteur
        FROM fonds f
        JOIN financement_fonds ff ON ff.fonds_id   = f.id
        JOIN financement fin      ON fin.id         = ff.financement_id
        JOIN projet  p            ON p.id           = fin.projet_id
        LEFT JOIN etat_avancement ea ON ea.id = p.etat_id
        LEFT JOIN promoteur       pr ON pr.id = p.promoteur_id
        WHERE f.denomination ILIKE %s
        ORDER BY p.nom
        LIMIT 100
    """
    rows = execute_data_readonly(sql, [f"%{fonds_name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps(
            {"message": f"Aucun projet trouvé pour le fonds : '{fonds_name}'"},
            ensure_ascii=False,
        )
    return json.dumps(result, ensure_ascii=False, default=str)


#  Outil 6 : Filtrer les fonds par état 

@mcp.tool()
def get_fonds_by_etat(etat: str) -> str:
    """
    Retourne les fonds filtrés par leur état (ex: actif, fermé, en investissement,
    en cours de levée, en pré-liquidation, liquidé).

    Args:
        etat: L'état recherché (partiel ou complet).

    Returns:
        JSON array des fonds correspondants.
    """
    sql = """
        SELECT
            f.denomination,
            f.montant,
            f.duree,
            f.date_lancement,
            ef.libelle  AS etat,
            b.libelle   AS banque_depositaire
        FROM fonds f
        LEFT JOIN etat_fonds ef ON ef.id = f.etat_id
        LEFT JOIN banque      b  ON b.id  = f.banque_id
        WHERE ef.libelle ILIKE %s
        ORDER BY f.denomination
        LIMIT 200
    """
    rows = execute_data_readonly(sql, [f"%{etat}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps({"message": f"Aucun fonds trouvé avec l'état : '{etat}'"}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, default=str)


#  Outil 7 : Filtrer les fonds par année de lancement 

@mcp.tool()
def get_fonds_by_year(year: int) -> str:
    """
    Retourne les fonds lancés (créés) au cours d'une année donnée.

    Args:
        year: L'année de lancement (ex: 2024).

    Returns:
        JSON array des fonds lancés cette année.
    """
    sql = """
        SELECT
            f.denomination,
            f.montant,
            f.duree,
            f.date_lancement,
           
            ef.libelle AS etat,
            b.libelle  AS banque_depositaire
        FROM fonds f
        LEFT JOIN etat_fonds ef ON ef.id = f.etat_id
        LEFT JOIN banque      b  ON b.id  = f.banque_id
        WHERE f.date_lancement IS NOT NULL
          AND EXTRACT(YEAR FROM f.date_lancement) = %s
        ORDER BY f.date_lancement
        LIMIT 200
    """
    rows = execute_data_readonly(sql, [year])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps({"message": f"Aucun fonds trouvé pour l'année {year}."}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, default=str)


#  Outil 8 : Total investi par un fonds (actions + OCA + CCA) 
@mcp.tool()
def get_fonds_investment_totals(fonds_name: str) -> str:
    """
    Calcule le montant total réellement investi par un fonds,
    détaillé par type (actions, OCA, CCA) et nombre de projets financés.

    Args:
        fonds_name: Nom (ou partie du nom) du fonds.

    Returns:
        JSON object avec les totaux par type d'investissement.
    """
    sql = """
        SELECT
            f.denomination,
            COUNT(DISTINCT fin.projet_id)                          AS nb_projets,
            COALESCE(SUM(ila.montant_liberation), 0)               AS total_investi_actions,
            COALESCE(SUM(ilo.montant_liberation), 0)               AS total_investi_oca,
            COALESCE(SUM(ilc.montant_liberation), 0)               AS total_investi_cca,
            COALESCE(SUM(ila.montant_liberation), 0)
          + COALESCE(SUM(ilo.montant_liberation), 0)
          + COALESCE(SUM(ilc.montant_liberation), 0)               AS total_investi_global
        FROM fonds f
        JOIN financement_fonds ff   ON ff.fonds_id        = f.id
        JOIN financement fin        ON fin.id             = ff.financement_id
        LEFT JOIN inv_souscription_action isa ON isa.fonds_id = f.id
        LEFT JOIN inv_liberation_action   ila ON ila.souscription_id = isa.id
        LEFT JOIN inv_souscription_oca    iso ON iso.fonds_id = f.id
        LEFT JOIN inv_liberation_oca      ilo ON ilo.souscription_id = iso.id
        LEFT JOIN inv_souscription_cca    isc ON isc.fonds_id = f.id
        LEFT JOIN inv_liberation_cca      ilc ON ilc.souscription_id = isc.id
        WHERE f.denomination ILIKE %s
        GROUP BY f.denomination
        LIMIT 10
    """
    rows = execute_data_readonly(sql, [f"%{fonds_name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps({"message": f"Aucune donnée d'investissement pour '{fonds_name}'."}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, default=str)


#  Outil 9 : Fonds ayant investi dans un secteur 

@mcp.tool()
def get_fonds_by_sector(sector_name: str) -> str:
    """
    Retourne les fonds ayant financé des projets dans un secteur donné.
    Les secteurs sont associés aux projets via la table projet_secteur.

    Args:
        sector_name: Nom (ou partie du nom) du secteur (ex: énergie, industrie, agriculture).

    Returns:
        JSON array des fonds avec les projets concernés.
    """
    sql = """
        SELECT DISTINCT
            f.denomination          AS fonds,
            s.libelle               AS secteur,
            p.nom                   AS projet,
            fin.montant             AS montant_investi
        FROM secteur s
        JOIN projet_secteur ps   ON ps.secteur_id = s.id
        JOIN projet p            ON p.id          = ps.projet_id
        JOIN financement fin     ON fin.projet_id  = p.id
        JOIN financement_fonds ff ON ff.financement_id = fin.id
        JOIN fonds f             ON f.id          = ff.fonds_id
        WHERE s.libelle ILIKE %s
        ORDER BY f.denomination, p.nom
        LIMIT 200
    """
    rows = execute_data_readonly(sql, [f"%{sector_name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps({"message": f"Aucun fonds trouvé pour le secteur : '{sector_name}'."}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, default=str)


#  Outil 10 : Classement des fonds (Top N selon un critère) 

@mcp.tool()
def get_fonds_ranking(criteria: str, limit: int = 10) -> str:
    """
    Classe les fonds selon un critère donné.
    Critères disponibles :
    - 'projets'      : fonds ayant financé le plus de projets
    - 'souscripteurs': fonds ayant le plus de souscripteurs
    - 'montant'      : fonds ayant le plus grand montant (souscriptions collectées)
    - 'investissement': fonds ayant libéré le plus de capital investi
    - 'secteurs'     : secteur le plus financé tous fonds confondus

    Args:
        criteria: Le critère de classement.
        limit: Nombre de résultats (défaut : 10).

    Returns:
        JSON array du classement.
    """
    c = (criteria or "").lower().strip()

    if "projet" in c:
        sql = """
            SELECT f.denomination, COUNT(DISTINCT fin.projet_id) AS nb_projets
            FROM fonds f
            JOIN financement_fonds ff ON ff.fonds_id      = f.id
            JOIN financement fin      ON fin.id           = ff.financement_id
            GROUP BY f.denomination
            ORDER BY nb_projets DESC
            LIMIT %s
        """
    elif "souscripteur" in c:
        sql = """
            SELECT f.denomination,
                   COUNT(DISTINCT s.souscripteur_id) AS nb_souscripteurs,
                   COALESCE(SUM(s.montant_souscription), 0) AS total_souscrit
            FROM souscription s
            JOIN fonds f ON f.id = s.fonds_id
            GROUP BY f.denomination
            ORDER BY nb_souscripteurs DESC
            LIMIT %s
        """
    elif "investissement" in c or "libér" in c or "libere" in c:
        sql = """
            SELECT f.denomination,
                   COALESCE(SUM(ila.montant_liberation), 0)
                 + COALESCE(SUM(ilo.montant_liberation), 0)
                 + COALESCE(SUM(ilc.montant_liberation), 0) AS total_investi
            FROM fonds f
            LEFT JOIN inv_souscription_action isa ON isa.fonds_id = f.id
            LEFT JOIN inv_liberation_action   ila ON ila.souscription_id = isa.id
            LEFT JOIN inv_souscription_oca    iso ON iso.fonds_id = f.id
            LEFT JOIN inv_liberation_oca      ilo ON ilo.souscription_id = iso.id
            LEFT JOIN inv_souscription_cca    isc ON isc.fonds_id = f.id
            LEFT JOIN inv_liberation_cca      ilc ON ilc.souscription_id = isc.id
            GROUP BY f.denomination
            ORDER BY total_investi DESC
            LIMIT %s
        """
    elif "secteur" in c:
        sql = """
            SELECT s.libelle AS secteur,
                   COUNT(DISTINCT p.id) AS nb_projets,
                   COUNT(DISTINCT f.id) AS nb_fonds
            FROM secteur s
            JOIN projet_secteur ps   ON ps.secteur_id      = s.id
            JOIN projet p            ON p.id               = ps.projet_id
            JOIN financement fin     ON fin.projet_id       = p.id
            JOIN financement_fonds ff ON ff.financement_id  = fin.id
            JOIN fonds f             ON f.id               = ff.fonds_id
            GROUP BY s.libelle
            ORDER BY nb_projets DESC
            LIMIT %s
        """
    else:  # Classement par montant souscrit 
        sql = """
            SELECT f.denomination, f.montant,
                   COALESCE(SUM(s.montant_souscription), 0) AS total_souscrit
            FROM fonds f
            LEFT JOIN souscription s ON s.fonds_id = f.id
            GROUP BY f.denomination, f.montant
            ORDER BY total_souscrit DESC
            LIMIT %s
        """

    rows = execute_data_readonly(sql, [limit])
    return json.dumps(_rows_to_list(rows), ensure_ascii=False, default=str)


#  Outil 11 : Comparer deux fonds 

@mcp.tool()
def compare_fonds(fonds1_name: str, fonds2_name: str) -> str:
    """
    Compare deux fonds côte à côte : montant, durée, état, nombre de projets,
    nombre de souscripteurs, total souscrit et total investi.

    Args:
        fonds1_name: Nom (ou partie du nom) du premier fonds.
        fonds2_name: Nom (ou partie du nom) du deuxième fonds.

    Returns:
        JSON array avec une entrée par fonds pour comparaison directe.
    """
    sql = """
        SELECT
            f.denomination,
            f.montant                                              AS montant_autorise,
            f.duree,
            f.date_lancement,
            ef.libelle                                             AS etat,
            b.libelle                                              AS banque,
            COUNT(DISTINCT fin.projet_id)                          AS nb_projets,
            COUNT(DISTINCT s.souscripteur_id)                      AS nb_souscripteurs,
            COALESCE(SUM(s.montant_souscription), 0)               AS total_souscrit,
            COALESCE(SUM(ila.montant_liberation), 0)
          + COALESCE(SUM(ilo.montant_liberation), 0)
          + COALESCE(SUM(ilc.montant_liberation), 0)               AS total_investi
        FROM fonds f
        LEFT JOIN etat_fonds ef            ON ef.id  = f.etat_id
        LEFT JOIN banque b                 ON b.id   = f.banque_id
        LEFT JOIN souscription s           ON s.fonds_id = f.id
        LEFT JOIN financement_fonds ff     ON ff.fonds_id = f.id
        LEFT JOIN financement fin          ON fin.id = ff.financement_id
        LEFT JOIN inv_souscription_action isa ON isa.fonds_id = f.id
        LEFT JOIN inv_liberation_action   ila ON ila.souscription_id = isa.id
        LEFT JOIN inv_souscription_oca    iso ON iso.fonds_id = f.id
        LEFT JOIN inv_liberation_oca      ilo ON ilo.souscription_id = iso.id
        LEFT JOIN inv_souscription_cca    isc ON isc.fonds_id = f.id
        LEFT JOIN inv_liberation_cca      ilc ON ilc.souscription_id = isc.id
        WHERE f.denomination ILIKE %s OR f.denomination ILIKE %s
        GROUP BY f.denomination, f.montant, f.duree, f.date_lancement, ef.libelle, b.libelle
        LIMIT 20
    """
    rows = execute_data_readonly(sql, [f"%{fonds1_name}%", f"%{fonds2_name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps({"message": "Aucun fonds trouvé pour la comparaison."}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, default=str)


# ─── Outil 12 : Recherche documentaire RAG ────────────────────────────────────

@mcp.tool()
def search_fonds_documents(fonds_name: str, query: str, top_k: int = 6) -> str:
    """
    Recherche dans les documents PDF (rapports annuels, bilans, prospectus, PV)
    associés à un fonds. Utilise la recherche vectorielle (RAG).
    À utiliser pour les questions sur :
    - La politique d'investissement d'un fonds
    - Les données financières d'un rapport (bilan, résultat, actif net)
    - Les procédures, règlements, situations annuelles
    - Tout contenu documentaire non disponible en base structurée

    Args:
        fonds_name: Nom (ou partie du nom) du fonds pour cibler les documents.
        query: La question ou le terme à rechercher dans les documents.
        top_k: Nombre maximum de passages à retourner (défaut : 6).

    Returns:
        Texte formaté des passages pertinents trouvés dans les documents.
    """
    # Combiner fonds_name + query pour que le RAG booste le bon fonds
    combined_query = f"{fonds_name} {query}".strip() if fonds_name else query

    chunks = doc_search(combined_query, top_k=top_k)

    if not chunks:
        return json.dumps(
            {"message": f"Aucun document trouvé pour '{fonds_name}' avec la requête : '{query}'"},
            ensure_ascii=False,
        )

    results = []
    for c in chunks:
        results.append({
            "source": c.get("title", "Document inconnu"),
            "page": c.get("page_start"),
            "type": c.get("source_type", "text"),
            "score": round(c.get("score", 0), 3),
            "contenu": c.get("text", "")[:2000],  # limite pour le LLM
        })

    return json.dumps(results, ensure_ascii=False, default=str)


# ─── Outil 13 : Trouver les fonds qui ont financé un projet donné ────────────

@mcp.tool()
def get_fonds_by_project(project_name: str) -> str:
    """
    Retourne les fonds d'investissement qui ont financé un projet donné.
    Utiliser quand la question est : "Quels fonds ont investi dans le projet X ?"
    ou "Quel fonds a financé X ?".

    Args:
        project_name: Nom (ou partie du nom) du projet.

    Returns:
        JSON array des fonds avec le montant investi et l'état du projet.
    """
    sql = """
        SELECT
            f.denomination          AS fonds,
            ef.libelle              AS etat_fonds,
            p.nom                   AS projet,
            fin.montant             AS montant_investi,
            ea.libelle              AS etat_projet,
            pr.nom                  AS promoteur
        FROM projet p
        JOIN financement fin          ON fin.projet_id      = p.id
        JOIN financement_fonds ff     ON ff.financement_id  = fin.id
        JOIN fonds f                  ON f.id               = ff.fonds_id
        LEFT JOIN etat_fonds ef       ON ef.id = f.etat_id
        LEFT JOIN etat_avancement ea  ON ea.id = p.etat_id
        LEFT JOIN promoteur pr        ON pr.id = p.promoteur_id
        WHERE p.nom ILIKE %s
        ORDER BY f.denomination
        LIMIT 50
    """
    rows = execute_data_readonly(sql, [f"%{project_name}%"])
    result = _rows_to_list(rows)
    if not result:
        return json.dumps(
            {"message": f"Aucun fonds trouvé ayant financé le projet : '{project_name}'"},
            ensure_ascii=False,
        )
    return json.dumps(result, ensure_ascii=False, default=str)


# ─── Outil 14 : Total investi par type d'instrument (global) ─────────────────

@mcp.tool()
def get_total_investi_par_type(instrument_type: str = "tous") -> str:
    """
    Calcule le total des montants libérés (investis) par type d'instrument,
    tous fonds confondus.
    Utiliser pour : "total investi en OCA", "total en CCA", "total en actions",
    "total investi global", "combien a été investi en OCA ?"

    Args:
        instrument_type: Type d'instrument parmi 'oca', 'cca', 'actions', ou 'tous' (défaut).

    Returns:
        JSON object avec les totaux par type.
    """
    t = (instrument_type or "tous").lower().strip()

    if t == "oca":
        sql = "SELECT COALESCE(SUM(montant_liberation), 0) AS total_investi_oca FROM inv_liberation_oca"
        rows = execute_data_readonly(sql)
    elif t == "cca":
        sql = "SELECT COALESCE(SUM(montant_liberation), 0) AS total_investi_cca FROM inv_liberation_cca"
        rows = execute_data_readonly(sql)
    elif t in ("action", "actions"):
        sql = "SELECT COALESCE(SUM(montant_liberation), 0) AS total_investi_actions FROM inv_liberation_action"
        rows = execute_data_readonly(sql)
    else:  # tous
        sql = """
            SELECT
                COALESCE((SELECT SUM(montant_liberation) FROM inv_liberation_action), 0) AS total_actions,
                COALESCE((SELECT SUM(montant_liberation) FROM inv_liberation_oca),    0) AS total_oca,
                COALESCE((SELECT SUM(montant_liberation) FROM inv_liberation_cca),    0) AS total_cca,
                COALESCE((SELECT SUM(montant_liberation) FROM inv_liberation_action), 0)
              + COALESCE((SELECT SUM(montant_liberation) FROM inv_liberation_oca),    0)
              + COALESCE((SELECT SUM(montant_liberation) FROM inv_liberation_cca),    0) AS total_global
        """
        rows = execute_data_readonly(sql)

    result = _rows_to_list(rows)
    return json.dumps(result[0] if result else {}, ensure_ascii=False, default=str)


# ─── Point d'entrée ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run(transport="stdio")
