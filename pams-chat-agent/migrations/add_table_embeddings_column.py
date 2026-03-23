"""
Migration : Ajouter la colonne text_summary_embedding à doc_table

Cette migration ajoute la colonne manquante pour pouvoir faire
des recherches vectorielles dans les tableaux extraits.

Usage:
    python migrations/add_table_embeddings_column.py
"""

import sys
from pathlib import Path

# Ajouter le répertoire du projet au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.db import get_rag_conn


def add_embedding_column():
    """Ajoute la colonne text_summary_embedding à doc_table"""
    
    print("="*80)
    print("🔧 MIGRATION : Ajout de text_summary_embedding à doc_table")
    print("="*80)
    
    with get_rag_conn() as conn:
        with conn.cursor() as cur:
            # Vérifier si la colonne existe déjà
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'doc_table' 
                  AND column_name = 'text_summary_embedding'
            """)
            
            if cur.fetchone():
                print("\n✅ La colonne text_summary_embedding existe déjà !")
                return
            
            print("\n📝 Ajout de la colonne text_summary_embedding...")
            
            # Ajouter la colonne
            cur.execute("""
                ALTER TABLE doc_table 
                ADD COLUMN text_summary_embedding vector(1024)
            """)
            
            conn.commit()
            print("✅ Colonne ajoutée avec succès")
            
            # Créer l'index si besoin
            print("\n📝 Création de l'index sur text_summary_embedding...")
            
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_doc_table_vec 
                ON doc_table USING ivfflat (text_summary_embedding vector_cosine_ops) 
                WITH (lists = 100)
            """)
            
            conn.commit()
            print("✅ Index créé avec succès")
            
            # Afficher le résultat
            cur.execute("SELECT COUNT(*) FROM doc_table")
            total = cur.fetchone()[0]
            
            print(f"\n📊 Résultat :")
            print(f"  • Table doc_table : {total} ligne(s)")
            print(f"  • Colonne text_summary_embedding : Ajoutée (NULL par défaut)")
            print(f"  • Index idx_doc_table_vec : Créé")
            
            print(f"\n💡 Prochaine étape :")
            print(f"  python regenerate_table_embeddings.py")
            print(f"\n{'='*80}\n")


if __name__ == "__main__":
    try:
        add_embedding_column()
    except Exception as e:
        print(f"\n❌ ERREUR : {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
