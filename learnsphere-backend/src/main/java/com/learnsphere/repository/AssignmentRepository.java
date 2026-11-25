package com.learnsphere.repository;

import com.learnsphere.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseId(Long courseId);
    List<Assignment> findByCourseInstructorId(Long instructorId);
    List<Assignment> findByModuleId(Long moduleId);
}
