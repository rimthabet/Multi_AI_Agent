import re
from typing import List, Tuple

def fix_broken_table_labels(table_text: str) -> str:
    """
    Corrige les libellés coupés dans un tableau pipe-separated.
    
    Détecte les lignes où :
    - La première colonne se termine par une préposition ou mot de liaison
    - La ligne suivante commence par une minuscule ou continue logiquement
    - Les colonnes de valeurs sont vides sur la première ligne
    
    Args:
        table_text: Texte du tableau au format pipe-separated
        
    Returns:
        Texte du tableau avec les libellés fusionnés
    """
    if not table_text:
        return table_text
    
    lines = [ln.strip() for ln in table_text.split('\n') if ln.strip()]
    if len(lines) < 2:
        return table_text
    
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        current_line = lines[i]
        
        # Si c'est la dernière ligne, on l'ajoute directement
        if i == len(lines) - 1:
            fixed_lines.append(current_line)
            break
        
        next_line = lines[i + 1]
        
        # Analyser la ligne courante
        current_parts = [p.strip() for p in current_line.split('|')]
        next_parts = [p.strip() for p in next_line.split('|')]
        
        # Vérifier si on doit fusionner avec la ligne suivante
        should_merge = _should_merge_lines(current_parts, next_parts)
        
        if should_merge:
            # Fusionner les libellés
            merged_label = _merge_labels(current_parts[0], next_parts[0])
            
            # Construire la nouvelle ligne fusionnée
            # Garder les valeurs de la ligne suivante 
            new_parts = [merged_label] + next_parts[1:] if len(next_parts) > 1 else [merged_label]
            merged_line = ' | '.join(new_parts)
            fixed_lines.append(merged_line)
            i += 2  
        else:
            fixed_lines.append(current_line)
            i += 1
    
    return '\n'.join(fixed_lines)

def _should_merge_lines(current_parts: List[str], next_parts: List[str]) -> bool:
    """
    Détermine si deux lignes doivent être fusionnées.
    """
    if not current_parts or not next_parts:
        return False
    
    current_label = current_parts[0].strip()
    next_label = next_parts[0].strip()
    
  
    if len(current_label) < 4:
        other_cells_have_content = any(p.strip() for p in current_parts[1:])
        if other_cells_have_content:
            return False  
        return True
    
   
    liaison_words = ['des', 'de', 'du', 'la', 'le', 'les', 'd', 'l', 'par', 'pour', 'avec', 'sur', 'sous']
    if current_label.lower().split()[-1] in liaison_words:
        return True
    
    
    # Si le libellé courant se termine par une préposition ou un article
    if re.search(r'\b(des|de|du|la|le|les|d|l)\s*$', current_label.lower()):
        return True
    
    # Si les colonnes de valeurs sont vides dans la ligne courante mais pas dans la suivante
    current_has_values = any(
        part.strip() and re.search(r'\d', part) 
        for part in current_parts[1:]
    )
    next_has_values = any(
        part.strip() and re.search(r'\d', part) 
        for part in next_parts[1:]
    )
    
    if not current_has_values and next_has_values:
        # Vérifier aussi que le libellé suivant continue logiquement
        if next_label and (next_label[0].islower() or _is_continuation_word(next_label)):
            if re.match(r'^[a-z]\s*[-–—]\s*', next_label):
                return False  
            return True
    
    # Cas spécifique 
    if (re.search(r'\b(total|revenus|charges|gestion|placements|actifs|passifs)\b', current_label.lower()) and
        next_label and next_label.lower().startswith('des')):
        return True
    
    return False

def _merge_labels(label1: str, label2: str) -> str:
    """
    Fusionne deux libellés en un seul.
    """
    if not label1:
        return label2
    if not label2:
        return label1
    
    # Nettoyer les libellés
    label1 = label1.strip()
    label2 = label2.strip()
    
    # Si le premier se termine par un espace, le garder
    if label1.endswith(' '):
        return label1 + label2
    else:
        return label1 + ' ' + label2

def _is_continuation_word(word: str) -> bool:
    """
    Vérifie si un mot est typiquement une continuation de libellé.
    """
    continuation_words = [
        'des', 'de', 'du', 'la', 'le', 'les', 'd', 'l',
        'placements', 'revenus', 'charges', 'actifs', 'passifs',
        'gestion', 'exploitation', 'financier', 'fonds'
    ]
    return word.lower() in continuation_words

def fix_table_with_context(table_text: str, table_title: str = "") -> str:
    """
    Corrige les libellés coupés en utilisant le contexte du titre du tableau.
    
    Certains libellés sont spécifiques à certains types de tableaux.
    """
    fixed = fix_broken_table_labels(table_text)
    
    # Corrections spécifiques selon le type de tableau
    title_lower = table_title.lower()
    
    if 'revenus' in title_lower or 'placements' in title_lower:
        # Corrections spécifiques pour les tableaux de revenus/placements
        fixed = re.sub(
            r'Total des revenus\s*\n\s*des placements',
            'Total des revenus des placements',
            fixed,
            flags=re.IGNORECASE
        )
        fixed = re.sub(
            r'Charges de gestion\s*\n\s*des placements',
            'Charges de gestion des placements',
            fixed,
            flags=re.IGNORECASE
        )
    
    if 'charges' in title_lower and 'gestion' in title_lower:
        # Corrections pour les tableaux de charges de gestion
        fixed = re.sub(
            r'Charges de gestion\s*\n\s*(des|de|du)',
            r'Charges de gestion \1',
            fixed,
            flags=re.IGNORECASE
        )
    
    return fixed

# Test avec l'exemple fourni
#if __name__ == "__main__":
    #example = """Total des revenus |  |  | 
#des placements |  | 0 | 0
#Charges de gestion |  |  | 
#des placements | CH 1 | (49 213) | (28 357)"""
    
    #print("=== EXEMPLE AVANT CORRECTION ===")
    #print(example)
    #print("\n=== APRÈS CORRECTION ===")
    #print(fix_broken_table_labels(example))
