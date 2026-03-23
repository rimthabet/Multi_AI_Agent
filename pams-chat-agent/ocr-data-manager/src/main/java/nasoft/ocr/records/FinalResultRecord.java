package nasoft.ocr.records;

    import java.util.List;

import nasoft.ocr.models.FinalResult;

public record FinalResultRecord(
    String code,
    String libelle,
    List<String> similarityData
) {
    // Optional: Constructor from FinalResult model
    public FinalResultRecord(FinalResult result) {
        this(
            result.getCode(),
            result.getLibelle(),
            result.getSimilarityData()
        );
    }
}