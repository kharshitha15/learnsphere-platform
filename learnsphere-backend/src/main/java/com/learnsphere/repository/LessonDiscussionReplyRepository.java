package com.learnsphere.repository;

import com.learnsphere.entity.LessonDiscussionReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonDiscussionReplyRepository extends JpaRepository<LessonDiscussionReply, Long> {
    List<LessonDiscussionReply> findByDiscussionIdOrderByCreatedAtAsc(Long discussionId);
}
