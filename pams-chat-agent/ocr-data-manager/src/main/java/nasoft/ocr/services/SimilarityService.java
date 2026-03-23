package nasoft.ocr.services;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Year;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.text.similarity.CosineDistance;
import org.apache.commons.text.similarity.JaccardSimilarity;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import nasoft.ocr.models.DateIndex;
import nasoft.ocr.models.Dictionary;
import nasoft.ocr.models.FinalResult;
import nasoft.ocr.models.OcrItem;
import nasoft.ocr.records.FinalResultRecord;
import nasoft.ocr.records.SimilarityResultRecord;
import nasoft.ocr.utils.HungarianAlgorithm;

@Service
public class SimilarityService {
	private static Logger LOG = LoggerFactory.getLogger(SimilarityService.class);

	@Autowired
	private RestTemplate restTemplate;

	@Value("${finStatement.url}")
	private String finStatementUrl;

	@Value("${similarity.threshold}")
	private double similarityThreshold;

	@Value("${similarity.composite.weights.cosine}")
	private double cosineWeight;

	@Value("${similarity.composite.weights.jaccard}")
	private double jaccardWeight;

	@Value("${similarity.composite.weights.levenshtein}")
	private double levenshteinWeight;

	@Value("${similarity.minimum-acceptable}")
	private double minimumAcceptable;

	@Value("${similarity.adaptive-threshold-percentile}")
	private int adaptiveThresholdPercentile;

    private static final Pattern EXCLUDED_PATTERN = Pattern.compile(
        "^(somme|montant|bilan|chiffre.*affaires|marge|solde).*",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    
    private static final Pattern NUMERIC_PATTERN = Pattern.compile("^[-+]?\\d[\\d,.\\s]*$");

	/**
	 * Retrieves financial data from the specified API endpoint.
	 * 
	 * @param id The ID used to query the financial data.
	 * @return A list of Dictionary objects containing the retrieved financial data.
	 * @throws Exception If an I/O error occurs while communicating with the API.
	 */
public List<Dictionary> retrieveDataFromRequest(String id) throws IOException {

    ObjectMapper mapper = new ObjectMapper();

    JsonNode jsonNode = mapper.readTree(id);
    List<Dictionary> items = new ArrayList<>();

    for (JsonNode node : jsonNode) {

        String code = node.hasNonNull("code")
                ? node.get("code").asText()
                : null;

        String libelle = node.hasNonNull("libelle")
                ? node.get("libelle").asText().toUpperCase()
                : null;

        String referentCode = null;
        String referentLibelle = null;

        JsonNode ref = node.get("referedEntity");
        if (ref != null && !ref.isNull()) {

            if (ref.hasNonNull("code")) {
                referentCode = ref.get("code").asText();
            }

            if (ref.hasNonNull("libelle")) {
                referentLibelle = ref.get("libelle").asText().toUpperCase();
            }
        }

        Dictionary item = new Dictionary(
                code,
                libelle,
                referentCode,
                referentLibelle
        );

        items.add(item);
    }

    return items;
}

public List<Dictionary> retrieveData(String id) throws IOException {
		// Construct the URL for the API endpoint
		String url = finStatementUrl + id;
		ResponseEntity<String> responseEntity;
		try {
			// retrieve data from the API
			responseEntity = restTemplate.getForEntity(url, String.class);
			LOG.info("Successfully retrieving data from the finStatementApi");
		} catch (Exception e) {
			LOG.error("Problem retrieving data from the finStatementApi");
			// Return an empty list
			return new ArrayList<>();
		}

		// Check if the HTTP response status is not OK (200)
		if (responseEntity.getStatusCode() != HttpStatus.OK) {
			// Return an empty list
			return new ArrayList<>();
		}

		// Parse the JSON response body into a JsonNode
		JsonNode jsonNode = new ObjectMapper().readTree(responseEntity.getBody());
		List<Dictionary> items = new ArrayList<>();
		// Iterate through each JSON node and create Dictionary objects
		for (JsonNode node : jsonNode) {
			// Create a new Dictionary object and add it to the list
			String code = node.get("code").asText();
			String libelle = node.get("libelle").asText().toUpperCase();
			String referentCode = null;
			String referentLibelle = null;
			JsonNode ref = node.get("referedEntity");
			if (ref != null && !ref.isNull()) {
				JsonNode refCodeNode = ref.get("code");
				JsonNode refLibNode = ref.get("libelle");
				if (refCodeNode != null && !refCodeNode.isNull()) {
					referentCode = refCodeNode.asText();
				}
				if (refLibNode != null && !refLibNode.isNull()) {
					referentLibelle = refLibNode.asText().toUpperCase();
				}
			}
			Dictionary item = new Dictionary(code, libelle, referentCode, referentLibelle);
			items.add(item);
		}
		// Return the list of Dictionary objects containing the retrieved financial data
		return items;
	}


	/**
	 * Calculates the similarity between financial data and OCR responses.
	 * 
	 * This method processes financial data and OCR responses to identify
	 * similarities. It extracts relevant data from OCR responses and compares it
	 * with financial data to find matches. The method utilizes similarity metrics
	 * such as Cosine Similarity and Jaccard Similarity for comparison.
	 * 
	 * @param finData     The list of financial data represented as Dictionary
	 *                    objects.
	 * @param ocrResponse The OCR responses, which are lists of tables, each
	 *                    containing lists of rows, each containing strings.
	 * @param fileName    The name of the file being processed.
	 * @return A SimilarityResultRecord containing the unique years and the final
	 *         matching results.
	 */

    
	 public SimilarityResultRecord similarity(List<Dictionary> finData, 
                                           List<List<List<String>>> ocrResponse,
                                           String fileName) {
        LOG.info("=== STARTING ENHANCED SIMILARITY CALCULATION ===");
        LOG.info("File: {}, Dictionary entries: {}", fileName, finData.size());
        
        List<FinalResult> results = new ArrayList<>();
        Set<String> uniqueYears = new HashSet<>();
        List<String> uniqueYearsList = new ArrayList<>();
        
        try {
            // 1. Process dates and extract years
            LOG.debug("Processing dates...");
            List<DateIndex> dateIndices = new ArrayList<>();
            processDates(ocrResponse, uniqueYears, dateIndices);
            uniqueYearsList.addAll(uniqueYears);
            LOG.info("Found {} unique years: {}", uniqueYears.size(), uniqueYears);
            
            // 2. Flatten OCR data with metadata
            LOG.debug("Flattening OCR data...");
            List<OcrItem> ocrItems = flattenOcrData(ocrResponse);
            LOG.info("Flattened {} OCR items from {} tables", ocrItems.size(), ocrResponse.size());
            
        if (ocrItems.isEmpty()) {
            LOG.warn("No valid OCR items found after flattening");
            // Return empty clean records
            List<FinalResultRecord> emptyCleanRecords = new ArrayList<>();
            return new SimilarityResultRecord(uniqueYearsList, emptyCleanRecords);
        }
            
            // 3. Build similarity matrix
            LOG.debug("Building similarity matrix...");
            long startTime = System.currentTimeMillis();
            double[][] similarityMatrix = buildSimilarityMatrix(finData, ocrItems);
            long matrixTime = System.currentTimeMillis() - startTime;
            LOG.info("Built {}} similarity matrix in {}ms", 
                    similarityMatrix.length + "x" + similarityMatrix[0].length, matrixTime);
            
            // 4. Calculate adaptive threshold
            double threshold = calculateAdaptiveThreshold(similarityMatrix);
            LOG.info("Adaptive threshold calculated: {:.3f}", threshold);
            
            // 5. Find optimal matching using Hungarian Algorithm
            LOG.debug("Finding optimal matching...");
            startTime = System.currentTimeMillis();
            int[] assignments = findOptimalMatching(similarityMatrix, threshold);
            long matchingTime = System.currentTimeMillis() - startTime;
            
            // Count valid assignments
            int validAssignments = 0;
            for (int i = 0; i < assignments.length; i++) {
                if (assignments[i] >= 0 && similarityMatrix[i][assignments[i]] >= threshold) {
                    validAssignments++;
                }
            }
            LOG.info("Found {} valid matches out of {} dictionary entries in {}ms", 
                    validAssignments, finData.size(), matchingTime);
            
            // 6. Process matches and extract values
            LOG.debug("Processing matches and extracting values...");
            Map<String, FinalResult> resultMap = processMatches(finData, ocrItems, similarityMatrix, 
                                                               assignments, threshold, ocrResponse, 
                                                               dateIndices, fileName);
            
            // 7. Handle unmatched entries
            handleUnmatchedEntries(finData, resultMap, ocrItems, similarityMatrix, threshold);
            
            // 8. Convert to final results
results.addAll(resultMap.values().stream()
    .filter(result -> result != null)
    .collect(Collectors.toList()));            
            LOG.info("=== SIMILARITY CALCULATION COMPLETE ===");
            LOG.info("Total matches found: {} ({}% of dictionary entries)", 
                    results.size(), String.format("%.1f", (results.size() * 100.0 / finData.size())));
            
            // Log top matches for debugging
            logTopMatches(results, 5);
            
        } catch (Exception e) {
            LOG.error("Error in enhanced similarity calculation", e);
            e.printStackTrace();
        }
         List<FinalResultRecord> cleanRecords = transformToCleanRecords(results);
    
    // Create the record with clean data
    return new SimilarityResultRecord(
        new ArrayList<>(uniqueYears),  // Convert Set to List
        cleanRecords
    );
    }
    
    /**
     * Flattens OCR data with position metadata
     */
    private List<OcrItem> flattenOcrData(List<List<List<String>>> ocrResponse) {
        List<OcrItem> flattened = new ArrayList<>();
        
        for (int tableIdx = 0; tableIdx < ocrResponse.size(); tableIdx++) {
            List<List<String>> table = ocrResponse.get(tableIdx);
            
            for (int rowIdx = 0; rowIdx < table.size(); rowIdx++) {
                List<String> row = table.get(rowIdx);
                
                for (int colIdx = 0; colIdx < row.size(); colIdx++) {
                    String text = row.get(colIdx);
                    
                    // Skip empty or whitespace-only cells
                    if (text == null || text.trim().isEmpty()) {
                        continue;
                    }
                    
                    // Skip excluded cells
                    if (isExcludedCell(text, rowIdx, colIdx, table)) {
                        continue;
                    }
                    
                    // Create OCR item with metadata
                    OcrItem item = createOcrItem(tableIdx, rowIdx, colIdx, text, table, row);
                    flattened.add(item);
                }
            }
        }
        
        return flattened;
    }
    
    /**
     * Creates an OCR item with full metadata
     */
    private OcrItem createOcrItem(int tableIdx, int rowIdx, int colIdx, String text, 
                                 List<List<String>> table, List<String> row) {
        OcrItem item = new OcrItem(text, tableIdx, rowIdx, colIdx);
        
        // Normalize text
        item.setNormalizedText(normalizeOcrText(text));
        item.setRowSize(row.size());
        item.setTableSize(table.size());
        
        // Collect context
        item.setLeftContext(colIdx > 0 ? row.get(colIdx - 1) : "");
        item.setRightContext(colIdx < row.size() - 1 ? row.get(colIdx + 1) : "");
        item.setAboveContext(rowIdx > 0 && table.get(rowIdx - 1).size() > colIdx ? 
                            table.get(rowIdx - 1).get(colIdx) : "");
        item.setBelowContext(rowIdx < table.size() - 1 && table.get(rowIdx + 1).size() > colIdx ? 
                            table.get(rowIdx + 1).get(colIdx) : "");
        
        return item;
    }
    
    /**
     * Normalizes OCR text for comparison
     */
    private String normalizeOcrText(String text) {
        if (text == null) return "";
        
        String normalized = text;
        
        // Remove special characters but keep important ones
        normalized = normalized.replaceAll("[\\n\\r\\t]+", " ");
        normalized = normalized.replace("\u00A0", " "); // Non-breaking space
        normalized = normalized.replaceAll("[\u200B-\u200D\uFEFF]", ""); // Zero-width spaces
        
        // Remove common OCR artifacts
        normalized = normalized.replaceAll("\\|", "I");
        normalized = normalized.replaceAll("\\[", "I");
        normalized = normalized.replaceAll("\\]", "I");
        normalized = normalized.replaceAll("\\{", "(");
        normalized = normalized.replaceAll("\\}", ")");
        
        // Normalize quotes and apostrophes
        normalized = normalized.replaceAll("['\"`´]", "'");
        
        // Remove multiple spaces
        normalized = normalized.replaceAll("\\s+", " ").trim();
        
        // Convert to uppercase for consistent comparison
        normalized = normalized.toUpperCase();
        
        // Remove accents
        normalized = StringUtils.stripAccents(normalized);
        
        return normalized;
    }
    
    /**
     * Checks if a cell should be excluded from matching
     */
    private boolean isExcludedCell(String text, int rowIdx, int colIdx, List<List<String>> table) {
        if (text == null || text.trim().isEmpty()) return true;
        
        String normalized = text.trim();
        
        // Check against exclusion patterns
        if (EXCLUDED_PATTERN.matcher(normalized).matches()) {
            return true;
        }
        
        // Check if numeric-only
        if (NUMERIC_PATTERN.matcher(normalized).matches()) {
            return true;
        }
        
        // Check for percentage signs
        if (normalized.contains("%")) {
            return true;
        }
        
        // Check for common header terms in first few rows
        if (rowIdx < 3) {
            String[] headerExclusions = {"année", "exercice", "date", "période", "n°", "numéro", 
                                        "ref", "référence", "code", "désignation", "libellé"};
            String lowerText = normalized.toLowerCase();
            for (String exclusion : headerExclusions) {
                if (lowerText.contains(exclusion)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Builds similarity matrix between dictionary entries and OCR items
     */
    private double[][] buildSimilarityMatrix(List<Dictionary> dictionaryEntries, List<OcrItem> ocrItems) {
        int dictSize = dictionaryEntries.size();
        int ocrSize = ocrItems.size();
        
        double[][] similarityMatrix = new double[dictSize][ocrSize];
        
        for (int i = 0; i < dictSize; i++) {
            Dictionary dictEntry = dictionaryEntries.get(i);
            String dictText = normalizeDictionaryText(dictEntry.getLibelle());
            
            for (int j = 0; j < ocrSize; j++) {
                OcrItem ocrItem = ocrItems.get(j);
                double similarity = calculateSimilarityWithStrategies(dictText, ocrItem);
                similarityMatrix[i][j] = similarity;
            }
        }
        
        return similarityMatrix;
    }
    
    /**
     * Calculates similarity using multiple strategies
     */
    private double calculateSimilarityWithStrategies(String dictText, OcrItem ocrItem) {
        double bestScore = 0.0;
        
        // Strategy 1: Direct text comparison
        double directScore = calculateCompositeSimilarity(dictText, ocrItem.getNormalizedText());
        bestScore = Math.max(bestScore, directScore);
        
        // Strategy 2: Comparison with right context
        if (directScore < 0.85) {
            String withRightContext = ocrItem.getNormalizedText() + " " + 
                                     normalizeOcrText(ocrItem.getRightContext());
            double contextScore = calculateCompositeSimilarity(dictText, withRightContext);
            bestScore = Math.max(bestScore, contextScore);
        }
        
        // Strategy 3: Check for partial matches
        if (dictText.length() > 5 && ocrItem.getNormalizedText().length() > 5) {
            if (dictText.contains(ocrItem.getNormalizedText()) || 
                ocrItem.getNormalizedText().contains(dictText)) {
                double substringBonus = 0.15;
                bestScore = Math.min(1.0, bestScore + substringBonus);
            }
        }
        
        // Strategy 4: Remove common prefixes/suffixes
        String cleanedDict = removeCommonPrefixes(dictText);
        String cleanedOcr = removeCommonPrefixes(ocrItem.getNormalizedText());
        if (!cleanedDict.equals(dictText) || !cleanedOcr.equals(ocrItem.getNormalizedText())) {
            double cleanedScore = calculateCompositeSimilarity(cleanedDict, cleanedOcr);
            bestScore = Math.max(bestScore, cleanedScore);
        }
        
        return bestScore;
    }
    
    /**
     * Removes common prefixes from text
     */
    private String removeCommonPrefixes(String text) {
        if (text == null || text.length() < 5) return text;
        
        String[] prefixes = {"TOTAL ", "SOMME ", "MONTANT ", "VARIATION ", "AJUSTEMENT ", "ECART "};
        String result = text;
        
        for (String prefix : prefixes) {
            if (result.startsWith(prefix)) {
                result = result.substring(prefix.length()).trim();
                break;
            }
        }
        
        return result;
    }
    
    /**
     * Calculates composite similarity score
     */
    private double calculateCompositeSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null || text1.isEmpty() || text2.isEmpty()) {
            return 0.0;
        }
        
        CosineDistance cosineDistance = new CosineDistance();
        JaccardSimilarity jaccardSimilarity = new JaccardSimilarity();
        LevenshteinDistance levenshteinDistance = new LevenshteinDistance();
        
        // Calculate individual scores
        double cosineScore = 1.0 - cosineDistance.apply(text1, text2);
        double jaccardScore = jaccardSimilarity.apply(text1, text2);
        
        // Normalize Levenshtein to similarity score
        int maxLen = Math.max(text1.length(), text2.length());
        double levenshteinScore = maxLen > 0 ? 
            1.0 - ((double) levenshteinDistance.apply(text1, text2) / maxLen) : 0.0;
        
        // Apply weights from config
        double compositeScore = 
            (cosineScore * cosineWeight) + 
            (jaccardScore * jaccardWeight) + 
            (levenshteinScore * levenshteinWeight);
        
        return Math.min(1.0, Math.max(0.0, compositeScore));
    }
    
    /**
     * Normalizes dictionary text for comparison
     */
    private String normalizeDictionaryText(String text) {
        if (text == null) return "";
        
        String normalized = text.toUpperCase();
        normalized = StringUtils.stripAccents(normalized);
        normalized = normalized.replaceAll("[^\\p{L}\\p{N}\\s-]", " ");
        normalized = normalized.replaceAll("\\s+", " ").trim();
        
        return normalized;
    }
    
    /**
     * Calculates adaptive threshold based on score distribution
     */
    private double calculateAdaptiveThreshold(double[][] similarityMatrix) {
        List<Double> allScores = new ArrayList<>();
        
        for (double[] row : similarityMatrix) {
            for (double score : row) {
                if (score > 0.1) { // Ignore very low scores
                    allScores.add(score);
                }
            }
        }
        
        if (allScores.isEmpty()) {
            return minimumAcceptable;
        }
        
        Collections.sort(allScores);
        
        // Calculate percentile
        int percentile = adaptiveThresholdPercentile;
        int index = (int) Math.ceil((percentile / 100.0) * allScores.size()) - 1;
        index = Math.max(0, Math.min(index, allScores.size() - 1));
        
        double percentileScore = allScores.get(index);
        
        // Use the higher of percentile or minimum acceptable
        double threshold = Math.max(percentileScore, minimumAcceptable);
        
        // Cap at reasonable maximum
        threshold = Math.min(threshold, 0.95);
        
        LOG.debug("Score distribution: min={:.3f}, 25th={:.3f}, median={:.3f}, 75th={:.3f}, max={:.3f}", 
                 allScores.get(0),
                 allScores.get((int)(allScores.size() * 0.25)),
                 allScores.get(allScores.size() / 2),
                 allScores.get((int)(allScores.size() * 0.75)),
                 allScores.get(allScores.size() - 1));
        
        return threshold;
    }
    
    /**
     * Finds optimal matching using Hungarian Algorithm
     */
    private int[] findOptimalMatching(double[][] similarityMatrix, double threshold) {
        // Apply threshold
        double[][] filteredMatrix = applyThreshold(similarityMatrix, threshold);
        
        // Run Hungarian algorithm
        HungarianAlgorithm hungarian = new HungarianAlgorithm(filteredMatrix);
        return hungarian.execute();
    }
    
    private double[][] applyThreshold(double[][] matrix, double threshold) {
        double[][] filtered = new double[matrix.length][matrix[0].length];
        
        for (int i = 0; i < matrix.length; i++) {
            for (int j = 0; j < matrix[i].length; j++) {
                filtered[i][j] = matrix[i][j] >= threshold ? matrix[i][j] : 0.0;
            }
        }
        
        return filtered;
    }
    
    /**
     * Processes matches and creates results
     */
   private Map<String, FinalResult> processMatches(List<Dictionary> finData, List<OcrItem> ocrItems,
                                               double[][] similarityMatrix, int[] assignments,
                                               double threshold, List<List<List<String>>> ocrResponse,
                                               List<DateIndex> dateIndices, String fileName) {
    Map<String, FinalResult> resultMap = new HashMap<>();
    
    for (int i = 0; i < assignments.length; i++) {
        int assignedOcrIdx = assignments[i];
        
        if (assignedOcrIdx >= 0 && similarityMatrix[i][assignedOcrIdx] >= threshold) {
            Dictionary dict = finData.get(i);
            OcrItem matchedItem = ocrItems.get(assignedOcrIdx);
            double matchScore = similarityMatrix[i][assignedOcrIdx];
            
            // Determine target code (handle referents)
            String targetCode = determineTargetCode(dict, resultMap);
            if (targetCode == null) {
                continue; // Skip if referent already processed
            }
            
            // Extract associated values
            List<String> values = extractAssociatedValues(matchedItem, ocrResponse, dateIndices);
            
            // CRITICAL: Only create result if values were found
            if (!values.isEmpty()) {
                String targetLibelle = determineTargetLibelle(dict, targetCode);
                
                // Create enriched FinalResult
                FinalResult finalResult = createEnrichedResult(targetCode, targetLibelle, 
                                                              values, matchScore, dict, matchedItem);
                
                resultMap.put(targetCode, finalResult);
                
                LOG.debug("Match #{:03d}: '{}' (code: {}) -> '{}' [score: {:.3f}, values: {}]",
                         i + 1, dict.getLibelle(), targetCode,
                         matchedItem.getOriginalText().length() > 30 ? 
                         matchedItem.getOriginalText().substring(0, 30) + "..." : 
                         matchedItem.getOriginalText(),
                         matchScore, values);
            } else {
                LOG.debug("SKIPPING '{}' (code: {}) - matched but NO VALUES found",
                         dict.getLibelle(), targetCode);
            }
        }
    }
    
    return resultMap;
}
    
    /**
     * Creates enriched FinalResult with metadata
     */
      private FinalResult createEnrichedResult(String code, String libelle, List<String> values,
                                        double confidenceScore, Dictionary dict, OcrItem matchedItem) {
    
    // CRITICAL: Check if values are valid (not just ["0"] or empty)
    if (!hasValidValues(values)) {
        LOG.debug("SKIPPING '{}' (code: {}) - no valid values found: {}", 
                 dict.getLibelle(), code, values);
        return null; // Don't create result
    }
    
    FinalResult result = new FinalResult();
    result.setCode(code);
    result.setLibelle(libelle);
    result.setConfidenceScore(confidenceScore);
    
    // Set ONLY valid numeric values
    result.setSimilarityData(values);
    
    LOG.debug("Created result for {}: {} valid values: {}, confidence: {:.3f}", 
             code, values.size(), values, confidenceScore);
    
    return result;
}

/**
 * Check if values are valid (not just ["0"] or empty)
 */
private boolean hasValidValues(List<String> values) {
    if (values == null || values.isEmpty()) {
        return false;
    }
    
    // Check if ALL values are just "0"
    boolean allZero = true;
    for (String value : values) {
        if (!value.equals("0") && !value.isEmpty()) {
            allZero = false;
            break;
        }
    }
    
    if (allZero) {
        LOG.debug("All values are zero: {}", values);
        return false;
    }
    
    // Check if values look like real financial numbers
    int validCount = 0;
    for (String value : values) {
        if (isValidFinancialNumber(value)) {
            validCount++;
        }
    }
    
    // Require at least 1 valid financial number
    return validCount > 0;
}

/**
 * Check if a string is a valid financial number
 */
private boolean isValidFinancialNumber(String value) {
    if (value == null || value.trim().isEmpty()) {
        return false;
    }
    
    // DON'T remove spaces! Check with spaces included
    String clean = value.trim();
    
    // Check if it's just "0" or "0 0 0" etc.
    String withoutSpaces = clean.replaceAll("\\s", "");
    if (withoutSpaces.equals("0") || withoutSpaces.equals("-0") || withoutSpaces.equals("+0")) {
        return false;
    }
    
    // Check if it matches financial number pattern WITH SPACES
    return clean.matches("^-?[\\d\\s]+[\\d\\s.,]*$") && 
           !withoutSpaces.equals("0") && 
           !withoutSpaces.equals("0.0") && 
           !withoutSpaces.equals("0.00");
}

        // And in createFallbackResult:
      private FinalResult createFallbackResult(String code, Dictionary dict, double score) {
    // IMPORTANT: Fallbacks should have ["0"] but we don't want them
    // So we return null to exclude them
    
    LOG.warn("Skipping fallback for '{}' (code: {}) - no valid values available", 
             dict.getLibelle(), code);
    
    return null; // Exclude from results
}
    
    /**
     * Extracts values associated with matched OCR item
     */
    private List<String> extractAssociatedValues(OcrItem matchedItem, List<List<List<String>>> ocrResponse,
                                                List<DateIndex> dateIndices) {
        List<String> values = new ArrayList<>();
        
        if (matchedItem == null || ocrResponse == null) {
            return values;
        }
        
        int tableIdx = matchedItem.getTableIndex();
        int rowIdx = matchedItem.getRowIndex();
        
        if (tableIdx >= ocrResponse.size()) {
            return values;
        }
        
        List<List<String>> table = ocrResponse.get(tableIdx);
        if (rowIdx >= table.size()) {
            return values;
        }
        
        List<String> row = table.get(rowIdx);
        
        // Find DateIndex for this table
        DateIndex dateIndex = findDateIndexForTable(dateIndices, tableIdx);
        
        if (dateIndex != null) {
            // Extract values based on date columns
            values = extractValuesFromDateColumns(row, dateIndex);
        } else {
            // Fallback: extract numeric values from the row
            values = extractNumericValuesFromRow(row, matchedItem.getColumnIndex());
        }
        
        return values;
    }
    
    private DateIndex findDateIndexForTable(List<DateIndex> dateIndices, int tableIdx) {
        for (DateIndex di : dateIndices) {
            if (di.getTableNum() == tableIdx + 1) { // Convert to 1-based index
                return di;
            }
        }
        return null;
    }
    
    private List<String> extractValuesFromDateColumns(List<String> row, DateIndex dateIndex) {
        List<String> values = new ArrayList<>();
        
        int targetCol = dateIndex.getIndex();
        
        // Try the target column
        if (targetCol >= 0 && targetCol < row.size()) {
            String value = extractNumericValue(row.get(targetCol));
            if (!value.isEmpty()) {
                values.add(value);
            }
        }
        
        // Try next column if we need a second value
        if (values.size() < 2 && targetCol + 1 < row.size()) {
            String value = extractNumericValue(row.get(targetCol + 1));
            if (!value.isEmpty()) {
                values.add(value);
            }
        }
        
        return values;
    }
    
    private List<String> extractNumericValuesFromRow(List<String> row, int startCol) {
        List<String> values = new ArrayList<>();
        
        for (int i = startCol + 1; i < row.size() && values.size() < 2; i++) {
            String value = extractNumericValue(row.get(i));
            if (!value.isEmpty()) {
                values.add(value);
            }
        }
        
        return values;
    }
    
   private String extractNumericValue(String cell) {
    if (cell == null || cell.trim().isEmpty()) {
        return "";
    }
    
    String trimmed = cell.trim();
    
    // Simple check: if it contains digits and looks like a number
    if (trimmed.matches(".*\\d.*") && trimmed.matches("^[-\\s\\d.,()]+$")) {
        // Remove parentheses for negative numbers
        if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
            trimmed = "-" + trimmed.substring(1, trimmed.length() - 1);
        }
        return normalizeNumber(trimmed);

    }
    
    return "";
    }
    /**
     * Determines target code (handles referents)
     */
    private String determineTargetCode(Dictionary dict, Map<String, FinalResult> resultMap) {
        String targetCode = dict.getCode();
        
        if (dict.getReferentCode() != null && !dict.getReferentCode().isEmpty()) {
            if (resultMap.containsKey(dict.getReferentCode())) {
                LOG.debug("Skipping child '{}' (code: {}) - referent '{}' already processed",
                         dict.getLibelle(), dict.getCode(), dict.getReferentCode());
                return null;
            }
            targetCode = dict.getReferentCode();
        }
        
        return targetCode;
    }
    
    /**
     * Determines target libelle
     */
    private String determineTargetLibelle(Dictionary dict, String targetCode) {
        if (dict.getReferentCode() != null && dict.getReferentCode().equals(targetCode) &&
            dict.getReferentLibelle() != null && !dict.getReferentLibelle().isEmpty()) {
            return dict.getReferentLibelle();
        }
        return dict.getLibelle();
    }
    
    /**
     * Handles unmatched dictionary entries
     */
    private void handleUnmatchedEntries(List<Dictionary> finData, Map<String, FinalResult> resultMap,
                                       List<OcrItem> ocrItems, double[][] similarityMatrix, double threshold) {
        int fallbackMatches = 0;
        double fallbackThreshold = threshold * 0.8; // Lower threshold for fallback
        
        for (int i = 0; i < finData.size(); i++) {
            Dictionary dict = finData.get(i);
            String targetCode = determineTargetCode(dict, resultMap);
            
            if (targetCode != null && !resultMap.containsKey(targetCode)) {
                // Find best available match
                int bestOcrIdx = findBestAvailableMatch(i, ocrItems, similarityMatrix, 
                                                       fallbackThreshold, resultMap);
                
                if (bestOcrIdx >= 0) {
                    double score = similarityMatrix[i][bestOcrIdx];
                    
                    // Create fallback result
                    FinalResult fallback = createFallbackResult(targetCode, dict, score);
                    resultMap.put(targetCode, fallback);
                    fallbackMatches++;
                    
                    LOG.debug("Fallback match for '{}' (code: {}) with score: {:.3f}",
                             dict.getLibelle(), targetCode, score);
                }
            }
        }
        
        if (fallbackMatches > 0) {
            LOG.info("Added {} fallback matches with lower confidence", fallbackMatches);
        }
    }
    
    private int findBestAvailableMatch(int dictIdx, List<OcrItem> ocrItems, 
                                      double[][] similarityMatrix, double threshold,
                                      Map<String, FinalResult> resultMap) {
        int bestIdx = -1;
        double bestScore = 0.0;
        
        for (int j = 0; j < ocrItems.size(); j++) {
            double score = similarityMatrix[dictIdx][j];
            if (score > bestScore && score >= threshold) {
                // Check if OCR item is likely already used
                if (!isOcrItemLikelyUsed(j, similarityMatrix, resultMap)) {
                    bestScore = score;
                    bestIdx = j;
                }
            }
        }
        
        return bestIdx;
    }
    
    private boolean isOcrItemLikelyUsed(int ocrIdx, double[][] similarityMatrix, 
                                       Map<String, FinalResult> resultMap) {
        // Simple heuristic: if any dictionary entry with high similarity already has a result
        for (int i = 0; i < similarityMatrix.length; i++) {
            if (similarityMatrix[i][ocrIdx] > 0.7) {
                // Check if this dictionary entry is in resultMap
                // This would require tracking which dictionary entries have results
            }
        }
        return false;
    }
    

    
    /**
     * Logs top matches for debugging
     */
    private void logTopMatches(List<FinalResult> results, int topN) {
        if (results.isEmpty()) {
            LOG.info("No matches found to log");
            return;
        }
        
        LOG.info("=== TOP {} MATCHES ===", Math.min(topN, results.size()));
        
        // Sort by confidence descending
        results.sort((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()));
        
        for (int i = 0; i < Math.min(topN, results.size()); i++) {
            FinalResult result = results.get(i);
            LOG.info("{}. {} (code: {}) - Confidence: {:.3f}", 
                    i + 1, result.getLibelle(), result.getCode(), result.getConfidenceScore());
        }
    }
    
    
    public static int computeLevenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[s1.length()][s2.length()];
    }
    
    private void processDates(List<List<List<String>>> ocrResponse, Set<String> uniqueYears, List<DateIndex> dates) {
        int tableNum = 0;
        for (List<List<String>> table : ocrResponse) {
            tableNum++;
            int headerRowsToScan = Math.min(5, table.size());
            int maxColumns = 0;
            Map<Integer, String> colToYear = new HashMap<>();
            for (int i = 0; i < headerRowsToScan; i++) {
                List<String> row = table.get(i);
                maxColumns = Math.max(maxColumns, row.size());
                for (int j = 0; j < row.size(); j++) {
                    String y = isDate(row.get(j));
                    if (y != null && y.length() == 4) {
                        colToYear.put(j, y);
                    }
                }
            }
            List<Integer> chosenCols = new ArrayList<>();
            if (colToYear.size() >= 2) {
                List<Integer> cols = new ArrayList<>(colToYear.keySet());
                cols.sort(Integer::compareTo);
                int n = cols.size();
                chosenCols.add(cols.get(Math.max(0, n - 2)));
                chosenCols.add(cols.get(n - 1));
                uniqueYears.add(colToYear.get(cols.get(Math.max(0, n - 2))));
                uniqueYears.add(colToYear.get(cols.get(n - 1)));
                LOG.debug("Detected year columns for table {}: {} -> {}, {} -> {}", tableNum,
                         cols.get(Math.max(0, n - 2)), colToYear.get(cols.get(Math.max(0, n - 2))),
                         cols.get(n - 1), colToYear.get(cols.get(n - 1)));
            } else {
                if (maxColumns >= 2) {
                    chosenCols.add(maxColumns - 2);
                    chosenCols.add(maxColumns - 1);
                } else if (maxColumns == 1) {
                    chosenCols.add(0);
                }
            }
            for (Integer col : chosenCols) {
                int adjustedCol = preferNet(table, headerRowsToScan, col, maxColumns);
                dates.add(new DateIndex(colToYear.getOrDefault(col, ""), adjustedCol, maxColumns, tableNum));
            }
        }
    }
    
    private int preferNet(List<List<String>> table, int headerRowsToScan, int col, int maxColumns) {
        int target = col;
        boolean colIsBrut = false;
        boolean colIsNet = false;
        boolean nextIsNet = false;
        for (int i = 0; i < headerRowsToScan; i++) {
            List<String> row = table.get(i);
            String cur = (col < row.size()) ? row.get(col) : "";
            String next = (col + 1 < row.size()) ? row.get(col + 1) : "";
            String curN = StringUtils.stripAccents(cur == null ? "" : cur).toUpperCase();
            String nextN = StringUtils.stripAccents(next == null ? "" : next).toUpperCase();
            if (curN.contains("NET")) colIsNet = true;
            if (curN.contains("BRUT")) colIsBrut = true;
            if (nextN.contains("NET")) nextIsNet = true;
        }
        if (colIsNet) {
            target = col;
        } else if (colIsBrut && nextIsNet && col + 1 < maxColumns) {
            target = col + 1;
        }
        return target;
    }
    
    private String normalizeNumber(String s) {
    if (s == null) return "";

    String v = s.trim();
    if (v.isEmpty()) return "";

    // Handle negative numbers
    boolean negative = false;
    if ((v.startsWith("(") && v.endsWith(")")) || v.startsWith("-")) {
        negative = true;
        v = v.replace("(", "").replace(")", "").replace("-", "");
    }

    // Remove NBSP and normalize spaces
    v = v.replace("\u00A0", " ");

    // Remove dots and commas used as thousand separators
    v = v.replaceAll("(?<=\\d)[.,](?=\\d{3}(\\D|$))", "");

    // Remove everything except digits
    v = v.replaceAll("[^0-9]", "");

    if (v.isEmpty()) return "";

    // Format with spaces every 3 digits
    String formatted = v.replaceAll("(\\d)(?=(\\d{3})+$)", "$1 ");

    return negative ? "-" + formatted : formatted;
}

    
    public String isDate(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        
        int currentYear = Year.now().getValue();
        String result = input.replaceAll("[^\\d]", "");
        
        if (result.startsWith("31") && result.length() == 4) {
            return "20" + result.substring(2);
        } else if (result.startsWith("20") && result.length() == 4) {
            int year = Integer.parseInt(result);
            if (year <= currentYear) {
                return result;
            }
        } else if (result.startsWith("31") && result.length() == 6) {
            String lastFourCharacters = result.substring(result.length() - 4);
            int year = Integer.parseInt(lastFourCharacters);
            if (year <= currentYear) {
                return lastFourCharacters;
            }
        } else if (input.startsWith("31 Décembre")) {
            String[] parts = input.split(" ");
            String yearStr = parts[parts.length - 1];
            if (yearStr.matches("\\d+") && yearStr.length() == 4) {
                int year = Integer.parseInt(yearStr);
                if (year <= currentYear) {
                    return yearStr;
                }
            }
        } else if (input.startsWith("Jusqu'au")) {
            String[] parts = input.split(" ");
            String datePart = parts[parts.length - 1];
            String[] dateParts = datePart.split("/");
            String yearStr = dateParts[dateParts.length - 1];
            if (yearStr.matches("\\d{4}") && Integer.parseInt(yearStr) <= currentYear) {
                return yearStr;
            }
        } else if (input.startsWith("3112") && input.length() == 8) {
            int year = Integer.parseInt(input.substring(4));
            if (year >= 2010 && year <= currentYear) {
                return String.valueOf(year);
            }
        } else if ((result.startsWith("31") || result.startsWith("01")) && (result.length() == 8 || result.length() == 16)) {
            String lastFourCharacters = result.substring(result.length() - 4);
            int year = Integer.parseInt(lastFourCharacters);
            if (year <= currentYear) {
                return lastFourCharacters;
            }
        }
        
        input = input.trim().toLowerCase();
        Map<String, String> moisMap = Map.ofEntries(
            Map.entry("jan", "01"), Map.entry("févr", "02"), Map.entry("fevr", "02"),
            Map.entry("fév", "02"), Map.entry("fev", "02"),
            Map.entry("mar", "03"), Map.entry("avr", "04"), Map.entry("mai", "05"),
            Map.entry("jun", "06"), Map.entry("jui", "07"),
            Map.entry("aoû", "08"), Map.entry("aou", "08"),
            Map.entry("sep", "09"), Map.entry("oct", "10"),
            Map.entry("nov", "11"), Map.entry("déc", "12"), Map.entry("dec", "12")
        );
        
        String cleaned = input.replaceAll("\\s+", "");
        Pattern p = Pattern.compile("([a-zéèêû]+)\\.?-?(\\d{2})$");
        Matcher m = p.matcher(cleaned);
        
        if (m.find()) {
            String moisAbrev = m.group(1);
            String an2 = m.group(2);
            String mois = moisAbrev.length() >= 3 ? moisAbrev.substring(0, 3) : moisAbrev;
            
            if (moisMap.containsKey(mois)) {
                int year = 2000 + Integer.parseInt(an2);
                if (year <= currentYear) return String.valueOf(year);
            }
        }
        
        SimpleDateFormat[] formatsDates = {
            new SimpleDateFormat("dd.MM.yyyy"), 
            new SimpleDateFormat("dd/MM/yyyy"),
            new SimpleDateFormat("ddMMyyyy"), 
            new SimpleDateFormat("dd-MM-yyyy"),
            new SimpleDateFormat("'Au' dd/MM/yyyy"), 
            new SimpleDateFormat("'au' dd MM yyyy"),
            new SimpleDateFormat("'u' dd/MM/yyyy"), 
            new SimpleDateFormat("'Au 31 décembre' yyyy"),
            new SimpleDateFormat("'au 31 décembre' yyyy"),
            new SimpleDateFormat("'jusqu'au yyyy"),
            new SimpleDateFormat("yyyy")
        };
        
        for (SimpleDateFormat sdf : formatsDates) {
            try {
                sdf.setLenient(false);
                java.util.Date date = sdf.parse(input);
                if (date != null) {
                    int jour = Integer.parseInt(new SimpleDateFormat("dd").format(date));
                    int mois = Integer.parseInt(new SimpleDateFormat("MM").format(date));
                    int annee = Integer.parseInt(new SimpleDateFormat("yyyy").format(date));
                    if (annee >= 1970 && annee <= currentYear) {
                        if (sdf.toPattern().equals("yyyy") || (jour == 31 && mois == 12)) {
                            return String.valueOf(annee);
                        }
                    }
                }
            } catch (ParseException | NumberFormatException e) {
                continue;
            }
        }
        
        Pattern pYear4 = Pattern.compile("\\b(20\\d{2}|19\\d{2})\\b");
        Matcher m4 = pYear4.matcher(input);
        if (m4.find()) {
            int y = Integer.parseInt(m4.group());
            if (y <= currentYear && y >= 1970) return m4.group();
        }
        
        return null;
    }
    public String removeStopWords(String text) {
        if (text == null) return "";
        String normalized = text.toLowerCase();
        // Remove small connecting words surrounded by spaces
        normalized = normalized.replaceAll("\\b(des|de|du|la|le|et)\\b", " ");
        normalized = normalized.replaceAll("\\s+", " ").trim();
        return normalized;
    }

    private List<FinalResultRecord> transformToCleanRecords(List<FinalResult> rawResults) {
    return rawResults.stream()
        .filter(r -> r != null)
        .filter(r -> r.getSimilarityData() != null && !r.getSimilarityData().isEmpty())
        .filter(r -> !r.getSimilarityData().stream().allMatch(v -> v.equals("0")))
        .map(r -> new FinalResultRecord(r.getCode(), r.getLibelle(), r.getSimilarityData()))
        .collect(Collectors.toList());
}
    
}