package com.learnsphere.repository;

import com.learnsphere.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);
    List<LessonProgress> findByStudentId(Long studentId);
    long countByStudentIdAndCompletedTrue(Long studentId);
    List<LessonProgress> findByStudentIdAndLesson_Module_CourseId(Long studentId, Long courseId);
}
