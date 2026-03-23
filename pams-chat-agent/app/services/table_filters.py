"""
Filtres pour améliorer la qualité de l'extraction de tables
"""
import re
import pandas as pd
from typing import Set, Optional, List


def is_table_of_contents(text: str, headers: list = None) -> bool:
    """
    Détecte si une "table" extraite par Azure est en fait un sommaire/TOC.
    
    Indicateurs de sommaire :
    - Mots-clés : "sommaire", "table des matières"
    - Numérotation romaine (I., II., III., IV.)
    - Numéros de page dans la dernière colonne
    - Format : "Titre | Page"
    
    Args:
        text: Texte de la table au format pipe
        headers: Liste des headers (colonnes) si disponible
        
    Returns:
        True si c'est probablement un sommaire
    """
    if not text:
        return False
    
    text_lower = text.lower()
    
    # 1. Mots-clés explicites
    toc_keywords = [
        'sommaire',
        'table des matières',
        'table des matieres'
    ]
    
    if any(keyword in text_lower for keyword in toc_keywords):
        return True
    
    # 2. Numérotation romaine fréquente
    roman_pattern = r'\b(i{1,3}|iv|v|vi{0,3}|ix|x)\.\s*\|'
    roman_matches = re.findall(roman_pattern, text_lower)
    if len(roman_matches) >= 3:  # Au moins 3 numéros romains
        return True
    
    # 3. Beaucoup de numéros de page (pattern: "| nombre" à la fin des lignes)
    # NB: seulement pertinent pour les tables 2-3 colonnes (TOC classique)
    # Les tables financières larges (6+ cols) avec des petits nombres en dernière colonne
    # ne sont PAS des sommaires
    lines = text.split('\n')
    
    # Compter le nombre de colonnes (pipes dans la 1ère ligne)
    num_cols = len(lines[0].split('|')) if lines else 0
    
    if num_cols <= 3:
        page_number_lines = 0
        
        for line in lines[1:]:  # Skip header
            # Vérifie si la ligne se termine par "| nombre" (1-3 chiffres, typique page)
            # NB: [1-9] pas \d → exclut "| 0" qui est un montant financier, pas un n° de page
            if re.search(r'\|\s*[1-9]\d{0,2}\s*$', line):
                page_number_lines += 1
        
        # Si plus de 60% des lignes ont un numéro de page à la fin
        if len(lines) > 2 and page_number_lines / (len(lines) - 1) > 0.6:
            return True
    
    # 4. Headers typiques de TOC
    if headers:
        headers_lower = [h.lower() for h in headers]
        toc_header_patterns = ['page', 'pages', 'numéro', 'numero']
        
        if any(pattern in ' '.join(headers_lower) for pattern in toc_header_patterns):
            # Et peu de colonnes (2-3 max pour un TOC)
            if len(headers) <= 3:
                return True
    
    return False


def clean_table_with_underlines(df: pd.DataFrame, underline_chars: Set[str] = None) -> pd.DataFrame:
    """
    Nettoie les tableaux en supprimant les lignes/colonnes contenant uniquement
    des caractères de soulignement (implémentation complète)
    
    Args:
        df: DataFrame à nettoyer
        underline_chars: Set de caractères considérés comme soulignement
        
    Returns:
        DataFrame nettoyé
    """
    if underline_chars is None:
        # NB: NE PAS inclure "." ni "·" — ils apparaissent dans les montants (10.63%),
        # dates (31.12.2023) et labels financiers → les strip détruit les données
        underline_chars = {"_", "-", "=", "―", "─", "—", "–", "¯", "‾"}
    
    # Chars à NE PAS strip des cellules individuelles contenant du texte/nombres
    # (les tirets servent de signe négatif, de composant de dates, etc.)
    DASH_CHARS = {"-", "–", "—"}
    
    if df.empty:
        return df
    
    # Pattern pour détecter les cellules "underline"
    underline_pattern = "^[" + "".join(re.escape(c) for c in underline_chars) + r"\s]+$"
    
    # 1. Supprimer les lignes qui sont uniquement des underlines
    def is_underline_row(row):
        """Vérifie si une ligne contient uniquement des underlines"""
        non_empty = [str(cell).strip() for cell in row if pd.notna(cell) and str(cell).strip()]
        if not non_empty:
            return False
        return all(re.match(underline_pattern, cell) for cell in non_empty)
    
    mask_rows = ~df.apply(is_underline_row, axis=1)
    df_cleaned = df[mask_rows].copy()
    
    if df_cleaned.empty:
        return df_cleaned
    
    # 2. Supprimer les colonnes qui sont uniquement des underlines
    def is_underline_column(col):
        """Vérifie si une colonne contient uniquement des underlines"""
        non_empty = [str(cell).strip() for cell in col if pd.notna(cell) and str(cell).strip()]
        if not non_empty:
            return False
        return all(re.match(underline_pattern, cell) for cell in non_empty)
    
    mask_cols = ~df_cleaned.apply(is_underline_column, axis=0)
    df_cleaned = df_cleaned.loc[:, mask_cols]
    
    if df_cleaned.empty:
        return df_cleaned
    
    # 3. Nettoyer les cellules individuelles qui mélangent texte + underlines
    def clean_cell(cell):
        """Retire les underlines d'une cellule mixte, SANS toucher aux signes négatifs ni tirets composés"""
        if pd.isna(cell):
            return cell
        cell_str = str(cell).strip()
        if not cell_str:
            return cell_str
        # Si la cellule est uniquement underline, la vider
        if re.match(underline_pattern, cell_str):
            return ""
        # Si la cellule contient des chiffres ou des lettres mélangés avec des tirets,
        # ne PAS toucher (ex: "-350 000", "31-12-2023", "+/- values")
        if re.search(r'[a-zA-ZÀ-ÿ0-9]', cell_str):
            # Seulement strip les vrais underline chars (pas tirets) en début/fin
            for char in underline_chars:
                if char in DASH_CHARS:
                    continue  # Ne jamais strip les tirets d'une cellule avec du contenu
                cell_str = cell_str.strip(char).strip()
        return cell_str
    
    df_cleaned = df_cleaned.map(clean_cell)
    
    # 4. Supprimer les lignes/colonnes devenues vides après nettoyage
    df_cleaned = df_cleaned.replace("", pd.NA).dropna(how='all').dropna(axis=1, how='all')
    
    return df_cleaned.reset_index(drop=True)


def is_likely_real_table(text: str, min_rows: int = 3, min_numeric_cells: int = 3) -> bool:
    """
    Vérifie si une table extraite est probablement une vraie table de données.
    
    Critères :
    - Au moins min_rows lignes de données
    - Au moins min_numeric_cells cellules numériques
    - Pas un sommaire
    
    Args:
        text: Texte de la table au format pipe
        min_rows: Nombre minimum de lignes
        min_numeric_cells: Nombre minimum de cellules avec des nombres
        
    Returns:
        True si c'est probablement une vraie table
    """
    if not text:
        return False
    
    # D'abord vérifier que ce n'est pas un TOC
    if is_table_of_contents(text):
        return False
    
    lines = text.split('\n')
    # Strip empty lines
    lines = [l for l in lines if l.strip()]
    
    # Vérifier le nombre de lignes (header + données)
    # min_rows=2 signifie au moins 2 lignes de données + 1 header = 3 lignes minimum
    if len(lines) < min_rows + 1:  # +1 pour le header
        # Exception: si peu de lignes mais beaucoup de cellules numériques, garder
        # (ex: table récap avec 1-2 lignes mais 6 colonnes de chiffres)
        numeric_cells = 0
        for line in lines[1:]:
            cells = line.split('|')
            for cell in cells:
                if re.search(r'\d', cell.strip()):
                    numeric_cells += 1
        # Si au moins 4 cellules numériques malgré peu de lignes → garder
        if numeric_cells >= 4:
            return True
        return False
    
    # Compter les cellules numériques
    numeric_cells = 0
    for line in lines[1:]:  # Skip header
        cells = line.split('|')
        for cell in cells:
            cell = cell.strip()
            # Détecte nombres, montants, pourcentages
            if re.search(r'\d', cell):
                numeric_cells += 1
    
    if numeric_cells < min_numeric_cells:
        return False
    
    return True


def is_garbled_table(text: str) -> bool:
    """
    Détecte si un tableau extrait est du bruit OCR (texte brouillé/illisible).
    
    Utilise un score combiné de plusieurs signaux faibles:
    - Mots collés ("Nombredeparts", "MontantenNominat")
    - Petits mots ALL-CAPS bruit ("AE", "EAN", "SCA")
    - Crochets/parenthèses excessifs
    - Transitions minuscule→Majuscule
    
    Returns:
        True si la table semble être du bruit OCR
    """
    if not text or len(text) < 30:
        return False
    
    # Acronymes financiers / tickers / termes courants à ne pas compter comme bruit
    _KNOWN_ACRONYMS = {'TVA', 'TTC', 'HT', 'PDF', 'EUR', 'TND', 'USD',
                       'SA', 'SARL', 'SAS', 'FCPR', 'FCP', 'OPCVM', 'SICAV',
                       'BNA', 'STB', 'BH', 'BIAT', 'BT', 'UIB', 'ATB', 'UBCI',
                       'OCA', 'MIP', 'NAI', 'SIM', 'SFBT', 'STAR', 'SPDI',
                       'AERO', 'ESAT', 'GIF', 'TPR', 'ICF', 'SITS', 'CC',
                       'CDC', 'CMF', 'BCT', 'BVMT', 'GP', 'TND', 'DT',
                       'NOTE', 'DU', 'AU', 'EN', 'LE', 'LA', 'LES', 'UN', 'DE',
                       'ET', 'OU', 'PAR', 'DES', 'NET', 'NB', 'REF', 'DR',
                       # Codes comptables / financiers tunisiens
                       'AC', 'PA', 'CH', 'PR', 'RN', 'CP', 'ATOT', 'PTOT',
                       'BTA', 'STE', 'MAC', 'NEW', 'UP', 'LINE', 'BODY',
                       'CRAM', 'TVAL', 'ITEM', 'AMEN', 'WAFA', 'AMI',
                       'TOTAL', 'CAP', 'RES', 'SOC', 'PROV', 'EMP', 'AUT'}
    
    words = text.split()
    total_words = 0
    glued_words = 0
    caps_noise_words = 0
    
    for w in words:
        w_clean = w.strip("|[](){}_ ")
        if not w_clean:
            continue
        total_words += 1
        
        # --- Signal 1: Mots collés (> 14 chars, pas nombre, pas composé) ---
        # NB: utiliser [a-z][A-Z] (ASCII seul) pour la detéction camelCase
        # car [À-Ÿ] inclut les lettres accentuées minuscules (é, è, ê...)
        if len(w_clean) > 14 and '-' not in w_clean:
            if not re.match(r'^[\d\s.,%-]+$', w_clean):
                transitions = len(re.findall(r'[a-z][A-Z]', w_clean))
                has_no_space = (len(w_clean) > 16 and w_clean.islower() and
                               re.search(r'[aeiou]{1}[bcdfghjklmnpqrstvwxz]{1,2}[aeiou]', w_clean))
                if transitions >= 1 or has_no_space:
                    glued_words += 1
        
        # --- Signal 2: Petits mots ALL-CAPS bruit (2-4 lettres) ---
        if re.match(r'^[A-Z]{2,4}$', w_clean) and w_clean not in _KNOWN_ACRONYMS:
            caps_noise_words += 1
    
    if total_words == 0:
        return False
    
    glued_ratio = glued_words / total_words
    caps_noise_ratio = caps_noise_words / total_words
    
    # --- Décision par score combiné ---
    if glued_ratio > 0.10:
        return True
    if caps_noise_ratio > 0.15:
        return True
    # Signaux combinés
    if (glued_ratio + caps_noise_ratio) > 0.12:
        return True
    
    # --- Signal 3: Crochets/parenthèses excessifs ---
    # NB: les parenthèses autour de nombres négatifs (convention comptable) ne comptent pas
    bracket_count = len(re.findall(r'[\[\]{}]', text))  # Exclure ()
    paren_count = len(re.findall(r'[()]', text))
    # Ne compter les parenthèses que si elles ne sont PAS autour de nombres
    financial_parens = len(re.findall(r'\(\s*-?\d[\d\s.,]*\d?\s*\)', text))
    noise_parens = paren_count - financial_parens * 2  # 2 parens per match
    bracket_count += max(0, noise_parens)
    alphanum_count = len(re.findall(r'[a-zA-ZÀ-ÿ0-9]', text))
    if alphanum_count > 0 and bracket_count / alphanum_count > 0.12:
        return True
    
    # --- Signal 4: Beaucoup de transitions minuscule→Majuscule DANS les mots ---
    # Ne compter que les transitions intra-mot (pas entre mots séparés par pipes/espaces)
    # IMPORTANT: utiliser [a-z][A-Z] (ASCII seul) car [À-Ÿ] inclut les lettres
    # accentuées minuscules (é, è, ê, ë...) ce qui provoque des faux positifs
    # sur les mots français normaux ("assimilées", "monétaires", "Intérêts"...)
    intra_word_camel = 0
    for w in words:
        w_clean = w.strip("|[](){}_ ")
        if len(w_clean) > 5:  # Seulement mots assez longs
            intra_word_camel += len(re.findall(r'[a-z][A-Z]', w_clean))
    if intra_word_camel > 8:
        return True
    
    return False


def split_concatenated_label_cells(df: pd.DataFrame) -> pd.DataFrame:
    """
    Détecte et sépare les cellules de la colonne 0 qui contiennent
    plusieurs labels fusionnés (Azure a fusionné 2 lignes en 1 cellule).
    
    Pattern détecté: cellule col 0 = "catégorie sous-item" avec cols 1+ vides.
    Ex: "b- Disponibilités Dépôt à vue" → 2 lignes:
        "b- Disponibilités" | "" | ""
        "Dépôt à vue"       | "" | ""
    
    AUSSI: "ACTIF NET a- en début d'exercice | 5 824 639 | 0" → 2 lignes:
        "ACTIF NET" | 5 824 639 | 0
        "a- en début d'exercice" | 5 824 639 | 0
    """
    if df.empty or len(df.columns) < 2:
        return df
    
    first_col = df.columns[0]
    
    # Patterns connus de catégorie (a-, b-, c-, etc. ou mots-clés de section)
    category_pattern = re.compile(
        r'^([a-z]\s*[-–—:]\s*[A-ZÀ-Ÿ].+?)'  # "b- Disponibilités"
        r'\s+'
        r'([A-ZÀ-Ÿ][a-zà-ÿ].+)$'  # "Dépôt à vue" (commence par Majuscule)
    )
    
    # Pattern plus général: un label long avec un sous-item après une majuscule
    general_split_pattern = re.compile(
        r'^(.+?(?:monétaires|disponibilités|placements|obligations|valeurs|portefeuille|créditeurs|créanciers|débiteurs))'
        r'\s+'
        r'([A-ZÀ-Ÿ][a-zà-ÿ].{3,})$',  # Sous-item commençant par majuscule
        re.IGNORECASE
    )
    
    # Pattern NOUVEAU: "CATÉGORIE a- sous-catégorie" avec données dans autres colonnes
    # Ex: "ACTIF NET a- en début d'exercice" → "ACTIF NET" + "a- en début d'exercice"
    # Ex: "NOMBRE DE PARTS a- en début d'exercice" → "NOMBRE DE PARTS" + "a- ..."
    category_subcategory_pattern = re.compile(
        r'^(.+?)\s+([a-z]\s*[-–—]\s*[a-zà-ÿ].*)$',
        re.IGNORECASE
    )
    
    new_rows = []
    split_count = 0
    
    for idx, row in df.iterrows():
        cells = [str(c).strip() for c in row]
        first_cell = cells[0]
        other_cells_empty = all(c == "" for c in cells[1:])
        other_cells = cells[1:]
        
        # CAS 1: Lignes AVEC données - pattern "CATÉGORIE a- sous-catégorie"
        if not other_cells_empty and len(first_cell) > 10:
            m = category_subcategory_pattern.match(first_cell)
            if m:
                category = m.group(1).strip()
                subcategory = m.group(2).strip()
                
                # Vérifier que c'est vraiment une sous-catégorie (pas une date, formule, etc.)
                # La sous-catégorie doit commencer par lettre-tiret-espace-mot
                if (len(category) >= 3 and 
                    len(subcategory) >= 5 and
                    re.match(r'^[a-z]\s*[-–—]\s*[a-zà-ÿ]', subcategory, re.IGNORECASE)):
                    
                    print(f"[SPLIT-DATA] '{first_cell[:50]}' → '{category}' + '{subcategory[:30]}'")
                    
                    new_rows.append([category] + other_cells)
                    new_rows.append([subcategory] + other_cells)
                    split_count += 1
                    continue
        
        # CAS 2: Lignes SANS données (cols 1+ vides), label long
        if other_cells_empty and len(first_cell) > 20:
            # 1) Tenter un split 2-way avec patterns connus
            m = category_pattern.match(first_cell) or general_split_pattern.match(first_cell)
            if m:
                empty_rest = [""] * (len(df.columns) - 1)
                new_rows.append([m.group(1).strip()] + empty_rest)
                new_rows.append([m.group(2).strip()] + empty_rest)
                split_count += 1
                continue
            
            # 2) Multi-split: découper sur les transitions minuscule→Majuscule
            #    Ex: "Régularisation des sommes non distribuables de l'exercice
            #         Régularisation des sommes distribuables Droits de sortie"
            #    → 3 lignes séparées
            if len(first_cell) > 40:
                fragments = re.split(
                    r'(?<=[a-zà-ÿ\'»\)\.ée])\s+(?=[A-ZÀ-Ÿ][a-zà-ÿ])',
                    first_cell
                )
                # Fusionner les fragments trop courts (< 12 chars) avec le précédent
                merged = []
                for frag in fragments:
                    frag = frag.strip()
                    if not frag:
                        continue
                    if merged and len(frag) < 12:
                        merged[-1] = merged[-1] + " " + frag
                    else:
                        merged.append(frag)
                
                if len(merged) >= 2:
                    empty_rest = [""] * (len(df.columns) - 1)
                    for frag in merged:
                        new_rows.append([frag] + empty_rest)
                    split_count += 1
                    continue
        
        new_rows.append(list(row))
    
    if split_count > 0:
        result = pd.DataFrame(new_rows, columns=df.columns)
        print(f"[TABLE CLEAN] {split_count} cellule(s) fusionnée(s) scindée(s)")
        return result
    
    return df


def merge_continuation_rows(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fusionne les lignes de continuation dans la colonne 0.
    
    Problème Azure : un label long est découpé sur 2+ lignes consécutives,
    chaque fragment dans col 0 et les autres colonnes vides.
    
    Exemples :
        Row N  : "b- Intérêts"           | "" | ""
        Row N+1: "échus sur dépôts à vue" | "" | ""
        → Résultat: "b- Intérêts échus sur dépôts à vue" | "" | ""
    
        Row N  : "a-Actions, valeurs"               | "" | "" | "" | "" | ""
        Row N+1: "assimilées et droits rattachés"    | "" | "" | "" | "" | ""
        → Résultat: "a-Actions, valeurs assimilées et droits rattachés"
        
        Row N  : "PA2 : Autres créditeurs" | "" | ""
        Row N+1: "divers"                  | "" | ""
        → Résultat: "PA2 : Autres créditeurs divers" | "" | ""
    
    Règle: fusionner row N+1 dans row N si :
      - Row N a du texte en col 0, le reste vide
      - Row N+1 a du texte en col 0, le reste vide
      - Row N+1 commence par une MINUSCULE (continuation de phrase)
      - Row N+1 ne commence PAS par un pattern de catégorie (a-, b-, c-, §, etc.)
    
    IMPORTANT: on ne fusionne PAS les lignes commençant par une majuscule car
    ce sont des labels distincts (ex: "Régularisation des sommes distribuables",
    "Droits de sortie", "Dépôt à vue" sont des labels autonomes).
    """
    if df.empty or len(df.columns) < 2:
        return df
    
    first_col = df.columns[0]
    
    # Pattern indiquant un NOUVEAU label (pas une continuation)
    new_label_pattern = re.compile(
        r'^(?:'
        r'[a-z]\s*[-–—]\s*[a-zà-ÿA-ZÀ-Ÿ]'  # "b- Disponibilités", "a- en début", "a-Actions"
        r'|§\s'                              # Section marker
        r'|[A-Z]{2,5}\d{0,3}\s*[:：]'        # "PA1 :", "CH2 :", "PR :"
        r'|Total'                             # "Total ..."
        r'|TOTAL'                             # "TOTAL ..."
        r'|\d+[\s.)\-]'                       # "1. ", "1) ", etc.
        r')'
    )
    
    rows = list(df.iterrows())
    merged_rows = []
    merge_count = 0
    i = 0
    
    while i < len(rows):
        idx, row = rows[i]
        cells = [str(c).strip() for c in row]
        first_cell = cells[0]
        other_empty = all(c == "" for c in cells[1:])
        
        if other_empty and first_cell:
            # Cette ligne est un candidat pour fusion (texte en col 0 seul)
            # Chercher les lignes de continuation suivantes
            combined_text = first_cell
            j = i + 1
            
            while j < len(rows):
                _, next_row = rows[j]
                next_cells = [str(c).strip() for c in next_row]
                next_first = next_cells[0]
                next_other_empty = all(c == "" for c in next_cells[1:])
                
                if not next_first:
                    break  # Ligne vide
                
                # Vérifier si c'est une vraie continuation (pas un nouveau label)
                if new_label_pattern.match(next_first):
                    break  # C'est un nouveau label, pas une continuation
                
                # CAS A: La ligne suivante est aussi seule (empty cols) et commence par minuscule
                if next_other_empty and next_first[0].islower():
                    combined_text = combined_text + " " + next_first
                    merge_count += 1
                    j += 1
                    continue
                
                # CAS B: La ligne suivante a des DONNÉES et commence par minuscule
                # Ex: "Régularisation" (seul) + "des sommes non distribuables de l'exercice | 0 | 0"
                # → "Régularisation des sommes non distribuables de l'exercice | 0 | 0"
                if not next_other_empty and next_first[0].islower():
                    new_cells = list(next_row)
                    new_cells[0] = combined_text + " " + next_first
                    merged_rows.append(new_cells)
                    merge_count += 1
                    i = j + 1
                    combined_text = None  # Marquer comme traité
                    break
                
                break
            
            if combined_text is not None:
                # La ligne seule n'a pas pu être fusionnée avec une ligne suivante avec données
                empty_rest = [""] * (len(df.columns) - 1)
                merged_rows.append([combined_text] + empty_rest)
                i = j
        else:
            merged_rows.append(list(row))
            i += 1
    
    if merge_count > 0:
        result = pd.DataFrame(merged_rows, columns=df.columns)
        print(f"[TABLE CLEAN] {merge_count} ligne(s) de continuation fusionnée(s)")
        return result
    
    return df


def split_repeated_sublabels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Détecte et sépare les labels de section fusionnés avec des sous-labels répétés.
    
    Problème Azure : dans les tables à structure répétitive (Capital, Souscriptions...),
    le header de section est fusionné avec le premier sous-label :
        "Capital au 31 décembre 2021 Montant en Nominal" | "16 030 000"
    
    Détection : chercher des suffixes communs (alignés sur les mots) partagés
    par 2+ cellules de col 0. Ces suffixes sont des sous-labels qui doivent
    être séparés du préfixe (header de section).
    
    Résultat :
        "Capital au 31 décembre 2021" | ""
        "Montant en Nominal"          | "16 030 000"
    """
    if df.empty or len(df.columns) < 2 or len(df) < 4:
        return df
    
    from collections import Counter
    
    first_col = df.columns[0]
    
    # Collecter les valeurs de col 0
    col0_values = []
    for _, row in df.iterrows():
        val = str(row[first_col]).strip()
        if val:
            col0_values.append(val)
    
    # Compter les suffixes alignés sur les mots
    # Pour chaque cellule qui a >= 3 mots, extraire tous les suffixes possibles
    suffix_counts = Counter()
    for val in col0_values:
        words = val.split()
        if len(words) < 3:  # Besoin d'au moins 3 mots pour prefix + suffix
            continue
        for start in range(1, len(words) - 1):  # Au moins 2 mots de suffix
            suffix = " ".join(words[start:])
            if len(suffix) >= 10:  # Suffixe assez long pour être un label
                suffix_counts[suffix] += 1
    
    # Garder seulement les suffixes qui apparaissent dans 2+ cellules
    valid_suffixes = {s for s, c in suffix_counts.items() if c >= 2}
    
    if not valid_suffixes:
        return df
    
    new_rows = []
    split_count = 0
    
    for idx, row in df.iterrows():
        cells = [str(c).strip() for c in row]
        first_cell = cells[0]
        
        # Trouver le meilleur suffix valide :
        # 1) Priorité au plus fréquent (count haut = sous-label récurrent)
        # 2) En cas d'égalité, le plus long
        best_suffix = None
        best_score = (0, 0)  # (count, length)
        for suffix in valid_suffixes:
            if first_cell.endswith(suffix) and len(first_cell) > len(suffix) + 2:
                score = (suffix_counts[suffix], len(suffix))
                if score > best_score:
                    best_suffix = suffix
                    best_score = score
        
        if best_suffix:
            prefix = first_cell[:-len(best_suffix)].strip()
            # Le prefix doit être assez long pour être un header de section
            # (ex: "Capital au 31 décembre 2021" = 27 chars ✓, "Nombre" = 6 chars ✗)
            # ET le prefix doit ressembler à un header (ALL-CAPS ou court mot-clé comme "Capital")
            # PAS un mot ordinaire comme "Régularisation" suivi du reste de la phrase
            if prefix and len(prefix) >= 5:
                prefix_words = prefix.split()
                # Le prefix doit être ALL-CAPS, ou contenir un mot-clé de section
                is_section_header = (
                    prefix.upper() == prefix  # ALL-CAPS: "ACTIF NET", "CAPITAL"
                    or (len(prefix_words) == 1 and len(prefix) >= 5 and prefix[0].isupper())  # Un mot capitalisé court: "Capital", "Total"
                    or re.match(r'^[A-ZÀ-Ÿ][a-zà-ÿ]+\s+\d', prefix)  # Mot capitalisé + date: "Capital au 31..."
                )
                # EXCLUSION: "Régularisation des sommes..." → préfixe = "Régularisation" qui est long
                # Un préfixe d'un seul mot long (>12 chars) sans date n'est pas un header de section
                if is_section_header and not (len(prefix_words) == 1 and len(prefix) > 12 and not re.search(r'\d', prefix)):
                    empty_rest = [""] * (len(df.columns) - 1)
                    new_rows.append([prefix] + empty_rest)  # Section header
                    new_rows.append([best_suffix] + cells[1:])  # Sous-label + données
                    split_count += 1
                    continue
        
        new_rows.append(list(row))
    
    if split_count > 0:
        result = pd.DataFrame(new_rows, columns=df.columns)
        print(f"[TABLE CLEAN] {split_count} label(s) de section séparé(s) des sous-labels répétés")
        return result
    
    return df


def split_section_header_from_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sépare les en-têtes de section (ALL-CAPS) fusionnés avec la première ligne de données.
    
    Problème Azure : un titre de section bold/large est lu sur la même ligne que les données.
    
    Exemple :
        col 0: "REVENUS NETS DES PLACEMENTS Autres produits" | "-220 271" | "-211 709"
        → Résultat:
          Row N  : "§ REVENUS NETS DES PLACEMENTS" | "" | ""    (section header)
          Row N+1: "Autres produits"               | "-220 271" | "-211 709"
    
    Détection: col 0 commence par 3+ mots ALL-CAPS suivi d'un texte en casse normale,
    ET les autres colonnes ont des données.
    """
    if df.empty or len(df.columns) < 2:
        return df
    
    first_col = df.columns[0]
    
    # Pattern: 3+ mots MAJUSCULES au début, suivis de texte en casse normale
    section_data_pattern = re.compile(
        r'^((?:[A-ZÀ-Ÿ]{2,}[\s\-\']*){3,}?)'   # 3+ mots MAJUSCULES (le header)
        r'\s+'
        r'([A-ZÀ-Ÿa-zà-ÿ].{2,})$'               # Texte normal (les données)
    )
    
    new_rows = []
    split_count = 0
    
    for idx, row in df.iterrows():
        cells = [str(c).strip() for c in row]
        first_cell = cells[0]
        has_data = any(c != "" for c in cells[1:])  # Autres colonnes non-vides
        
        if has_data and len(first_cell) > 20:
            m = section_data_pattern.match(first_cell)
            if m:
                header_part = m.group(1).strip()
                data_part = m.group(2).strip()
                
                # Vérifier que le header est bien ALL-CAPS (pas juste le début d'un nom)
                # et que la partie données ne l'est pas
                if header_part.upper() == header_part and not data_part.isupper():
                    empty_rest = [""] * (len(df.columns) - 1)
                    new_rows.append(["§ " + header_part] + empty_rest)
                    new_rows.append([data_part] + cells[1:])
                    split_count += 1
                    continue
        
        new_rows.append(list(row))
    
    if split_count > 0:
        result = pd.DataFrame(new_rows, columns=df.columns)
        print(f"[TABLE CLEAN] {split_count} en-tête(s) de section séparé(s) des données")
        return result
    
    return df


# ═══════════════════════════════════════════════════════════════════════
# Post-Azure cleaning — nettoyage du DataFrame AVANT conversion en pipe
# ═══════════════════════════════════════════════════════════════════════

def clean_empty_rows(df: pd.DataFrame) -> pd.DataFrame:
    """
    Supprime les lignes où TOUTES les cellules sont vides / whitespace.
    Exemple:  ` |  |  `
    """
    if df.empty:
        return df

    def row_is_empty(row):
        return all(
            pd.isna(cell) or str(cell).strip() == ""
            for cell in row
        )

    mask = ~df.apply(row_is_empty, axis=1)
    return df[mask].reset_index(drop=True)


def clean_duplicate_paragraph_rows(df: pd.DataFrame, min_len: int = 40) -> pd.DataFrame:
    """
    Supprime les lignes où les colonnes contiennent le même texte long (ou quasi-identique)
    (paragraphe descriptif dupliqué par Azure sur toutes les colonnes).

    Exemples à supprimer:
        Le solde de ce poste ... | Le solde de ce poste ... | Le solde de ce poste ...
        Cette rubrique s'élève ... : Désignation | Cette rubrique s'élève ... : 31.12.2022 | 31.12.2021
    
    Détection par préfixe commun long: si toutes les cellules partagent un préfixe > min_len chars.
    """
    if df.empty or len(df.columns) < 2:
        return df

    def is_dup_paragraph(row):
        values = [str(c).strip() for c in row if pd.notna(c) and str(c).strip()]
        if len(values) < 2:
            return False
        first = values[0]
        if len(first) < min_len:
            return False
        # Exact match
        if all(v == first for v in values):
            return True
        
        long_values = [v for v in values if len(v) >= min_len]
        if len(long_values) < 2:
            return False
        prefix_len = 0
        min_val_len = min(len(v) for v in long_values)
        for i in range(min_val_len):
            if all(v[i] == long_values[0][i] for v in long_values):
                prefix_len = i + 1
            else:
                break
        if prefix_len >= min_len:
            return True
        return False

    mask = ~df.apply(is_dup_paragraph, axis=1)
    return df[mask].reset_index(drop=True)


def clean_section_header_rows(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforme les lignes "section header" en lignes plus propres.
    
    Pattern détecté :
        PA1 : Opérateurs créditeurs |  | 
        PA2 : Autres créditeurs divers |  |
    
    → On les GARDE (info utile) mais on consolide le texte dans la 1re colonne
      et on vide les autres pour qu'elles ne polluent pas les données.
    """
    if df.empty or len(df.columns) < 2:
        return df

    # Pattern: 1re cellule contient du texte non-numérique, toutes les autres vides
    section_pattern = re.compile(
        r"^[A-Z]{1,5}\d{0,3}\s*[:：]\s*",  # PA1 :, CH2 :, etc.
        re.IGNORECASE,
    )

    def is_section_header(row):
        cells = [str(c).strip() for c in row]
        first = cells[0]
        if not first:
            return False
        rest_empty = all(c == "" or pd.isna(c) for c in cells[1:])
        return rest_empty and section_pattern.match(first)

    # On ne supprime PAS les section headers — on les laisse pour le contexte
    # Mais on marque le texte pour le rendre distinct
    result = df.copy()
    for idx, row in result.iterrows():
        if is_section_header(row):
            first_col = result.columns[0]
            result.at[idx, first_col] = "§ " + str(row.iloc[0]).strip()
    return result


def clean_duplicate_subheaders(df: pd.DataFrame) -> pd.DataFrame:
    """
    Supprime les sous-headers dupliqués qui réapparaissent au milieu d'un tableau.
    
    Exemple :
        Header (row 0 implicite dans DataFrame) : Désignation | 31.12.2022 | 31.12.2021
        ...
        row N : Désignation | 31.12.2022 | 31.12.2021   ← doublon à supprimer
    
    Critère: si une ligne de données est identique aux noms des colonnes.
    """
    if df.empty or len(df) < 2:
        return df

    header_values = [str(c).strip().lower() for c in df.columns]

    def matches_header(row):
        row_values = [str(c).strip().lower() for c in row]
        return row_values == header_values

    mask = ~df.apply(matches_header, axis=1)
    return df[mask].reset_index(drop=True)


def fix_known_header_in_col0(df: pd.DataFrame) -> pd.DataFrame:
    """
    Corrige le cas où la colonne 0 contient un header connu fusionné avec la
    première valeur de données.
    
    Symptôme (fréquent pour les tables portefeuille):
        Col 0 header = "Désignation des Titres AERO TUNISIA"
        → devrait être header = "Désignation des Titres", row 0 = "AERO TUNISIA"
    
    Fonctionne sur le header (nom de colonne) ET sur les cellules de données.
    """
    if df is None or df.empty or len(df.columns) < 2:
        return df
    
    KNOWN_COL0_HEADERS = [
        "Désignation des Titres",
        "Désignation des titres",
        "désignation des titres",
        "Désignation",
        "Libellé",
        "Nature des charges",
        "Nature des produits",
        "Nature",
    ]
    
    col0_name = str(df.columns[0]).strip()
    
    # Si le header col 0 est déjà un des headers connus → ne rien faire
    col0_lower = col0_name.lower()
    if any(col0_lower == h.lower() for h in KNOWN_COL0_HEADERS):
        return df
    
    # Cas 1: Le nom de la colonne 0 contient un header connu + data
    for known_hdr in KNOWN_COL0_HEADERS:
        if col0_name.lower().startswith(known_hdr.lower()) and len(col0_name) > len(known_hdr) + 1:
            remainder = col0_name[len(known_hdr):].strip()
            if remainder and not remainder[0].isdigit():
                # Le remainder est un label de données (ex: "AERO TUNISIA")
                new_cols = list(df.columns)
                new_cols[0] = known_hdr
                df = df.copy()
                df.columns = new_cols
                
                # Vérifier si row 0 col 0 est vide ou contient le texte complet → remplacer
                first_val = str(df.iloc[0][known_hdr]).strip() if len(df) > 0 else ""
                if first_val == "" or first_val == col0_name:
                    df.at[df.index[0], known_hdr] = remainder
                else:
                    # Row 0 a déjà une valeur différente → INSÉRER une nouvelle ligne
                    empty_row = {c: "" for c in df.columns}
                    empty_row[known_hdr] = remainder
                    new_row_df = pd.DataFrame([empty_row])
                    df = pd.concat([new_row_df, df], ignore_index=True)
                
                print(f"[TABLE CLEAN] Col 0 header fixé: '{col0_name}' → header '{known_hdr}', data '{remainder}'")
                return df
    
    # Cas 2: Header col 0 est vide/"" mais la 1ère cellule contient un header connu + data
    if (col0_name == "" or col0_name.lower() in ("", "nan")) and len(df) > 0:
        first_val = str(df.iloc[0][df.columns[0]]).strip()
        for known_hdr in KNOWN_COL0_HEADERS:
            if first_val.lower().startswith(known_hdr.lower()) and len(first_val) > len(known_hdr) + 1:
                remainder = first_val[len(known_hdr):].strip()
                if remainder and not remainder[0].isdigit():
                    df = df.copy()
                    new_cols = list(df.columns)
                    new_cols[0] = known_hdr
                    df.columns = new_cols
                    df.at[df.index[0], known_hdr] = remainder
                    print(f"[TABLE CLEAN] Col 0 data séparée: '{first_val}' → header '{known_hdr}', data '{remainder}'")
                    return df
    
    return df


def clean_merged_header_data_row(df: pd.DataFrame) -> pd.DataFrame:
    """
    Détecte et corrige le cas où Azure/Java a fusionné le header avec la 1ère ligne de données.
    
    Symptôme: les noms de colonnes contiennent des valeurs numériques à la fin.
    Exemple:
        Colonnes: ["Revenus du portefeuille titres", "Note PR1",
                   "Du 01.01.2022 Au 31.12.2022 66 556", "Du 01.01.2021 Au 31.12.2021 74 400"]
    
    Résultat attendu:
        Colonnes: ["Désignation", "Note", "Du 01.01.2022 Au 31.12.2022", "Du 01.01.2021 Au 31.12.2021"]
        Row 0:    ["Revenus du portefeuille titres", "PR1", "66 556", "74 400"]
    
    Logique:
    1. Colonnes avec nombre final → séparer (header texte, data nombre)
    2. Si fusion détectée ET la 1ère colonne ne semble pas être un header générique
       → reconstituer un header propre + ligne de données complète
    """
    if df.empty:
        return df
    
    cols = list(df.columns)
    num_cols = len(cols)
    if num_cols < 2:
        return df
    
    # ─── Phase 1: détecter les colonnes avec trailing numbers ───
    trailing_number_pattern = re.compile(
        r'^(.+?)\s+(-?\d[\d\s]*\d)\s*$'  # "text 123 456" → ("text", "123 456")
    )
    trailing_decimal_pattern = re.compile(
        r'^(.+?)\s+(-?\d+[.,]\d+%?)\s*$'  # "text 10.63%" → ("text", "10.63%")
    )
    trailing_pct_pattern = re.compile(
        r'^(.+?)\s+(-?\d+%)\s*$'  # "text 10%" → ("text", "10%")
    )
    
    splits = []
    cols_with_trailing_num = 0
    for col in cols:
        col_str = str(col).strip()
        m = (trailing_number_pattern.match(col_str) or
             trailing_decimal_pattern.match(col_str) or
             trailing_pct_pattern.match(col_str))
        if m:
            text_part = m.group(1).strip()
            # IMPORTANT: si la partie "texte" est purement numérique (ex: "16" dans "16 030 000"),
            # c'est que toute la valeur est un nombre, pas text+nombre → ne pas splitter
            if re.match(r'^[\d\s.,%-]+$', text_part):
                splits.append((col_str, None))  # garder tel quel
            else:
                splits.append((text_part, m.group(2).strip()))
                cols_with_trailing_num += 1
        else:
            splits.append((col_str, None))
    
    # Au moins la moitié des colonnes (hors la 1ère) doivent avoir un trailing number
    non_first_with_num = sum(1 for i, (_, val) in enumerate(splits) if i > 0 and val is not None)
    if non_first_with_num < (num_cols - 1) * 0.5:
        return df  # Pas un header fusionné
    
    # ─── Phase 2: reconstruire header + ligne de données ───
    # Mots-clé qui signalent une vraie colonne "Note/Ref" (ex: "Note PR1")
    NOTE_LIKE_HEADERS = {'note', 'ref', 'réf', 'référence', 'reference', 'n°'}
    
    new_header = []
    new_first_row = []
    
    for i, (header_part, data_part) in enumerate(splits):
        if data_part is not None:
            # Trailing number trouvé → séparer
            new_header.append(header_part)
            new_first_row.append(data_part)
        else:
            # Pas de trailing number → garder tel quel, sans inventer de nom
            val = header_part.strip()
            val_words = val.split()
            
            if i > 0 and len(val_words) >= 2 and val_words[0].lower() in NOTE_LIKE_HEADERS:
                # Colonnes "Note PR1" → header "Note", data "PR1"
                new_header.append(val_words[0])
                new_first_row.append(" ".join(val_words[1:]))
            else:
                # Garder le texte original comme header, pas de data à extraire
                new_header.append(val)
                new_first_row.append("")
    
    # ─── Phase 3: reconstruire le DataFrame ───
    new_df = df.copy()
    new_df.columns = new_header
    
    # Insérer la ligne de données extraite comme première ligne
    first_row_df = pd.DataFrame([new_first_row], columns=new_header)
    new_df = pd.concat([first_row_df, new_df], ignore_index=True)
    
    # ─── Phase 4: supprimer la ligne artefact (ancienne row 0 du DF original) ───
    # Après insertion, row 0 = données reconstituées, row 1 = ancienne row 0.
    # Si row 1 a ses premières colonnes vides et ses colonnes numériques identiques
    # à row 0, c'est un doublon → supprimer.
    if len(new_df) >= 2:
        row0 = new_df.iloc[0]
        row1 = new_df.iloc[1]
        # Compter combien de cellules de row1 sont vides ou identiques à row0
        matches = 0
        for c in new_header:
            v0 = str(row0[c]).strip()
            v1 = str(row1[c]).strip()
            if v1 == "" or v1 == v0:
                matches += 1
        # Si toutes les cellules matchent → row1 est un artefact
        if matches == len(new_header):
            new_df = new_df.drop(index=1).reset_index(drop=True)
            print(f"[TABLE CLEAN] Ligne artefact supprimée (doublon de la 1ère ligne reconstituée)")
    
    # ─── Phase 5: détecter si col 0 du header est un label de données aspiré ───
    # Symptôme: col 0 header = texte long, et la row insérée (row 0) a col 0 vide,
    # ET l'ancienne row 0 du DF original (maintenant row 1) avait aussi col 0 vide.
    # Dans ce cas, le texte du header col 0 est en fait la valeur de la 1ère ligne.
    first_col = new_header[0]
    first_col_val = str(new_df.iloc[0][first_col]).strip()
    if first_col_val == "" and len(first_col) > 5:
        # Le header col 0 est probablement un label de données → le descendre
        new_df.at[new_df.index[0], first_col] = first_col
        # Renommer la colonne avec un nom neutre vide (sera juste la colonne label)
        new_header[0] = ""
        new_df.columns = new_header
        print(f"[TABLE CLEAN] Label col 0 descendu du header vers row 0: '{first_col}'")
    
    print(f"[TABLE CLEAN] Header fusionné détecté et corrigé: {cols} → {list(new_df.columns)}")
    return new_df


def clean_table_post_azure(df: pd.DataFrame, underline_chars: Set[str] = None) -> pd.DataFrame:
    """
    Pipeline complet de nettoyage post-Azure.
    Applique tous les filtres dans l'ordre optimal :

    1. Supprimer les lignes vides
    2. Supprimer les paragraphes dupliqués sur toutes les colonnes
    3. Nettoyer les sous-headers dupliqués
    4. Nettoyer les underlines (lignes/colonnes de soulignement)
    5. Marquer les lignes de section
    
    Args:
        df: DataFrame brut extrait par Azure via le service Java
        underline_chars: Set de chars underline (None = default)
        
    Returns:
        DataFrame nettoyé
    """
    if df is None or df.empty:
        return df

    original_shape = df.shape
    _log_step = lambda name, d: print(f"  [{name}] {d.shape[0]}r x {d.shape[1]}c") if d is not None and not d.empty else print(f"  [{name}] VIDE!")

    # 0. Header fusionné avec première ligne de données (Java mergeMultilineRows trop agressif)
    df = clean_merged_header_data_row(df)
    _log_step("merged_header", df)

    # 0a. Séparer header connu fusionné avec data en col 0 (ex: "Désignation des Titres AERO TUNISIA")
    df = fix_known_header_in_col0(df)
    _log_step("fix_col0", df)

    # 0b. Scinder les cellules col 0 qui contiennent 2 labels fusionnés
    df = split_concatenated_label_cells(df)
    _log_step("split_concat", df)

    # 0c. Fusionner les lignes de continuation (labels découpés sur 2+ lignes par Azure)
    df = merge_continuation_rows(df)
    _log_step("merge_cont", df)

    # 0d. Séparer les en-têtes de section ALL-CAPS fusionnés avec des données
    df = split_section_header_from_data(df)
    _log_step("split_section", df)

    # 0e. Séparer les labels de section fusionnés avec des sous-labels répétés
    #     (ex: "Capital au 31 décembre 2021 Montant en Nominal" | "16 030 000")
    df = split_repeated_sublabels(df)
    _log_step("split_sublabel", df)

    # 1. Lignes vides
    df = clean_empty_rows(df)
    _log_step("empty_rows", df)

    # 2. Paragraphes dupliqués (même texte long dans toutes les colonnes)
    df = clean_duplicate_paragraph_rows(df)
    _log_step("dup_paragraphs", df)

    # 3. Sous-headers dupliqués
    df = clean_duplicate_subheaders(df)
    _log_step("dup_subheaders", df)

    # 4. Underlines (lignes, colonnes, cellules individuelles)
    before_underline = df.shape
    df = clean_table_with_underlines(df, underline_chars)
    _log_step("underlines", df)
    if df.empty:
        print(f"  [WARNING] Table vidée par clean_table_with_underlines! Avant: {before_underline}")
        return df

    # 5. Section headers (marquer, pas supprimer)
    df = clean_section_header_rows(df)
    _log_step("section_headers", df)

    # 6. Dernière passe : supprimer les lignes/colonnes ENTIÈREMENT vides
    before_final = df.shape
    df = df.replace("", pd.NA).dropna(how="all").dropna(axis=1, how="all")
    df = df.fillna("").reset_index(drop=True)
    if df.shape != before_final:
        print(f"  [final dropna] {before_final} → {df.shape}")

    if df.shape != original_shape:
        removed_rows = original_shape[0] - df.shape[0]
        removed_cols = original_shape[1] - df.shape[1]
        parts = []
        if removed_rows > 0:
            parts.append(f"{removed_rows} lignes")
        if removed_cols > 0:
            parts.append(f"{removed_cols} colonnes")
        if parts:
            print(f"[TABLE CLEAN] Supprimé {', '.join(parts)} ({original_shape} → {df.shape})")

    return df