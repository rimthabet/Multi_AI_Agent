import glob
import sys
import time
import argparse
from pathlib import Path


if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

from app.services.doc_ingest import ingest_pdf
from app.services.db import get_rag_conn


def _is_already_ingested(path: str) -> bool:
    """Retourne True si le PDF est déjà présent en base (via sha256)."""
    import hashlib
    sha = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    try:
        with get_rag_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM doc_document WHERE sha256 = %s", (sha,))
                return cur.fetchone() is not None
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="Ingestion de tous les PDFs")
    parser.add_argument("--force", action="store_true",
                        help="Forcer la ré-ingestion (supprime les anciens chunks)")
    parser.add_argument("--dir", default="data/docs",
                        help="Répertoire des PDFs (défaut: data/docs)")
    args = parser.parse_args()

    pdfs = sorted(glob.glob(f"{args.dir}/*.pdf"))
    total = len(pdfs)
    print(f"{'='*60}")
    print(f"INGESTION DE {total} PDF(s)")
    if args.force:
        print("MODE: Force ré-ingestion")
    print(f"{'='*60}\n")

    success = 0
    skipped = 0
    errors = []
    start_all = time.time()

    for i, path in enumerate(pdfs, 1):
        name = Path(path).name
        print(f"\n[{i}/{total}] {name}")
        print("-" * 50)

        # Vérifier si déjà ingéré (sans force)
        if not args.force and _is_already_ingested(path):
            print(f"  DÉJÀ INGÉRÉ — ignoré (utilisez --force pour ré-ingérer)")
            skipped += 1
            continue

        start = time.time()
        try:
            doc_id = ingest_pdf(path, force=args.force)
            elapsed = time.time() - start
            print(f"  OK doc_id={doc_id} ({elapsed:.1f}s)")
            success += 1
        except KeyboardInterrupt:
            print(f"\n  Interrompu par l'utilisateur")
            break
        except Exception as e:
            elapsed = time.time() - start
            print(f"  ERREUR après {elapsed:.1f}s: {e}")
            errors.append((name, str(e)))

    total_elapsed = time.time() - start_all
    print(f"\n{'='*60}")
    print(f"RÉSUMÉ")
    print(f"{'='*60}")
    print(f"  Ingérés  : {success}/{total}")
    print(f"  Ignorés  : {skipped}/{total}  (déjà en base)")
    print(f"  Erreurs  : {len(errors)}/{total}")
    print(f"  Durée    : {total_elapsed:.0f}s")
    if errors:
        print(f"\n  Fichiers en erreur:")
        for name, err in errors:
            print(f"    - {name}: {err}")
    print()


if __name__ == "__main__":
    main()
