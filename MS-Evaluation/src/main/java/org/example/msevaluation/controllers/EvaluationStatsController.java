package org.example.msevaluation.controllers;

import lombok.RequiredArgsConstructor;
import org.example.msevaluation.dto.QuestionDifficultyDTO;
import org.example.msevaluation.dto.ScoreDistributionDTO;
import org.example.msevaluation.entities.Evaluation;
import org.example.msevaluation.repositories.EvaluationRepository;
import org.example.msevaluation.services.impl.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/evaluations/stats")
@RequiredArgsConstructor
public class EvaluationStatsController {
    private final StatisticsService statisticsService;
    private final EvaluationRepository evaluationRepository;

    @GetMapping("/{id}/questions-analysis")
    public ResponseEntity<List<QuestionDifficultyDTO>> getAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(statisticsService.getQuestionsAnalysis(id));
    }

    @GetMapping("/{id}/distribution")
    public ResponseEntity<List<ScoreDistributionDTO>> getScoreDistribution(@PathVariable Long id) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation non trouvée"));
        List<ScoreDistributionDTO> distribution = statisticsService.getScoreDistribution(id, eval.getTypeAssessment());

        return ResponseEntity.ok(distribution);
    }
}
