package org.example.msevaluation.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.msevaluation.dto.EvaluationResultDTO;
import org.example.msevaluation.entities.Evaluation;
import org.example.msevaluation.entities.ExamQuestions;
import org.example.msevaluation.entities.LearnerExamAnswer;
import org.example.msevaluation.repositories.ExamQuestionsRepository;
import org.example.msevaluation.repositories.LearnerExamAnswerRepository;
import org.example.msevaluation.services.interfaces.ILearnerExamAnswerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class LearnerExamAnswerImpl implements ILearnerExamAnswerService {

    private final LearnerExamAnswerRepository learnerExamAnswerRepository;
    private final ExamQuestionsRepository examQuestionsRepository;

    @Override
    @Transactional
    public EvaluationResultDTO saveAllAnswers(List<LearnerExamAnswer> answers) {
        if (answers == null || answers.isEmpty()) {
            return buildEmptyResult();
        }

        List<Long> questionIds = answers.stream()
                .map(a -> a.getQuestion().getId())
                .toList();

        List<ExamQuestions> questionsFromDb = examQuestionsRepository.findAllByIdIn(questionIds);

        // Récupération de l'évaluation parente
        Evaluation eval = questionsFromDb.get(0).getEvaluation();

        // LOGIQUE MODIFIÉE : On utilise eval.getDate() (date officielle en base de données)
        boolean suspicious = isSubmittingTooFast(eval.getDate(), eval.getDuration());

        double earnedPoints = 0.0;
        double totalPoints = 0.0;
        int correctCount = 0;
        int totalQuestions = answers.size();
        LocalDateTime submissionTime = LocalDateTime.now();

        for (LearnerExamAnswer answer : answers) {
            ExamQuestions question = questionsFromDb.stream()
                    .filter(q -> q.getId().equals(answer.getQuestion().getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Question non trouvée : " + answer.getQuestion().getId()));

            // Correction automatique sémantique
            double score = calculateAutomaticScore(answer.getAnswerOfLearner(), question);

            // Mise à jour de l'entité
            answer.setScore(score);
            answer.setQuestion(question);
            answer.setIsSuspicious(suspicious); // Stockage du flag d'audit
            answer.setResponseDate(submissionTime); // Date de fin réelle

            earnedPoints += score;
            totalPoints += question.getPoints();
            if (score > 0) correctCount++;
        }

        // Sauvegarde persistante
        learnerExamAnswerRepository.saveAll(answers);

        double percentage = (totalPoints > 0) ? (earnedPoints / totalPoints) * 100 : 0.0;

        return EvaluationResultDTO.builder()
                .learnerName("Omar Aguil")
                .evaluationTitle(eval.getTitle())
                .type("EXAM")
                .scoreObtained(earnedPoints)
                .totalPossiblePoints(totalPoints)
                .correctAnswersCount(correctCount)
                .wrongAnswersCount(totalQuestions - correctCount)
                .totalQuestions(totalQuestions)
                .percentage(Math.round(percentage * 100.0) / 100.0)
                .minSuccessScore(eval.getMinSuccessScore())
                .isPassed(percentage >= eval.getMinSuccessScore())
                .evaluationId(eval.getId())
                .isSuspicious(suspicious)
                .build();
    }

    private double calculateAutomaticScore(String studentAnswer, ExamQuestions question) {
        if (studentAnswer == null || studentAnswer.trim().isEmpty() ||
                question.getKeywords() == null || question.getKeywords().isEmpty()) {
            return 0.0;
        }

        String cleanStudentAnswer = studentAnswer.toLowerCase().trim();
        List<String> requiredKeywords = question.getKeywords();

        long foundCount = requiredKeywords.stream()
                .filter(keyword -> cleanStudentAnswer.contains(keyword.toLowerCase().trim()))
                .count();

        // Notation binaire basée sur la présence de tous les mots-clés
        if (foundCount == requiredKeywords.size()) {
            return question.getPoints();
        }

        return 0.0;
    }

    @Override
    public boolean isSubmittingTooFast(LocalDateTime scheduledDate, int durationInMinutes) {
        if (scheduledDate == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        long secondsSinceStart = java.time.Duration.between(scheduledDate, now).getSeconds();
        long minimumSecondsRequired = (durationInMinutes * 60L) / 10;

        System.out.println("--- AUDIT TEMPOREL ---");
        System.out.println("Début officiel : " + scheduledDate);
        System.out.println("Soumission à   : " + now);
        System.out.println("Écart réel     : " + secondsSinceStart + " secondes");
        System.out.println("Seuil minimum  : " + minimumSecondsRequired + " secondes");

        return secondsSinceStart < minimumSecondsRequired;
    }

    private EvaluationResultDTO buildEmptyResult() {
        return EvaluationResultDTO.builder()
                .learnerName("Omar Aguil")
                .evaluationTitle("Examen vide")
                .type("EXAM")
                .scoreObtained(0.0)
                .isPassed(false)
                .isSuspicious(false)
                .build();
    }

    @Override
    public List<LearnerExamAnswer> getAnswersByLearnerId(Long learnerId) {
        return learnerExamAnswerRepository.findByLearnerId(learnerId);
    }
}