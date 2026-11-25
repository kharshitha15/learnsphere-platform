package com.learnsphere.controller;

import com.learnsphere.entity.User;
import com.learnsphere.repository.CourseRepository;
import com.learnsphere.repository.EnrollmentRepository;
import com.learnsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    @GetMapping("/instructor")
    public ResponseEntity<?> getInstructorAnalytics(Authentication authentication) {
        String email = authentication.getName();
        User instructor = userRepository.findByEmail(email).orElseThrow();

        long totalCourses = courseRepository.countByInstructorId(instructor.getId());
        long totalStudents = enrollmentRepository.countByCourse_Instructor_Id(instructor.getId());

        return ResponseEntity.ok(Map.of(
                "totalCourses", totalCourses,
                "totalStudents", totalStudents,
                "averageRating", 4.8, // Mock for now
                "totalRevenue", totalStudents * 49.99 // Mock calculation
        ));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics() {
        long totalUsers = userRepository.count();
        long totalCourses = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalCourses", totalCourses,
                "totalEnrollments", totalEnrollments
        ));
    }
}
