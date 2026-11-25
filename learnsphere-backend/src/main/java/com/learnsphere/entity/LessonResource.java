package com.learnsphere.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_resources")
@Data
@NoArgsConstructor
public class LessonResource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "lesson_id", nullable = false) @com.fasterxml.jackson.annotation.JsonIgnore private Lesson lesson;

    @Column(nullable = false)
    private String resourceType; // VIDEO, DOCUMENTATION, ARTICLE, GITHUB, PDF, PRACTICE

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 1000)
    private String url;

    private String provider; // e.g. YOUTUBE, GITHUB, OFFICIAL_DOCS

    private boolean isFree = true;
    private boolean isExternal = true;

    private LocalDateTime createdAt = LocalDateTime.now();
}

