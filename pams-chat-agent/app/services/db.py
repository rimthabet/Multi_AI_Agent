import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import Config


_DB_DEBUG = os.getenv("DB_DEBUG", "").lower() in ("1", "true", "yes")


def _debug(msg: str) -> None:
    if _DB_DEBUG:
        print(msg, file=sys.stderr)

def get_rag_conn():
    return psycopg2.connect(
        host=Config.RAG_DB_HOST,
        port=Config.RAG_DB_PORT,
        dbname=Config.RAG_DB_NAME,
        user=Config.RAG_DB_USER,
        password=Config.RAG_DB_PASSWORD,
    )

def get_data_conn():
    return psycopg2.connect(
        host=Config.DATA_DB_HOST,
        port=Config.DATA_DB_PORT,
        dbname=Config.DATA_DB_NAME,
        user=Config.DATA_DB_USER,
        password=Config.DATA_DB_PASSWORD,
    )

def execute_rag(sql: str, params=None):
    if params is None or (isinstance(params, list) and len(params) == 0):
        params = None
    
    with get_rag_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if params is not None:
                cur.execute(sql, params)
            else:
                cur.execute(sql)
            return cur.fetchall()

def execute_data_readonly(sql: str, params=None, timeout_ms: int = 5000):
    """
    Exécute une requête SQL en lecture seule sur la base DATA.
    PROTECTION TOTALE contre les erreurs de paramètres.
    """
   
    if params is None or (isinstance(params, list) and len(params) == 0):
        params = None
    
   
    _debug(f"\n{'='*80}")
    _debug("[EXECUTE_DATA] SQL reçu:")
    _debug(sql[:500])
    _debug(f"[EXECUTE_DATA] Params: {params}")
    _debug(f"[EXECUTE_DATA] Nombre de %s dans SQL: {sql.count('%s')}")
    _debug(f"{'='*80}\n")
    
    with get_data_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SET default_transaction_read_only = on;")
            cur.execute("SET statement_timeout = %s;", (timeout_ms,))
            
            #  si le SQL contient %s mais params est vide
            if '%s' in sql and params is None:
                _debug("[ERROR] SQL contient %s mais aucun paramètre fourni!")
                _debug("[FIX] Remplacement des %s par NULL...")
                # Supprimer toutes les clauses avec %s
                import re
                sql = re.sub(r"WHERE\s+.*%s.*", "", sql, flags=re.IGNORECASE)
                sql = re.sub(r"AND\s+.*%s.*", "", sql, flags=re.IGNORECASE)
                sql = sql.replace('%s', 'NULL')
                _debug(f"[FIX] SQL corrigé: {sql}")
            
            try:
                #  Ne passer params que si non-None
                if params is not None:
                    cur.execute(sql, params)
                else:
                    cur.execute(sql)
                results = cur.fetchall()
                _debug(f"[EXECUTE_DATA] SUCCESS: {len(results)} lignes retournées")
                return results
            except Exception as e:
                _debug(f"[EXECUTE_DATA ERROR] {type(e).__name__}: {str(e)}")
                _debug(f"[EXECUTE_DATA ERROR] SQL: {sql}")
                _debug(f"[EXECUTE_DATA ERROR] Params: {params}")
                raise