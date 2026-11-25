package com.learnsphere.controller;

import com.learnsphere.entity.Certificate;
import com.learnsphere.entity.Course;
import com.learnsphere.entity.Enrollment;
import com.learnsphere.entity.User;
import com.learnsphere.repository.CertificateRepository;
import com.learnsphere.repository.CourseRepository;
import com.learnsphere.repository.EnrollmentRepository;
import com.learnsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @PostMapping("/generate/{courseId}")
    public ResponseEntity<?> generateCertificate(@PathVariable Long courseId, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Student not enrolled in course"));

        // In a real scenario, we'd verify progress == 100% and quizzes passed.
        // For demonstration, we allow generation.

        String uniqueId = "CERT-LS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Certificate certificate = new Certificate();
        certificate.setStudent(student);
        certificate.setCourse(course);
        certificate.setIssueDate(LocalDateTime.now());
        certificate.setCertificateId(uniqueId);

        certificateRepository.save(certificate);

        return ResponseEntity.ok(Map.of(
                "message", "Certificate generated successfully",
                "certificateId", uniqueId
        ));
    }

    @GetMapping("/verify/{certId}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certId) {
        Certificate cert = certificateRepository.findByCertificateId(certId)
                .orElseThrow(() -> new RuntimeException("Invalid certificate"));

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "studentName", cert.getStudent().getFullName(),
                "courseName", cert.getCourse().getTitle(),
                "issueDate", cert.getIssueDate()
        ));
    }
}
