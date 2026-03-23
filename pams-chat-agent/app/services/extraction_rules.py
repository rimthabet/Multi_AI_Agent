"""
Règles configurables pour l'extraction Azure OCR via le service Java

Objectif:
- Filtrer les faux positifs
- Adapter les seuils selon les styles de tableaux (financiers, contacts, grilles, etc.)
- Permettre une sélection automatique des règles à partir du texte tabulaire (pipe text)

Ces règles sont envoyées au service Java qui les applique lors du parsing
des résultats Azure Form Recognizer / OCR.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import re


# ----------------------------
# Helpers (analyse table text)
# ----------------------------

_NUM_RE = re.compile(r"[-+]?\d[\d\s.,]*%?$")  # "1 234", "-254 982", "5,42%", "0"
_DATE_RE = re.compile(r"\b\d{2}[./-]\d{2}[./-]\d{4}\b|\b\d{4}\b")
_CONTACT_KWS = ("adresse", "tél", "tel", "fax", "site", "www", "email", "e-mail")
_FIN_KWS = ("actifs", "passifs", "résultat", "resultat", "revenus", "charges", "total", "variation")
_PORTFOLIO_KWS = ("plus-value", "plus-values", "potentielles", "valeur", "% actif", "capital", "émetteur", "emetteur")
_RECAP_FONDS_KWS = ("dénomination", "agrement", "agrément", "visa", "cmf", "souscriptions", "pourcentage", "montant")
_GRID_KWS = ("capital", "souscriptions", "rachats", "nombre de part", "nombre de porteurs")


def _split_rows(table_text: str) -> List[List[str]]:
    """
    table_text attendu au format pipe:
      col1 | col2 | col3
      v11  | v12  | v13
    """
    lines = [ln.strip() for ln in (table_text or "").splitlines() if ln.strip()]
    rows: List[List[str]] = []
    for ln in lines:
        # tolère des tables avec pipe entourés d'espaces
        parts = [p.strip() for p in ln.split("|")]
        if len(parts) >= 2:
            rows.append(parts)
    return rows


def _table_stats(table_text: str) -> Dict[str, Any]:
    rows = _split_rows(table_text)
    if not rows:
        return {
            "rows": 0,
            "cols": 0,
            "cells": 0,
            "numeric_cells": 0,
            "empty_cells": 0,
            "numeric_ratio": 0.0,
            "empty_ratio": 0.0,
            "text_lower": "",
        }

    cols = max(len(r) for r in rows)
    # normalisation: pad
    norm = [r + [""] * (cols - len(r)) for r in rows]

    cells = 0
    numeric = 0
    empty = 0

    for r in norm:
        for c in r:
            cells += 1
            v = (c or "").strip()
            if not v:
                empty += 1
                continue
            # normalise numbers like "35 070 000 DT" -> detect numeric token separately is hard
            # but Azure tables often isolate numeric cells; we keep a permissive regex.
            vv = v.replace("\u00a0", " ").strip().lower()
            # allow "dt" suffix or currency next to number
            vv = re.sub(r"\b(dt|tnd|dinar[s]?)\b", "", vv).strip()
            if _NUM_RE.match(vv):
                numeric += 1

    text_lower = (table_text or "").lower()
    numeric_ratio = (numeric / cells) if cells else 0.0
    empty_ratio = (empty / cells) if cells else 0.0

    return {
        "rows": len(rows),
        "cols": cols,
        "cells": cells,
        "numeric_cells": numeric,
        "empty_cells": empty,
        "numeric_ratio": numeric_ratio,
        "empty_ratio": empty_ratio,
        "text_lower": text_lower,
    }


def _contains_any(text_lower: str, kws: Tuple[str, ...]) -> bool:
    return any(k in text_lower for k in kws)


# ----------------------------
# Core rules object
# ----------------------------

@dataclass
class ExtractionRules:
    """
    Dictionnaire de règles pour configurer l'extraction de tableaux Azure OCR.
    Ces règles sont envoyées au service Java qui les applique lors du parsing.
    """

    # ===== FILTRES DE TAILLE =====
    min_rows: int = 3
    min_cols: int = 2

    # ===== FILTRES DE CONTENU =====
    min_numeric_percentage: float = 0.20
    exclude_toc: bool = True
    exclude_single_column: bool = False

    # ===== DÉTECTION TOC =====
    toc_keywords: List[str] = field(default_factory=lambda: [
        "sommaire",
        "table des matières",
        "présentation succinte",
        "table of contents",
        "contents",
    ])
    exclude_patterns: List[str] = field(default_factory=lambda: [
        r"^I\.",
        r"^II\.",
        r"^III\.",
        r"^IV\.",
        r"^V\.",
        r"^\d{1,3}$",  # Numéros de page seuls
    ])

    # ===== OPTIONS DE TRAITEMENT =====
    column_span_handling: str = "duplicate"  # duplicate | merge
    empty_cell_handling: str = "keep"        # keep | remove

    # ===== DÉTECTION SPÉCIFIQUE =====
    require_header: bool = False
    max_empty_percentage: float = 0.5

    # ===== FUSION TEXTE SOULIGNÉ =====
    merge_underlined_text: bool = True
    """Fusionner/supprimer les lignes de texte souligné (séparateurs).
    Détecte les lignes composées principalement de '_', '-', '=', etc.
    et les supprime pour éviter qu'elles soient considérées comme des colonnes/lignes."""
    
    underline_detection_threshold: float = 0.35
    """Seuil de détection : ratio de caractères underline dans une ligne.
    0.35 = 35% de la ligne doit être composée de caractères underline.
    Baissé de 0.5 à 0.35 pour détecter plus de lignes soulignées (Azure ajoute espaces/artefacts)."""
    
    underline_chars: List[str] = field(default_factory=lambda: [
        "_", "-", "=", "―", "─", "—", "–", "-", "¯", "‾", ".", "·"
    ])
    """Caractères considérés comme 'underline' pour la détection.
    Élargi pour couvrir plus de variantes Unicode de tirets/soulignements."""

    # ===== MODE NO-FILTER (bypass filtres Java, filtrage côté Python) =====
    no_filter: bool = False
    """Si True, le service Java ne filtre aucun tableau et les renvoie tous.
    Le filtrage se fait ensuite côté Python (is_table_of_contents, is_likely_real_table, etc.)."""

    # ===== FUSION TABLEAUX MULTI-PAGES =====
    merge_multi_page_tables: bool = True
    """Si True, fusionne les tableaux qui s'étendent sur plusieurs pages.
    Détecte les tableaux consécutifs avec même structure de colonnes."""

    # (Optionnel) tags libres pour debug / routing côté Java
    profile: str = "custom"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "minRows": self.min_rows,
            "minCols": self.min_cols,
            "minNumericPercentage": self.min_numeric_percentage,
            "excludeToc": self.exclude_toc,
            "excludeSingleColumn": self.exclude_single_column,
            "tocKeywords": self.toc_keywords,
            "excludePatterns": self.exclude_patterns,
            "columnSpanHandling": self.column_span_handling,
            "emptyCellHandling": self.empty_cell_handling,
            "requireHeader": self.require_header,
            "maxEmptyPercentage": self.max_empty_percentage,
            "mergeUnderlinedText": self.merge_underlined_text,
            "underlineDetectionThreshold": self.underline_detection_threshold,
            "underlineChars": self.underline_chars,
            "noFilter": self.no_filter,
            "mergeMultiPageTables": self.merge_multi_page_tables,
            "profile": self.profile,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExtractionRules":
        rules = cls()

        rules.min_rows = int(data.get("minRows", rules.min_rows))
        rules.min_cols = int(data.get("minCols", rules.min_cols))
        rules.min_numeric_percentage = float(data.get("minNumericPercentage", rules.min_numeric_percentage))
        rules.exclude_toc = bool(data.get("excludeToc", rules.exclude_toc))
        rules.exclude_single_column = bool(data.get("excludeSingleColumn", rules.exclude_single_column))

        # IMPORTANT: conserver les defaults si clé absente
        rules.toc_keywords = list(data.get("tocKeywords", rules.toc_keywords))
        rules.exclude_patterns = list(data.get("excludePatterns", rules.exclude_patterns))

        rules.column_span_handling = str(data.get("columnSpanHandling", rules.column_span_handling))
        rules.empty_cell_handling = str(data.get("emptyCellHandling", rules.empty_cell_handling))
        rules.require_header = bool(data.get("requireHeader", rules.require_header))
        rules.max_empty_percentage = float(data.get("maxEmptyPercentage", rules.max_empty_percentage))
        
        # Fusion texte souligné
        rules.merge_underlined_text = bool(data.get("mergeUnderlinedText", rules.merge_underlined_text))
        rules.underline_detection_threshold = float(data.get("underlineDetectionThreshold", rules.underline_detection_threshold))
        rules.underline_chars = list(data.get("underlineChars", rules.underline_chars))
        
        # Mode no-filter
        rules.no_filter = bool(data.get("noFilter", rules.no_filter))
        
        # Fusion tableaux multi-pages
        rules.merge_multi_page_tables = bool(data.get("mergeMultiPageTables", rules.merge_multi_page_tables))
        
        rules.profile = str(data.get("profile", rules.profile))
        return rules

    def __repr__(self) -> str:
        return (
            "ExtractionRules("
            f"profile={self.profile!r}, min_rows={self.min_rows}, min_cols={self.min_cols}, "
            f"min_numeric={self.min_numeric_percentage:.0%}, max_empty={self.max_empty_percentage:.0%}, "
            f"exclude_toc={self.exclude_toc}, require_header={self.require_header}, "
            f"merge_underlined={self.merge_underlined_text}, merge_multi_page={self.merge_multi_page_tables})"
        )


# ----------------------------
# Presets (basés sur tes captures)
# ----------------------------

def create_financial_statement_rules() -> ExtractionRules:
    """
    Pour: bilans ACTIFS/PASSIFS, compte de résultat, variation de l'actif net.
    Caractéristiques:
    - 3 colonnes typiques: libellé / note / N / N-1 (souvent 4+ cols avec dates)
    - Beaucoup de chiffres, mais une colonne libellé très textuelle
    - Peu de cellules vides
    """
    r = ExtractionRules(
        min_rows=6,
        min_cols=3,
        min_numeric_percentage=0.30,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=False,
        max_empty_percentage=0.35,
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="financial_statement",
    )
    return r


def create_variation_actif_net_rules() -> ExtractionRules:
    """
    Pour: tableaux type 'VARIATION DE L'ACTIF NET...' (souvent longs, 3-4 cols, beaucoup de 0).
    Caractéristiques:
    - Beaucoup de lignes, parfois des lignes titres/sections (texte) avec valeurs 0
    - Numeric ratio peut baisser à cause des titres et sous-sections
    """
    r = ExtractionRules(
        min_rows=8,
        min_cols=3,
        min_numeric_percentage=0.25,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=False,
        max_empty_percentage=0.45,
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="variation_actif_net",
    )
    return r


def create_portfolio_titles_rules() -> ExtractionRules:
    """
    Pour: tableau 'portefeuille titres' multi-colonnes (Nombre, Coût, Plus-values, Valeur, %, etc.)
    Caractéristiques:
    - 6 à 8 colonnes
    - 1ère colonne texte (désignation), reste plutôt numérique
    """
    r = ExtractionRules(
        min_rows=5,
        min_cols=6,
        min_numeric_percentage=0.30,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=True,          # utile quand header est lisible
        max_empty_percentage=0.45,    # tolère "-" / vides
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="portfolio_titles",
    )
    return r


def create_funds_recap_rules() -> ExtractionRules:
    """
    Pour: 'Tableau récapitulatif des fonds gérés'
    Caractéristiques:
    - 6-7 colonnes, beaucoup de texte (nature, dates), quelques % et montants
    - Numeric ratio assez faible à moyen
    """
    r = ExtractionRules(
        min_rows=3,
        min_cols=6,
        min_numeric_percentage=0.15,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=True,
        max_empty_percentage=0.55,
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="funds_recap",
    )
    return r


def create_contacts_intervenants_rules() -> ExtractionRules:
    """
    Pour: 'Dénomination des intervenants ... et leurs coordonnées'
    Caractéristiques:
    - 2 colonnes
    - Très peu numérique
    - Beaucoup de texte (Adresse, Tél, Fax, Site)
    """
    r = ExtractionRules(
        min_rows=3,
        min_cols=2,
        min_numeric_percentage=0.03,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=False,
        max_empty_percentage=0.65,
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="contacts_intervenants",
    )
    return r


def create_two_date_designation_rules() -> ExtractionRules:
    """
    Pour: tableau 'Désignation | 31.12.N | 31.12.N-1' (placements monétaires, dépôts, banque)
    Caractéristiques:
    - 3 colonnes
    - Peu de lignes (parfois 6-12)
    - Numeric ratio moyen (1ère colonne texte)
    """
    r = ExtractionRules(
        min_rows=4,
        min_cols=3,
        min_numeric_percentage=0.25,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=True,
        max_empty_percentage=0.55,   # souvent des 0, mais peu de vides
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="designation_two_dates",
    )
    return r


def create_grid_capital_souscriptions_rachats_rules() -> ExtractionRules:
    """
    Pour: tableau en grille (capital / souscriptions / rachats) avec beaucoup de cellules vides.
    Caractéristiques:
    - 2 colonnes, parfois 3
    - Beaucoup de lignes
    - Beaucoup de cellules vides (structure 'formulaire')
    """
    r = ExtractionRules(
        min_rows=6,
        min_cols=2,
        min_numeric_percentage=0.10,
        exclude_toc=True,
        exclude_single_column=True,
        require_header=False,
        max_empty_percentage=0.80,  # IMPORTANT: sinon tu rejettes ce style
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="grid_capital_souscriptions_rachats",
    )
    return r


def create_no_filter_rules() -> ExtractionRules:
    """
    Debug: extrait tout ce qu'Azure détecte.
    """
    r = ExtractionRules(
        min_rows=1,
        min_cols=1,
        min_numeric_percentage=0.0,
        exclude_toc=False,
        exclude_single_column=False,
        require_header=False,
        max_empty_percentage=1.0,
        column_span_handling="duplicate",
        empty_cell_handling="keep",
        profile="no_filter",
    )
    return r


# Alias pour compatibilité avec anciens scripts
def create_financial_flexible_rules() -> ExtractionRules:
    """Alias de create_financial_statement_rules() pour compatibilité"""
    return create_financial_statement_rules()


# ----------------------------
# Defaults & registry
# ----------------------------

RULE_PRESETS: Dict[str, ExtractionRules] = {
    "financial_statement": create_financial_statement_rules(),
    "variation_actif_net": create_variation_actif_net_rules(),
    "portfolio_titles": create_portfolio_titles_rules(),
    "funds_recap": create_funds_recap_rules(),
    "contacts_intervenants": create_contacts_intervenants_rules(),
    "designation_two_dates": create_two_date_designation_rules(),
    "grid_capital_souscriptions_rachats": create_grid_capital_souscriptions_rachats_rules(),
    "no_filter": create_no_filter_rules(),
}

DEFAULT_RULES: ExtractionRules = RULE_PRESETS["financial_statement"]


# ----------------------------
# Auto selection (table text -> rules)
# ----------------------------

def select_rules_for_table_text(table_text: str, fallback: str = "financial_statement") -> ExtractionRules:
    """
    Choisit automatiquement un preset en fonction du contenu du texte tabulaire (pipe-text).

    Idée:
    - détecter les styles très typés (contacts, portefeuille, récap fonds, grilles)
    - sinon utiliser 'financial_statement' par défaut
    """
    st = _table_stats(table_text)
    tl = st["text_lower"]

    if st["rows"] == 0 or st["cols"] == 0:
        return RULE_PRESETS.get(fallback, DEFAULT_RULES)

    # 1) Contacts / intervenants (beaucoup de mots clés adresse/tel/fax/www)
    if _contains_any(tl, _CONTACT_KWS) and st["cols"] <= 3:
        return RULE_PRESETS["contacts_intervenants"]

    # 2) Grille capital/souscriptions/rachats (beaucoup de vides + mots clés)
    if _contains_any(tl, _GRID_KWS) and st["cols"] <= 3 and st["empty_ratio"] >= 0.55:
        return RULE_PRESETS["grid_capital_souscriptions_rachats"]

    # 3) Portefeuille titres (beaucoup de colonnes + mots clés + %)
    if st["cols"] >= 6 and (_contains_any(tl, _PORTFOLIO_KWS) or "% actif" in tl or "émetteur" in tl or "emetteur" in tl):
        return RULE_PRESETS["portfolio_titles"]

    # 4) Récap fonds gérés (mots clés + 6+ cols)
    if st["cols"] >= 6 and _contains_any(tl, _RECAP_FONDS_KWS):
        return RULE_PRESETS["funds_recap"]

    # 5) Désignation + 2 dates (3 cols, dates dans header, mots 'désignation')
    if st["cols"] == 3 and ("désignation" in tl or "designation" in tl) and _DATE_RE.search(tl):
        return RULE_PRESETS["designation_two_dates"]

    # 6) Variation actif net (mots clés variation + pas forcément beaucoup de cols)
    if "variation" in tl and ("actif net" in tl or "opérations d'exploitation" in tl or "operations d'exploitation" in tl):
        return RULE_PRESETS["variation_actif_net"]

    # 7) États financiers génériques
    if _contains_any(tl, _FIN_KWS) and st["cols"] >= 3:
        # Si énormément de vides, on tolère plus
        if st["empty_ratio"] >= 0.6 and st["cols"] <= 3:
            return RULE_PRESETS["grid_capital_souscriptions_rachats"]
        return RULE_PRESETS["financial_statement"]

    return RULE_PRESETS.get(fallback, DEFAULT_RULES)

# ===== EXEMPLES D'UTILISATION =====
if __name__ == "__main__":
    # Exemple 1: Utiliser règles prédéfinies
    rules = create_financial_statement_rules()
    print("Règles financières:", rules)
    print("JSON:", rules.to_dict())
    
    # Exemple 2: Créer règles personnalisées
    custom = ExtractionRules()
    custom.min_rows = 7
    custom.min_numeric_percentage = 0.50
    custom.toc_keywords = ["sommaire", "index", "annexe"]
    print("\nRègles personnalisées:", custom)
    
    # Exemple 3: Charger depuis dictionnaire
    config = {
        "minRows": 4,
        "minCols": 3,
        "minNumericPercentage": 0.3,
        "excludeToc": True
    }
    loaded = ExtractionRules.from_dict(config)
    print("\nRègles chargées:", loaded)
