import re
from app.config import Config
from app.services.embedder import embed_text, to_pgvector
from app.services.db import execute_rag

_STOP = {"de","du","des","la","le","les","un","une","au","aux","et","a","\u00e0","pour","sur","en","d","l"}



def _extract_keywords(q: str) -> list[str]:
    q = (q or "").strip()
    tokens = re.findall(r"[A-Za-z\u00c0-\u00ff0-9\-\/]+", q)
    out = []
    for t in tokens:
        tl = t.lower()
        if tl in _STOP:
            continue
        if len(t) <= 2:
            continue
        out.append(t)

    seen = set()
    res = []
    for t in out:
        tl = t.lower()
        if tl not in seen:
            res.append(t)
            seen.add(tl)
    return res[:12]

def _normalize_fund_token(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"\s+", " ", s)
    s = s.replace("-", " ")
    return s.strip()

def _maybe_fund_and_year_boost(q: str) -> tuple[str, str]:
    """
    fund: detect 'FCPR ...' or common fund names after 'fonds'
    year: prefer year from a FULL DATE (dd.mm.yyyy) — take the LAST one
          (period-end = column header), to avoid matching wrong-year documents.
          Ex: '31.12.2022' -> year='2022', not '2023' from another date.
    """
    q0 = (q or "").strip()
    ql = q0.lower()

    # ── Year : prioritise those attached to a full date ──────────────────────
    year = ""
    # 1) Full dates: 31.12.2022 / 31/12/2022 / 31-12-2022
    date_years = re.findall(r"\b\d{1,2}[.\-/]\d{1,2}[.\-/](20\d{2})\b", ql)
    if date_years:
        year = date_years[-1]   # last date (period-end = column header)
    else:
        # 2) Standalone year as fallback
        my = re.search(r"\b(20\d{2})\b", ql)
        if my:
            year = my.group(1)

    # ── Fund ─────────────────────────────────────────────────────────────────
    # Stop-words that mark end of fund name in user query
    _FUND_STOPS = (
        r"\b(bilan|rapport|exercice|arr[e\u00ea]t[e\u00e9]e?|"
        r"au|le|du|de|selon|donne|d'apr[e\u00e8]s|a\s+partir)\b"
    )

    fund = ""
    m1 = re.search(r"\b(fcpr)\b\s*([a-z0-9\-\s]+)", ql, re.IGNORECASE)
    if m1:
        fund = _normalize_fund_token((m1.group(1) + " " + m1.group(2)).strip())
        fund = re.split(_FUND_STOPS, fund, maxsplit=1, flags=re.IGNORECASE)[0].strip()

    if not fund:
        m2 = re.search(r"\b(fonds|fond)\b\s+(?P<name>.+)$", ql, re.IGNORECASE)
        if m2:
            fund = _normalize_fund_token(m2.group("name"))
            fund = re.split(_FUND_STOPS, fund, maxsplit=1, flags=re.IGNORECASE)[0].strip()

    return fund, year


# OBSOLETE: Les tables sont maintenant dans doc_chunk avec metadata->>'is_table'=true
def search_tables(question: str, top_k: int = 5):
    """OBSOLETE - retourner liste vide."""
    return []


def doc_search(question: str, top_k: int | None = None, include_tables: bool = True):
    """
    Recherche unifiee dans doc_chunk (texte + tables en format pipe).

    Garantit un melange de chunks texte ET table en executant deux recherches
    separees puis en fusionnant les resultats.
    """
    top_k = top_k or Config.DOC_TOP_K
    q = (question or "").strip()
    if not q:
        return []

    q_emb = embed_text(q)
    q_vec = to_pgvector(q_emb)

    kws = _extract_keywords(q)
    fund, year = _maybe_fund_and_year_boost(q)

    _BASE_SQL = """
        WITH ranked AS (
          SELECT
            c.document_id, d.title, c.page_start, c.page_end,
            c.text, c.metadata,
            (1 - (c.embedding <=> %s::vector)) AS vscore,
            ts_rank(c.tsv, plainto_tsquery('french', %s)) AS tscore
          FROM doc_chunk c
          JOIN doc_document d ON d.id = c.document_id
          WHERE c.text IS NOT NULL AND length(c.text) > 20
            {table_filter}
        )
        SELECT
          document_id, title, page_start, page_end, text, metadata,
          (
            (0.50 * vscore) +
            (0.30 * LEAST(tscore, 1.0)) +
            -- Boost via métadonnées strictes (Très fort)
            CASE WHEN %s <> '' AND LOWER(metadata->>'fund_name') LIKE ('%%' || LOWER(%s) || '%%') THEN 0.50 ELSE 0 END +
            CASE WHEN %s <> '' AND metadata->>'years' LIKE ('%%' || %s || '%%') THEN 0.40 ELSE 0 END +
            -- Boost via texte/titre (Fallback)
            CASE WHEN %s <> '' AND LOWER(REPLACE(title, '_', ' ')) LIKE ('%%' || LOWER(%s) || '%%') THEN 0.20 ELSE 0 END +
            CASE WHEN %s <> '' AND LOWER(text) LIKE ('%%' || LOWER(%s) || '%%') THEN 0.10 ELSE 0 END +
            CASE WHEN %s <> '' AND LOWER(REPLACE(title, '_', ' ')) LIKE ('%%' || %s || '%%') THEN 0.10 ELSE 0 END +
            CASE WHEN %s <> '' AND text ~ %s THEN 0.05 ELSE 0 END
          ) AS score
        FROM ranked
        ORDER BY score DESC
        LIMIT %s
    """

    base_params = [
        q_vec,
        " ".join(kws) if kws else q,
        
        fund, fund,          # fund in metadata
        year, year,          # year in metadata
        fund, fund,          # fund in title
        fund, fund,          # fund in text
        year, year,          # year in title
        year, year,          # year in text
    ]

    table_slots = top_k
    text_slots = top_k

    # 1) Recherche TEXT chunks
    text_sql = _BASE_SQL.format(table_filter="AND (c.metadata->>'is_table' IS NULL OR c.metadata->>'is_table' != 'true')")
    text_rows = execute_rag(text_sql, base_params + [text_slots])

    # 2) Recherche TABLE chunks
    table_sql = _BASE_SQL.format(table_filter="AND (c.metadata->>'is_table')::boolean IS TRUE")
    table_rows = execute_rag(table_sql, base_params + [table_slots])

    min_score = getattr(Config, "DOC_MIN_SCORE", 0.35)
    table_min_score = 0.10   # Tables get low vscores -- don't filter aggressively
    seen_ids = set()
    out = []

    def _add_row(r, is_table):
        s = float(r["score"])
        threshold = table_min_score if is_table else min_score
        if s < threshold:
            return
        key = (r["document_id"], r["page_start"], r["text"][:50])
        if key in seen_ids:
            return
        seen_ids.add(key)
        out.append({
            "document_id": r["document_id"],
            "title": r["title"],
            "page_start": r["page_start"],
            "page_end": r["page_end"],
            "text": r["text"],
            "metadata": r.get("metadata"),
            "score": s,
            "source_type": "table" if is_table else "text",
        })

    # Tables first (guaranteed inclusion)
    for r in table_rows:
        _add_row(r, True)

    # Then text
    for r in text_rows:
        _add_row(r, False)

    # Sort by score descending
    out.sort(key=lambda x: x["score"], reverse=True)

    # Keep top_k results, but guarantee at least some table chunks
    if len(out) > top_k:
        tables_in_topk = [c for c in out[:top_k] if c["source_type"] == "table"]
        if len(tables_in_topk) < 3:
            extra_tables = [c for c in out[top_k:] if c["source_type"] == "table"]
            out = out[:top_k] + extra_tables[:3 - len(tables_in_topk)]
            out.sort(key=lambda x: x["score"], reverse=True)
        else:
            out = out[:top_k]

    return out
