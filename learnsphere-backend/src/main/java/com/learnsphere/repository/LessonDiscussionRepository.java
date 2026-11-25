package com.learnsphere.repository;

import com.learnsphere.entity.LessonDiscussion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonDiscussionRepository extends JpaRepository<LessonDiscussion, Long> {
    List<LessonDiscussion> findByLessonIdOrderByCreatedAtDesc(Long lessonId);
    List<LessonDiscussion> findByLessonIdOrderByUpvotesDesc(Long lessonId);
    List<LessonDiscussion> findByUserId(Long userId);
}
