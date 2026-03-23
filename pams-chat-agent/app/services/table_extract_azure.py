from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import pandas as pd
import requests
from app.config import Config
from app.services.extraction_rules import ExtractionRules, DEFAULT_RULES


@dataclass
class ExtractedTable:
    """Compatible avec table_extract_img2table.ExtractedTable"""
    page: int
    index: int
    html: str
    df: Optional[pd.DataFrame]
    bbox: Optional[tuple] = None
    title: str = ""
    kind: str = "GENERIC"


class TableExtractorJavaClient:
    """
    Client Python pour appeler l'API Java ocr-data-manager.
    Consomme l'endpoint POST /api/extract qui utilise Azure Form Recognizer.
    """

    def __init__(self, java_api_url: str, timeout: int = 120):
        """
        Args:
            java_api_url: URL de l'API Java (ex: http://localhost:8083/api/extract)
            timeout: Timeout en secondes pour l'appel HTTP
        """
        self.java_api_url = java_api_url
        self.timeout = timeout

    def extract_from_pdf(
        self,
        pdf_path: str | Path,
        start_page: int = 1,
        end_page: Optional[int] = None,
        lang: str = "fra",
        rules: Optional[ExtractionRules] = None
    ) -> List[ExtractedTable]:
        """
        Extrait les tableaux d'un PDF en appelant l'API Java.

        Args:
            pdf_path: Chemin vers le fichier PDF
            start_page: Page de début (1-indexed)
            end_page: Page de fin (1-indexed, None = dernière page)
            lang: Langue (non utilisé par l'API Java, gardé pour compatibilité)
            rules: Règles d'extraction configurables (ExtractionRules)
                   Si None, utilise les règles par défaut (DEFAULT_RULES)

        Returns:
            Liste d'ExtractedTable
            
        Note:
            Pour que le paramètre 'rules' fonctionne, l'API Java doit être modifiée
            pour accepter un body JSON avec les règles d'extraction.
            Voir AZURE_OCR_ARCHITECTURE.md pour les détails d'implémentation.
        """
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        # Déterminer end_page si non spécifié
        # Pour simplifier, on peut passer une grande valeur (ex: 999)
        if end_page is None:
            end_page = 999
        
        # Utiliser règles par défaut si non spécifiées
        if rules is None:
            rules = DEFAULT_RULES

        # Préparer le multipart form data
        with open(pdf_path, "rb") as f:
            files = {"file": (pdf_path.name, f, "application/pdf")}
            
            # ✅ Préparer les données du formulaire
            data = {
                "PageRange": f"[{start_page},{end_page}]"
            }
            
            # ✅ Ajouter les règles en JSON string (nouveau support côté Java)
            if rules:
                import json
                data["rules"] = json.dumps(rules.to_dict())

            try:
                print(f"[JAVA API] Calling {self.java_api_url} for {pdf_path.name} pages {start_page}-{end_page}")
                if rules:
                    print(f"[JAVA API] Using rules: {rules}")
                
                response = requests.post(
                    self.java_api_url,
                    files=files,
                    data=data,
                    timeout=self.timeout
                )

                if response.status_code != 200:
                    print(f"[JAVA API] Error {response.status_code}: {response.text}")
                    return []

                # Forcer UTF-8 (Java ne declare pas toujours charset dans Content-Type)
                response.encoding = "utf-8"
                # Reponse: List<List<List<String>>> (pages -> tables -> rows -> cells)
                tables_response = response.json()

            except Exception as e:
                print(f"[JAVA API] Error calling API: {e}")
                return []

        # Convertir la réponse en ExtractedTable
        return self._convert_response_to_tables(tables_response, start_page)

    def _convert_response_to_tables(
        self,
        tables_response,
        start_page: int
    ) -> List[ExtractedTable]:
        """
        Convertir la réponse Java en ExtractedTable.

        Supporte deux formats de réponse:
        - Nouveau format (avec métadonnées): List[{"pageNumber": int, "rows": List[List[str]]}]
        - Ancien format (sans métadonnées): List[List[List[str]]]
        """
        extracted_tables = []

        for table_index, table_entry in enumerate(tables_response):
            # Détecter le format de la réponse
            if isinstance(table_entry, dict):
                # Nouveau format avec métadonnées
                page_num = table_entry.get("pageNumber", start_page)
                table_rows = table_entry.get("rows", [])
            else:
                # Ancien format: List[List[str]]
                table_rows = table_entry
                page_num = start_page + (table_index // 3)

            if not table_rows:
                continue

            # Créer DataFrame à partir des lignes
            df = self._rows_to_dataframe(table_rows)
            html = df.to_html(index=False, na_rep="") if df is not None else ""

            extracted_tables.append(
                ExtractedTable(
                    page=page_num,
                    index=table_index,
                    html=html,
                    df=df,
                    bbox=None,
                    title="",
                    kind="GENERIC"
                )
            )

        print(f"[JAVA API] Converted {len(extracted_tables)} tables")
        return extracted_tables

    def _rows_to_dataframe(self, rows: List[List[str]]) -> Optional[pd.DataFrame]:
        """Convertir les lignes en DataFrame pandas."""
        if not rows:
            return None

        try:
            max_cols = max(len(row) for row in rows) if rows else 0
            if max_cols == 0:
                return None

            # Normaliser toutes les lignes à la même longueur
            normalized_rows = []
            for row in rows:
                normalized_row = row + [""] * (max_cols - len(row))
                normalized_rows.append(normalized_row)

            # Utiliser la première ligne comme header
            if len(normalized_rows) > 1:
                df = pd.DataFrame(normalized_rows[1:], columns=normalized_rows[0])
            else:
                df = pd.DataFrame(normalized_rows)

            return df

        except Exception as e:
            print(f"[JAVA API] Error creating DataFrame: {e}")
            return None


def get_java_client_extractor() -> TableExtractorJavaClient:
    """
    Factory pour créer un TableExtractorJavaClient configuré depuis Config.
    """
    return TableExtractorJavaClient(
        java_api_url=Config.JAVA_OCR_API_URL,
        timeout=Config.JAVA_OCR_TIMEOUT
    )
