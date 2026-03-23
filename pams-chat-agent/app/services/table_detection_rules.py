from dataclasses import dataclass, field
from typing import List, Tuple, Literal


@dataclass
class TableDetectionRules:
    """Règles pour détecter les zones de tableaux dans les images"""
    
    # =====================================================================
    # 1. DÉTECTION PAR LIGNES HORIZONTALES
    # =====================================================================
    detect_horizontal_lines: bool = True
    """Activer la détection par lignes horizontales"""
    
    horizontal_kernel_width_ratio: float = 0.15
    """Largeur du kernel morphologique (ratio de la largeur page)
    Valeur typique : 0.10 à 0.20 (ex: 60px à 200px selon DPI)"""
    
    min_horizontal_line_length_ratio: float = 0.55
    """Longueur minimale d'une ligne horizontale (ratio de la largeur page)
    Une ligne horizontale doit faire au moins 55% de la largeur"""
    
    min_horizontal_lines_in_block: int = 2
    """Nombre minimal de lignes horizontales pour déclarer un bloc tableau"""
    
    max_line_height_ratio: float = 0.03
    """Épaisseur maximale d'une ligne (ratio de la hauteur page)
    Une ligne doit être fine (< 3% de la hauteur)"""
    
    line_clustering_threshold_ratio: float = 0.08
    """Distance maximale entre lignes pour les grouper (ratio hauteur page)
    Lignes proches verticalement = même bloc tableau"""
    
    # =====================================================================
    # 2. DÉTECTION PAR HEADER MULTI-COLONNES
    # =====================================================================
    detect_by_header_keywords: bool = True
    """Activer la détection par mots-clés de colonnes"""
    
    header_keywords_any: List[str] = field(default_factory=lambda: [
        "Nombre", "Coût", "Valeur", "%", "Plus-value", "unitaire",
        "Quantité", "Prix", "Montant", "Total", "Date", "Référence",
        "Désignation", "Description", "Code", "N°", "Taux", "Pourcentage"
    ])
    """Mots-clés typiques de colonnes de tableau"""
    
    header_keywords_min_match: int = 2
    """Nombre minimal de mots-clés trouvés dans une bande horizontale
    pour déclarer un header de tableau"""
    
    header_band_height_ratio: float = 0.05
    """Hauteur de la bande horizontale pour chercher les headers
    (ratio de la hauteur page)"""
    
    header_min_x_spread_ratio: float = 0.40
    """Écart horizontal minimal entre mots-clés (ratio largeur page)
    Les mots doivent être répartis sur ≥40% de la largeur"""
    
    # =====================================================================
    # 3. DÉTECTION PAR DENSITÉ D'ALIGNEMENTS
    # =====================================================================
    detect_by_density: bool = True
    """Activer la détection par densité de tokens numériques et alignements"""
    
    min_numeric_token_ratio_in_region: float = 0.20
    """Ratio minimal de tokens contenant des chiffres dans la zone
    20% = beaucoup de données numériques → probablement un tableau"""
    
    min_columns_estimate: int = 4
    """Nombre minimal de colonnes estimées (via clustering des positions X)"""
    
    min_rows_estimate: int = 3
    """Nombre minimal de lignes estimées"""
    
    column_detection_tolerance_ratio: float = 0.03
    """Tolérance pour grouper des tokens en colonnes (ratio largeur page)"""
    
    # =====================================================================
    # 4. ACTIONS SUR LES ZONES DÉTECTÉES
    # =====================================================================
    table_region_action: Literal["mask", "skip", "none"] = "mask"
    """Action à effectuer sur les zones tableau détectées:
    - "mask": Blanchir la zone avant OCR (recommandé)
    - "skip": Ne pas faire d'OCR sur cette zone
    - "none": Détecter mais ne rien faire (debug)"""
    
    table_region_margin: Tuple[int, int, int, int] = (20, 25, 20, 40)
    """Marges autour de la zone tableau (left, top, right, bottom) en pixels
    Pour éviter de laisser des résidus de texte aux bords"""
    
    # =====================================================================
    # 5. PARAMÈTRES GÉNÉRAUX
    # =====================================================================
    min_region_area_ratio: float = 0.01
    """Surface minimale d'une région pour être considérée (ratio surface page)
    Ignorer les micro-régions < 1% de la page"""
    
    max_region_area_ratio: float = 0.85
    """Surface maximale d'une région (ratio surface page)
    Éviter de masquer toute la page si détection aberrante"""
    
    combine_overlapping_regions: bool = True
    """Fusionner les régions qui se chevauchent"""
    
    overlap_threshold: float = 0.30
    """Seuil de chevauchement pour fusionner (ratio surface intersection)"""
    
    # =====================================================================
    # 6. DEBUG & VISUALISATION
    # =====================================================================
    debug_mode: bool = False
    """Activer le mode debug (affichage des régions détectées)"""
    
    save_debug_images: bool = False
    """Sauvegarder les images avec régions annotées"""
    
    debug_output_dir: str = "logs/table_detection"
    """Dossier pour les images de debug"""
    
    def to_dict(self) -> dict:
        """Sérialiser en dictionnaire"""
        return {
            "detect_horizontal_lines": self.detect_horizontal_lines,
            "horizontal_kernel_width_ratio": self.horizontal_kernel_width_ratio,
            "min_horizontal_line_length_ratio": self.min_horizontal_line_length_ratio,
            "min_horizontal_lines_in_block": self.min_horizontal_lines_in_block,
            "max_line_height_ratio": self.max_line_height_ratio,
            "line_clustering_threshold_ratio": self.line_clustering_threshold_ratio,
            "detect_by_header_keywords": self.detect_by_header_keywords,
            "header_keywords_any": self.header_keywords_any,
            "header_keywords_min_match": self.header_keywords_min_match,
            "header_band_height_ratio": self.header_band_height_ratio,
            "header_min_x_spread_ratio": self.header_min_x_spread_ratio,
            "detect_by_density": self.detect_by_density,
            "min_numeric_token_ratio_in_region": self.min_numeric_token_ratio_in_region,
            "min_columns_estimate": self.min_columns_estimate,
            "min_rows_estimate": self.min_rows_estimate,
            "column_detection_tolerance_ratio": self.column_detection_tolerance_ratio,
            "table_region_action": self.table_region_action,
            "table_region_margin": self.table_region_margin,
            "min_region_area_ratio": self.min_region_area_ratio,
            "max_region_area_ratio": self.max_region_area_ratio,
            "combine_overlapping_regions": self.combine_overlapping_regions,
            "overlap_threshold": self.overlap_threshold,
            "debug_mode": self.debug_mode,
            "save_debug_images": self.save_debug_images,
            "debug_output_dir": self.debug_output_dir,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "TableDetectionRules":
        """Désérialiser depuis un dictionnaire"""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
    
    def __repr__(self) -> str:
        return (
            f"TableDetectionRules("
            f"lines={self.detect_horizontal_lines}, "
            f"headers={self.detect_by_header_keywords}, "
            f"density={self.detect_by_density}, "
            f"action={self.table_region_action})"
        )


# =====================================================================
# PRESETS
# =====================================================================

def create_strict_detection_rules() -> TableDetectionRules:
    """Règles strictes : détecte seulement les tableaux évidents avec lignes"""
    return TableDetectionRules(
        detect_horizontal_lines=True,
        min_horizontal_lines_in_block=3,  # Au moins 3 lignes
        detect_by_header_keywords=False,
        detect_by_density=False,
        table_region_action="mask"
    )


def create_conservative_detection_rules() -> TableDetectionRules:
    """Règles conservatrices : évite de masquer les titres (recommandé pour qualité OCR)
    
    - Lignes horizontales uniquement (pas de mots-clés ni densité)
    - Minimum 3 lignes espacées
    - Lignes longues (≥65% de la page)
    - Marges réduites pour ne pas masquer le texte autour
    """
    return TableDetectionRules(
        detect_horizontal_lines=True,
        min_horizontal_lines_in_block=3,  # Plus strict : 3 lignes minimum
        min_horizontal_line_length_ratio=0.65,  # Plus strict : lignes ≥65% largeur
        detect_by_header_keywords=False,  # Désactivé : évite faux positifs sur titres
        detect_by_density=False,  # Désactivé : évite faux positifs sur listes
        table_region_action="mask",
        table_region_margin=(10, 15, 10, 20),  # Marges réduites
    )


def create_balanced_detection_rules() -> TableDetectionRules:
    """Règles équilibrées : combine lignes + headers (recommandé)"""
    return TableDetectionRules(
        detect_horizontal_lines=True,
        min_horizontal_lines_in_block=2,
        detect_by_header_keywords=True,
        header_keywords_min_match=2,
        detect_by_density=False,  # Désactivé pour éviter faux positifs
        table_region_action="mask"
    )


def create_aggressive_detection_rules() -> TableDetectionRules:
    """Règles agressives : utilise les 3 méthodes de détection"""
    return TableDetectionRules(
        detect_horizontal_lines=True,
        min_horizontal_lines_in_block=2,
        detect_by_header_keywords=True,
        header_keywords_min_match=2,
        detect_by_density=True,
        min_numeric_token_ratio_in_region=0.20,
        min_columns_estimate=4,
        table_region_action="mask"
    )


def create_debug_rules() -> TableDetectionRules:
    """Règles pour debug : détecte et visualise sans masquer"""
    return TableDetectionRules(
        detect_horizontal_lines=True,
        detect_by_header_keywords=True,
        detect_by_density=True,
        table_region_action="none",  # Ne masque pas
        debug_mode=True,
        save_debug_images=True
    )


# Règles par défaut
DEFAULT_DETECTION_RULES = create_balanced_detection_rules()
