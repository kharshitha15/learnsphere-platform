package com.learnsphere.repository;

import com.learnsphere.entity.LessonNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonNoteRepository extends JpaRepository<LessonNote, Long> {
    List<LessonNote> findByStudentIdAndLessonIdOrderByUpdatedAtDesc(Long studentId, Long lessonId);
    List<LessonNote> findByStudentIdOrderByUpdatedAtDesc(Long studentId);
    List<LessonNote> findByStudentId(Long studentId);
    List<LessonNote> findByStudentIdAndLesson_Module_CourseIdOrderByUpdatedAtDesc(Long studentId, Long courseId);
}
