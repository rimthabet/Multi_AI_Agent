// File: FinalResult.java
package nasoft.ocr.models;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class FinalResult {
    private String code;
    private String libelle;
    private List<String> similarityData;
    private double confidenceScore;
    private Map<String, Object> metadata;
    
    public FinalResult() {
        super();
        this.metadata = new HashMap<>();
    }
    
    public FinalResult(String code, String libelle, List<String> similarityData) {
        super();
        this.code = code;
        this.libelle = libelle;
        this.similarityData = similarityData;
        this.metadata = new HashMap<>();
    }
    
    public FinalResult(String code, String libelle, List<String> similarityData, double confidenceScore) {
        super();
        this.code = code;
        this.libelle = libelle;
        this.similarityData = similarityData;
        this.confidenceScore = confidenceScore;
        this.metadata = new HashMap<>();
    }
    
    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    
    public List<String> getSimilarityData() { return similarityData; }
    public void setSimilarityData(List<String> similarityData) { this.similarityData = similarityData; }
    
    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    public void addMetadata(String key, Object value) {
        this.metadata.put(key, value);
    }
    
    @Override
    public String toString() {
        return "FinalResult [code=" + code + ", libelle=" + libelle + 
               ", similarityData=" + similarityData + ", confidenceScore=" + 
               String.format("%.3f", confidenceScore) + ", metadata=" + metadata + "]";
    }
}