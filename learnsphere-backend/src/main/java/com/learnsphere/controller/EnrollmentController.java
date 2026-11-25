package com.learnsphere.controller;

import com.learnsphere.entity.Course;
import com.learnsphere.entity.Enrollment;
import com.learnsphere.entity.*;
import com.learnsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final StudentActivityRepository studentActivityRepository;
    private final CertificateRepository certificateRepository;

    @PostMapping("/progress/{lessonId}")
    public ResponseEntity<?> markLessonComplete(@PathVariable Long lessonId, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow();
        Course course = lesson.getModule().getCourse();

        // 1. Mark lesson as complete
        LessonProgress progress = lessonProgressRepository.findByStudentIdAndLessonId(student.getId(), lessonId)
                .orElse(new LessonProgress());
        
        progress.setStudent(student);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());
        lessonProgressRepository.save(progress);

        // 2. Activity Record
        studentActivityRepository.save(StudentActivity.builder()
            .student(student)
            .activityType("LESSON_COMPLETED")
            .description("Completed lesson: " + lesson.getTitle())
            .timestamp(LocalDateTime.now())
            .build());

        // 3. Update Course Progress & Auto-enroll if needed
        List<com.learnsphere.entity.Module> courseModules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(course.getId());
        int totalCourseLessons = 0;
        for (com.learnsphere.entity.Module m : courseModules) {
            totalCourseLessons += lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()).size();
        }
        if (totalCourseLessons == 0) totalCourseLessons = 1;

        List<LessonProgress> allCompleted = lessonProgressRepository.findByStudentIdAndLesson_Module_CourseId(student.getId(), course.getId());
        long completedCount = allCompleted.stream().filter(LessonProgress::isCompleted).count();
        double percentage = Math.min(100.0, Math.round(((double) completedCount / (double) totalCourseLessons) * 100.0));

        Enrollment enrollment = enrollmentRepository.findByStudentId(student.getId())
            .stream().filter(e -> e.getCourse().getId().equals(course.getId())).findFirst().orElse(null);
            
        if (enrollment == null) {
            enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setEnrolledAt(LocalDateTime.now());
        }

        enrollment.setProgressPercentage(percentage);
        enrollmentRepository.save(enrollment);
            
        // 4. Generate Certificate if 100%
        boolean isCompleted = percentage >= 100.0 || completedCount >= totalCourseLessons;
        if (isCompleted) {
            boolean hasCert = certificateRepository.findByStudentId(student.getId()).stream()
                                .anyMatch(c -> c.getCourse().getId().equals(course.getId()));
            if (!hasCert) {
                Certificate cert = new Certificate();
                cert.setStudent(student);
                cert.setCourse(course);
                cert.setCertificateId("CERT-LS-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0,6).toUpperCase());
                cert.setIssueDate(LocalDateTime.now());
                certificateRepository.save(cert);
                
                studentActivityRepository.save(StudentActivity.builder()
                    .student(student)
                    .activityType("CERTIFICATE_EARNED")
                    .description("Earned certificate for: " + course.getTitle())
                    .timestamp(LocalDateTime.now())
                    .build());
            }
        }
        
        enrollmentRepository.save(enrollment);
        
        return ResponseEntity.ok(Map.of(
            "message", isCompleted ? "Course completed!" : "Lesson marked as complete",
            "progressPercentage", percentage,
            "completedCount", completedCount,
            "isCourseCompleted", isCompleted
        ));
    }

    @GetMapping("/completed-lessons/{courseId}")
    public ResponseEntity<List<Long>> getCompletedLessons(@PathVariable Long courseId, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        
        List<Long> completedIds = lessonProgressRepository.findByStudentIdAndLesson_Module_CourseId(student.getId(), courseId)
            .stream()
            .filter(LessonProgress::isCompleted)
            .map(lp -> lp.getLesson().getId())
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(completedIds);
    }

    @GetMapping("/check/{courseId}")
    public ResponseEntity<?> checkEnrollment(@PathVariable Long courseId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.ok(Map.of("isEnrolled", false));
        }
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElse(null);
        if (student == null) {
            return ResponseEntity.ok(Map.of("isEnrolled", false));
        }

        Course targetCourse = courseRepository.findById(courseId).orElse(null);
        Enrollment existing = enrollmentRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getCourse() != null && (e.getCourse().getId().equals(courseId) || (targetCourse != null && e.getCourse().getTitle().trim().equalsIgnoreCase(targetCourse.getTitle().trim()))))
                .findFirst()
                .orElse(null);

        boolean isEnrolled = existing != null;
        double progress = existing != null ? existing.getProgressPercentage() : 0.0;
        return ResponseEntity.ok(Map.of(
            "isEnrolled", isEnrolled,
            "courseId", existing != null ? existing.getCourse().getId() : courseId,
            "progressPercentage", progress
        ));
    }

    @PostMapping("/enroll/{courseId}")
    public ResponseEntity<?> enrollCourse(@PathVariable Long courseId, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Prevent duplicate enrollment (by ID or matching title)
        Enrollment existing = enrollmentRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getCourse() != null && (e.getCourse().getId().equals(courseId) || e.getCourse().getTitle().trim().equalsIgnoreCase(course.getTitle().trim())))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "alreadyEnrolled", true,
                "message", "You are already enrolled in this course.",
                "courseId", existing.getCourse().getId(),
                "progressPercentage", existing.getProgressPercentage()
            ));
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setProgressPercentage(0.0);
        enrollment.setEnrolledAt(LocalDateTime.now());
        
        enrollmentRepository.save(enrollment);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "alreadyEnrolled", false,
            "message", "Successfully enrolled in " + course.getTitle() + "!",
            "courseId", courseId
        ));
    }

    @GetMapping("/my-courses")
    public ResponseEntity<?> getMyCourses(Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email).orElseThrow();
        
        List<Map<String, Object>> myCourses = enrollmentRepository.findByStudentId(student.getId())
            .stream().map(enrollment -> {
                Map<String, Object> map = new HashMap<>();
                map.put("enrollmentId", enrollment.getId());
                map.put("progress", enrollment.getProgressPercentage());
                map.put("courseId", enrollment.getCourse().getId());
                map.put("courseTitle", enrollment.getCourse().getTitle());
                map.put("courseCategory", enrollment.getCourse().getCategory());
                map.put("instructorName", enrollment.getCourse().getInstructor().getFullName());
                return map;
            }).collect(Collectors.toList());
            
        return ResponseEntity.ok(myCourses);
    }
}
