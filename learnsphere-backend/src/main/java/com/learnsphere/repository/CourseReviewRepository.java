package com.learnsphere.repository;

import com.learnsphere.entity.CourseReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {
    List<CourseReview> findByCourseInstructorIdOrderByCreatedAtDesc(Long instructorId);
    List<CourseReview> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    List<CourseReview> findByStudentId(Long studentId);
    Optional<CourseReview> findByStudentIdAndCourseId(Long studentId, Long courseId);
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
}
