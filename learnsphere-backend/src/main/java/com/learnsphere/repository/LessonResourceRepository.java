package com.learnsphere.repository;

import com.learnsphere.entity.LessonResource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonResourceRepository extends JpaRepository<LessonResource, Long> {
    List<LessonResource> findByLessonId(Long lessonId);
}
