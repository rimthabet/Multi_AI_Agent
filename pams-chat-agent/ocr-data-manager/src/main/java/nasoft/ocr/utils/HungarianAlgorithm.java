package nasoft.ocr.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HungarianAlgorithm {
    private static final Logger LOG = LoggerFactory.getLogger(HungarianAlgorithm.class);
    
    private double[][] costMatrix;
    private int[] assignment;
    private int n, m;
    
    public HungarianAlgorithm(double[][] costMatrix) {
        this.n = costMatrix.length;
        this.m = costMatrix[0].length;
        this.costMatrix = new double[n][m];
        for (int i = 0; i < n; i++) {
            System.arraycopy(costMatrix[i], 0, this.costMatrix[i], 0, m);
        }
        this.assignment = new int[n];
        Arrays.fill(this.assignment, -1);
    }
    
    /**
     * Executes the Hungarian algorithm to find optimal assignment
     * Returns array where assignment[i] = index of OCR item assigned to dictionary entry i
     */
    public int[] execute() {
        // Convert to minimization problem (higher similarity = lower cost)
        convertToMinimization();
        
        // Apply Hungarian algorithm steps
        return optimizedGreedyAssignment();
    }
    
    /**
     * Converts similarity matrix to cost matrix for minimization
     */
    private double[][] convertToMinimization() {
        double[][] minCostMatrix = new double[n][m];
        double maxVal = findMaxValue();
        
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                minCostMatrix[i][j] = maxVal - costMatrix[i][j] + 1;
            }
        }
        
        return minCostMatrix;
    }
    
    private double findMaxValue() {
        double maxVal = Double.NEGATIVE_INFINITY;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                maxVal = Math.max(maxVal, costMatrix[i][j]);
            }
        }
        return maxVal;
    }
    
    /**
     * Optimized greedy assignment with tie-breaking
     */
    private int[] optimizedGreedyAssignment() {
        boolean[] colAssigned = new boolean[m];
        List<ScoreTriple> scores = new ArrayList<>();
        
        // Collect all scores
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (costMatrix[i][j] > 0.1) { // Only consider meaningful scores
                    scores.add(new ScoreTriple(i, j, costMatrix[i][j]));
                }
            }
        }
        
        // Sort by score descending
        scores.sort((a, b) -> {
            int scoreCompare = Double.compare(b.score, a.score);
            if (scoreCompare != 0) return scoreCompare;
            // Tie-breaking: prefer matches where OCR item is unique to this dictionary entry
            return Integer.compare(getUniquenessScore(b.row, b.col), 
                                  getUniquenessScore(a.row, a.col));
        });
        
        // Assign
        for (ScoreTriple triple : scores) {
            if (assignment[triple.row] == -1 && !colAssigned[triple.col]) {
                assignment[triple.row] = triple.col;
                colAssigned[triple.col] = true;
                LOG.trace("Assigned dictionary[{}] -> ocr[{}] with score: {:.3f}", 
                         triple.row, triple.col, triple.score);
            }
        }
        
        return assignment;
    }
    
    /**
     * Calculates uniqueness score for a potential match
     */
    private int getUniquenessScore(int dictIdx, int ocrIdx) {
        int uniqueness = 0;
        double targetScore = costMatrix[dictIdx][ocrIdx];
        
        // Check how many other dictionary entries want this OCR item
        for (int i = 0; i < n; i++) {
            if (i != dictIdx && costMatrix[i][ocrIdx] >= targetScore * 0.9) {
                uniqueness++;
            }
        }
        
        // Check how many other OCR items are similarly good for this dictionary entry
        for (int j = 0; j < m; j++) {
            if (j != ocrIdx && costMatrix[dictIdx][j] >= targetScore * 0.9) {
                uniqueness++;
            }
        }
        
        return -uniqueness; // Negative because lower uniqueness is worse
    }
    
    /**
     * Get the score for a specific assignment
     */
    public double getAssignmentScore(int dictIdx) {
        int ocrIdx = assignment[dictIdx];
        return ocrIdx >= 0 ? costMatrix[dictIdx][ocrIdx] : 0.0;
    }
    
    /**
     * Helper class to store score information
     */
    private static class ScoreTriple {
        int row, col;
        double score;
        
        ScoreTriple(int row, int col, double score) {
            this.row = row;
            this.col = col;
            this.score = score;
        }
    }
}