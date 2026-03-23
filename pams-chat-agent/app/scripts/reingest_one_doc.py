import sys
from app.services.db import get_rag_conn
from app.services.doc_ingest import ingest_pdf

pdf_path = sys.argv[1]

with get_rag_conn() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM doc_document WHERE source_path = %s", (pdf_path,))
        row = cur.fetchone()
        if row:
            doc_id = row[0]
            cur.execute("DELETE FROM doc_chunk WHERE document_id = %s", (doc_id,))
            cur.execute("DELETE FROM doc_document WHERE id = %s", (doc_id,))
            conn.commit()

# re-ingest complet
new_id = ingest_pdf(pdf_path)
print("re-ingested doc_id=", new_id)
