package com.learnsphere.controller;

import com.learnsphere.entity.*;
import com.learnsphere.entity.Module;
import com.learnsphere.service.CourseService;
import com.learnsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonResourceRepository lessonResourceRepository;
    private final CourseReviewRepository courseReviewRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final AssignmentRepository assignmentRepository;

    @GetMapping
    public ResponseEntity<List<Course>> getAllPublishedCourses() {
        return ResponseEntity.ok(courseService.getAllPublishedCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/{id}/curriculum")
    public ResponseEntity<?> getCourseCurriculum(@PathVariable Long id) {
        List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(id);
        List<Map<String, Object>> result = modules.stream().map(module -> {
            Map<String, Object> mMap = new HashMap<>();
            mMap.put("id", module.getId());
            mMap.put("title", module.getTitle());
            mMap.put("moduleOrder", module.getModuleOrder());
            
            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(module.getId());
            mMap.put("lessons", lessons);
            return mMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<?> getCourseReviews(@PathVariable Long id) {
        List<CourseReview> reviews = courseReviewRepository.findByCourseIdOrderByCreatedAtDesc(id);
        List<Map<String, Object>> result = reviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("studentName", r.getStudent() != null ? r.getStudent().getFullName() : "Learner");
            map.put("rating", r.getRating());
            map.put("comment", r.getReviewText());
            map.put("instructorReply", r.getInstructorReply());
            map.put("repliedAt", r.getRepliedAt());
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Interactive Preview Drawer / Modal API (Udemy style)
    @GetMapping("/{id}/preview")
    public ResponseEntity<?> getCoursePreview(@PathVariable Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<CourseReview> reviews = courseReviewRepository.findByCourseIdOrderByCreatedAtDesc(id);
        double avgRating = reviews.isEmpty() ? 4.9 :
                reviews.stream().mapToInt(CourseReview::getRating).average().orElse(4.9);

        // Rating distribution breakdown (5 star, 4 star, etc.)
        Map<Integer, Long> starCounts = reviews.stream()
                .collect(Collectors.groupingBy(CourseReview::getRating, Collectors.counting()));
        int totalRevs = reviews.size();
        List<Map<String, Object>> ratingDistribution = new ArrayList<>();
        for (int star = 5; star >= 1; star--) {
            long count = starCounts.getOrDefault(star, 0L);
            int pct = totalRevs > 0 ? (int) Math.round(((double) count / totalRevs) * 100) : (star >= 4 ? (star == 5 ? 80 : 20) : 0);
            ratingDistribution.add(Map.of("stars", star, "count", count, "percentage", pct));
        }

        long studentsCount = enrollmentRepository.findAll().stream()
                .filter(e -> e.getCourse() != null && e.getCourse().getId().equals(id)).count();
        if (studentsCount == 0) studentsCount = 120 + course.getId() * 35;

        List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(id);
        int totalLessons = 0;
        int totalDuration = 0;
        boolean firstLessonPreviewAssigned = false;

        List<Map<String, Object>> curriculum = new ArrayList<>();
        for (Module m : modules) {
            Map<String, Object> mMap = new HashMap<>();
            mMap.put("id", m.getId());
            mMap.put("title", m.getTitle());

            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId());
            List<Map<String, Object>> lessonDTOs = new ArrayList<>();
            for (Lesson l : lessons) {
                totalLessons++;
                int dur = l.getDuration() > 0 ? l.getDuration() : 12;
                totalDuration += dur;

                boolean isPreview = false;
                if (!firstLessonPreviewAssigned && l.getLessonType() == LessonType.VIDEO && l.getVideoUrl() != null && !l.getVideoUrl().isBlank()) {
                    isPreview = true;
                    firstLessonPreviewAssigned = true;
                }

                Map<String, Object> lMap = new HashMap<>();
                lMap.put("id", l.getId());
                lMap.put("title", l.getTitle());
                lMap.put("lessonType", l.getLessonType() != null ? l.getLessonType().name() : "VIDEO");
                lMap.put("duration", dur);
                lMap.put("isPreview", isPreview);
                if (isPreview) {
                    lMap.put("previewVideoUrl", l.getVideoUrl());
                }
                lessonDTOs.add(lMap);
            }
            mMap.put("lessons", lessonDTOs);

            List<Quiz> quizzes = quizRepository.findByModuleId(m.getId());
            mMap.put("quizzesCount", quizzes.size());

            List<Assignment> activities = assignmentRepository.findByModuleId(m.getId());
            mMap.put("activitiesCount", activities.size());

            curriculum.add(mMap);
        }

        Map<String, Object> previewLessonMap = null;
        String previewVideoUrl = null;
        for (Module m : modules) {
            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId());
            for (Lesson l : lessons) {
                if (l.getVideoUrl() != null && !l.getVideoUrl().isBlank()) {
                    previewVideoUrl = l.getVideoUrl();
                    previewLessonMap = Map.of(
                            "id", l.getId(),
                            "title", l.getTitle(),
                            "videoUrl", l.getVideoUrl(),
                            "duration", l.getDuration() > 0 ? l.getDuration() : 12
                    );
                    break;
                }
            }
            if (previewLessonMap != null) break;
        }

        Map<String, Object> instructorMap = Map.of(
                "id", course.getInstructor() != null ? course.getInstructor().getId() : 0,
                "fullName", course.getInstructor() != null ? course.getInstructor().getFullName() : "Instructor",
                "bio", course.getInstructor() != null && course.getInstructor().getBio() != null ? course.getInstructor().getBio() : "Expert Instructor",
                "skills", course.getInstructor() != null && course.getInstructor().getSkills() != null ? course.getInstructor().getSkills() : "Software Engineering"
        );

        Map<String, Object> courseDTO = new HashMap<>();
        courseDTO.put("id", course.getId());
        courseDTO.put("title", course.getTitle());
        courseDTO.put("description", course.getDescription());
        courseDTO.put("category", course.getCategory() != null ? course.getCategory() : "Development");
        courseDTO.put("difficulty", course.getDifficulty() != null ? course.getDifficulty() : "BEGINNER");
        courseDTO.put("level", course.getDifficulty() != null ? course.getDifficulty() : "BEGINNER");
        courseDTO.put("instructor", instructorMap);

        Map<String, Object> response = new HashMap<>();
        response.put("course", courseDTO);
        response.put("id", course.getId());
        response.put("title", course.getTitle());
        response.put("description", course.getDescription());
        response.put("category", course.getCategory() != null ? course.getCategory() : "Development");
        response.put("difficulty", course.getDifficulty() != null ? course.getDifficulty() : "BEGINNER");
        response.put("level", course.getDifficulty() != null ? course.getDifficulty() : "BEGINNER");
        response.put("instructor", instructorMap);
        response.put("instructorName", course.getInstructor() != null ? course.getInstructor().getFullName() : "Instructor");
        response.put("rating", Math.round(avgRating * 10.0) / 10.0);
        response.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        response.put("totalReviews", totalRevs > 0 ? totalRevs : 24);
        response.put("ratingDistribution", ratingDistribution);
        response.put("studentsCount", studentsCount);
        response.put("enrolledStudentsCount", studentsCount);
        response.put("totalLessons", totalLessons);
        response.put("totalDurationHours", Math.max(1, Math.round(totalDuration / 60.0)));
        response.put("curriculum", curriculum);
        response.put("previewLesson", previewLessonMap);
        response.put("previewVideoUrl", previewVideoUrl != null ? previewVideoUrl : "https://www.youtube.com/embed/9SGDpanrc8U");
        response.put("reviews", reviews.stream().limit(6).map(r -> Map.of(
                "id", r.getId(),
                "studentName", r.getStudent() != null ? r.getStudent().getFullName() : "Learner",
                "rating", r.getRating(),
                "comment", r.getReviewText() != null ? r.getReviewText() : "",
                "instructorReply", r.getInstructorReply() != null ? r.getInstructorReply() : "",
                "createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
        )).collect(Collectors.toList()));
        response.put("recentReviews", response.get("reviews"));

        return ResponseEntity.ok(response);
    }
}
