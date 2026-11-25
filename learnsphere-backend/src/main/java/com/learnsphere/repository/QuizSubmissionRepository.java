package com.learnsphere.repository;

import com.learnsphere.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    List<QuizSubmission> findByStudentId(Long studentId);
    List<QuizSubmission> findByQuizId(Long quizId);
    List<QuizSubmission> findByQuizModuleCourseInstructorId(Long instructorId);
    List<QuizSubmission> findByQuizModuleCourseId(Long courseId);
}
