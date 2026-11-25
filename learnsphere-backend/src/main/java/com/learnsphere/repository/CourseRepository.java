package com.learnsphere.repository;

import com.learnsphere.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByPublishedTrue();
    List<Course> findByInstructorId(Long instructorId);
    long countByInstructorId(Long instructorId);
    List<Course> findByCategoryAndPublishedTrue(String category);
}
