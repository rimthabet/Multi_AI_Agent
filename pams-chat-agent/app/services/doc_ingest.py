import os
import hashlib
import re

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import numpy as np
import cv2
from psycopg2.extras import Json

from app.config import Config
from app.services.text_clean import clean_pdf_text, clean_text_for_chunking
from app.services.embedder import embed_text
from app.services.table_extract_azure import TableExtractorJavaClient
from app.services.table_formatter import table_to_pipe_text
from app.services.table_filters import (
    is_table_of_contents,
    is_likely_real_table,
    clean_table_post_azure,
    is_garbled_table,
)
from app.services.extraction_rules import ExtractionRules
from app.services.table_detection_rules import TableDetectionRules
from app.services.table_region_detector import TableRegionDetector
from app.services.table_label_fixer import fix_table_with_context



def strip_leading_chunk_index(text: str) -> str:
   
    if not text:
        return text

    original = text.strip()

   
    cleaned = re.sub(r"^\d{1,4}\s*\n+", "", original, count=1).strip()
    if cleaned != original and len(cleaned) >= 15:
        return cleaned

    
    cleaned = re.sub(r"^\d{1,4}\s+", "", original, count=1).strip()
    if len(cleaned) < 15:
        return original

    return cleaned


def enhance_table_extraction(table_text: str) -> str:

    if not table_text:
        return table_text
    
    
    lines = table_text.strip().split("\n")
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        if stripped and not re.match(r"^[\|\s\-]+$", stripped):
            cells = stripped.split("|")
            cells = [re.sub(r"\s+", " ", c).strip() for c in cells]
            cleaned_lines.append(" | ".join(cells))
    
    if not cleaned_lines:
        return table_text
    
    # Corriger la concaténation catégories/sous-catégories
    cleaned_lines = _fix_category_concatenation(cleaned_lines)
    
   
    cleaned_lines = _fix_missing_lines(cleaned_lines)
    
    return "\n".join(cleaned_lines)


def _fix_category_concatenation(lines: list[str]) -> list[str]:
    """
    Corrige le problème de concaténation catégories/sous-catégories.
    
    Exemple:
    AVANT: "ACTIF NET a- en début d'exercice | 5 824 639 | 0"
    APRÈS:  "ACTIF NET | 5 824 639 | 0"
            "a- en début d'exercice | 5 824 639 | 0"
    """
    fixed_lines = []
    split_count = 0
    
    for line in lines:
        cells = line.split("|")
        
        if len(cells) >= 2:
            first_cell = cells[0].strip()
            
            
            letter_pattern = re.match(
                r'^(.+?)\s+([a-z]\s*[-–—]\s*[a-zà-ÿ].*)$',
                first_cell,
                re.IGNORECASE
            )
            
            if letter_pattern:
                category = letter_pattern.group(1).strip()
                subcategory = letter_pattern.group(2).strip()
               
                if (len(category) >= 3 and 
                    len(subcategory) >= 5 and
                    re.match(r'^[a-z]\s*[-–—]\s*[a-zà-ÿ]', subcategory, re.IGNORECASE)):
                    
                    rest_cells = " | ".join(c.strip() for c in cells[1:])
                    
                    category_line = f"{category} | {rest_cells}"
                    subcategory_line = f"{subcategory} | {rest_cells}"
                    
                    print(f"[SPLIT] '{first_cell[:50]}' → '{category}' + '{subcategory[:30]}'")
                    
                    fixed_lines.append(category_line)
                    fixed_lines.append(subcategory_line)
                    split_count += 1
                    continue
        
        fixed_lines.append(line)
    
    if split_count > 0:
        print(f"[TABLE FIX] {split_count} concaténation(s) catégorie/sous-catégorie corrigée(s)")
    
    return fixed_lines


def _fix_missing_lines(lines: list[str]) -> list[str]:
    """
    Détecte et ajoute des lignes manquantes basées sur la structure du tableau.
    """
    if len(lines) < 3:
        return lines
    
    # Analyser la structure des colonnes
    col_counts = [len(line.split("|")) for line in lines]
    most_common_cols = max(set(col_counts), key=col_counts.count)
    
    # Vérifier s'il y a des lignes avec moins de colonnes (potentiellement tronquées)
    fixed_lines = []
    
    for i, line in enumerate(lines):
        cells = line.split("|")
        
        # Si cette ligne a moins de colonnes que la normale
        if len(cells) < most_common_cols:
            # Essayer de reconstruire depuis les lignes adjacentes
            if i > 0:
                prev_cells = lines[i-1].split("|")
                # Ajouter les colonnes manquantes avec des valeurs vides
                while len(cells) < most_common_cols:
                    if len(cells) < len(prev_cells):
                        cells.append("")
                    else:
                        cells.append("")
                fixed_lines.append(" | ".join(cells))
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    return fixed_lines


def merge_multi_page_tables(tables: list) -> list:
    """
    Fusionne les tableaux qui s'étendent sur plusieurs pages consécutives.
    Appelé APRÈS la fusion côté Java (filet de sécurité Python).
    Supporte les chaînes de 3+ pages consécutives.
    """
    if len(tables) <= 1:
        return tables

    merged_tables = []
    i = 0

    while i < len(tables):
        current_table = tables[i]
        last_page = current_table.page  # page de fin du groupe fusionné
        j = i + 1

        # Tenter d'enchaîner autant de continuations que possible
        while j < len(tables):
            next_table = tables[j]

            # La page suivante doit être immédiatement après la DERNIÈRE page fusionnée
            if next_table.page != last_page + 1:
                break

            try:
                # Construire un proxy avec la page courante = last_page pour le test de consécutivité
                proxy = _TableProxy(current_table, last_page)
                if _is_table_continuation(proxy, next_table):
                    current_table = _merge_two_tables(current_table, next_table)
                    last_page = next_table.page
                    j += 1
                else:
                    break
            except Exception as e:
                print(f"[TABLES] Erreur fusion pages {last_page}-{next_table.page}: {e}")
                break

        merged_tables.append(current_table)
        i = j

    return merged_tables


class _TableProxy:
    """Proxy léger pour tester la consécutivité de page sans modifier l'objet original."""
    def __init__(self, table, page_override: int):
        self._table = table
        self.page = page_override
        self.df = table.df

    def __getattr__(self, name):
        return getattr(self._table, name)


def _is_table_continuation(table1, table2) -> bool:
    """
    Détermine si table2 est une continuation de table1 sur la page suivante.
    La fusion multi-page est déjà gérée côté Java. Cette fonction est un filet
    de sécurité pour les cas que Java a manqués.

    Cas couverts :
      A) Header répété : table2 commence par le même header que table1 (fréquent dans
         les PDFs financiers qui répètent les colonnes en haut de chaque page).
      B) Continuation directe : table2 commence par une ligne de données numériques
         sans titre de nouveau tableau.
    """
    if table1.df is None or table2.df is None:
        return False
    if table1.df.empty or table2.df.empty:
        return False

    #  pages strictement consécutives
    if table2.page != table1.page + 1:
        return False

    #  nombre de colonnes compatible (tolérance ±1 : OCR peut perdre une colonne)
    n1 = table1.df.shape[1]
    n2 = table2.df.shape[1]
    if abs(n1 - n2) > 1 or n1 < 2:
        return False

    # C3: table1 ne se termine pas par une ligne totalisatrice
    last_row_text = " ".join(str(v) for v in table1.df.iloc[-1].values).upper()
    if any(kw in last_row_text for kw in ["TOTAL", "TOTAUX", "SOLDE FINAL"]):
        return False

    # Dans un DataFrame pandas, df.columns contient les valeurs de la PREMIÈRE ligne brute
    # (c'est ainsi que _rows_to_dataframe() construit le DataFrame depuis Java)
    t1_col_vals = list(table1.df.columns)
    t2_col_vals = list(table2.df.columns)

    #  si table2 commence par un titre de nouveau tableau → refus
    # Titre = une seule cellule non-vide, texte long tout en majuscules, sans chiffres
    non_empty_t2 = [str(v).strip() for v in t2_col_vals if str(v).strip()]
    if len(non_empty_t2) == 1:
        cell = non_empty_t2[0]
        if len(cell) > 8 and cell == cell.upper() and not any(c.isdigit() for c in cell) and n1 >= 3:
            return False

    # Cas A: header répété (colonnes de table2 ≈ colonnes de table1 à ≥ 80%)
    if _rows_are_similar(t1_col_vals, t2_col_vals):
        return True

    # Cas B: continuation directe – la première "ligne" de table2 contient des valeurs
    # numériques dans les colonnes de données (index > 0, ex: montants, pourcentages)
    data_cells = t2_col_vals[1:]
    if any(re.search(r'\d', str(v)) for v in data_cells):
        # Guard 1 : bloquer seulement si UNE SEULE cellule non-vide (= titre pur).
        if len(non_empty_t2) == 1:
            label = non_empty_t2[0]
            if len(label) > 15 and label == label.upper() and not any(c.isdigit() for c in label):
                return False

        # Guard 2 : si toutes les cellules de données sont des plages de dates
        # (ex: "Du 01/01/2014 Au 31/12/2014") c'est l'en-tête d'un NOUVEAU tableau.
        date_range_pat = re.compile(r'\d{2}/\d{2}/\d{4}|\b\d{4}\b')
        data_are_all_dates = all(
            not str(v).strip() or date_range_pat.search(str(v))
            for v in data_cells
        )
        if data_are_all_dates and not str(t2_col_vals[0]).strip():
            return False

        return True

    return False


def _rows_are_similar(row1: list, row2: list) -> bool:
    """
    Vérifie si deux lignes sont similaires (≥ 80% des cellules identiques, insensible à la casse).
    Utilisé pour détecter les headers répétés en haut de chaque page.
    """
    if len(row1) != len(row2) or not row1:
        return False
    matches = sum(
        1 for v1, v2 in zip(row1, row2)
        if str(v1).strip().lower() == str(v2).strip().lower()
    )
    return matches / len(row1) >= 0.8


def _merge_two_tables(table1, table2):
    """
    Fusionne deux tableaux en un seul au niveau DataFrame.
    
    - Cas A (header répété) : les noms de colonnes de table2 sont identiques à ceux de
      table1 (le PDF répète l'en-tête sur la page suivante) → on supprime la répétition.
    - Cas B (continuation directe) : les noms de colonnes de table2 sont en fait une ligne
      de données → on les insère comme première ligne avant de concaténer.
    """
    import pandas as pd
    from app.services.table_extract_azure import ExtractedTable

    if table1.df is None or table1.df.empty:
        return table2
    if table2.df is None or table2.df.empty:
        return table1

    df1 = table1.df.copy()
    df2 = table2.df.copy()

    t1_cols = list(df1.columns)
    t2_cols = list(df2.columns)

    # Aligner le nombre de colonnes si OCR a perdu/ajouté une colonne sur la 2ème page
    if len(t1_cols) != len(t2_cols):
        if len(t2_cols) == len(t1_cols) - 1:
            # Colonne manquante dans table2 → ajouter colonne vide en fin
            missing_col = t1_cols[len(t2_cols)]
            df2[missing_col] = ""
            print(f"[MERGE] p{table2.page}: colonne '{missing_col}' manquante (OCR) → complétée vide")
        elif len(t2_cols) == len(t1_cols) + 1:
            # Colonne en excès dans table2 → tronquer
            df2 = df2.iloc[:, :len(t1_cols)]
            print(f"[MERGE] p{table2.page}: colonne en excès → supprimée")
        t2_cols = list(df2.columns)

    if _rows_are_similar(t1_cols, t2_cols):
        # Cas A : header répété → renommer les colonnes de df2 pour les aligner,
        # puis concaténer directement (le header dupliqué disparaît naturellement)
        df2.columns = df1.columns
        merged_df = pd.concat([df1, df2], ignore_index=True)
        print(f"[MERGE] p{table1.page}+{table2.page}: header répété supprimé, "
              f"{len(df1)}+{len(df2)} lignes → {len(merged_df)}")
    else:
        # Cas B : les colonnes de table2 sont des données → les réinsérer comme ligne
        extra_row = pd.DataFrame([t2_cols], columns=df1.columns)
        df2.columns = df1.columns
        merged_df = pd.concat([df1, extra_row, df2], ignore_index=True)
        print(f"[MERGE] p{table1.page}+{table2.page}: continuation directe, "
              f"{len(df1)}+1+{len(df2)} lignes → {len(merged_df)}")

    return ExtractedTable(
        page=table1.page,
        index=table1.index,
        html="",
        df=merged_df,
        bbox=None,
        title=table1.title or table2.title,
        kind="MERGED"
    )


def enhanced_table_of_contents_detection(table_text: str) -> bool:
    """
    Détection améliorée de sommaire/TOC dans un tableau extrait.
    Combine les heuristiques de base + nouvelles règles :
      - Mots-clés explicites (sommaire, table des matières)
      - Numérotation romaine fréquente (I., II., III.)
      - Format "Titre | numéro de page" avec ≥60% des lignes
      - Beaucoup de lignes contenant un point de suite "............"
      - Section avec items courts (≤ 6 mots) + numéro final
    """
    if not table_text:
        return False

    text_lower = table_text.lower()

    # 1. Mots-clés explicites
    if any(kw in text_lower for kw in ("sommaire", "table des matières", "table des matieres")):
        return True

    lines = [l for l in table_text.split("\n") if l.strip()]
    if not lines:
        return False

    # 2. Numérotation romaine fréquente
    roman_hits = sum(
        1 for l in lines
        if re.search(r"\b(i{1,3}|iv|v|vi{0,3}|ix|x)\.\s", l, re.IGNORECASE)
    )
    if roman_hits >= 3:
        return True

    # 3. Points de suite (........)
    dotted = sum(1 for l in lines if re.search(r"\.{4,}", l))
    if dotted >= 2:
        return True

    # 4. Format "texte court | numéro de page" : ≥60% des lignes (hors header)
    num_cols = len(lines[0].split("|")) if lines else 0
    if num_cols <= 3:
        page_num_lines = sum(
            1 for l in lines[1:]
            if re.search(r"\|\s*[1-9]\d{0,2}\s*$", l)
        )
        data_lines = len(lines) - 1
        if data_lines > 2 and page_num_lines / data_lines > 0.60:
            return True

    return False


def _detect_table_name(table_text: str) -> str:
    """
    Détecte le nom de la section financière d'un tableau pipe-separated
    en analysant les libellés (1ère colonne) et les en-têtes.
    FALLBACK uniquement — utilisé quand _extract_page_titles() ne trouve rien.
    """
    lines = table_text.strip().split("\n")

    labels = []
    for line in lines:
        parts = line.split("|")
        if parts:
            label = parts[0].strip().upper()
            if label and len(label) > 2:
                labels.append(label)

    joined = " ".join(labels)
    full_upper = table_text.upper()

    if re.search(r"CO[ÛU]T\s*D.ACQUISITION", full_upper) and re.search(
        r"NOMBRE\s*DE\s*TITRES", full_upper
    ):
        return "ÉTAT DU PORTEFEUILLE-TITRES"
    if re.search(r"PORTEFEUILLE.TITRES", full_upper) and re.search(
        r"NOMBRE\s*DE\s*TITRES|VALEUR\s*AU\s*BILAN", full_upper
    ):
        return "ÉTAT DU PORTEFEUILLE-TITRES"

    if re.search(r"VALEUR\s*LIQUIDATIVE", joined):
        return "DONNÉES PAR PART"
    if re.search(r"VARIATION\s+DE\s+L.ACTIF\s+NET", joined):
        return "ÉTAT DE VARIATION DE L'ACTIF NET"
    if re.search(r"TOTAL\s*(DES\s*)?ACTIF", joined) and re.search(
        r"TOTAL\s*(DES\s*)?PASSIF", joined
    ):
        return "BILAN"
    if re.search(r"TOTAL\s*(DES\s*)?ACTIF", joined) and not re.search(
        r"TOTAL\s*(DES\s*)?PASSIF", joined
    ):
        return "BILAN - ACTIF"
    if re.search(r"TOTAL\s*(DES\s*)?PASSIF", joined):
        return "BILAN - PASSIF"
    if re.search(r"ACTIFS?\s*\|.*NOTE", full_upper) and re.search(
        r"PORTEFEUILLE", full_upper
    ):
        return "BILAN"
    if re.search(r"R[ÉE]SULTAT\s*(DE\s*L.EXERCICE|D.EXPLOITATION|NET)", joined):
        return "ÉTAT DE RÉSULTAT"
    if re.search(r"REVENUS\s*(DU\s*PORTEFEUILLE|DES\s*PLACEMENTS|NETS)", joined):
        return "ÉTAT DE RÉSULTAT"
    if re.search(r"CHARGES\s*DE\s*GESTION", joined) and re.search(r"R[ÉE]SULTAT", joined):
        return "ÉTAT DE RÉSULTAT"
    if re.search(r"DIVIDENDE", joined) or re.search(r"INT[ÉE]R[ÊE]TS\s*(SUR|[ÉE]CHUS)", joined):
        return "DÉTAIL DES REVENUS"
    if re.search(r"R[ÉE]MUN[ÉE]RATION\s*(DU\s*GESTIONNAIRE|DU\s*D[ÉE]POSITAIRE)", joined):
        return "DÉTAIL DES CHARGES"
    if re.search(r"HONORAIRES|REDEVANCE|COMMISSION", joined):
        return "DÉTAIL DES CHARGES"
    if re.search(r"FLUX\s*(DE\s*)?TR[ÉE]SORERIE", joined):
        return "TABLEAU DE FLUX DE TRÉSORERIE"
    if re.search(r"CAPITAL\s*(AU|SOCIAL|SOUSCRIT|FIN|D[ÉE]BUT)", joined):
        return "CAPITAL"
    if re.search(r"MOUVEMENT\s*SUR\s*(LE\s*)?CAPITAL", joined):
        return "MOUVEMENTS DU CAPITAL"
    if re.search(r"HORS\s*BILAN|ENGAGEMENT", joined):
        return "ENGAGEMENTS HORS BILAN"
    if re.search(r"PORTEFEUILLE.TITRES|CO[ÛU]T\s*D.ACQUISITION|NOMBRE\s*DE\s*TITRES", joined):
        return "ÉTAT DU PORTEFEUILLE-TITRES"
    if re.search(r"PLACEMENT|D[ÉE]P[ÔO]T|DISPONIBILIT", joined) and not re.search(
        r"PORTEFEUILLE|NOMBRE\s*DE\s*TITRES", full_upper
    ):
        return "PLACEMENTS MONÉTAIRES"

    return ""


def _extract_page_titles(raw_text: str) -> list:
    """
    Extrait TOUS les titres de tableaux d'une page, dans l'ordre d'apparition.
    Version "titre réel": nettoyage MINIMAL seulement.
    """
    if not raw_text or len(raw_text) < 20:
        return []

    lines = raw_text.split("\n")
    section_titles = []

    def _clean_title_minimal(raw: str) -> str:
        d = raw.strip()
        d = re.sub(r"[\!\*\#\@\¥\€\$\£\~\^]+", "", d).strip()
        d = re.sub(r"\s*[-–—]{3,}\s*", " ", d).strip()
        d = re.sub(r"\s+", " ", d).strip()
        return d

    # Phase 1 : PR1/AC2/...
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        m = re.match(
            r"((?:PR|AC|CH|CP|PA)\s*\d+)\s*[:\.\-]\s*(.*)",
            stripped,
            re.IGNORECASE,
        )
        if m:
            desc = _clean_title_minimal(m.group(2))

            if re.search(r"\d", desc) and len(desc.split()) <= 3:
                continue
            if len(desc) < 4:
                continue

            section_titles.append(desc)

    if section_titles:
        return section_titles

    # Phase 2 : titres d'états
    header_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if "|" in stripped and re.search(r"\d{3,}", stripped):
            break
        if len(stripped) > 120:
            break
        header_lines.append(stripped)
        if len(header_lines) >= 8:
            break

    if not header_lines:
        return []

    combined_title = re.sub(r"\s+", " ", " ".join(header_lines)).strip()

    if re.search(r"NOTES\s*SUR", combined_title.upper()):
        return []

    title_patterns = [
        (r"[ÉE]TAT\s*DE\s*(?:LA\s*)?VARIATION\s*DE\s*L\.?\s*ACTIF\s*NET", True),
        (r"[ÉE]TAT\s*DE\s*R[ÉE]SULTAT", True),
        (r"DONN[ÉE]ES\s*PAR\s*PART", True),
        (r"TABLEAU\s*DE\s*FLUX\s*DE\s*TR[ÉE]SORERIE", True),
        (r"FLUX\s*DE\s*TR[ÉE]SORERIE", True),
        (r"PORTEFEUILLE[\s\.\-]*TITRES?", True),
        (r"\bBILAN\b", True),
    ]
    detected = any(re.search(pat, combined_title, re.IGNORECASE) for pat, _ in title_patterns)
    if detected:
        fund_match = re.search(
            r"(FCPR\s+[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s]+?)(?:\s+(?:BILAN|[ÉE]TAT|EXERCICE|DONN|NOTE|TABLEAU|AU\s+\d))",
            combined_title,
        )
        if fund_match:
            fund_name = fund_match.group(1).strip()
            fund_name = re.sub(r"[^A-ZÀ-Ÿ0-9\s]", "", fund_name).strip()
            fund_name = re.sub(r"\s+", " ", fund_name)
            if len(fund_name) > 4:
                return [f"{fund_name} — {combined_title.strip()}"]
        return [combined_title.strip()]

    # Phase 3 : fallback contextuel
    first_lines_text = " ".join(
        l.strip()
        for l in lines[:15]
        if l.strip() and not re.search(r"\|.*\d{3,}", l)
    )

    fallback_patterns = [
        (r"PLACEMENTS?\s*MON[ÉE]TAIRES?", True),
        (r"REVENUS?\s*DU\s+PORTEFEUILLE", True),
        (r"CHARGES?\s*DE\s*GESTION", True),
        (r"ENGAGEMENTS?\s*HORS\s*BILAN", True),
        (r"CAPITAUX?\s*PROPRES?", True),
    ]
    for pat, _ in fallback_patterns:
        m = re.search(pat, first_lines_text, re.IGNORECASE)
        if m:
            start = max(0, m.start() - 50)
            end = min(len(first_lines_text), m.end() + 50)
            title = _clean_title_minimal(first_lines_text[start:end])
            if len(title) > 10:
                return [title]

    return []


try:
    from app.services.embedder import to_pgvector
except Exception:
    to_pgvector = None

from app.services.db import get_rag_conn

if getattr(Config, "TESSERACT_CMD", ""):
    pytesseract.pytesseract.tesseract_cmd = Config.TESSERACT_CMD

OCR_LANG = os.getenv("TESSERACT_LANG", "fra")
OCR_DPI = int(os.getenv("TESSERACT_DPI", "300"))
TESSERACT_CONFIG = "--oem 1 --psm 6 -c preserve_interword_spaces=1"
MIN_CHUNK_CHARS = int(os.getenv("RAG_MIN_CHUNK_CHARS", "80"))


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def is_scanned_pdf(doc: fitz.Document, sample_pages: int = 2) -> bool:
    pages = min(sample_pages, doc.page_count)
    for i in range(pages):
        t = (doc.load_page(i).get_text("text") or "").strip()
        if len(t) > 80:
            return False
    return True


def ocr_page(page: fitz.Page, detection_rules: TableDetectionRules | None = None) -> str:
    """
    OCR d'une page PDF.
    - Chemin rapide : rendu PyMuPDF directement en niveaux de gris → Tesseract (sans cv2)
    - Chemin complet : seulement si la détection de régions-tableau est activée
    """
    needs_region_detection = (
        detection_rules and detection_rules.table_region_action != "none"
    )

    if needs_region_detection:
        # Chemin complet : RGB → numpy/cv2 pour détecter et masquer les régions
        pix = page.get_pixmap(dpi=OCR_DPI)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        pix = None
        arr = np.array(img)
        img.close()

        try:
            detector = TableRegionDetector(detection_rules)
            table_regions = detector.detect_table_regions(arr)
            if table_regions:
                print(f"[TABLE DETECTOR] {len(table_regions)} région(s) tableau détectée(s) - action: {detection_rules.table_region_action}")
                if detection_rules.table_region_action == "mask":
                    arr = detector.apply_masking(arr, table_regions)
        except Exception as e:
            print(f"[TABLE DETECTOR] Erreur lors de la détection: {e}")

        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = pytesseract.image_to_string(binary, lang=OCR_LANG, config=TESSERACT_CONFIG)
        return text

    # ─── Chemin rapide : rendu natif en niveaux de gris, pas de cv2 ──────────
    pix = page.get_pixmap(dpi=OCR_DPI, colorspace=fitz.csGRAY)
    img = Image.frombytes("L", [pix.width, pix.height], pix.samples)
    pix = None
    text = pytesseract.image_to_string(img, lang=OCR_LANG, config=TESSERACT_CONFIG)
    img.close()
    return text


def chunk_text(text: str, max_chars: int = 3000, overlap: int = 300) -> list[str]:
    text = " ".join((text or "").split())
    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(len(text), start + max_chars)

        if end < len(text):
            search_start = max(start, end - 200)
            last_sentence = max(
                text.rfind(". ", search_start, end),
                text.rfind("! ", search_start, end),
                text.rfind("? ", search_start, end),
            )
            if last_sentence > search_start:
                end = last_sentence + 1
            else:
                last_space = text.rfind(" ", search_start, end)
                if last_space > search_start:
                    end = last_space

        chunk = text[start:end].strip()

        if chunk and len(chunk) >= MIN_CHUNK_CHARS:
            chunks.append(chunk)

        if end >= len(text):
            break

        next_start = max(0, end - overlap)
        space_after = text.find(" ", next_start)
        if space_after != -1 and space_after < end:
            start = space_after + 1
        else:
            start = next_start

    return chunks


def _rects_overlap(r1, r2, margin: float = 2.0) -> bool:
    return not (
        r1[2] < r2[0] - margin
        or r1[0] > r2[2] + margin
        or r1[3] < r2[1] - margin
        or r1[1] > r2[3] + margin
    )


def _extract_text_excluding_tables(page: fitz.Page) -> str:
    from app.services.text_clean import is_noisy_line, is_garbled_text_line

    table_bboxes = []
    try:
        tables = page.find_tables()
        for t in tables:
            table_bboxes.append(t.bbox)
    except Exception:
        return (page.get_text("text") or "").strip()

    if not table_bboxes:
        return (page.get_text("text") or "").strip()

    # get_text("blocks") est 5× plus léger que get_text("dict")
    # Chaque bloc : (x0, y0, x1, y1, text, block_no, block_type)
    kept_lines = []
    try:
        blocks = page.get_text("blocks", sort=True)
    except Exception:
        return (page.get_text("text") or "").strip()

    for block in blocks:
        if block[6] != 0:          # type 1 = image, ignorer
            continue
        block_bbox = block[:4]
        if any(_rects_overlap(block_bbox, tb) for tb in table_bboxes):
            continue
        for line in block[4].split("\n"):
            txt = line.strip()
            if not txt or len(txt) < 3:
                continue
            if _is_junk_line(txt):
                continue
            if is_noisy_line(txt):
                continue
            if is_garbled_text_line(txt):
                continue
            kept_lines.append(txt)

    return "\n".join(kept_lines)


_FR_STOP_WORDS_2 = {
    "a",
    "à",
    "au",
    "ce",
    "de",
    "du",
    "en",
    "et",
    "il",
    "je",
    "la",
    "le",
    "ne",
    "ni",
    "on",
    "ou",
    "où",
    "se",
    "si",
    "un",
    "y",
    "s",
    "l",
    "d",
    "n",
    "DT",
    "DH",
}


def _is_junk_line(line: str) -> bool:
    if not line or len(line) < 8:
        return False

    s = line.strip()
    words = s.split()
    if not words:
        return False

    total_words = len(words)

    non_stop_short = 0
    for w in words:
        stripped = w.strip("(){}[]|,;:.-_!?*#@'\"")
        if len(stripped) <= 2 and stripped not in _FR_STOP_WORDS_2 and not stripped.isdigit():
            non_stop_short += 1
    if total_words >= 5 and non_stop_short / total_words > 0.40:
        return True

    alpha = sum(c.isalpha() for c in s)
    total = len(s.replace(" ", ""))
    special = sum(not (c.isalnum() or c.isspace()) for c in s)
    if total > 10 and alpha / total < 0.30 and special / total > 0.15:
        return True

    caps_fragments = sum(
        1
        for w in words
        if 1 <= len(w) <= 3
        and w.isalpha()
        and w.isupper()
        and w not in _FR_STOP_WORDS_2
    )
    if total_words >= 6 and caps_fragments / total_words > 0.30:
        return True

    bracket_count = sum(c in "{}[]" for c in s)
    if bracket_count >= 3 and total_words < 10:
        return True

    _VOWELS = set("aeiouyàâäéèêëïîôùûüÿæœAEIOUYÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒ")
    nonsense_words = 0
    for w in words:
        w_clean = w.strip("(){}[]|,;:.-_!?*#@'\"")
        if not w_clean or len(w_clean) < 2:
            continue
        if w_clean.isdigit():
            continue
        if w_clean.isalpha() and len(w_clean) >= 3 and not any(c in _VOWELS for c in w_clean):
            nonsense_words += 1
            continue
        if w_clean.isalpha() and 3 <= len(w_clean) <= 5:
            consonants = sum(1 for c in w_clean if c.isalpha() and c not in _VOWELS)
            if consonants / len(w_clean) > 0.75:
                nonsense_words += 1
                continue
        has_digit = any(c.isdigit() for c in w_clean)
        has_alpha = any(c.isalpha() for c in w_clean)
        if has_digit and has_alpha and len(w_clean) <= 5:
            if not re.match(r"^\d{1,2}[hH]\d{0,2}$", w_clean):
                nonsense_words += 1
    if total_words >= 4 and nonsense_words / total_words > 0.25:
        return True

    return False


def ingest_pdf(
    path: str,
    title: str | None = None,
    extraction_rules: ExtractionRules | None = None,
    detection_rules: TableDetectionRules | None = None,
    chunk_by_page: bool = True,
    force: bool = False,
) -> int:
    title = title or os.path.basename(path)
    file_hash = sha256_file(path)

    with get_rag_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM doc_document WHERE sha256 = %s", (file_hash,))
            row = cur.fetchone()
            if row:
                if not force:
                    return int(row[0])
                # Force re-ingestion: supprimer l'ancien document et ses chunks
                old_doc_id = int(row[0])
                print(f"[INGESTION] Force re-ingestion: suppression du document #{old_doc_id}...")
                cur.execute("DELETE FROM doc_chunk WHERE document_id = %s", (old_doc_id,))
                cur.execute("DELETE FROM doc_document WHERE id = %s", (old_doc_id,))
                conn.commit()
                print(f"[INGESTION] Ancien document #{old_doc_id} supprimé")

            cur.execute(
                "INSERT INTO doc_document(title, source_path, sha256) VALUES (%s, %s, %s) RETURNING id",
                (title, path, file_hash),
            )
            doc_id = int(cur.fetchone()[0])

            doc = fitz.open(path)
            globally_scanned = is_scanned_pdf(doc)

            page_raw_texts = {}
            chunk_index = 0
            
            print(f"[INGESTION] Traitement de {doc.page_count} pages...")

            # ✅ PHASE 1: Extraction du texte de toutes les pages
            all_chunks_data = []
            
            for page_i in range(doc.page_count):
                page = doc.load_page(page_i)
                extracted = (page.get_text("text") or "").strip()

                if globally_scanned or len(extracted) < 50:
                    print(f"[INGESTION] Page {page_i + 1}/{doc.page_count} - OCR en cours...")
                    raw = ocr_page(page, detection_rules=detection_rules)
                    scanned = True
                else:
                    raw = _extract_text_excluding_tables(page)
                    scanned = False

                page_raw_texts[page_i + 1] = raw

                # Nettoyage + suppression tableaux
                page_text = clean_text_for_chunking(raw, remove_tables=True)
                # NEW: enlever numéro parasite au début
                page_text = strip_leading_chunk_index(page_text)

                if chunk_by_page:
                    chunks_to_insert = [page_text] if page_text.strip() else []
                else:
                    chunks_to_insert = chunk_text(page_text)

                for chunk in chunks_to_insert:
                    # NEW: sécurité aussi au niveau chunk
                    chunk = strip_leading_chunk_index(chunk)

                    prefix = _build_chunk_context_prefix(title, chunk)
                    text_for_embed = prefix + chunk if prefix else chunk

                    chunk_years = _extract_years_from_text(chunk) or _extract_years_from_text(title)
                    chunk_fund = _extract_fund_from_title(title)
                    meta = {
                        "scanned": scanned,
                        "chunk_by_page": chunk_by_page,
                        "fund_name": chunk_fund or None,
                        "years": chunk_years or None,
                    }

                    all_chunks_data.append({
                        "text": chunk,
                        "text_for_embed": text_for_embed,
                        "page": page_i + 1,
                        "metadata": meta,
                    })
                
                # Log de progression tous les 5 pages
                if (page_i + 1) % 5 == 0 or page_i + 1 == doc.page_count:
                    print(f"[INGESTION] Traité {page_i + 1}/{doc.page_count} pages, {len(all_chunks_data)} chunks")

            # ✅ PHASE 2: Génération des embeddings en batch
            if all_chunks_data:
                print(f"[INGESTION] Génération de {len(all_chunks_data)} embeddings...")
                texts_for_embed = [c["text_for_embed"] for c in all_chunks_data]
                
                from app.services.embedder import embed_texts_batch
                embeddings = embed_texts_batch(texts_for_embed, batch_size=32)
                
                print(f"[INGESTION] Embeddings générés, insertion dans la DB...")

                # ✅ PHASE 3: Insertion en batch
                batch_data = []
                for i, chunk_data in enumerate(all_chunks_data):
                    emb = embeddings[i]
                    if to_pgvector:
                        emb = to_pgvector(emb)
                    
                    batch_data.append((
                        doc_id,
                        chunk_index,
                        chunk_data["page"],
                        chunk_data["page"],
                        chunk_data["text"],
                        emb,
                        Json(chunk_data["metadata"]),
                        chunk_data["text"],
                    ))
                    chunk_index += 1
                
                # Insertion en batch (tous les chunks d'un coup)
                from psycopg2.extras import execute_batch
                execute_batch(
                    cur,
                    """
                    INSERT INTO doc_chunk(
                        document_id, chunk_index, page_start, page_end,
                        text, embedding, metadata, tsv
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s, to_tsvector('french', %s))
                    """,
                    batch_data,
                    page_size=100
                )
                print(f"[INGESTION] {len(batch_data)} chunks de texte insérés")

            print(f"[TABLES] Extraction des tableaux avec Azure pour {title}...")
            try:
                java_api_url = Config.JAVA_OCR_API_URL
                extractor = TableExtractorJavaClient(java_api_url=java_api_url, timeout=120)
                tables = extractor.extract_from_pdf(path, rules=extraction_rules)

                print(f"[TABLES] {len(tables)} table(s) extraite(s)")

                # 🔧 AMÉLIORATION: Fusionner les tableaux multi-pages
                tables = merge_multi_page_tables(tables)
                print(f"[TABLES] {len(tables)} table(s) après fusion multi-pages")

                tables_inserted = 0
                tables_filtered = 0
                page_titles_cache = {}
                page_table_count = {}
                
                # ✅ Préparer les données des tableaux AVANT d'embedder
                valid_tables_data = []

                for table in tables:
                    if table.df is None or table.df.empty:
                        continue

                    table.df = clean_table_post_azure(table.df)
                    if table.df is None or table.df.empty:
                        print(f"[TABLES] Page {table.page} : Table vide après nettoyage, ignorée")
                        tables_filtered += 1
                        continue

                    table_text = table_to_pipe_text(table.df)
                    if not table_text.strip():
                        continue

                    if is_garbled_table(table_text):
                        print(f"[TABLES] Page {table.page} table#{table.index}: FILTRÉE (bruit OCR)")
                        tables_filtered += 1
                        continue

                    # amélioration post-extraction
                    table_text = enhance_table_extraction(table_text)

                    if enhanced_table_of_contents_detection(table_text):
                        print(
                            f"[TABLES] Page {table.page} table#{table.index}: FILTRÉE (sommaire)"
                        )
                        tables_filtered += 1
                        continue

                    table_lines = table_text.strip().split("\n")
                    numeric_count = sum(
                        1
                        for line in table_lines[1:]
                        for cell in line.split("|")
                        if re.search(r"\d", cell.strip())
                    )

                    if not is_likely_real_table(table_text, min_rows=2, min_numeric_cells=2):
                        print(
                            f"[TABLES] Page {table.page} table#{table.index}: FILTRÉE (peu fiable)"
                        )
                        tables_filtered += 1
                        continue

                    if table.page not in page_titles_cache:
                        page_titles_cache[table.page] = _extract_page_titles(page_raw_texts.get(table.page, ""))

                    titles_for_page = page_titles_cache[table.page]
                    idx_on_page = page_table_count.get(table.page, 0)
                    page_table_count[table.page] = idx_on_page + 1

                    page_title = titles_for_page[idx_on_page] if idx_on_page < len(titles_for_page) else ""

                    content_name = _detect_table_name(table_text)
                    table_name = page_title or content_name

                    # correction libellés coupés
                    table_text_fixed = fix_table_with_context(table_text, table_name)
                    if table_text_fixed != table_text:
                        table_text = table_text_fixed

                    if table_name:
                        table_text_with_name = f"[{table_name}]\n{table_text}"
                        print(f"[TABLES] Page {table.page} table#{table.index}: {table_name}")
                    else:
                        table_text_with_name = table_text
                        print(f"[TABLES] Page {table.page} table#{table.index}: (nom non détecté)")

                    # NEW: enlever numéro parasite au début (au cas où)
                    table_text_with_name = strip_leading_chunk_index(table_text_with_name)

                    table_years = _extract_years_from_text(table_text)
                    table_fund = _extract_fund_from_title(title)
                    prefix = _build_chunk_context_prefix(title, table_text, table_name)
                    text_for_embed = prefix + table_text_with_name if prefix else table_text_with_name

                    valid_tables_data.append({
                        "table": table,
                        "text": table_text_with_name,
                        "text_for_embed": text_for_embed,
                        "table_name": table_name,
                        "table_years": table_years,
                        "table_fund": table_fund,
                    })

                # ✅ PHASE 2: Génération des embeddings des tableaux en batch
                if valid_tables_data:
                    print(f"[TABLES] Génération de {len(valid_tables_data)} embeddings de tableaux...")
                    table_texts_for_embed = [t["text_for_embed"] for t in valid_tables_data]
                    
                    from app.services.embedder import embed_texts_batch
                    table_embeddings = embed_texts_batch(table_texts_for_embed, batch_size=16)
                    
                    print(f"[TABLES] Embeddings générés, insertion dans la DB...")

                    # ✅ PHASE 3: Insertion des tableaux en batch
                    table_batch_data = []
                    for i, table_data in enumerate(valid_tables_data):
                        emb = table_embeddings[i]
                        if to_pgvector:
                            emb = to_pgvector(emb)

                        table_batch_data.append((
                            doc_id,
                            chunk_index,
                            table_data["table"].page,
                            table_data["table"].page,
                            table_data["text"],
                            emb,
                            Json({
                                "scanned": False,
                                "is_table": True,
                                "table_index": table_data["table"].index,
                                "table_name": table_data["table_name"] or None,
                                "fund_name": table_data["table_fund"] or None,
                                "years": table_data["table_years"] or None,
                            }),
                            table_data["text"],
                        ))
                        chunk_index += 1
                    
                    # Insertion en batch
                    from psycopg2.extras import execute_batch
                    execute_batch(
                        cur,
                        """
                        INSERT INTO doc_chunk(
                            document_id, chunk_index, page_start, page_end,
                            text, embedding, metadata, tsv
                        )
                        VALUES (%s,%s,%s,%s,%s,%s,%s, to_tsvector('french', %s))
                        """,
                        table_batch_data,
                        page_size=50
                    )
                    tables_inserted = len(table_batch_data)
                    print(f"[TABLES] {tables_inserted} tableaux insérés")

                print(f"[TABLES] Résumé : {tables_inserted} insérées, {tables_filtered} filtrées (sommaires/faux positifs)")

            except Exception as e:
                print(f"[TABLES] Erreur lors de l'extraction : {e}")

            doc.close()

        conn.commit()

    return doc_id


# -----------------------------------------------------------------------------
# Helpers pour l'enrichissement contextuel des chunks avant embedding
# -----------------------------------------------------------------------------
def _extract_fund_from_title(title: str) -> str:
    t = (title or "").upper()
    m = re.search(r"(FCPR[\s_][A-Z][A-Z0-9\s_]+?)(?:[_\s](?:EFD|COMITE|RAPPORT|ETAT|\d{4})|$)", t)
    if m:
        fund = m.group(1).strip("_ ")
        fund = re.sub(r"[\s_]+", " ", fund)
        return fund
    return ""


def _extract_years_from_text(text: str) -> list[str]:
    matches = re.findall(r"\b(20\d{2})\b", text)
    if not matches:
        return []
    from collections import Counter
    counter = Counter(matches)
    return [y for y, _ in counter.most_common(3)]


def _build_chunk_context_prefix(doc_title: str, text: str, table_name: str = "") -> str:
    parts = []

    fund = _extract_fund_from_title(doc_title)
    if fund:
        parts.append(f"Fonds: {fund}")

    if table_name:
        parts.append(f"Tableau: {table_name}")

    years = _extract_years_from_text(text) or _extract_years_from_text(doc_title)
    if years:
        parts.append(f"Exercice: {', '.join(years)}")

    if not parts:
        return ""

    return " | ".join(parts) + "\n"