package org.example.msevaluation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EvaluationResultDTO {
    private String learnerName; // À récupérer via un appel inter-service ou ID
    private String evaluationTitle;
    private String type; // "QUIZ" ou "EXAM"
    private double scoreObtained;
    private double totalPossiblePoints;
    private int correctAnswersCount;
    private int wrongAnswersCount;
    private int totalQuestions;
    private double percentage;
    private int minSuccessScore;
    private boolean isPassed;
    private Long evaluationId;
    private boolean isSuspicious;
}
