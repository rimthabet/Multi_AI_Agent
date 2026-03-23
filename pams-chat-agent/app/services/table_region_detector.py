"""
Détection de zones de tableaux par analyse d'image (preprocessing OCR)

Ce module détecte les régions contenant des tableaux AVANT l'OCR texte,
afin de les masquer ou les ignorer pour éviter qu'elles polluent
l'extraction de texte.

Trois méthodes de détection :
1. Lignes horizontales (morphologie OpenCV)
2. Headers multi-colonnes avec mots-clés (Tesseract + pattern matching)
3. Densité d'alignements + tokens numériques
"""
import os
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass

import cv2
import numpy as np
import pytesseract
from PIL import Image

from app.services.table_detection_rules import TableDetectionRules, DEFAULT_DETECTION_RULES


@dataclass
class TableRegion:
    """Représente une région détectée comme tableau"""
    x: int  # Position X (left)
    y: int  # Position Y (top)
    width: int
    height: int
    confidence: float  # Score de confiance 0-1
    detection_method: str  # "horizontal_lines", "header_keywords", "density"
    
    def to_bbox(self) -> Tuple[int, int, int, int]:
        """Retourne (x1, y1, x2, y2)"""
        return (self.x, self.y, self.x + self.width, self.y + self.height)
    
    def area(self) -> int:
        return self.width * self.height
    
    def intersection_over_union(self, other: "TableRegion") -> float:
        """Calcule l'IoU avec une autre région"""
        x1_max = max(self.x, other.x)
        y1_max = max(self.y, other.y)
        x2_min = min(self.x + self.width, other.x + other.width)
        y2_min = min(self.y + self.height, other.y + other.height)
        
        if x2_min <= x1_max or y2_min <= y1_max:
            return 0.0
        
        intersection = (x2_min - x1_max) * (y2_min - y1_max)
        union = self.area() + other.area() - intersection
        
        return intersection / union if union > 0 else 0.0


class TableRegionDetector:
    """Détecte les zones de tableaux dans une image"""
    
    def __init__(self, rules: Optional[TableDetectionRules] = None):
        self.rules = rules or DEFAULT_DETECTION_RULES
    
    def detect_table_regions(self, image: np.ndarray) -> List[TableRegion]:
        """
        Détecte toutes les régions de tableaux dans l'image
        
        Args:
            image: Image numpy array (BGR ou RGB)
        
        Returns:
            Liste de TableRegion détectées
        """
        regions = []
        img_height, img_width = image.shape[:2]
        
        # Méthode 1 : Lignes horizontales
        if self.rules.detect_horizontal_lines:
            line_regions = self._detect_by_horizontal_lines(image)
            regions.extend(line_regions)
        
        # Méthode 2 : Headers avec mots-clés
        if self.rules.detect_by_header_keywords:
            header_regions = self._detect_by_header_keywords(image)
            regions.extend(header_regions)
        
        # Méthode 3 : Densité d'alignements
        if self.rules.detect_by_density:
            density_regions = self._detect_by_density(image)
            regions.extend(density_regions)
        
        # Filtrer par taille
        page_area = img_width * img_height
        min_area = page_area * self.rules.min_region_area_ratio
        max_area = page_area * self.rules.max_region_area_ratio
        
        regions = [r for r in regions if min_area <= r.area() <= max_area]
        
        # Combiner les régions qui se chevauchent
        if self.rules.combine_overlapping_regions:
            regions = self._merge_overlapping_regions(regions)
        
        # Debug : sauvegarder les images annotées
        if self.rules.save_debug_images:
            self._save_debug_image(image, regions)
        
        return regions
    
    def _detect_by_horizontal_lines(self, image: np.ndarray) -> List[TableRegion]:
        """Détection par lignes horizontales (morphologie)"""
        img_height, img_width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Binarisation
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Kernel horizontal pour détecter les lignes
        kernel_width = int(img_width * self.rules.horizontal_kernel_width_ratio)
        kernel_width = max(20, kernel_width)  # Minimum 20 pixels
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_width, 1))
        
        # Detection des lignes horizontales
        horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
        
        # Trouver les contours des lignes
        contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filtrer les lignes valides
        valid_lines = []
        min_length = img_width * self.rules.min_horizontal_line_length_ratio
        max_height = img_height * self.rules.max_line_height_ratio
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w >= min_length and h <= max_height:
                valid_lines.append((y, x, x + w))  # (y_position, x_start, x_end)
        
        if len(valid_lines) < self.rules.min_horizontal_lines_in_block:
            return []
        
        # Grouper les lignes proches verticalement
        valid_lines.sort(key=lambda l: l[0])  # Trier par Y
        
        clusters = self._cluster_lines_by_proximity(valid_lines, img_height)
        
        # Créer des régions pour chaque cluster
        regions = []
        for cluster in clusters:
            if len(cluster) >= self.rules.min_horizontal_lines_in_block:
                # Calculer la bounding box du cluster
                y_positions = [line[0] for line in cluster]
                x_starts = [line[1] for line in cluster]
                x_ends = [line[2] for line in cluster]
                
                x = min(x_starts)
                y = min(y_positions)
                width = max(x_ends) - x
                height = max(y_positions) - y + int(img_height * 0.02)  # Ajouter un peu de marge
                
                # Appliquer les marges
                x = max(0, x - self.rules.table_region_margin[0])
                y = max(0, y - self.rules.table_region_margin[1])
                width = min(img_width - x, width + self.rules.table_region_margin[0] + self.rules.table_region_margin[2])
                height = min(img_height - y, height + self.rules.table_region_margin[1] + self.rules.table_region_margin[3])
                
                regions.append(TableRegion(
                    x=x, y=y, width=width, height=height,
                    confidence=0.85,
                    detection_method="horizontal_lines"
                ))
        
        return regions
    
    def _cluster_lines_by_proximity(self, lines: List[Tuple], img_height: int) -> List[List[Tuple]]:
        """Groupe les lignes proches verticalement"""
        if not lines:
            return []
        
        threshold = img_height * self.rules.line_clustering_threshold_ratio
        clusters = []
        current_cluster = [lines[0]]
        
        for i in range(1, len(lines)):
            prev_y = lines[i - 1][0]
            curr_y = lines[i][0]
            
            if curr_y - prev_y <= threshold:
                current_cluster.append(lines[i])
            else:
                clusters.append(current_cluster)
                current_cluster = [lines[i]]
        
        clusters.append(current_cluster)
        return clusters
    
    def _detect_by_header_keywords(self, image: np.ndarray) -> List[TableRegion]:
        """Détection par headers multi-colonnes avec mots-clés"""
        img_height, img_width = image.shape[:2]
        
        # OCR pour extraire les mots avec positions
        try:
            ocr_data = pytesseract.image_to_data(image, lang='fra', output_type=pytesseract.Output.DICT)
        except Exception as e:
            print(f"[TABLE DETECTOR] Erreur OCR header detection: {e}")
            return []
        
        # Extraire les mots avec positions
        words = []
        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i].strip()
            if text and ocr_data['conf'][i] > 30:  # Confiance > 30
                words.append({
                    'text': text,
                    'x': ocr_data['left'][i],
                    'y': ocr_data['top'][i],
                    'width': ocr_data['width'][i],
                    'height': ocr_data['height'][i]
                })
        
        if not words:
            return []
        
        # Chercher les bandes horizontales contenant plusieurs mots-clés
        band_height = int(img_height * self.rules.header_band_height_ratio)
        regions = []
        
        # Scanner par bandes horizontales
        y_positions = sorted(set(w['y'] for w in words))
        
        for y_start in y_positions:
            y_end = y_start + band_height
            words_in_band = [w for w in words if y_start <= w['y'] <= y_end]
            
            # Compter les mots-clés
            matched_keywords = []
            for word_data in words_in_band:
                word = word_data['text']
                for keyword in self.rules.header_keywords_any:
                    if keyword.lower() in word.lower():
                        matched_keywords.append((word_data, keyword))
                        break
            
            if len(matched_keywords) >= self.rules.header_keywords_min_match:
                # Vérifier l'écartement horizontal
                x_positions = [w[0]['x'] for w in matched_keywords]
                x_spread = max(x_positions) - min(x_positions)
                
                if x_spread >= img_width * self.rules.header_min_x_spread_ratio:
                    # Créer une région qui s'étend vers le bas
                    x_min = min(w[0]['x'] for w in matched_keywords)
                    x_max = max(w[0]['x'] + w[0]['width'] for w in matched_keywords)
                    
                    # Estimer la hauteur du tableau (jusqu'à la prochaine bande vide ou fin de page)
                    estimated_height = int(img_height * 0.30)  # Par défaut 30% de la page
                    
                    # Appliquer marges
                    x = max(0, x_min - self.rules.table_region_margin[0])
                    y = max(0, y_start - self.rules.table_region_margin[1])
                    width = min(img_width - x, (x_max - x_min) + self.rules.table_region_margin[0] + self.rules.table_region_margin[2])
                    height = min(img_height - y, estimated_height + self.rules.table_region_margin[3])
                    
                    regions.append(TableRegion(
                        x=x, y=y, width=width, height=height,
                        confidence=0.75,
                        detection_method="header_keywords"
                    ))
        
        return regions
    
    def _detect_by_density(self, image: np.ndarray) -> List[TableRegion]:
        """Détection par densité de tokens numériques et alignements"""
        img_height, img_width = image.shape[:2]
        
        # OCR pour extraire tous les tokens avec positions
        try:
            ocr_data = pytesseract.image_to_data(image, lang='fra', output_type=pytesseract.Output.DICT)
        except Exception as e:
            print(f"[TABLE DETECTOR] Erreur OCR density detection: {e}")
            return []
        
        # Extraire les tokens
        tokens = []
        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i].strip()
            if text and ocr_data['conf'][i] > 30:
                tokens.append({
                    'text': text,
                    'x': ocr_data['left'][i],
                    'y': ocr_data['top'][i],
                    'width': ocr_data['width'][i],
                    'height': ocr_data['height'][i],
                    'is_numeric': any(c.isdigit() for c in text)
                })
        
        if not tokens:
            return []
        
        # Diviser l'image en grille et analyser chaque cellule
        grid_rows = 6
        grid_cols = 4
        cell_height = img_height // grid_rows
        cell_width = img_width // grid_cols
        
        regions = []
        
        for row in range(grid_rows):
            for col in range(grid_cols):
                cell_x = col * cell_width
                cell_y = row * cell_height
                
                # Tokens dans cette cellule (et voisines)
                cell_tokens = [
                    t for t in tokens
                    if (cell_x - cell_width // 2) <= t['x'] <= (cell_x + cell_width * 1.5)
                    and (cell_y - cell_height // 2) <= t['y'] <= (cell_y + cell_height * 1.5)
                ]
                
                if len(cell_tokens) < 10:  # Pas assez de données
                    continue
                
                # Calculer ratio numérique
                numeric_count = sum(1 for t in cell_tokens if t['is_numeric'])
                numeric_ratio = numeric_count / len(cell_tokens)
                
                if numeric_ratio < self.rules.min_numeric_token_ratio_in_region:
                    continue
                
                # Estimer nombre de colonnes (clustering des positions X)
                x_positions = sorted(set(t['x'] for t in cell_tokens))
                columns = self._estimate_columns(x_positions, img_width)
                
                # Estimer nombre de lignes (positions Y uniques)
                y_positions = sorted(set(t['y'] for t in cell_tokens))
                rows = len(y_positions)
                
                if columns >= self.rules.min_columns_estimate and rows >= self.rules.min_rows_estimate:
                    # Créer une région
                    x_min = min(t['x'] for t in cell_tokens)
                    y_min = min(t['y'] for t in cell_tokens)
                    x_max = max(t['x'] + t['width'] for t in cell_tokens)
                    y_max = max(t['y'] + t['height'] for t in cell_tokens)
                    
                    # Appliquer marges
                    x = max(0, x_min - self.rules.table_region_margin[0])
                    y = max(0, y_min - self.rules.table_region_margin[1])
                    width = min(img_width - x, (x_max - x_min) + self.rules.table_region_margin[0] + self.rules.table_region_margin[2])
                    height = min(img_height - y, (y_max - y_min) + self.rules.table_region_margin[1] + self.rules.table_region_margin[3])
                    
                    confidence = 0.60 + (numeric_ratio - self.rules.min_numeric_token_ratio_in_region) * 0.5
                    confidence = min(0.90, confidence)
                    
                    regions.append(TableRegion(
                        x=x, y=y, width=width, height=height,
                        confidence=confidence,
                        detection_method="density"
                    ))
        
        return regions
    
    def _estimate_columns(self, x_positions: List[int], img_width: int) -> int:
        """Estime le nombre de colonnes via clustering des positions X"""
        if not x_positions:
            return 0
        
        tolerance = int(img_width * self.rules.column_detection_tolerance_ratio)
        columns = 1
        prev_x = x_positions[0]
        
        for x in x_positions[1:]:
            if x - prev_x > tolerance:
                columns += 1
                prev_x = x
        
        return columns
    
    def _merge_overlapping_regions(self, regions: List[TableRegion]) -> List[TableRegion]:
        """Fusionne les régions qui se chevauchent"""
        if not regions:
            return []
        
        merged = []
        regions = sorted(regions, key=lambda r: r.area(), reverse=True)
        
        for region in regions:
            should_merge = False
            for i, existing in enumerate(merged):
                iou = region.intersection_over_union(existing)
                if iou >= self.rules.overlap_threshold:
                    # Fusionner : prendre l'union des deux régions
                    x1 = min(region.x, existing.x)
                    y1 = min(region.y, existing.y)
                    x2 = max(region.x + region.width, existing.x + existing.width)
                    y2 = max(region.y + region.height, existing.y + existing.height)
                    
                    merged[i] = TableRegion(
                        x=x1, y=y1, width=x2 - x1, height=y2 - y1,
                        confidence=(region.confidence + existing.confidence) / 2,
                        detection_method=f"{existing.detection_method}+{region.detection_method}"
                    )
                    should_merge = True
                    break
            
            if not should_merge:
                merged.append(region)
        
        return merged
    
    def apply_masking(self, image: np.ndarray, regions: List[TableRegion]) -> np.ndarray:
        """
        Masque les régions de tableaux (blanchit les zones)
        
        Args:
            image: Image numpy array
            regions: Liste de régions à masquer
        
        Returns:
            Image avec zones masquées
        """
        if self.rules.table_region_action != "mask":
            return image
        
        masked = image.copy()
        
        for region in regions:
            x1, y1, x2, y2 = region.to_bbox()
            # Blanchir la zone (255 pour toutes les couleurs)
            masked[y1:y2, x1:x2] = 255
        
        return masked
    
    def _save_debug_image(self, image: np.ndarray, regions: List[TableRegion]):
        """Sauvegarde une image annotée avec les régions détectées"""
        import time
        
        os.makedirs(self.rules.debug_output_dir, exist_ok=True)
        
        annotated = image.copy()
        
        # Dessiner les régions
        for region in regions:
            x1, y1, x2, y2 = region.to_bbox()
            color = (0, 255, 0) if region.detection_method == "horizontal_lines" else \
                    (255, 0, 0) if region.detection_method == "header_keywords" else \
                    (0, 0, 255)
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)
            label = f"{region.detection_method} ({region.confidence:.2f})"
            cv2.putText(annotated, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        timestamp = int(time.time())
        output_path = os.path.join(self.rules.debug_output_dir, f"detection_{timestamp}.png")
        cv2.imwrite(output_path, annotated)
        print(f"[TABLE DETECTOR] Debug image saved: {output_path}")
