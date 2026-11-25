package com.learnsphere.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    private String activityType; // e.g. "LESSON_COMPLETED", "QUIZ_PASSED", "CERTIFICATE_EARNED", "ENROLLED"
    private String description; // e.g. "Completed Java OOP lesson"
    
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
