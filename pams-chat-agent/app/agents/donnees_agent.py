
import asyncio
import sys
import os
import json
import re
import warnings

warnings.filterwarnings("ignore", message=".*create_react_agent.*")
warnings.filterwarnings("ignore", message=".*LangGraphDeprecated.*")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from langchain_ollama import ChatOllama
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from app.config import Config
from app.services.db import execute_data_readonly
from app.services.llm_client import llm_generate

_MCP_SERVER_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../mcp/donnees_server.py")
)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

_FORMAT_SYSTEM = """Tu es un assistant francophone spécialisé en fonds d'investissement tunisiens.
LANGUE OBLIGATOIRE : français uniquement. Si tu réponds dans une autre langue, c'est une erreur critique.
Tu reçois des résultats RÉELS de base de données PostgreSQL.

RÈGLES STRICTES :
- Réponds EXCLUSIVEMENT en français
- Présente UNIQUEMENT les données reçues, sans en inventer
- Aucun conseil, aucune analyse, aucun commentaire
- Les montants sont en TND (dinars tunisiens), jamais en euros
- Ne montre JAMAIS le JSON brut à l'utilisateur
- Présente sous forme de liste numérotée markdown (chaque ligne commence par 1. 2. 3. ... sur une nouvelle ligne)
- Si la liste est vide : réponds "Aucun résultat trouvé."
- N'invente JAMAIS de données fictives (Projet 1, Projet 2, etc.)"""


def _normalize_currency(text: str) -> str:
    if not text:
        return text
    text = re.sub(r"\s*€", " TND", text)
    text = re.sub(r"\bEUR\b", "TND", text, flags=re.IGNORECASE)
    text = re.sub(r"\beuros?\b", "TND", text, flags=re.IGNORECASE)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def _load_reference_values() -> str:
    tables_ref = {
        "etat_fonds":      "libelle",
        "etat_avancement": "libelle",
        "secteur":         "libelle",
        "banque":          "libelle",
    }
    lines = []
    for table, col in tables_ref.items():
        try:
            rows = execute_data_readonly(
                f"SELECT DISTINCT {col} FROM {table} ORDER BY {col}"
            )
            valeurs = [str(r[col]) for r in rows if r.get(col)]
            if valeurs:
                valeurs_str = ", ".join([f'"{v}"' for v in valeurs])
                lines.append(f"- {table}.{col} : {valeurs_str}")
        except Exception:
            pass
    return "\n".join(lines) if lines else "Valeurs non disponibles."


def _build_system_prompt() -> str:
    try:
        from app.mcp.donnees_server import _build_schema_dynamic
        schema = _build_schema_dynamic()
    except Exception as e:
        schema = f"Schéma non disponible : {e}"

    valeurs = _load_reference_values()

    return f"""Tu es un agent SQL spécialisé en fonds d'investissement tunisiens.
Tu réponds UNIQUEMENT en français.

RÈGLE ABSOLUE N°1 : appelle execute_sql() IMMÉDIATEMENT.
RÈGLE ABSOLUE N°2 : N'invente JAMAIS de données. Si execute_sql() retourne une erreur, corrige le SQL et réessaie.
RÈGLE ABSOLUE N°3 : Ne montre jamais le SQL ni le JSON brut à l'utilisateur.
RÈGLE ABSOLUE N°4 : Si aucun résultat → réponds "Aucun résultat trouvé." JAMAIS de données fictives.

RÈGLES CRITIQUES SUR LES JOINTURES :
1. Fonds → Projets : chemin OBLIGATOIRE en 3 étapes
   fonds f
   JOIN financement_fonds ff ON ff.fonds_id = f.id
   JOIN financement fin ON fin.id = ff.financement_id
   JOIN projet p ON p.id = fin.projet_id
   INTERDIT : ff.projet_id n'existe PAS dans financement_fonds

2. Promoteur d'un projet : filtre TOUJOURS sur p.nom
   CORRECT   : WHERE p.nom ILIKE '%NOM_PROJET%'
   INTERDIT  : WHERE pr.nom ILIKE '%NOM_PROJET%'

3. Fonds par nom : utilise TOUJOURS f.denomination ILIKE '%nom%'
   INTERDIT  : f.alias

4. Dates : EXTRACT(YEAR FROM col) — jamais YEAR(col)

VALEURS RÉELLES DANS LA BASE :
{valeurs}

SCHÉMA :
{schema}
"""


def _clean_sql(sql: str) -> str:
    if not sql:
        return sql
    sql = sql.strip().rstrip(";")
    sql = re.sub(r'["\s]*,\s*"limit"\s*:\s*\d+\s*\}?.*$', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'["\s]*\}.*$', '', sql)
    sql = re.sub(r'\bYEAR\s*\(\s*(\w+)\s*\)', r'EXTRACT(YEAR FROM \1)', sql, flags=re.IGNORECASE)
    sql = re.sub(r'\bMONTH\s*\(\s*(\w+)\s*\)', r'EXTRACT(MONTH FROM \1)', sql, flags=re.IGNORECASE)
    sql = re.sub(r'\bDAY\s*\(\s*(\w+)\s*\)', r'EXTRACT(DAY FROM \1)', sql, flags=re.IGNORECASE)
    return sql.strip()


def _extract_sql_from_response(content: str) -> str | None:
    try:
        data = json.loads(content.strip())
        if isinstance(data, dict):
            if data.get("name") == "execute_sql":
                args = data.get("arguments") or data.get("parameters") or {}
                sql = args.get("query") or args.get("sql") or ""
                return _clean_sql(sql) if sql else None
            if "query" in data:
                return _clean_sql(data["query"])
    except (json.JSONDecodeError, ValueError):
        pass

    
    m = re.search(r'"query"\s*:\s*"(SELECT[^"]+)"', content, re.IGNORECASE)
    if m:
        return _clean_sql(m.group(1))

   
    m = re.search(r"```(?:sql)?\s*(SELECT[\s\S]+?)```", content, re.IGNORECASE)
    if m:
        return _clean_sql(m.group(1).strip())

    
    m = re.search(r"(SELECT\s+[\s\S]+?)(?:;|\Z)", content, re.IGNORECASE)
    if m:
        sql = m.group(1).strip()
        if "FROM" in sql.upper():
            return _clean_sql(sql)

    return None


def _contains_hallucination(content: str) -> bool:
    """
    Détecte si le LLM a inventé des données au lieu d'appeler execute_sql().
    Signaux d'hallucination : données fictives, JSON inventé, résultats simulés.
    """
    hallucination_patterns = [
        r"Projet\s+\d+",           
        r"Fonds\s+\d+",            
        r'"error"\s*:\s*null',     
        r'"results"\s*:\s*\[',     
        r"capital_social.*date_lancement",  
        r"Je vais ajuster la requête",      
        r"Voici les résultats.*```json",    
    ]
    for pattern in hallucination_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False


def _contains_non_french(content: str) -> bool:
    if not content:
        return False
    if re.search(r"[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]", content):
        return True
    return False


def _filter_columns(rows: list[dict]) -> list[dict]:
    """
    Garde uniquement les colonnes qui ont au moins une valeur non nulle.
    Évite d'envoyer 30 colonnes vides au LLM.
    """
    if not rows:
        return rows

    # Trouve les colonnes non nulles
    cols_utiles = set()
    for row in rows:
        for k, v in row.items():
            if v is not None and v != "" and str(v) != "0":
                cols_utiles.add(k)

    # Garde en priorité les colonnes importantes
    prioritaires = {
        "denomination", "nom", "montant", "duree",
        "etat", "libelle", "date_lancement",
        "banque", "promoteur", "secteur",
        "nb_projets", "nb_souscripteurs", "total",
    }
    cols_finales = cols_utiles & prioritaires if cols_utiles & prioritaires else cols_utiles

    return [
        {k: v for k, v in row.items() if k in cols_finales}
        for row in rows
    ]


def _execute_and_format(question: str, sql: str) -> str:
    sql = _clean_sql(sql)
    print(f"[FALLBACK] Exécution SQL : {sql[:150]}...")
    try:
        raw = execute_data_readonly(sql)
        rows = [dict(r) for r in (raw or [])]
        print(f"[FALLBACK] {len(rows)} résultat(s)")

        if not rows:
            return "Aucun résultat trouvé."

        # Filtre les colonnes inutiles AVANT d'envoyer au LLM
        rows_clean = _filter_columns(rows)
        sample = json.dumps(rows_clean[:20], ensure_ascii=False, default=str)

        prompt = (
            f"Question : {question}\n\n"
            f"Résultats RÉELS ({len(rows)} entrées) :\n"
            f"{sample}\n\n"
            f"Présente ces résultats en français sous forme de liste numérotée."
        )
        formatted = llm_generate(prompt, system=_FORMAT_SYSTEM, max_tokens=600)
        formatted = _normalize_currency(formatted)
        # Correction markdown : force chaque item sur une nouvelle ligne
        lines = re.split(r'(\d+\.\s+)', formatted)
        out = []
        i = 1
        while i < len(lines):
            prefix = lines[i]
            content = lines[i+1] if i+1 < len(lines) else ''
            out.append(f'{prefix}{content.strip()}')
            i += 2
        return '\n'.join(out) if out else formatted

    except Exception as e:
        return f"Erreur d'exécution : {e}"


def _augment_question(question: str) -> str:
    return (
        f"{question}\n\n"
        "[INSTRUCTION : appelle execute_sql() IMMÉDIATEMENT avec le SELECT approprié. "
        "N'invente JAMAIS de données. Si erreur SQL → corrige et réessaie. "
        "Réponds UNIQUEMENT en français avec les vrais résultats. "
        "Aucune analyse, aucun conseil, aucun commentaire.]"
    )


async def ask_donnees_agent(question: str, max_iterations: int = 15) -> str:
    llm = ChatOllama(
        base_url=Config.OLLAMA_BASE_URL,
        model=Config.LLM_MODEL,
        temperature=0,
        disable_streaming=True,
        async_client_kwargs={"timeout": Config.LLM_TIMEOUT_S},
        system="Tu réponds TOUJOURS et UNIQUEMENT en français. Jamais en chinois, jamais en anglais, jamais en arabe.",
    )

    mcp_client = MultiServerMCPClient(
        {
            "donnees": {
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
    system_prompt = _build_system_prompt()

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=system_prompt,
    )

    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": _augment_question(question)}]},
        config={"recursion_limit": max_iterations},
    )

    messages = result.get("messages", [])

    from langchain_core.messages import ToolMessage
    tool_executed = any(
        isinstance(m, ToolMessage) or
        (hasattr(m, "type") and m.type == "tool")
        for m in messages
    )

    last_content = ""
    for msg in reversed(messages):
        content = None
        if hasattr(msg, "role") and getattr(msg, "role", None) == "assistant":
            content = msg.content
        elif hasattr(msg, "type") and msg.type == "ai":
            content = msg.content
        elif isinstance(msg, dict) and msg.get("role") == "assistant":
            content = msg.get("content", "")
        if content and content.strip():
            last_content = content.strip()
            break

    # Outil exécuté ET pas d'hallucination → réponse normale
    if tool_executed and last_content and not _contains_hallucination(last_content):
        if _contains_non_french(last_content):
            return "Je n'ai pas pu formater la réponse en français. Veuillez réessayer."
        return _normalize_currency(last_content)

    # Fallback : extrait le SQL depuis la réponse texte
    if last_content:
        sql = _extract_sql_from_response(last_content)
        if sql:
            print("[FALLBACK] SQL extrait depuis la réponse texte")
            return _execute_and_format(question, sql)

        # Hallucination détectée → refuse de retourner les données inventées
        if _contains_hallucination(last_content) or _contains_non_french(last_content):
            print("[HALLUCINATION] Données inventées détectées — refus de retourner")
            return "Je n'ai pas pu récupérer les données depuis la base. Veuillez reformuler votre question."

    return _normalize_currency(last_content) or "Je n'ai pas pu générer une réponse."


def ask_donnees_agent_sync(question: str) -> str:
    return asyncio.run(ask_donnees_agent(question))


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Liste tous les fonds"
    print(f"\nQuestion : {q}\n")
    answer = ask_donnees_agent_sync(q)
    print(f"Réponse : {answer}\n")