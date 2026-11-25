package com.learnsphere.controller;

import com.learnsphere.entity.Assignment;
import com.learnsphere.entity.AssignmentSubmission;
import com.learnsphere.entity.User;
import com.learnsphere.repository.AssignmentRepository;
import com.learnsphere.repository.AssignmentSubmissionRepository;
import com.learnsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    @PostMapping("/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(@PathVariable Long assignmentId, @RequestBody Map<String, String> payload, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow();

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setStudent(student);
        submission.setAssignment(assignment);
        submission.setSubmissionUrl(payload.get("submissionUrl"));
        submission.setStudentNotes(payload.get("studentNotes"));
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setGraded(false);

        submissionRepository.save(submission);

        return ResponseEntity.ok(Map.of("message", "Assignment submitted successfully!"));
    }
}
