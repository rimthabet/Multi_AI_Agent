package nasoft.ocr.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.tomcat.util.http.fileupload.ByteArrayOutputStream;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.awt.image.BufferedImage;
import org.springframework.web.multipart.MultipartFile;

import nasoft.ocr.models.ExtractionRules;

@Service
public class OcrService {
	private static Logger LOG = LoggerFactory.getLogger(OcrService.class);

	@Autowired
	private RestTemplate restTemplate;
	@Value("${azure.url}")
	private String azureUrl;
	@Value("${azure.key}")
	private String azureKey;
	@Value("${azure.version}")
	private String azureVersion;

	/**
	 * Retrieves OCR results for the specified page range from Azure Cognitive
	 * Services.
	 *
	 * @param file      The document file to perform OCR on.
	 * @param startPage The starting page of the document range to analyze.
	 * @param endPage   The ending page of the document range to analyze.
	 * @param rules     Règles d'extraction configurables
	 * @return A list containing the OCR results in a tabular format.
	 */
	public List<List<List<String>>> getAnalyzeResults(MultipartFile file, int startPage, int endPage, ExtractionRules rules) {
    try {
        // Build Azure URL with page range
        String url = azureUrl + startPage + "-" + endPage + azureVersion;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Ocp-Apim-Subscription-Key", azureKey);
        headers.setContentType(MediaType.APPLICATION_PDF);

        // ✅ Binary upload (correct way)
        HttpEntity<byte[]> requestEntity =
                new HttpEntity<>(file.getBytes(), headers);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

        if (response.getStatusCode() == HttpStatus.ACCEPTED) {

            String operationLocation =
                    response.getHeaders().getFirst("Operation-Location");

            long startTimeMs = System.currentTimeMillis();
            long timeoutMs = TimeUnit.SECONDS.toMillis(60);

            while (System.currentTimeMillis() - startTimeMs < timeoutMs) {

                ResponseEntity<String> getDataResponse =
                        restTemplate.exchange(operationLocation, HttpMethod.GET,
                                new HttpEntity<>(headers), String.class);

                if (getDataResponse.getStatusCode() == HttpStatus.OK) {

                    JSONObject jsonResponse =
                            new JSONObject(getDataResponse.getBody());

                    if ("succeeded".equalsIgnoreCase(jsonResponse.getString("status"))) {

                        JSONObject analyzeResult =
                                jsonResponse.getJSONObject("analyzeResult");

                        // ✅ pass rules
                        return extractTableCells(analyzeResult, startPage, endPage, rules);
                    }

                    if ("failed".equalsIgnoreCase(jsonResponse.getString("status"))) {
                        LOG.error("Azure analysis failed: {}", jsonResponse);
                        break;
                    }
                }

                Thread.sleep(1000);
            }
        }
    } catch (Exception e) {
        LOG.error("Problem retrieving data from Azure API", e);
    }
    return null;
}

/*public List<List<List<String>>> getAnalyzeResults(MultipartFile file, int startPage, int endPage) {
    try {
        // 1. Charger PDF original depuis MultipartFile
        PDDocument originalPdf = PDDocument.load(file.getInputStream());

        // 2. Convertir pages demandées en images haute résolution 300 DPI
        PDFRenderer pdfRenderer = new PDFRenderer(originalPdf);
        PDDocument enhancedPdf = new PDDocument();

        for (int i = startPage - 1; i < endPage && i < originalPdf.getNumberOfPages(); i++) {
            BufferedImage pageImage = pdfRenderer.renderImageWithDPI(i, 300);

            // Ici tu peux ajouter un traitement image (contraste, deskew...) si tu veux
            BufferedImage enhancedImage = pageImage; // pour l'instant, pas de traitement

            // Créer une nouvelle page PDF avec cette image
            PDPage page = new PDPage();
            enhancedPdf.addPage(page);

            PDPageContentStream contentStream = new PDPageContentStream(enhancedPdf, page);
            contentStream.drawImage(LosslessFactory.createFromImage(enhancedPdf, enhancedImage), 0, 0, page.getMediaBox().getWidth(), page.getMediaBox().getHeight());
            contentStream.close();
        }
        originalPdf.close();

        // 3. Exporter PDF amélioré en byte[]
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        enhancedPdf.save(baos);
        enhancedPdf.close();
        byte[] enhancedPdfBytes = baos.toByteArray();

        // 4. Préparer appel Azure avec PDF amélioré
        String url = azureUrl + startPage + "-" + endPage + azureVersion;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Ocp-Apim-Subscription-Key", azureKey);
        headers.setContentType(MediaType.APPLICATION_PDF);

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(enhancedPdfBytes, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

        if (response.getStatusCode() == HttpStatus.ACCEPTED) {
            String operationLocation = response.getHeaders().getFirst("Operation-Location");
            long startTimeMs = System.currentTimeMillis();
            long timeoutMs = TimeUnit.SECONDS.toMillis(60);

            while (System.currentTimeMillis() - startTimeMs < timeoutMs) {
                ResponseEntity<String> getDataResponse = restTemplate.exchange(operationLocation, HttpMethod.GET, new HttpEntity<>(headers), String.class);

                if (getDataResponse.getStatusCode() == HttpStatus.OK) {
                    JSONObject jsonResponse = new JSONObject(getDataResponse.getBody());
                    if ("succeeded".equalsIgnoreCase(jsonResponse.getString("status"))) {
                        JSONObject analyzeResult = jsonResponse.getJSONObject("analyzeResult");
                        return extractTableCells(analyzeResult, startPage, endPage);
                    }
                    if ("failed".equalsIgnoreCase(jsonResponse.getString("status"))) {
                        LOG.error("Azure analysis failed: {}", jsonResponse);
                        break;
                    }
                }
                Thread.sleep(1000);
            }
        }

    } catch (Exception e) {
        LOG.error("Problem retrieving data from Azure API", e);
    }
    return null;
}
*/

	/**
	 * Analyse les résultats Azure et retourne les tableaux avec métadonnées (numéro de page).
	 * Format de retour: List<Map<String, Object>> où chaque map contient:
	 *   - "pageNumber": int (numéro de page réel depuis Azure)
	 *   - "rows": List<List<String>> (lignes du tableau)
	 */
	public List<Map<String, Object>> getAnalyzeResultsWithMeta(MultipartFile file, int startPage, int endPage, ExtractionRules rules) {
		try {
			String url = azureUrl + startPage + "-" + endPage + azureVersion;
			HttpHeaders headers = new HttpHeaders();
			headers.set("Ocp-Apim-Subscription-Key", azureKey);
			headers.setContentType(MediaType.APPLICATION_PDF);
			HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

			if (response.getStatusCode() == HttpStatus.ACCEPTED) {
				String operationLocation = response.getHeaders().getFirst("Operation-Location");
				long startTimeMs = System.currentTimeMillis();
				long timeoutMs = TimeUnit.SECONDS.toMillis(60);

				while (System.currentTimeMillis() - startTimeMs < timeoutMs) {
					ResponseEntity<String> getDataResponse = restTemplate.exchange(
							operationLocation, HttpMethod.GET, new HttpEntity<>(headers), String.class);

					if (getDataResponse.getStatusCode() == HttpStatus.OK) {
						JSONObject jsonResponse = new JSONObject(getDataResponse.getBody());
						if ("succeeded".equalsIgnoreCase(jsonResponse.getString("status"))) {
							JSONObject analyzeResult = jsonResponse.getJSONObject("analyzeResult");
							return extractTableCellsWithMeta(analyzeResult, startPage, endPage, rules);
						}
						if ("failed".equalsIgnoreCase(jsonResponse.getString("status"))) {
							LOG.error("Azure analysis failed: {}", jsonResponse);
							break;
						}
					}
					Thread.sleep(1000);
				}
			}
		} catch (Exception e) {
			LOG.error("Problem retrieving data from Azure API (withMeta)", e);
		}
		return new ArrayList<>();
	}

	/**
	 * Extrait le numéro de page d'un tableau depuis ses boundingRegions.
	 */
	private int getTablePageNumber(JSONObject tableJson) {
		JSONArray regions = tableJson.optJSONArray("boundingRegions");
		if (regions != null && regions.length() > 0) {
			return regions.getJSONObject(0).getInt("pageNumber");
		}
		return 1;
	}

	/**
	 * Version enrichie de extractTableCells qui retourne aussi le numéro de page.
	 */
	private List<Map<String, Object>> extractTableCellsWithMeta(JSONObject analyzeResult,
			int startPage, int endPage, ExtractionRules rules) {

		List<Map<String, Object>> allTables = new ArrayList<>();
		JSONArray tablesArray = analyzeResult.getJSONArray("tables");
		LOG.info("[withMeta] Azure a détecté {} tableaux", tablesArray.length());

		for (Object tableObj : tablesArray) {
			JSONObject tableJson = (JSONObject) tableObj;

			if (!isTableInPageRange(tableJson, startPage, endPage)) {
				continue;
			}

			int pageNumber = getTablePageNumber(tableJson);
			List<List<String>> tableCells = parseCells(tableJson, rules);

			if (rules.isMergeUnderlinedText()) {
				tableCells = mergeUnderlinedRows(tableCells, rules);
			}
			tableCells = mergeMultilineRows(tableCells);

			if (!rules.isNoFilter()) {
				if (tableCells.size() < rules.getMinRows() ||
					(tableCells.size() > 0 && tableCells.get(0).size() < rules.getMinCols())) {
					continue;
				}
				if (rules.isExcludeSingleColumn() && tableCells.size() > 0 && tableCells.get(0).size() == 1) {
					continue;
				}
				if (rules.isExcludeToc() && isTocTable(tableCells, rules)) {
					continue;
				}
				if (!hasEnoughNumbers(tableCells, rules.getMinNumericPercentage())) {
					continue;
				}
				double emptyPct = calculateEmptyPercentage(tableCells);
				if (emptyPct > rules.getMaxEmptyPercentage()) {
					continue;
				}
			}

			LOG.info("✅ [withMeta] Table page {} validée: {}x{}", pageNumber, tableCells.size(),
					tableCells.size() > 0 ? tableCells.get(0).size() : 0);

			Map<String, Object> entry = new LinkedHashMap<>();
			entry.put("pageNumber", pageNumber);
			entry.put("rows", tableCells);
			allTables.add(entry);
		}

		// ✅ MULTI-PAGE TABLE MERGING: Fusionner les tableaux qui continuent sur plusieurs pages
		if (rules.isMergeMultiPageTables()) {
			allTables = mergeMultiPageTables(allTables, rules);
		}

		LOG.info("[withMeta] Résultat: {} tableaux validés sur {} détectés", allTables.size(), tablesArray.length());
		return allTables;
	}

	/**
	 * Fusionne les tableaux qui s'étendent sur plusieurs pages.
	 * Détecte les tableaux consécutifs avec une structure de colonnes similaire.
	 * 
	 * Critères de fusion:
	 * - Pages consécutives (page N et page N+1)
	 * - Même nombre de colonnes
	 * - La table de page N+1 n'a pas de header reconnaissable (ou header similaire)
	 */
	@SuppressWarnings("unchecked")
	private List<Map<String, Object>> mergeMultiPageTables(List<Map<String, Object>> tables, ExtractionRules rules) {
		if (tables.size() < 2) return tables;
		
		List<Map<String, Object>> result = new ArrayList<>();
		int i = 0;
		
		while (i < tables.size()) {
			Map<String, Object> currentTable = tables.get(i);
			int currentPage = (int) currentTable.get("pageNumber");
			List<List<String>> currentRows = (List<List<String>>) currentTable.get("rows");
			
			if (currentRows.isEmpty()) {
				result.add(currentTable);
				i++;
				continue;
			}
			
			int currentCols = currentRows.get(0).size();
			
			// Chercher des tables à fusionner sur les pages suivantes
			int j = i + 1;
			List<List<String>> mergedRows = new ArrayList<>(currentRows);
			int lastMergedPage = currentPage;
			
			while (j < tables.size()) {
				Map<String, Object> nextTable = tables.get(j);
				int nextPage = (int) nextTable.get("pageNumber");
				List<List<String>> nextRows = (List<List<String>>) nextTable.get("rows");
				
				// Vérifier si page consécutive
				if (nextPage != lastMergedPage + 1) {
					break;
				}
				
				if (nextRows.isEmpty()) {
					j++;
					continue;
				}
				
				int nextCols = nextRows.get(0).size();
				
				// Vérifier si même structure (MÊME nombre de colonnes - plus de tolérance)
				if (nextCols != currentCols) {
					LOG.debug("Pas de fusion pages {} et {}: colonnes différentes ({} vs {})", 
							lastMergedPage, nextPage, currentCols, nextCols);
					break;
				}
				
				// Vérifier si la table suivante semble être une continuation (pas de header distinct)
				if (isTableContinuation(currentRows, nextRows, rules)) {
					LOG.info("🔗 Fusion tables pages {} et {}: {}+{} lignes", 
							lastMergedPage, nextPage, mergedRows.size(), nextRows.size());
					
					// Ajouter les lignes (en sautant le header si c'est une répétition)
					int startRow = hasRepeatedHeader(currentRows, nextRows) ? 1 : 0;
					for (int r = startRow; r < nextRows.size(); r++) {
						mergedRows.add(nextRows.get(r));
					}
					
					lastMergedPage = nextPage;
					j++;
				} else {
					break;
				}
			}
			
			// Créer l'entrée fusionnée
			Map<String, Object> mergedEntry = new LinkedHashMap<>();
			mergedEntry.put("pageNumber", currentPage); // Page de début
			mergedEntry.put("endPageNumber", lastMergedPage); // Page de fin (nouvelle info)
			mergedEntry.put("rows", mergedRows);
			result.add(mergedEntry);
			
			i = j; // Sauter les tables fusionnées
		}
		
		return result;
	}
	
	/**
	 * Vérifie si table2 est une continuation de table1 (même tableau sur plusieurs pages).
	 * Critères TRÈS stricts pour éviter de fusionner des tableaux différents.
	 * Philosophie: il vaut mieux ne PAS fusionner que fusionner incorrectement.
	 */
	private boolean isTableContinuation(List<List<String>> table1, List<List<String>> table2, ExtractionRules rules) {
		if (table1.isEmpty() || table2.isEmpty()) return false;
		
		// Critère 1: MÊME nombre de colonnes (strictement)
		int cols1 = table1.get(0).size();
		int cols2 = table2.get(0).size();
		if (cols1 != cols2) {
			LOG.info("[MERGE] REFUSÉ pages: colonnes différentes ({} vs {})", cols1, cols2);
			return false;
		}
		
		// Critère 2: Vérifier si la première ligne de table2 est un TITRE
		List<String> firstRow2 = table2.get(0);
		if (isTableTitle(firstRow2)) {
			LOG.info("[MERGE] REFUSÉ: table2 commence par un titre: {}", firstRow2.get(0));
			return false;
		}
		
		// Critère 3: Vérifier si table2 a des lignes qui ressemblent à des titres dans les 3 premières lignes
		for (int r = 0; r < Math.min(3, table2.size()); r++) {
			List<String> row = table2.get(r);
			if (isTableTitle(row)) {
				LOG.info("[MERGE] REFUSÉ: table2 ligne {} est un titre: {}", r, row.get(0));
				return false;
			}
		}
		
		// Critère 4: Si table2 a une ligne avec des dates dans les 2 premières lignes
		// ET ces dates ne correspondent PAS au header de table1 → c'est un NOUVEAU tableau
		for (int r = 0; r < Math.min(2, table2.size()); r++) {
			List<String> row = table2.get(r);
			if (hasDateHeader(row)) {
				// Vérifier si table1 a aussi un date header similaire
				boolean table1HasMatchingDates = false;
				for (int r1 = 0; r1 < Math.min(2, table1.size()); r1++) {
					if (hasSimilarDateHeader(table1.get(r1), row)) {
						table1HasMatchingDates = true;
						break;
					}
				}
				if (!table1HasMatchingDates) {
					LOG.info("[MERGE] REFUSÉ: table2 a des dates header non compatibles");
					return false;
				}
			}
		}
		
		// Critère 5: Vérifier si la première ligne de table2 est un HEADER distinct
		if (isTypicalHeaderRow(firstRow2)) {
			if (!hasRepeatedHeader(table1, table2)) {
				LOG.info("[MERGE] REFUSÉ: table2 a un header différent: {}", firstRow2);
				return false;
			}
		}
		
		// Critère 6: Vérifier aussi la 2ème ligne de table2 (parfois titre en ligne 1, header en ligne 2)
		if (table2.size() > 1) {
			List<String> secondRow2 = table2.get(1);
			if (isTypicalHeaderRow(secondRow2) && !hasRepeatedHeader(table1, table2)) {
				LOG.info("[MERGE] REFUSÉ: table2 ligne 2 est un header différent");
				return false;
			}
		}
		
		// Critère 7: Vérifier la structure des données
		if (!hasCompatibleStructure(table1, table2)) {
			LOG.info("[MERGE] REFUSÉ: structures incompatibles");
			return false;
		}
		
		// Critère 8: table1 ne doit PAS se terminer par une ligne TOTAL
		List<String> lastRow1 = table1.get(table1.size() - 1);
		String lastRowText = String.join(" ", lastRow1).toUpperCase();
		if (lastRowText.contains("TOTAL") || lastRowText.contains("TOTAUX")) {
			LOG.info("[MERGE] REFUSÉ: table1 se termine par TOTAL");
			return false;
		}
		
		// Critère 9: Si la première cellule de la première ligne de table2 contient un texte
		// "de type header" (texte long + toutes les autres cellules vides), c'est un titre
		String firstCellT2 = firstRow2.get(0).trim();
		if (!firstCellT2.isEmpty() && firstCellT2.length() > 15) {
			int emptyOthers = 0;
			for (int c = 1; c < firstRow2.size(); c++) {
				if (firstRow2.get(c).trim().isEmpty()) emptyOthers++;
			}
			// Si toutes les autres cellules sont vides → c'est un titre
			if (emptyOthers == firstRow2.size() - 1) {
				LOG.info("[MERGE] REFUSÉ: table2 ligne 1 = titre (cellule unique non-vide: '{}')", firstCellT2);
				return false;
			}
		}
		
		LOG.info("✅ [MERGE] Fusion autorisée: tables compatibles");
		return true;
	}
	
	/**
	 * Détecte si la première ligne est un titre de tableau.
	 * Exemples: "[DÉTAIL DES CHARGES]", "VARIATION DE L'ACTIF NET", "Capital au 31 Décembre 2013"
	 */
	private boolean isTableTitle(List<String> row) {
		if (row.isEmpty()) return false;
		
		String firstCell = row.get(0).trim();
		if (firstCell.isEmpty()) return false;
		
		// Compter les cellules non-vides dans la ligne
		int nonEmptyCells = 0;
		for (String cell : row) {
			if (!cell.trim().isEmpty()) nonEmptyCells++;
		}
		
		// Pattern 1: Texte entre crochets [TITRE]
		if (firstCell.matches("^\\[.+\\]$")) {
			return true;
		}
		
		// Pattern 2: Texte tout en majuscules (au moins 2 mots) + seule cellule remplie
		if (firstCell.equals(firstCell.toUpperCase()) && firstCell.split("\\s+").length >= 2) {
			if (!containsNumbers(firstCell) && nonEmptyCells <= 2) {
				return true;
			}
		}
		
		// Pattern 3: Titre contenant des mots-clés indicateurs de section
		String lowerCell = firstCell.toLowerCase();
		String[] titleKeywords = {
			"capital au", "situation au", "état de", "etat de",
			"détail des", "detail des", "récapitulatif", "recapitulatif",
			"tableau des", "résumé", "resume", "évolution", "evolution",
			"variation de", "composition de", "inventaire",
			"portefeuille", "répartition", "repartition"
		};
		boolean hasTitleKeyword = false;
		for (String kw : titleKeywords) {
			if (lowerCell.contains(kw)) {
				hasTitleKeyword = true;
				break;
			}
		}
		
		if (hasTitleKeyword) {
			// Autres colonnes vides = c'est un titre
			int emptyCols = 0;
			for (int i = 1; i < row.size(); i++) {
				if (row.get(i).trim().isEmpty()) emptyCols++;
			}
			if (emptyCols >= row.size() - 2) {
				return true;
			}
		}
		
		// Pattern 4: Ligne avec une seule cellule remplie longue (>10 chars) 
		// sur un tableau de 3+ colonnes = probable titre
		if (nonEmptyCells == 1 && row.size() >= 3 && firstCell.length() > 10) {
			return true;
		}
		
		// Pattern 5: Texte contenant une date complète (ex: "Capital au 31 Décembre 2013")
		// et les autres colonnes vides
		if (lowerCell.matches(".*\\d{1,2}\\s*(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\\s*\\d{4}.*")) {
			if (nonEmptyCells <= 2) {
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Vérifie si une ligne contient des dates en header (format: 31/12/2014, 31-12-2013, etc.)
	 */
	private boolean hasDateHeader(List<String> row) {
		int dateCount = 0;
		for (String cell : row) {
			String trimmed = cell.trim();
			if (trimmed.matches(".*\\d{2}[/-]\\d{2}[/-]\\d{4}.*") ||
				trimmed.matches(".*\\d{2}[/-]\\d{2}[/-]\\d{2}.*") ||
				trimmed.matches("^\\d{4}$")) {
				dateCount++;
			}
		}
		return dateCount >= 2;
	}
	
	/**
	 * Vérifie si deux lignes ont des dates headers similaires.
	 */
	private boolean hasSimilarDateHeader(List<String> row1, List<String> row2) {
		if (row1.size() != row2.size()) return false;
		
		for (int i = 0; i < row1.size(); i++) {
			String cell1 = row1.get(i).trim();
			String cell2 = row2.get(i).trim();
			// Si les deux ont des dates, elles doivent être identiques
			if (cell1.matches(".*\\d{2}[/-]\\d{2}[/-]\\d{4}.*") &&
				cell2.matches(".*\\d{2}[/-]\\d{2}[/-]\\d{4}.*")) {
				if (!cell1.equals(cell2)) {
					return false;
				}
			}
		}
		return true;
	}
	
	/**
	 * Vérifie si deux tables ont une structure compatible (types de données similaires).
	 */
	private boolean hasCompatibleStructure(List<List<String>> table1, List<List<String>> table2) {
		if (table1.size() < 2 || table2.size() < 2) return true; // Pas assez de données pour comparer
		
		// Analyser la structure de la dernière ligne de table1 et première ligne de table2
		List<String> lastRow1 = table1.get(table1.size() - 1);
		List<String> firstRow2 = table2.get(0);
		
		if (lastRow1.size() != firstRow2.size()) return false;
		
		// Compter les types de colonnes (numérique vs texte)
		int numericCols1 = 0, numericCols2 = 0;
		for (int i = 0; i < lastRow1.size(); i++) {
			if (isNumericCell(lastRow1.get(i))) numericCols1++;
			if (isNumericCell(firstRow2.get(i))) numericCols2++;
		}
		
		// Si la structure est très différente, ne pas fusionner
		// (ex: table1 a 3 cols numériques, table2 en a 0)
		if (Math.abs(numericCols1 - numericCols2) > lastRow1.size() / 2) {
			return false;
		}
		
		return true;
	}
	
	/**
	 * Vérifie si une chaîne contient des nombres.
	 */
	private boolean containsNumbers(String text) {
		return text.matches(".*\\d+.*");
	}
	
	/**
	 * Vérifie si la première ligne est un header typique de tableau.
	 */
	private boolean isTypicalHeaderRow(List<String> row) {
		if (row.isEmpty()) return false;
		
		// Mots-clés typiques de headers
		String[] headerKeywords = {
			"date", "montant", "description", "désignation", "libellé", "référence",
			"quantité", "prix", "total", "valeur", "nombre", "coût", "taux",
			"exercice", "période", "année", "n°", "code", "intitulé",
			"capital", "nominal", "porteurs", "souscriptions", "rachats", "parts",
			"rubriques", "charges", "actif", "passif", "dénomination"
		};
		
		String rowText = String.join(" ", row).toLowerCase();
		
		int keywordCount = 0;
		for (String keyword : headerKeywords) {
			if (rowText.contains(keyword)) {
				keywordCount++;
			}
		}
		
		// Vérifier la présence de dates (format header)
		int dateCount = 0;
		for (String cell : row) {
			if (cell.trim().matches(".*\\d{2}[/-]\\d{2}[/-]\\d{4}.*")) {
				dateCount++;
			}
		}
		
		// Vérifier si la ligne est principalement textuelle (peu de chiffres)
		// → probable header si au moins 1 mot-clé ET peu de données numériques
		int numericCells = 0;
		int nonEmptyCells = 0;
		for (String cell : row) {
			if (!cell.trim().isEmpty()) {
				nonEmptyCells++;
				if (isNumericCell(cell)) numericCells++;
			}
		}
		
		// Header si:
		// - au moins 2 mots-clés
		// - OU au moins 2 dates dans la ligne
		// - OU 1 mot-clé ET pas de cellules numériques (ligne purement descriptive)
		return keywordCount >= 2 || dateCount >= 2 || 
			   (keywordCount >= 1 && numericCells == 0 && nonEmptyCells >= 1);
	}
	
	/**
	 * Vérifie si table2 a un header qui est une répétition de celui de table1.
	 * (certains PDFs répètent le header sur chaque page)
	 */
	private boolean hasRepeatedHeader(List<List<String>> table1, List<List<String>> table2) {
		if (table1.isEmpty() || table2.isEmpty()) return false;
		
		List<String> header1 = table1.get(0);
		List<String> header2 = table2.get(0);
		
		if (header1.size() != header2.size()) return false;
		
		// Comparer les cellules du header
		int matches = 0;
		for (int i = 0; i < header1.size(); i++) {
			String cell1 = header1.get(i).trim().toLowerCase();
			String cell2 = header2.get(i).trim().toLowerCase();
			
			if (cell1.equals(cell2) || 
				(cell1.isEmpty() && cell2.isEmpty()) ||
				(similarity(cell1, cell2) > 0.8)) {
				matches++;
			}
		}
		
		// Si >80% des cellules correspondent, c'est probablement le même header répété
		return (double) matches / header1.size() > 0.8;
	}
	
	/**
	 * Calcule la similarité entre deux chaînes (Jaccard ou simple).
	 */
	private double similarity(String s1, String s2) {
		if (s1.equals(s2)) return 1.0;
		if (s1.isEmpty() || s2.isEmpty()) return 0.0;
		
		// Similarité basée sur les mots communs
		String[] words1 = s1.split("\\s+");
		String[] words2 = s2.split("\\s+");
		
		int common = 0;
		for (String w1 : words1) {
			for (String w2 : words2) {
				if (w1.equals(w2)) {
					common++;
					break;
				}
			}
		}
		
		int total = Math.max(words1.length, words2.length);
		return total > 0 ? (double) common / total : 0.0;
	}

	private List<List<List<String>>> extractTableCells(JSONObject analyzeResult,
                                                   int startPage,
                                                   int endPage,
                                                   ExtractionRules rules) {

    List<List<List<String>>> allTables = new ArrayList<>();

    JSONArray tablesArray = analyzeResult.getJSONArray("tables");
    
    LOG.info("Azure a détecté {} tableaux, filtrage avec règles: {}", tablesArray.length(), rules);

    for (Object tableObj : tablesArray) {

        JSONObject tableJson = (JSONObject) tableObj;

        // ✅ 1. PAGE RANGE FILTER
        if (!isTableInPageRange(tableJson, startPage, endPage)) {
            LOG.debug("Table hors plage de pages");
            continue;
        }

        // ✅ 2. PARSE CELLS avec gestion columnSpan selon règles
        List<List<String>> tableCells = parseCells(tableJson, rules);
        
        // ✅ 3. MERGE UNDERLINED TEXT (nouvelle fonctionnalité)
        if (rules.isMergeUnderlinedText()) {
            tableCells = mergeUnderlinedRows(tableCells, rules);
        }
        
        // ✅ 3b. MERGE MULTILINE CELLS (fusion cellules sur plusieurs lignes)
        // Gère: headers multi-lignes + cellules de texte long split
        tableCells = mergeMultilineRows(tableCells);

        // ✅ noFilter: si activé, bypass tous les filtres (Python filtrera)
        if (!rules.isNoFilter()) {

            // ✅ 4. TAILLE MINIMALE (DYNAMIQUE)
            if (tableCells.size() < rules.getMinRows() ||
                (tableCells.size() > 0 && tableCells.get(0).size() < rules.getMinCols())) {
                LOG.debug("Table trop petite: {}x{} (min {}x{})",
                    tableCells.size(),
                    tableCells.size() > 0 ? tableCells.get(0).size() : 0,
                    rules.getMinRows(),
                    rules.getMinCols()
                );
                continue;
            }

            // ✅ 5. SINGLE COLUMN (DYNAMIQUE)
            if (rules.isExcludeSingleColumn() &&
                tableCells.size() > 0 &&
                tableCells.get(0).size() == 1) {
                LOG.debug("Table à colonne unique exclue");
                continue;
            }

            // ✅ 6. TOC DETECTION (DYNAMIQUE)
            if (rules.isExcludeToc() && isTocTable(tableCells, rules)) {
                LOG.debug("Table sommaire (TOC) exclue");
                continue;
            }

            // ✅ 7. PROPORTION NUMÉRIQUE (DYNAMIQUE)
            if (!hasEnoughNumbers(tableCells, rules.getMinNumericPercentage())) {
                LOG.debug("Table sans assez de nombres: < {}%",
                    rules.getMinNumericPercentage() * 100
                );
                continue;
            }

            // ✅ 8. EMPTY CELLS (DYNAMIQUE)
            double emptyPercentage = calculateEmptyPercentage(tableCells);
            if (emptyPercentage > rules.getMaxEmptyPercentage()) {
                LOG.debug("Table trop de cellules vides: {}% (max {}%)",
                    emptyPercentage * 100,
                    rules.getMaxEmptyPercentage() * 100
                );
                continue;
            }

        } else {
            LOG.info("[noFilter=true] Tous les filtres bypassés pour cette table");
        }

        LOG.info("✅ Table validée: {}x{} lignes", tableCells.size(), 
            tableCells.size() > 0 ? tableCells.get(0).size() : 0);
        allTables.add(tableCells);
    }
    
    LOG.info("Résultat final: {} tableaux validés sur {} détectés", allTables.size(), tablesArray.length());
    return allTables;
}


	/**
	 * Parse les cellules d'un tableau avec gestion columnSpan selon les règles
	 */
	private List<List<String>> parseCells(JSONObject tableJson, ExtractionRules rules) {
	    JSONArray cellsArray = tableJson.getJSONArray("cells");
	    List<List<String>> tableCells = new ArrayList<>();
	    int currentRowIndex = -1;
	
	    // Sort cells
	    List<JSONObject> sortedCells = new ArrayList<>();
	    for (Object cellObj : cellsArray) {
	        sortedCells.add((JSONObject) cellObj);
	    }
	    sortedCells.sort(
	        Comparator.comparingInt((JSONObject c) -> c.getInt("rowIndex"))
	                  .thenComparingInt(c -> c.optInt("columnIndex", 0))
	    );
	
	    for (JSONObject cellJson : sortedCells) {
	        int rowIndex = cellJson.getInt("rowIndex");
	        int colIndex = cellJson.optInt("columnIndex", 0);
	
	        if (rowIndex != currentRowIndex) {
	            tableCells.add(new ArrayList<>());
	            currentRowIndex = rowIndex;
	        }
	
	        List<String> currentRow = tableCells.get(rowIndex);
	
	        while (currentRow.size() < colIndex) {
	            currentRow.add("");
	        }
	
	        String content = cellJson.optString("content", "").trim();
	        
	        // ✅ Gestion columnSpan selon les règles
	        int colSpan = cellJson.optInt("columnSpan", 1);
	        
	        if ("duplicate".equals(rules.getColumnSpanHandling())) {
	            // Dupliquer le contenu dans toutes les colonnes fusionnées
	            for (int i = 0; i < colSpan; i++) {
	                currentRow.add(content);
	            }
	        } else {
	            // "merge": garder dans première colonne seulement
	            currentRow.add(content);
	            for (int i = 1; i < colSpan; i++) {
	                currentRow.add("");
	            }
	        }
	    }
	
	    return tableCells;
	}
	
	/**
	 * Fusionne les lignes de soulignement avec le texte au-dessus
	 * Azure détecte parfois "_____" ou "-----" comme des lignes séparées
	 */
	private List<List<String>> mergeUnderlinedRows(List<List<String>> table, ExtractionRules rules) {
	    if (table.size() <= 1) return table;
	    
	    List<List<String>> result = new ArrayList<>();
	    
	    for (int i = 0; i < table.size(); i++) {
	        List<String> row = table.get(i);
	        
	        // Vérifier si cette ligne est une ligne de soulignement
	        if (isUnderlineRow(row, rules)) {
	            // Ne pas ajouter cette ligne, elle sera fusionnée avec la précédente
	            LOG.debug("Ligne de soulignement détectée et supprimée: {}", row);
	            continue;
	        }
	        
	        result.add(row);
	    }
	    
	    return result;
	}
	
	/**
	 * Fusionne les lignes multi-lignes (headers + cellules de texte long)
	 * Pattern détecté: 
	 *   Row N: "VARIATION DE L'ACTIF NET..." | "" | ""
	 *   Row N+1: "D'EXPLOITATION" | 141003 | 104639
	 * Résultat:
	 *   Row N: "VARIATION DE L'ACTIF NET... D'EXPLOITATION" | 141003 | 104639
	 * 
	 * Traite TOUTES les lignes du tableau, pas seulement le header.
	 */
	private List<List<String>> mergeMultilineRows(List<List<String>> table) {
	    if (table.size() < 2) return table;
	    
	    List<List<String>> result = new ArrayList<>();
	    int i = 0;
	    
	    while (i < table.size()) {
	        List<String> currentRow = table.get(i);
	        
	        // Vérifier s'il y a une ligne suivante
	        if (i + 1 < table.size()) {
	            List<String> nextRow = table.get(i + 1);
	            
	            // Vérifier si nextRow est une continuation de currentRow
	            if (isRowContinuation(currentRow, nextRow)) {
	                // Fusionner les deux lignes
	                List<String> mergedRow = mergeTwoRows(currentRow, nextRow);
	                result.add(mergedRow);
	                
	                LOG.debug("Lignes fusionnées: {} + {} → {}", currentRow, nextRow, mergedRow);
	                
	                // Sauter la ligne suivante (déjà fusionnée)
	                i += 2;
	                continue;
	            }
	        }
	        
	        // Pas de fusion, ajouter la ligne telle quelle
	        result.add(currentRow);
	        i++;
	    }
	    
	    return result;
	}
	
	/**
	 * Fusionne deux lignes colonne par colonne
	 */
	private List<String> mergeTwoRows(List<String> row1, List<String> row2) {
	    List<String> merged = new ArrayList<>();
	    int maxCols = Math.max(row1.size(), row2.size());
	    
	    for (int i = 0; i < maxCols; i++) {
	        String cell1 = i < row1.size() ? row1.get(i).trim() : "";
	        String cell2 = i < row2.size() ? row2.get(i).trim() : "";
	        
	        // Fusionner avec espace si les deux ont du contenu
	        if (!cell1.isEmpty() && !cell2.isEmpty()) {
	            merged.add(cell1 + " " + cell2);
	        } else if (!cell1.isEmpty()) {
	            merged.add(cell1);
	        } else if (!cell2.isEmpty()) {
	            merged.add(cell2);
	        } else {
	            merged.add("");
	        }
	    }
	    
	    return merged;
	}
	
	/**
	 * Détecte si row2 est une continuation de row1
	 * 
	 * Pattern A - Header continuation:
	 *   Row1: "Du 01/01/2014 Au" | "Du 03/07/2012 Au"
	 *   Row2: "31/12/2014" | "31/12/2013"
	 * 
	 * Pattern B - Split cell with empty cells:
	 *   Row1: "VARIATION DE L'ACTIF NET..." | "" | ""
	 *   Row2: "D'EXPLOITATION" | 141003 | 104639
	 * 
	 * Critères:
	 * - Même nombre de colonnes
	 * - Row2 commence par un texte court OU row1 a des cellules vides à droite
	 * - Row1 semble incomplet (texte descriptif, fin sans ponctuation finale)
	 */
	private boolean isRowContinuation(List<String> row1, List<String> row2) {
	    if (row1.isEmpty() || row2.isEmpty()) return false;
	    if (row1.size() != row2.size()) return false;
	    
	    // Compter cellules vides dans row1 (surtout à droite)
	    int emptyCellsRow1 = 0;
	    int rightEmptyCellsRow1 = 0;
	    for (int i = 0; i < row1.size(); i++) {
	        if (row1.get(i).trim().isEmpty()) {
	            emptyCellsRow1++;
	            // Cellules à droite (dernières 2/3 colonnes)
	            if (i >= row1.size() * 0.33) {
	                rightEmptyCellsRow1++;
	            }
	        }
	    }
	    
	    // Pattern B: Si row1 a beaucoup de cellules vides à droite
	    // et row2 a du contenu dans ces mêmes cellules
	    if (rightEmptyCellsRow1 >= 1 && row1.size() >= 2) {
	        // Vérifier que row2 a du contenu là où row1 était vide
	        boolean hasContentInEmptyCells = false;
	        for (int i = 0; i < row1.size(); i++) {
	            if (row1.get(i).trim().isEmpty() && !row2.get(i).trim().isEmpty()) {
	                hasContentInEmptyCells = true;
	                break;
	            }
	        }
	        
	        if (hasContentInEmptyCells) {
            String firstCellRow1 = row1.get(0).trim();
            String firstCellRow2 = row2.get(0).trim();

            // EXCLUSION 1: Ne pas fusionner si row2 commence par un identifiant de sous-catégorie
            if (isSubcategoryIdentifier(firstCellRow2)) {
                LOG.debug("Pas de fusion: row2 est une sous-catégorie: '{}'", firstCellRow2);
                return false;
            }
            
            // Compter les cellules numériques dans row1 et row2
            int numericInRow1 = 0;
            int numericInRow2 = 0;
            for (int k = 1; k < row1.size(); k++) {
                if (isNumericCell(row1.get(k))) numericInRow1++;
            }
            for (int k = 1; k < row2.size(); k++) {
                if (isNumericCell(row2.get(k))) numericInRow2++;
            }
            
            // EXCLUSION 2: Ne pas fusionner si row1 ET row2 ont toutes deux des valeurs numériques
            // (ce sont deux lignes de données distinctes)
            // MAIS si row1 n'a PAS de valeurs et row2 en a, c'est une continuation valide
            if (numericInRow1 >= 1 && numericInRow2 >= 1) {
                LOG.debug("Pas de fusion: row1 et row2 ont toutes deux des valeurs numériques");
                return false;
            }

            // Contrainte: row1 doit avoir une 1ère cellule assez longue (> 10 chars)
            boolean row1FirstCellLong = firstCellRow1.length() > 10;

            // Contrainte: row2 doit ressembler à une continuation
            boolean row2LooksContinuation = false;
            if (!firstCellRow2.isEmpty() && firstCellRow2.length() < 40) {
                char firstChar = firstCellRow2.charAt(0);
                boolean startsLowerCase = Character.isLowerCase(firstChar);
                
                // Apostrophe d'élision: "D'EXPLOITATION", "L'ACTIF", "D'EXERCICE"
                boolean startsApostrophe = firstCellRow2.length() > 2 &&
                    (firstCellRow2.charAt(1) == '\'' || firstCellRow2.charAt(1) == '\u2019');
                
                // Connecteurs français suivis d'un espace
                boolean startsConnector = firstCellRow2.toLowerCase().matches(
                    "^(et|ou|de|du|des|le|la|les|au|aux|en|par|sur|sous|avec|pour|ni|mais|donc|car)\\s.*"
                );
                
                row2LooksContinuation = (startsLowerCase || startsConnector || startsApostrophe)
                    && !isSubcategoryIdentifier(firstCellRow2);
            }
            
            // EXCLUSION 3: ALL-CAPS = nouvelle catégorie, SAUF si c'est une apostrophe d'élision
            if (!firstCellRow2.isEmpty() && firstCellRow2.equals(firstCellRow2.toUpperCase()) 
                && firstCellRow2.length() > 3 && firstCellRow2.matches(".*[A-ZÀ-Ÿ].*")) {
                boolean isElision = firstCellRow2.length() > 2 && 
                    (firstCellRow2.charAt(1) == '\'' || firstCellRow2.charAt(1) == '\u2019');
                if (!isElision) {
                    LOG.debug("Pas de fusion: row2 commence par ALL-CAPS sans élision: '{}'", firstCellRow2);
                    return false;
                }
            }

            if (row1FirstCellLong && row2LooksContinuation) {
                LOG.info("Fusion continuation: '{}...' + '{}'", 
                    firstCellRow1.substring(0, Math.min(30, firstCellRow1.length())), firstCellRow2);
	                return true;
	            }
	        }
	    }
	    
	    // Pattern A: Header continuation (critères existants)
	    return isHeaderContinuation(row1, row2);
	}
	
	/**
	 * Détecte si la 2ème ligne est une continuation de header UNIQUEMENT pour
	 * le pattern de dates coupées:
	 *   Row1: "Du 01/01/2014 Au" | "Du 03/07/2012 Au"     ← Texte + dates incomplètes
	 *   Row2: "31/12/2014" | "31/12/2013"                 ← Seulement dates courtes
	 * 
	 * TRÈS restrictif: NE fusionne QUE si:
	 * - Row1 a des cellules qui finissent par un connecteur incomplet ("Au", "Du", "au", etc.)
	 * - Row2 a des cellules qui sont des dates/nombres courts (<15 chars)
	 * - Row2 n'a PAS de cellule texte qui ressemble à un label
	 */
	private boolean isHeaderContinuation(List<String> row1, List<String> row2) {
	    if (row1.isEmpty() || row2.isEmpty()) return false;
	    if (row1.size() != row2.size()) return false;
	    
	    // Vérifier que row2 ne contient PAS de label texte (non-date, non-nombre)
	    for (String cell2 : row2) {
	        String trimmed = cell2.trim();
	        if (trimmed.isEmpty()) continue;
	        // Si c'est un nombre ou une date, OK
	        if (isNumericCell(trimmed)) continue;
	        if (trimmed.matches(".*\\d{2}[/\\-]\\d{2}[/\\-]\\d{2,4}.*")) continue;
	        if (trimmed.matches("^\\d{4}$")) continue;
	        // Si c'est un texte court (<=15 chars) contenant au moins un chiffre, OK (date partielle)
	        if (trimmed.length() <= 15 && trimmed.matches(".*\\d+.*")) continue;
	        // Sinon c'est un label texte → PAS une continuation de header
	        LOG.debug("[HEADER-CONT] REFUSÉ: row2 contient un label texte: '{}'", trimmed);
	        return false;
	    }
	    
	    // Vérifier que row1 a au moins une cellule qui se termine par un connecteur incomplet
	    int incompleteCount = 0;
	    Pattern incompletePattern = Pattern.compile(
	        "(?i).*(\\b(au|du|le|la|les|de|des|en|à|a|par|pour|sur|sous|avec)\\s*)$"
	    );
	    for (String cell1 : row1) {
	        String trimmed = cell1.trim();
	        if (trimmed.isEmpty()) continue;
	        if (incompletePattern.matcher(trimmed).matches()) {
	            incompleteCount++;
	        }
	    }
	    
	    // Au moins une cellule de row1 doit être incomplète
	    if (incompleteCount == 0) {
	        LOG.debug("[HEADER-CONT] REFUSÉ: aucune cellule de row1 ne se termine par un connecteur");
	        return false;
	    }
	    
	    LOG.debug("[HEADER-CONT] Continuation de header détectée ({} cellule(s) incomplète(s))", incompleteCount);
	    return true;
	}
	
	/**
	 * Détecte si une chaîne représente un identifiant de sous-catégorie comptable.
	 * Patterns reconnus:
	 * - Lettres suivies de tiret/point: "a-", "b-", "A-", "a.", "b.", "I.", "II."
	 * - Chiffres suivis de tiret/point: "1-", "2-", "1.", "2."
	 * - Lettres avec parenthèses: "a)", "b)", "(a)", "(b)"
	 * - Chiffres romains: "i)", "ii)", "I.", "II."
	 * 
	 * Exemples positifs: "a-en début d'exercice", "b - en fin d'exercice", "1. Introduction"
	 * Exemples négatifs: "de l'exercice", "D'EXPLOITATION", "du 01/01"
	 */
	private boolean isSubcategoryIdentifier(String text) {
	    if (text == null || text.isEmpty()) return false;
	    
	    // Enlever les espaces en début (le texte peut commencer par des espaces/indentation)
	    String trimmed = text.stripLeading();
	    if (trimmed.isEmpty()) return false;
	    
	    // Pattern 1: Lettre(s) + tiret/point/parenthèse + espace optionnel + suite
	    // Exemples: "a-en début", "b- quelque chose", "A. titre", "I- chapitre", "a -en début"
	    if (trimmed.matches("(?i)^[a-z]{1,3}\\s*[\\-\\.\\)]\\s*\\S.*")) {
	        return true;
	    }
	    
	    // Pattern 2: Chiffre(s) + tiret/point + espace optionnel + suite
	    // Exemples: "1-introduction", "2. paragraphe", "12- suite"
	    if (trimmed.matches("^\\d{1,2}\\s*[\\-\\.\\)]\\s*\\S.*")) {
	        return true;
	    }
	    
	    // Pattern 3: Parenthèse ouvrante + lettre/chiffre + parenthèse fermante
	    // Exemples: "(a) quelque chose", "(1) introduction"
	    if (trimmed.matches("(?i)^\\([a-z0-9]{1,3}\\)\\s*\\S.*")) {
	        return true;
	    }
	    
	    // Pattern 4: Chiffres romains (I, II, III, IV, V, VI, VII, VIII, IX, X)
	    // Exemples: "I. chapitre", "II- section", "III) partie"
	    if (trimmed.matches("(?i)^(I{1,3}|IV|VI{0,3}|IX|X)\\s*[\\-\\.\\)]\\s*\\S.*")) {
	        return true;
	    }
	    
	    // Pattern 5: Lettre seule suivie d'espace(s) puis tiret puis suite
	    // Exemples: "a - en début", "B - quelque chose", "b  -  texte"
	    if (trimmed.matches("(?i)^[a-z]\\s+[\\-]\\s*\\S.*")) {
	        return true;
	    }
	    
	    // Pattern 6: Lettre + espace + tiret collé au texte
	    // Exemples: "a -en début" (sans espace après tiret)
	    if (trimmed.matches("(?i)^[a-z]\\s+[\\-]\\S.*")) {
	        return true;
	    }
	    
	    return false;
	}
	
	/**
	 * Détecte si une ligne est composée principalement de caractères de soulignement
	 */
	private boolean isUnderlineRow(List<String> row, ExtractionRules rules) {
	    if (row.isEmpty()) return false;
	    
	    // Concaténer toutes les cellules
	    String fullRow = String.join("", row);
	    if (fullRow.isEmpty()) return false;
	    
	    // Enlever les espaces pour l'analyse
	    String rowWithoutSpaces = fullRow.replaceAll("\\s+", "");
	    if (rowWithoutSpaces.isEmpty()) return false;
	    
	    // Compter les caractères de soulignement (sans compter les espaces)
	    long underlineCount = 0;
	    for (char c : rowWithoutSpaces.toCharArray()) {
	        String charStr = String.valueOf(c);
	        if (rules.getUnderlineChars().contains(charStr)) {
	            underlineCount++;
	        }
	    }
	    
	    // Calculer le ratio par rapport aux caractères non-espaces
	    double ratio = (double) underlineCount / rowWithoutSpaces.length();
	    boolean isUnderline = ratio >= rules.getUnderlineDetectionThreshold();
	    
	    if (isUnderline) {
	        LOG.debug("Ligne underline détectée: '{}' (ratio: {:.2f}, seuil: {:.2f})", 
	                  fullRow, ratio, rules.getUnderlineDetectionThreshold());
	    }
	    
	    return isUnderline;
	}
	
	/**
	 * Détecte si une table est un sommaire (TOC)
	 */
	private boolean isTocTable(List<List<String>> table, ExtractionRules rules) {
	    if (table.isEmpty()) return false;
	    
	    // Vérifier première ligne pour keywords
	    String firstRow = String.join(" ", table.get(0)).toLowerCase();
	    
	    for (String keyword : rules.getTocKeywords()) {
	        if (firstRow.contains(keyword.toLowerCase())) {
	            LOG.debug("TOC détecté par keyword: '{}'", keyword);
	            return true;
	        }
	    }
	    
	    // Vérifier patterns regex
	    for (String patternStr : rules.getExcludePatterns()) {
	        try {
	            Pattern pattern = Pattern.compile(patternStr);
	            if (pattern.matcher(firstRow).find()) {
	                LOG.debug("TOC détecté par pattern: '{}'", patternStr);
	                return true;
	            }
	        } catch (Exception e) {
	            LOG.warn("Invalid regex pattern: {}", patternStr);
	        }
	    }
	    
	    return false;
	}
	
	/**
	 * Vérifie proportion de cellules numériques (DYNAMIQUE)
	 */
	private boolean hasEnoughNumbers(List<List<String>> table, double minPercentage) {
	    long numeric = table.stream()
	        .flatMap(List::stream)
	        .filter(s -> isNumericCell(s))
	        .count();
	    
	    long total = table.stream()
	        .flatMap(List::stream)
	        .count();
	    
	    return total > 0 && (double) numeric / total >= minPercentage;
	}
	
	/**
	 * Calcule le pourcentage de cellules vides
	 */
	/**
	 * Détecte si une cellule contient une valeur numérique.
	 * Gère: espaces comme séparateurs de milliers, %, DT, TND, parenthèses comptables, signes +/-
	 * Exemples acceptés: "11 087 861", "-1 610 427", "-13,03%", "(295 238)", "0", "5,42 %", "141 003 DT"
	 */
	private boolean isNumericCell(String s) {
	    if (s == null || s.trim().isEmpty()) return false;
	    // Normaliser: retirer espaces insecçables, espaces simples (sép. milliers), suffixes unités
	    String normalized = s.trim()
	        .replaceAll("\u00a0", " ")          // espace insécable
	        .replaceAll("(?i)\\s*(DT|TND|dinars?)\\s*$", "")  // suffixe monnaie
	        .replaceAll("%\\s*$", "")           // suffixe %
	        .replaceAll("[\\(\\)]", "")         // parenthèses comptables
	        .replaceAll("\\s+", "")             // tous espaces restants
	        .trim();
	    // Accepter: optionnel signe, au moins 1 chiffre, séparateurs , ou .
	    return normalized.matches("[-+]?\\d[\\d,.]*");
	}

	private double calculateEmptyPercentage(List<List<String>> table) {
	    long empty = table.stream()
	        .flatMap(List::stream)
	        .filter(s -> s == null || s.trim().isEmpty())
	        .count();
	    
	    long total = table.stream()
	        .flatMap(List::stream)
	        .count();
	    
	    return total > 0 ? (double) empty / total : 0.0;
	}


	private boolean isTableInPageRange(JSONObject tableJson,
									int startPage,
									int endPage) {

		JSONArray regions = tableJson.optJSONArray("boundingRegions");
		if (regions == null) return false;

		for (int i = 0; i < regions.length(); i++) {
			int page = regions.getJSONObject(i).getInt("pageNumber");
			if (page >= startPage && page <= endPage) {
				return true;
			}
		}
		return false;
	}


}