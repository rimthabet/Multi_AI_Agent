package nasoft.ocr.controllers;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import nasoft.ocr.models.Dictionary;
import nasoft.ocr.models.ExtractionRules;
import nasoft.ocr.records.SimilarityResultRecord;
import nasoft.ocr.services.OcrService;
import nasoft.ocr.services.SimilarityService;

@RestController
@RequestMapping("/api")

public class OcrController {

	@Autowired
	private OcrService ocrService;
	@Autowired
	private SimilarityService similarityService;

	/**
	 * Endpoint for performing Optical Character Recognition (OCR) on a document and
	 * comparing the results with financial data.
	 * 
	 * @param file      The document file to perform OCR on.
	 * @param id        The ID of the finStatement data.
	 * @param pageRange The range of pages in the document to analyze.
	 *                  Format:[startPage,endPage]
	 * @return ResponseEntity containing the comparison result.
	 * @throws Exception if an error occurs during file processing.
	 */
	@PostMapping("/perform-ocr")
	public ResponseEntity<SimilarityResultRecord> performOCR(@RequestParam("file") MultipartFile file,
			@RequestParam("id") String id, @RequestParam("PageRange") String pageRange) throws IOException {
		try {

			// Retrieve financial data based on the provided ID
			List<Dictionary> finData = similarityService.retrieveData(id);

			// Check if financial data is available
			if (!finData.isEmpty()) {
				// Extract page range from the provided string
				// Format of pageRange: [startPage,endPage]
				String[] range = pageRange.substring(1, pageRange.length() - 1).split(",");
				int startPage = Integer.parseInt(range[0].trim());
				int endPage = Integer.parseInt(range[1].trim());
				String fileName = file.getOriginalFilename();

				// Get OCR results for the specified page range (use default rules)
				ExtractionRules rules = new ExtractionRules();
				List<List<List<String>>> ocrResponse = this.ocrService.getAnalyzeResults(file, startPage, endPage, rules);

				// Calculate similarity between finStatement data and OCR results
				return ResponseEntity.status(200).body(similarityService.similarity(finData, ocrResponse, fileName));
			} else {
				// Return bad request status if finStatement data is not available
				return ResponseEntity.status(400).body(null);
			}
		} catch (Exception e) {
			// Return internal server error status in case of any exception
			e.printStackTrace();
			return ResponseEntity.status(500).body(null);
		}
	}

	@PostMapping("/extract")
	public ResponseEntity<List<List<List<String>>>> extractOcr(@RequestParam("file") MultipartFile file,
			@RequestParam("id") String id, @RequestParam("PageRange") String pageRange) throws IOException {
		try {

			// Retrieve financial data based on the provided ID
			List<Dictionary> finData = similarityService.retrieveDataFromRequest(id);

			// Check if financial data is available
			if (!finData.isEmpty()) {
				// Extract page range from the provided string
				// Format of pageRange: [startPage,endPage]
				String[] range = pageRange.substring(1, pageRange.length() - 1).split(",");
				int startPage = Integer.parseInt(range[0].trim());
				int endPage = Integer.parseInt(range[1].trim());
				// Get OCR results for the specified page range (use default rules)
				ExtractionRules rules = new ExtractionRules();
				List<List<List<String>>> ocrResponse = this.ocrService.getAnalyzeResults(file, startPage, endPage, rules);

				// Calculate similarity between finStatement data and OCR results
				return ResponseEntity.status(200).body(ocrResponse);
			} else {
				// Return bad request status if finStatement data is not available
				return ResponseEntity.status(400).body(null);
			}
		} catch (Exception e) {
			// Return internal server error status in case of any exception
			e.printStackTrace();
			return ResponseEntity.status(500).body(null);
		}
	}

	/**
	 * Endpoint for extracting tables from a document using OCR without ID validation.
	 * @param file       PDF file to extract
	 * @param pageRange  Page range [startPage,endPage]
	 * @param rulesJson  JSON string with extraction rules (optional)
	 * @return
	 * @throws IOException 
	 */
	@PostMapping(value = "/extract-simple", produces = "application/json;charset=UTF-8")
	public ResponseEntity<List<java.util.Map<String, Object>>> extractSimple(
			@RequestParam("file") MultipartFile file,
			@RequestParam("PageRange") String pageRange,
			@RequestParam(value = "rules", required = false) String rulesJson) throws IOException {
		try {
			// Utiliser règles par défaut si non fournies
			ExtractionRules rules = new ExtractionRules();
			
			// Parser les règles si fournies
			if (rulesJson != null && !rulesJson.trim().isEmpty()) {
				try {
					ObjectMapper mapper = new ObjectMapper();
					rules = mapper.readValue(rulesJson, ExtractionRules.class);
					System.out.println("[OCR] Règles personnalisées reçues: " + rules);
				} catch (Exception e) {
					System.err.println("[OCR] Erreur parsing règles JSON: " + e.getMessage());
					System.out.println("[OCR] Utilisation règles par défaut");
				}
			} else {
				System.out.println("[OCR] Utilisation règles par défaut: " + rules);
			}
			
			// Extract page range from the provided string
			String[] range = pageRange.substring(1, pageRange.length() - 1).split(",");
			int startPage = Integer.parseInt(range[0].trim());
			int endPage = Integer.parseInt(range[1].trim());

			// Get OCR results with metadata (page numbers)
			List<java.util.Map<String, Object>> ocrResponse = this.ocrService.getAnalyzeResultsWithMeta(file, startPage, endPage, rules);

			if (ocrResponse != null && !ocrResponse.isEmpty()) {
				return ResponseEntity.status(200).body(ocrResponse);
			} else {
				return ResponseEntity.status(404).body(null);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(500).body(null);
		}
	}
	

}
