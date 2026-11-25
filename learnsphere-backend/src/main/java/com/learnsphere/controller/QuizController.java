package com.learnsphere.controller;

import com.learnsphere.entity.Question;
import com.learnsphere.entity.Quiz;
import com.learnsphere.entity.QuizSubmission;
import com.learnsphere.entity.User;
import com.learnsphere.repository.QuestionRepository;
import com.learnsphere.repository.QuizRepository;
import com.learnsphere.repository.QuizSubmissionRepository;
import com.learnsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final UserRepository userRepository;

    @GetMapping("/{quizId}/questions")
    public ResponseEntity<?> getQuestionsForQuiz(@PathVariable Long quizId) {
        // Return questions without the correctOption for the frontend to render!
        List<Map<String, Object>> questions = questionRepository.findByQuizId(quizId)
            .stream().map(q -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", q.getId());
                map.put("text", q.getText());
                map.put("optionA", q.getOptionA());
                map.put("optionB", q.getOptionB());
                map.put("optionC", q.getOptionC());
                map.put("optionD", q.getOptionD());
                return map;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<?> submitQuiz(@PathVariable Long quizId, @RequestBody Map<Long, String> answers, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        Quiz quiz = quizRepository.findById(quizId).orElseThrow();

        List<Question> questions = questionRepository.findByQuizId(quizId);
        int score = 0;
        
        for (Question q : questions) {
            String submittedAnswer = answers.get(q.getId());
            if (submittedAnswer != null && submittedAnswer.equalsIgnoreCase(q.getCorrectOption())) {
                score++;
            }
        }

        double percentage = ((double) score / questions.size()) * 100;
        boolean passed = percentage >= quiz.getPassingPercentage();

        QuizSubmission submission = new QuizSubmission();
        submission.setStudent(student);
        submission.setQuiz(quiz);
        submission.setScore(score);
        submission.setTotalQuestions(questions.size());
        submission.setPassed(passed);
        submission.setSubmittedAt(LocalDateTime.now());
        
        quizSubmissionRepository.save(submission);

        return ResponseEntity.ok(Map.of(
            "score", score,
            "total", questions.size(),
            "percentage", percentage,
            "passed", passed
        ));
    }
}
