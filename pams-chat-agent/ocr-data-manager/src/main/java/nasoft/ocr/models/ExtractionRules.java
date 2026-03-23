package nasoft.ocr.models;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Règles configurables pour filtrer les tableaux extraits par Azure OCR
 * Reçues depuis Python via JSON
 */
public class ExtractionRules {
    
    // ===== FILTRES DE TAILLE =====
    private int minRows = 2;
    private int minCols = 2;
    
    // ===== FILTRES DE CONTENU =====
    private double minNumericPercentage = 0.20;
    private boolean excludeToc = true;
    private boolean excludeSingleColumn = false;
    
    // ===== DÉTECTION TOC =====
    private List<String> tocKeywords = Arrays.asList(
        "sommaire", 
        "table des matières", 
        "présentation succinte",
        "table of contents",
        "contents"
    );
    private List<String> excludePatterns = new ArrayList<>();
    
    // ===== OPTIONS DE TRAITEMENT =====
    private String columnSpanHandling = "duplicate";
    private String emptyCellHandling = "keep";
    
    // ===== GESTION TEXTE SOULIGNÉ =====
    private boolean mergeUnderlinedText = true;
    private double underlineDetectionThreshold = 0.35;
    private List<String> underlineChars = Arrays.asList("_", "-", "=", "―", "─", "—", "–", "¯", "‾", ".", "·");

    // ===== MODE NO-FILTER (bypass tous les filtres Java, filtrage côté Python) =====
    private boolean noFilter = false;
    
    // ===== FUSION TABLEAUX MULTI-PAGES =====
    private boolean mergeMultiPageTables = true;
    
    // ===== DÉTECTION SPÉCIFIQUE =====
    private boolean requireHeader = false;
    private double maxEmptyPercentage = 0.5;
    
    // ===== CONSTRUCTEURS =====
    public ExtractionRules() {
        // Valeurs par défaut déjà définies
    }
    
    // ===== GETTERS & SETTERS =====
    public int getMinRows() { return minRows; }
    public void setMinRows(int minRows) { this.minRows = minRows; }
    
    public int getMinCols() { return minCols; }
    public void setMinCols(int minCols) { this.minCols = minCols; }
    
    public double getMinNumericPercentage() { return minNumericPercentage; }
    public void setMinNumericPercentage(double minNumericPercentage) { 
        this.minNumericPercentage = minNumericPercentage; 
    }
    
    public boolean isExcludeToc() { return excludeToc; }
    public void setExcludeToc(boolean excludeToc) { this.excludeToc = excludeToc; }
    
    public boolean isExcludeSingleColumn() { return excludeSingleColumn; }
    public void setExcludeSingleColumn(boolean excludeSingleColumn) { 
        this.excludeSingleColumn = excludeSingleColumn; 
    }
    
    public List<String> getTocKeywords() { return tocKeywords; }
    public void setTocKeywords(List<String> tocKeywords) { 
        this.tocKeywords = tocKeywords; 
    }
    
    public List<String> getExcludePatterns() { return excludePatterns; }
    public void setExcludePatterns(List<String> excludePatterns) { 
        this.excludePatterns = excludePatterns; 
    }
    
    public String getColumnSpanHandling() { return columnSpanHandling; }
    public void setColumnSpanHandling(String columnSpanHandling) { 
        this.columnSpanHandling = columnSpanHandling; 
    }
    
    public String getEmptyCellHandling() { return emptyCellHandling; }
    public void setEmptyCellHandling(String emptyCellHandling) { 
        this.emptyCellHandling = emptyCellHandling; 
    }
    
    // ===== GETTERS & SETTERS TEXTE SOULIGNÉ =====
    public boolean isMergeUnderlinedText() { return mergeUnderlinedText; }
    public void setMergeUnderlinedText(boolean mergeUnderlinedText) { 
        this.mergeUnderlinedText = mergeUnderlinedText; 
    }
    
    public double getUnderlineDetectionThreshold() { return underlineDetectionThreshold; }
    public void setUnderlineDetectionThreshold(double underlineDetectionThreshold) { 
        this.underlineDetectionThreshold = underlineDetectionThreshold; 
    }
    
    public List<String> getUnderlineChars() { return underlineChars; }
    public void setUnderlineChars(List<String> underlineChars) { 
        this.underlineChars = underlineChars; 
    }
    
    // ===== AUTRES GETTERS & SETTERS =====
    public boolean isRequireHeader() { return requireHeader; }
    public void setRequireHeader(boolean requireHeader) { 
        this.requireHeader = requireHeader; 
    }
    
    public double getMaxEmptyPercentage() { return maxEmptyPercentage; }
    public void setMaxEmptyPercentage(double maxEmptyPercentage) { 
        this.maxEmptyPercentage = maxEmptyPercentage; 
    }

    public boolean isNoFilter() { return noFilter; }
    public void setNoFilter(boolean noFilter) { this.noFilter = noFilter; }

    // ===== GETTERS & SETTERS MULTI-PAGES =====
    public boolean isMergeMultiPageTables() { return mergeMultiPageTables; }
    public void setMergeMultiPageTables(boolean mergeMultiPageTables) { 
        this.mergeMultiPageTables = mergeMultiPageTables; 
    }

    @Override
    public String toString() {
        return String.format(
            "ExtractionRules{minRows=%d, minCols=%d, minNumeric=%.0f%%, excludeToc=%b, mergeUnderlined=%b, mergeMultiPage=%b}",
            minRows, minCols, minNumericPercentage * 100, excludeToc, mergeUnderlinedText, mergeMultiPageTables
        );
    }
}
