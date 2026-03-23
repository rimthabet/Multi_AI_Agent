// File: OcrItem.java
package nasoft.ocr.models;

public class OcrItem {
    private String originalText;
    private String normalizedText;
    private int tableIndex;
    private int rowIndex;
    private int columnIndex;
    private int rowSize;
    private int tableSize;
    private String leftContext;
    private String rightContext;
    private String aboveContext;
    private String belowContext;
    
    // Constructors
    public OcrItem() {}
    
    public OcrItem(String originalText, int tableIndex, int rowIndex, int columnIndex) {
        this.originalText = originalText;
        this.tableIndex = tableIndex;
        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
    }
    
    // Getters and Setters
    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }
    
    public String getNormalizedText() { return normalizedText; }
    public void setNormalizedText(String normalizedText) { this.normalizedText = normalizedText; }
    
    public int getTableIndex() { return tableIndex; }
    public void setTableIndex(int tableIndex) { this.tableIndex = tableIndex; }
    
    public int getRowIndex() { return rowIndex; }
    public void setRowIndex(int rowIndex) { this.rowIndex = rowIndex; }
    
    public int getColumnIndex() { return columnIndex; }
    public void setColumnIndex(int columnIndex) { this.columnIndex = columnIndex; }
    
    public int getRowSize() { return rowSize; }
    public void setRowSize(int rowSize) { this.rowSize = rowSize; }
    
    public int getTableSize() { return tableSize; }
    public void setTableSize(int tableSize) { this.tableSize = tableSize; }
    
    public String getLeftContext() { return leftContext; }
    public void setLeftContext(String leftContext) { this.leftContext = leftContext; }
    
    public String getRightContext() { return rightContext; }
    public void setRightContext(String rightContext) { this.rightContext = rightContext; }
    
    public String getAboveContext() { return aboveContext; }
    public void setAboveContext(String aboveContext) { this.aboveContext = aboveContext; }
    
    public String getBelowContext() { return belowContext; }
    public void setBelowContext(String belowContext) { this.belowContext = belowContext; }
    
    @Override
    public String toString() {
        return String.format("OcrItem{table=%d, row=%d, col=%d, text='%s'}",
                           tableIndex, rowIndex, columnIndex, 
                           originalText != null && originalText.length() > 20 ? 
                           originalText.substring(0, 20) + "..." : originalText);
    }
}