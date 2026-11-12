package org.example.msevaluation.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.msevaluation.dto.EvaluationResultDTO;
import org.example.msevaluation.entities.*;
import org.example.msevaluation.repositories.*;
import org.example.msevaluation.services.interfaces.ILearnerQuizzAnswerService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearnerQuizzAnswerImpl implements ILearnerQuizzAnswerService {
    private final LearnerQuizzAnswerRepository repository;
    private final QuizzAnswerRepository quizzAnswerRepository;
    private final QuizzQuestionsRepository quizzQuestionsRepository;

    @Transactional
    @Override
    public EvaluationResultDTO saveAllQuizAnswers(List<LearnerQuizzAnswer> answers) {
        if (answers == null || answers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La liste des réponses ne peut pas être vide.");
        }

        // 1. Récupération de l'évaluation parente pour la date et la durée officielles
        Evaluation eval = quizzQuestionsRepository.findById(answers.get(0).getQuestion().getId())
                .map(QuizzQuestions::getEvaluation)
                .orElseThrow(() -> new RuntimeException("Évaluation introuvable"));

        // 2. AUDIT TEMPOREL : On utilise la date programmée en base de données
        boolean isSuspicious = isSubmittingTooFast(eval.getDate(), eval.getDuration());

        double earnedPoints = 0.0;
        double totalPossiblePoints = 0.0;
        int correctCount = 0;
        LocalDateTime submissionTime = LocalDateTime.now();

        // Optimisation : Récupération groupée des IDs de réponses correctes
        List<Long> selectedIds = answers.stream()
                .map(ans -> ans.getSelectedAnswer().getId())
                .toList();
        List<Long> correctIds = quizzAnswerRepository.findCorrectAnswerIdsIn(selectedIds);

        for (LearnerQuizzAnswer ans : answers) {
            ans.setResponseDate(submissionTime);
            ans.setIsSuspicious(isSuspicious);

            QuizzQuestions question = quizzQuestionsRepository.findById(ans.getQuestion().getId())
                    .orElseThrow(() -> new RuntimeException("Question non trouvée"));

            totalPossiblePoints += question.getPoints();

            if (correctIds.contains(ans.getSelectedAnswer().getId())) {
                earnedPoints += question.getPoints();
                correctCount++;
            }
            ans.setQuestion(question);
        }

        // Sauvegarde groupée pour les performances
        repository.saveAll(answers);

        double percentage = (totalPossiblePoints > 0) ? (earnedPoints / totalPossiblePoints) * 100 : 0.0;
        boolean isPassed = percentage >= eval.getMinSuccessScore();

        return EvaluationResultDTO.builder()
                .learnerName("Omar") // À dynamiser via User Context
                .evaluationTitle(eval.getTitle())
                .type("QUIZ")
                .scoreObtained(earnedPoints)
                .totalPossiblePoints(totalPossiblePoints)
                .correctAnswersCount(correctCount)
                .wrongAnswersCount(answers.size() - correctCount)
                .totalQuestions(answers.size())
                .percentage(Math.round(percentage * 100.0) / 100.0)
                .minSuccessScore(eval.getMinSuccessScore())
                .isPassed(isPassed)
                .evaluationId(eval.getId())
                .isSuspicious(isSuspicious)
                .build();
    }

    @Override
    public boolean isSubmittingTooFast(LocalDateTime scheduledStartTime, int durationInMinutes) {
        if (scheduledStartTime == null) return false;

        LocalDateTime now = LocalDateTime.now();
        long secondsSpent = java.time.Duration.between(scheduledStartTime, now).getSeconds();
        long minimumSecondsRequired = (durationInMinutes * 60L) / 10;
        System.out.println("--- AUDIT QUIZ ---");
        System.out.println("Début programmé : " + scheduledStartTime);
        System.out.println("Temps écoulé    : " + secondsSpent + "s");
        System.out.println("Seuil requis    : " + minimumSecondsRequired + "s");

        return secondsSpent < minimumSecondsRequired;
    }
}