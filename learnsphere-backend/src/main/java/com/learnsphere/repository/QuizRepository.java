package com.learnsphere.repository;

import com.learnsphere.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByModuleCourseInstructorId(Long instructorId);
    List<Quiz> findByModuleCourseId(Long courseId);
    List<Quiz> findByModuleId(Long moduleId);
}
