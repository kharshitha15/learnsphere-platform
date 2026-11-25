package com.learnsphere.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(length = 2000)
    private String submissionUrl;
    
    @Column(length = 3000)
    private String studentNotes;

    private Integer marksObtained;
    
    @Column(length = 2000)
    private String instructorFeedback;

    private String status; // SUBMITTED, GRADED, RETURNED, LATE, NOT_STARTED

    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private boolean graded;
}
