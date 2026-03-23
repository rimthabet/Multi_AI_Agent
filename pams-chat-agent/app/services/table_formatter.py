import re
from typing import List, Tuple, Optional
from app.services.text_clean import is_noisy_line, clean_corrupted_text



ACCOUNTING_CODE_RE = re.compile(r'^(AC|BC|BP|ER|CHV|PR|PA|CP)\s*\d+', re.IGNORECASE)
SUBCATEGORY_RE = re.compile(r'^[a-z]\s*[-–—]', re.IGNORECASE)
SECTION_RE = re.compile(r'^[A-Z][A-Z\s]{5,}$')



def is_table_content(text: str) -> bool:
    """
    Détecte si un texte contient probablement un tableau
    """
    if not text or len(text) < 20:
        return False
    
    # Critères de détection
    lines = text.split('\n')
    
    # 1. Lignes multiples avec beaucoup de nombres
    number_lines = sum(1 for line in lines if has_many_numbers(line))
    
    # 2. Présence de séparateurs (|, plusieurs espaces)
    separator_lines = sum(1 for line in lines if '|' in line or has_multiple_spaces(line))
    
    # 3. Lignes alignées (même nombre d'éléments)
    has_alignment = check_alignment(lines)
    
    # Un tableau doit avoir au moins 3 lignes avec des nombres
    # ET soit des séparateurs, soit de l'alignement
    return number_lines >= 3 and (separator_lines >= 2 or has_alignment)


def has_many_numbers(line: str) -> bool:
    """Vérifie si une ligne contient beaucoup de nombres"""
    # Extraire tous les nombres
    numbers = re.findall(r'-?\d+[\s,.]?\d*', line)
    return len(numbers) >= 2


def has_multiple_spaces(line: str) -> bool:
    """Vérifie si une ligne a des espacements multiples (alignement)"""
    return '  ' in line or '\t' in line


def check_alignment(lines: List[str]) -> bool:
    """Vérifie si les lignes semblent alignées (même structure)"""
    if len(lines) < 3:
        return False
    
    # Compter le nombre de "blocs" séparés par espaces dans chaque ligne
    block_counts = []
    for line in lines:
        if not line.strip():
            continue
        # Compter les groupes de caractères non-espaces
        blocks = [b for b in line.split() if b.strip()]
        if blocks:
            block_counts.append(len(blocks))
    
    if not block_counts or len(block_counts) < 3:
        return False
    
    # Vérifier si la majorité des lignes ont le même nombre de blocs
    from collections import Counter
    most_common_count = Counter(block_counts).most_common(1)[0][1]
    return most_common_count >= len(block_counts) * 0.6


def clean_and_format_table(text: str) -> str:
    """
    Nettoie et formate un texte de tableau pour une meilleure lisibilité
    
    Transforme:
    "Placements monétaires 1000000 -4012 802"
    
    En:
    "Placements monétaires
      1 000 000
      -4 012
      802"
    """
    if not text:
        return ""
    
    lines = text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Nettoyer les caractères corrompus
        line = clean_corrupted_chars(line)
        
        # Détecter si c'est une ligne de données (label + nombres)
        # ou une ligne de header
        if has_many_numbers(line):
            # Ligne avec des nombres - formater
            formatted = format_table_line(line)
            formatted_lines.append(formatted)
        else:
            # Ligne de header ou label - garder tel quel
            if line and not is_mostly_garbage(line):
                formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)


def clean_corrupted_chars(text: str) -> str:
    """Supprime les caractères corrompus"""
    corrupted = 'ŒËÊÛÈÏÎÔÙÆ@—'
    for char in corrupted:
        text = text.replace(char, '')
    
    # Supprimer les underscores, dots, dashes multiples
    text = re.sub(r'_{3,}', ' ', text)
    text = re.sub(r'\.{3,}', ' ', text)
    text = re.sub(r'-{3,}', ' ', text)
    
    return text


def is_mostly_garbage(line: str) -> bool:
    """Vérifie si une ligne est principalement du bruit"""
    if not line:
        return True
    
    # Compter les caractères alphanumériques valides
    valid_chars = sum(1 for c in line if c.isalnum() or c in ' :.-,()')
    total = len(line)
    
    return (valid_chars / total) < 0.5 if total > 0 else True


def format_table_line(line: str) -> str:
    """
    Formate une ligne de tableau avec label et nombres
    
    Exemple:
    "Placements monétaires 1000000 -4012 802"
    ->
    "Placements monétaires:
      1 000 000
      -4 012  
      802"
    """
    # Extraire le label (première partie, texte)
    # et les valeurs (nombres)
    parts = line.split()
    
    label_parts = []
    number_parts = []
    
    for part in parts:
        # Vérifier si c'est un nombre
        cleaned_part = part.replace(',', '').replace('.', '').replace('-', '')
        if cleaned_part.isdigit():
            number_parts.append(format_number(part))
        else:
            if not number_parts:  
                label_parts.append(part)
            else:
                if len(part) > 2:
                    label_parts.append(part)
    
    
    if label_parts and number_parts:
        label = ' '.join(label_parts)
        if len(label) < 40:
            numbers_str = '  '.join(number_parts)
            return f"{label.ljust(40)}: {numbers_str}"
        else:
            result = [label + ":"]
            for num in number_parts:
                result.append(f"  {num}")
            return '\n'.join(result)
    elif number_parts:
        return '  '.join(number_parts)
    else:
        # Seulement du texte
        return ' '.join(label_parts)


def format_number(num_str: str) -> str:
    """
    Formate un nombre avec espaces pour lisibilité
    
    "1000000" -> "1 000 000"
    "-4012" -> "-4 012"
    """
    if not num_str:
        return num_str
    
    # Gérer le signe
    sign = ''
    if num_str.startswith('-'):
        sign = '-'
        num_str = num_str[1:]
    elif num_str.startswith('+'):
        sign = '+'
        num_str = num_str[1:]
    
    # Nettoyer
    num_str = num_str.replace(' ', '').replace(',', '')
    
    # Séparer partie entière et décimale
    if '.' in num_str:
        parts = num_str.split('.')
        integer_part = parts[0]
        decimal_part = parts[1] if len(parts) > 1 else ''
        
        formatted_int = format_integer_with_spaces(integer_part)
        if decimal_part:
            return f"{sign}{formatted_int}.{decimal_part}"
        else:
            return f"{sign}{formatted_int}"
    else:
        formatted_int = format_integer_with_spaces(num_str)
        return f"{sign}{formatted_int}"


def format_integer_with_spaces(num_str: str) -> str:
    """Formate un entier avec espaces tous les 3 chiffres"""
    if not num_str or not num_str.isdigit():
        return num_str
    
    # Inverser, grouper par 3, réinverser
    reversed_num = num_str[::-1]
    groups = [reversed_num[i:i+3] for i in range(0, len(reversed_num), 3)]
    return ' '.join(group[::-1] for group in reversed(groups))


def format_all_numbers_in_text(text: str) -> str:
    """
    Formate tous les nombres de 4 chiffres ou plus dans le texte avec espaces
    Exemples: 1000000 -> 1 000 000, -4012 -> -4 012
    """
    def replace_number(match):
        num_str = match.group(0)
        # Ne formater que si >= 4 chiffres
        digits_only = num_str.replace('-', '').replace('+', '')
        if len(digits_only) >= 4:
            return format_number(num_str)
        return num_str
    
    # Pattern pour capturer les nombres (avec signe optionnel)
    # Ne pas matcher les nombres déjà formatés (avec espaces)
    pattern = r'(?<!\d\s)([+-]?\d{4,})(?!\s\d)'
    return re.sub(pattern, replace_number, text)


def split_text_and_tables(text: str, min_table_lines: int = 3) -> List[Tuple[str, str]]:
    """
    Sépare le texte en blocs de texte normal et blocs de tableaux
    
    Retourne: List[(type, content)] où type est 'text' ou 'table'
    """
    blocks = []
    lines = text.split('\n')
    
    current_block = []
    current_type = 'text'
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Déterminer si cette ligne fait partie d'un tableau
        # En regardant cette ligne et les suivantes
        window = '\n'.join(lines[i:i+5])  # Fenêtre de 5 lignes
        
        if is_table_content(window):
            # Début ou continuation d'un tableau
            if current_type == 'text' and current_block:
                # Sauvegarder le bloc de texte précédent
                blocks.append(('text', '\n'.join(current_block)))
                current_block = []
            
            current_type = 'table'
            current_block.append(line)
        else:
            # Texte normal
            if current_type == 'table' and current_block:
                # Sauvegarder le bloc de tableau précédent
                if len(current_block) >= min_table_lines:
                    blocks.append(('table', '\n'.join(current_block)))
                else:
                    # Trop court pour être un tableau, traiter comme texte
                    blocks.append(('text', '\n'.join(current_block)))
                current_block = []
            
            current_type = 'text'
            current_block.append(line)
        
        i += 1
    
    # Sauvegarder le dernier bloc
    if current_block:
        if current_type == 'table' and len(current_block) >= min_table_lines:
            blocks.append(('table', '\n'.join(current_block)))
        else:
            blocks.append(('text', '\n'.join(current_block)))
    
    return blocks


def process_text_with_tables(text: str) -> str:
    """
    Traite un texte en améliorant le formatage des tableaux
    
    Pipeline:
    1. Nettoyer le bruit avec clean_corrupted_text() (utilise is_noisy_line())
    2. Séparer texte et tableaux
    3. Formater les tableaux ET les nombres dans le texte normal
    4. Recombiner
    """
    # Appliquer d'abord le nettoyage avancé (supprime les lignes très bruitées)
    text = clean_corrupted_text(text)
    
    if not text or len(text.strip()) < 10:
        return ""
    
    # Formater tous les nombres avec espaces (pas seulement dans les tableaux)
    text = format_all_numbers_in_text(text)
    
    blocks = split_text_and_tables(text)
    
    processed_blocks = []
    for block_type, content in blocks:
        if block_type == 'table':
            # Formater le tableau
            formatted = clean_and_format_table(content)
            if formatted:
                processed_blocks.append(formatted)
        else:
            # Texte déjà nettoyé et nombres formatés
            if content.strip():
                processed_blocks.append(content)
    
    return '\n\n'.join(processed_blocks)


def table_to_pipe_text(df) -> str:
    """
    Convertit un DataFrame pandas en texte formaté avec pipes (|).
    Format: headers sur la première ligne, puis chaque row sur une ligne.
    
    Exemple:
        31/12/2014 | 31/12/2013
        VARIATION DE L'ACTIF NET | 141 003 | 104 639
        a - Résultat d'exploitation | 123 863 | 80 177
    
    Args:
        df: DataFrame pandas
        
    Returns:
        Texte formaté avec pipes
    """
    if df is None:
        return ""
    
    try:
        if df.empty:
            return ""
    except:
        pass
    
    lines = []
    
    # Headers (colonnes)
    try:
        headers = [str(col).strip() for col in df.columns]
        lines.append(" | ".join(headers))
    except:
        pass
    
    # Rows (données)
    try:
        for idx, row in df.iterrows():
            try:
                # Vérifier si pd.notna est disponible
                import pandas as pd
                values = [str(val).strip() if pd.notna(val) else "" for val in row]
            except:
                # Fallback simple
                values = [str(val).strip() for val in row]
            lines.append(" | ".join(values))
    except:
        pass
    
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Accounting hierarchy annotation
# ---------------------------------------------------------------------------

_ACCT_CODE_RE = re.compile(r'^([A-Z]{1,4})\s*(\d+)', re.IGNORECASE)


def _parse_acct_code(cell: str) -> tuple | None:
    """
    Extrait (prefix_letters, digits) depuis la première cellule d'une ligne.
    'AC 1-Actifs incorporels' → ('AC', '1')
    'AC12-Concessions'        → ('AC', '12')
    'AC311-Terrains'          → ('AC', '311')
    Retourne None si pas de code comptable.
    """
    m = _ACCT_CODE_RE.match(cell.strip())
    if not m:
        return None
    return m.group(1).upper(), m.group(2)


def _is_section_header(parts: list) -> bool:
    """True si toutes les cellules de valeurs (index 1+) sont vides — c'est une catégorie."""
    EMPTY = {'', '.', '-', 'nan', 'none', 'null'}
    return all(v.strip().lower() in EMPTY for v in parts[1:])


def has_accounting_codes(text: str) -> bool:
    for line in text.split("\n"):
        if ACCOUNTING_CODE_RE.match(line.strip()):
            return True
    return False


def annotate_accounting_table(pipe_text: str) -> str:
    """
    Enrichit un tableau financier pipe-separated en préfixant chaque ligne
    de données avec le chemin hiérarchique de ses catégories parentes.

    AVANT:
        AC12-Concessions, brevets | 3 378 541 | 2 673 446 | 705 095
        AC311-Terrains d'exploitation | 44 964 832 | ...

    APRÈS:
        [Actifs incorporels] AC12-Concessions, brevets | 3 378 541 | 2 673 446 | 705 095
        [Placements > Terrains et constructions] AC311-Terrains d'exploitation | 44 964 832 | ...

    Règles:
    - La profondeur hiérarchique = nombre de chiffres dans le code  (AC1→1, AC12→2, AC311→3)
    - Les lignes où toutes les valeurs sont vides = catégorie → mettent à jour le breadcrumb
    - Les lignes avec valeurs = données → préfixées par [parent > parent2 > ...]
    - La première ligne (en-têtes colonnes) n'est jamais modifiée
    - Aucun nom de section hardcodé : tout est dérivé du code et du label de la ligne
    """
    lines = pipe_text.strip().split('\n')
    if not lines:
        return pipe_text

    # breadcrumb: depth (int) → label complet de la cellule
    breadcrumb: dict[int, str] = {}
    result = [lines[0]]  # en-têtes colonnes, ignorées

    for line in lines[1:]:
        if not line.strip():
            result.append(line)
            continue

        parts = [p.strip() for p in line.split('|')]
        first_cell = parts[0]

        code_info = _parse_acct_code(first_cell)

        if code_info:
            _, digits = code_info
            depth = len(digits)  # AC1→1, AC12→2, AC311→3

            if _is_section_header(parts):
                breadcrumb[depth] = first_cell
                for d in [k for k in list(breadcrumb) if k > depth]:
                    del breadcrumb[d]
                result.append(line)
            else:
                ancestors = [
                    breadcrumb[d]
                    for d in sorted(breadcrumb)
                    if d < depth
                ]
                if ancestors:
                    labels = [
                        a.split('-', 1)[1].strip() if '-' in a else a
                        for a in ancestors
                    ]
                    prefix = ' > '.join(labels)
                    result.append(f'[{prefix}] {line}')
                else:
                    result.append(line)
        else:
            # Ligne sans code (totaux) : annote avec la section courante si des valeurs présentes
            has_values = any(re.search(r'\d', p) for p in parts[1:])
            if breadcrumb and has_values:
                deepest_label = breadcrumb[max(breadcrumb)]
                section = deepest_label.split('-', 1)[1].strip() if '-' in deepest_label else deepest_label
                result.append(f'[{section} - sous-total] {line}')
            else:
                result.append(line)

    return '\n'.join(result)
