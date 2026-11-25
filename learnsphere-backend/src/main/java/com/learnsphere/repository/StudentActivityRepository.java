package com.learnsphere.repository;

import com.learnsphere.entity.StudentActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentActivityRepository extends JpaRepository<StudentActivity, Long> {
    List<StudentActivity> findByStudentIdOrderByTimestampDesc(Long studentId);
    List<StudentActivity> findByStudentId(Long studentId);
}
