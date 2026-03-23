from app.services.db import get_rag_conn
conn = get_rag_conn()
cur = conn.cursor()

cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'doc_document' 
    ORDER BY ordinal_position
""")
print("Colonnes doc_document :")
for r in cur.fetchall():
    print(" ", r)

cur.execute("SELECT * FROM doc_document LIMIT 5")
print("\n5 premiers documents :")
for r in cur.fetchall():
    print(" ", r)

conn.close()