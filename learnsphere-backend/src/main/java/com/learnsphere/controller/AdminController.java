package com.learnsphere.controller;

import com.learnsphere.entity.*;
import com.learnsphere.entity.Module;
import com.learnsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;
    private final CourseReviewRepository courseReviewRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationRepository notificationRepository;
    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final StudentActivityRepository studentActivityRepository;
    private final LessonProgressRepository lessonProgressRepository;

    private User getAuthenticatedAdmin(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found for email: " + email));
        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Access denied. Admin privileges required.");
        }
        return user;
    }

    // ==========================================
    // 1. DASHBOARD OVERVIEW & METRICS
    // ==========================================
    @GetMapping("/dashboard")
    public ResponseEntity<?> getAdminDashboard(Authentication authentication) {
        getAuthenticatedAdmin(authentication);

        List<User> allUsers = userRepository.findAll();
        long totalStudents = allUsers.stream().filter(u -> u.getRole() == Role.STUDENT).count();
        long totalInstructors = allUsers.stream().filter(u -> u.getRole() == Role.INSTRUCTOR).count();

        List<Course> allCourses = courseRepository.findAll();
        long totalCourses = allCourses.size();
        long publishedCourses = allCourses.stream().filter(Course::isPublished).count();
        long pendingCourses = allCourses.stream().filter(c -> "PENDING_APPROVAL".equalsIgnoreCase(c.getStatus()) || !c.isPublished()).count();

        List<Enrollment> allEnrollments = enrollmentRepository.findAll();
        long totalEnrollments = allEnrollments.size();

        List<Certificate> allCertificates = certificateRepository.findAll();
        long certificatesIssued = allCertificates.size();

        List<CourseReview> allReviews = courseReviewRepository.findAll();
        double avgRating = allReviews.isEmpty() ? 5.0 :
                allReviews.stream().mapToInt(CourseReview::getRating).average().orElse(5.0);

        // Recent Registrations
        List<Map<String, Object>> recentUsers = allUsers.stream()
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .limit(6)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "fullName", u.getFullName() != null ? u.getFullName() : "User",
                        "email", u.getEmail(),
                        "role", u.getRole().name(),
                        "createdAt", u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now(),
                        "active", u.getActive() != null ? u.getActive() : true
                ))
                .collect(Collectors.toList());

        // Recent Courses
        List<Map<String, Object>> recentCourses = allCourses.stream()
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .limit(6)
                .map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "title", c.getTitle(),
                        "category", c.getCategory() != null ? c.getCategory() : "General",
                        "instructorName", c.getInstructor() != null ? c.getInstructor().getFullName() : "Instructor",
                        "status", c.getStatus() != null ? c.getStatus() : (c.isPublished() ? "PUBLISHED" : "PENDING_APPROVAL"),
                        "createdAt", c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now()
                ))
                .collect(Collectors.toList());

        // Recent Enrollments
        List<Map<String, Object>> recentEnrollmentList = allEnrollments.stream()
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getEnrolledAt() != null ? a.getEnrolledAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getEnrolledAt() != null ? b.getEnrolledAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1);
                })
                .limit(6)
                .map(e -> Map.<String, Object>of(
                        "id", e.getId(),
                        "studentName", e.getStudent() != null ? e.getStudent().getFullName() : "Student",
                        "courseTitle", e.getCourse() != null ? e.getCourse().getTitle() : "Course",
                        "progressPercentage", e.getProgressPercentage(),
                        "enrollmentDate", e.getEnrolledAt() != null ? e.getEnrolledAt() : LocalDateTime.now()
                ))
                .collect(Collectors.toList());

        // Category popularity counts
        Map<String, Long> categoryMap = allCourses.stream()
                .collect(Collectors.groupingBy(c -> c.getCategory() != null ? c.getCategory() : "Other", Collectors.counting()));
        List<Map<String, Object>> categoryStats = categoryMap.entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                        "category", entry.getKey(),
                        "count", entry.getValue(),
                        "percentage", totalCourses > 0 ? Math.round(((double) entry.getValue() / totalCourses) * 100.0) : 0
                ))
                .sorted((a, b) -> ((Long) b.get("count")).compareTo((Long) a.get("count")))
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalInstructors", totalInstructors);
        stats.put("totalCourses", totalCourses);
        stats.put("publishedCourses", publishedCourses);
        stats.put("pendingCourses", pendingCourses);
        stats.put("totalEnrollments", totalEnrollments);
        stats.put("certificatesIssued", certificatesIssued);
        stats.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        stats.put("totalReviews", allReviews.size());

        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        response.put("recentUsers", recentUsers);
        response.put("recentCourses", recentCourses);
        response.put("recentEnrollments", recentEnrollmentList);
        response.put("categoryStats", categoryStats);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 2. USERS MANAGEMENT
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            Authentication authentication
    ) {
        getAuthenticatedAdmin(authentication);
        List<User> users = userRepository.findAll();

        if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
            try {
                Role r = Role.valueOf(role.toUpperCase());
                users = users.stream().filter(u -> u.getRole() == r).collect(Collectors.toList());
            } catch (Exception ignored) {}
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            users = users.stream().filter(u ->
                    (u.getFullName() != null && u.getFullName().toLowerCase().contains(q)) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
                    (u.getLocation() != null && u.getLocation().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        List<Enrollment> allEnrollments = enrollmentRepository.findAll();
        List<Course> allCourses = courseRepository.findAll();

        List<Map<String, Object>> userDTOs = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("fullName", u.getFullName() != null ? u.getFullName() : "");
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("username", u.getUsername());
            map.put("bio", u.getBio());
            map.put("skills", u.getSkills());
            map.put("careerInterest", u.getCareerInterest());
            map.put("location", u.getLocation());
            map.put("active", u.getActive() != null ? u.getActive() : true);
            map.put("createdAt", u.getCreatedAt());

            if (u.getRole() == Role.STUDENT) {
                long enrCount = allEnrollments.stream().filter(e -> e.getStudent() != null && e.getStudent().getId().equals(u.getId())).count();
                map.put("enrollmentsCount", enrCount);
                map.put("coursesCount", 0);
            } else if (u.getRole() == Role.INSTRUCTOR) {
                long cCount = allCourses.stream().filter(c -> c.getInstructor() != null && c.getInstructor().getId().equals(u.getId())).count();
                map.put("coursesCount", cCount);
                map.put("enrollmentsCount", 0);
            } else {
                map.put("enrollmentsCount", 0);
                map.put("coursesCount", 0);
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userDTOs);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        User admin = getAuthenticatedAdmin(authentication);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (payload.containsKey("fullName")) user.setFullName((String) payload.get("fullName"));
        if (payload.containsKey("email")) {
            String newEmail = (String) payload.get("email");
            if (!user.getEmail().equalsIgnoreCase(newEmail) && userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email already in use by another account."));
            }
            user.setEmail(newEmail);
        }
        if (payload.containsKey("bio")) user.setBio((String) payload.get("bio"));
        if (payload.containsKey("skills")) user.setSkills((String) payload.get("skills"));
        if (payload.containsKey("careerInterest")) user.setCareerInterest((String) payload.get("careerInterest"));
        if (payload.containsKey("location")) user.setLocation((String) payload.get("location"));
        if (payload.containsKey("active")) user.setActive(Boolean.parseBoolean(String.valueOf(payload.get("active"))));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User details updated successfully", "user", user));
    }

    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id, Authentication authentication) {
        User admin = getAuthenticatedAdmin(authentication);
        if (admin.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Master Admin account cannot be deactivated."));
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean current = user.getActive() != null ? user.getActive() : true;
        user.setActive(!current);
        userRepository.save(user);

        String statusStr = user.getActive() ? "activated" : "deactivated";
        return ResponseEntity.ok(Map.of("message", "User account successfully " + statusStr, "active", user.getActive()));
    }

    // ==========================================
    // 3. COURSES MANAGEMENT
    // ==========================================
    @GetMapping("/courses")
    public ResponseEntity<?> getAllCourses(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            Authentication authentication
    ) {
        getAuthenticatedAdmin(authentication);
        List<Course> courses = courseRepository.findAll();

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            courses = courses.stream().filter(c -> {
                String cStatus = c.getStatus() != null ? c.getStatus() : (c.isPublished() ? "PUBLISHED" : "PENDING_APPROVAL");
                return cStatus.equalsIgnoreCase(status);
            }).collect(Collectors.toList());
        }

        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
            courses = courses.stream().filter(c -> c.getCategory() != null && c.getCategory().equalsIgnoreCase(category)).collect(Collectors.toList());
        }

        List<Enrollment> allEnrollments = enrollmentRepository.findAll();
        List<CourseReview> allReviews = courseReviewRepository.findAll();

        List<Map<String, Object>> result = courses.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("title", c.getTitle());
            map.put("category", c.getCategory() != null ? c.getCategory() : "General");
            map.put("difficulty", c.getDifficulty() != null ? c.getDifficulty() : "BEGINNER");
            map.put("description", c.getDescription());
            map.put("published", c.isPublished());
            map.put("status", c.getStatus() != null ? c.getStatus() : (c.isPublished() ? "PUBLISHED" : "PENDING_APPROVAL"));
            map.put("createdAt", c.getCreatedAt());

            if (c.getInstructor() != null) {
                map.put("instructor", Map.of(
                        "id", c.getInstructor().getId(),
                        "fullName", c.getInstructor().getFullName(),
                        "email", c.getInstructor().getEmail()
                ));
            } else {
                map.put("instructor", Map.of("fullName", "Instructor", "email", ""));
            }

            long enrCount = allEnrollments.stream().filter(e -> e.getCourse() != null && e.getCourse().getId().equals(c.getId())).count();
            map.put("studentsCount", enrCount);

            List<CourseReview> cReviews = allReviews.stream().filter(r -> r.getCourse() != null && r.getCourse().getId().equals(c.getId())).toList();
            double avg = cReviews.isEmpty() ? 5.0 : cReviews.stream().mapToInt(CourseReview::getRating).average().orElse(5.0);
            map.put("rating", Math.round(avg * 10.0) / 10.0);
            map.put("reviewsCount", cReviews.size());

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/courses/{id}/status")
    public ResponseEntity<?> updateCourseStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        User admin = getAuthenticatedAdmin(authentication);
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        String newStatus = (String) payload.getOrDefault("status", "PUBLISHED");
        String rejectionReason = (String) payload.getOrDefault("reason", "");

        course.setStatus(newStatus.toUpperCase());
        course.setPublished("PUBLISHED".equalsIgnoreCase(newStatus));
        courseRepository.save(course);

        // Notify Instructor
        if (course.getInstructor() != null) {
            String title = "Course Status Update: " + course.getTitle();
            String msg = "Your course '" + course.getTitle() + "' status has been set to " + newStatus + " by the Platform Administrator.";
            if (!rejectionReason.isBlank()) {
                msg += " Admin Notes: " + rejectionReason;
            }

            notificationRepository.save(Notification.builder()
                    .user(course.getInstructor())
                    .title(title)
                    .message(msg)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Course status updated to " + newStatus,
                "courseId", course.getId(),
                "status", course.getStatus(),
                "published", course.isPublished()
        ));
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourseDetails(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        getAuthenticatedAdmin(authentication);
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (payload.containsKey("title")) course.setTitle((String) payload.get("title"));
        if (payload.containsKey("category")) course.setCategory((String) payload.get("category"));
        if (payload.containsKey("difficulty")) course.setDifficulty((String) payload.get("difficulty"));
        if (payload.containsKey("description")) course.setDescription((String) payload.get("description"));

        courseRepository.save(course);

        return ResponseEntity.ok(Map.of("message", "Course updated successfully", "course", course));
    }

    @DeleteMapping("/courses/{id}")
    @Transactional
    public ResponseEntity<?> deleteCourse(@PathVariable Long id, Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Clean dependent items
        List<Enrollment> enrs = enrollmentRepository.findAll().stream()
                .filter(e -> e.getCourse() != null && e.getCourse().getId().equals(id)).toList();
        enrollmentRepository.deleteAll(enrs);

        List<Certificate> certs = certificateRepository.findAll().stream()
                .filter(c -> c.getCourse() != null && c.getCourse().getId().equals(id)).toList();
        certificateRepository.deleteAll(certs);

        List<CourseReview> revs = courseReviewRepository.findAll().stream()
                .filter(r -> r.getCourse() != null && r.getCourse().getId().equals(id)).toList();
        courseReviewRepository.deleteAll(revs);

        List<Assignment> assignments = assignmentRepository.findByCourseId(id);
        for (Assignment a : assignments) {
            List<AssignmentSubmission> subs = assignmentSubmissionRepository.findAll().stream()
                    .filter(s -> s.getAssignment() != null && s.getAssignment().getId().equals(a.getId())).toList();
            assignmentSubmissionRepository.deleteAll(subs);
        }
        assignmentRepository.deleteAll(assignments);

        List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(id);
        for (Module m : modules) {
            List<Quiz> quizzes = quizRepository.findByModuleId(m.getId());
            quizRepository.deleteAll(quizzes);

            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId());
            for (Lesson l : lessons) {
                List<LessonProgress> lps = lessonProgressRepository.findAll().stream()
                        .filter(lp -> lp.getLesson() != null && lp.getLesson().getId().equals(l.getId())).toList();
                lessonProgressRepository.deleteAll(lps);
            }
            lessonRepository.deleteAll(lessons);
        }
        moduleRepository.deleteAll(modules);

        courseRepository.delete(course);

        return ResponseEntity.ok(Map.of("message", "Course and all associated records permanently removed."));
    }

    // ==========================================
    // 4. CATEGORIES MANAGEMENT
    // ==========================================
    @GetMapping("/categories")
    public ResponseEntity<?> getAllCategories(Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        seedDefaultCategoriesIfEmpty();

        List<Category> categories = categoryRepository.findAll();
        List<Course> allCourses = courseRepository.findAll();

        List<Map<String, Object>> response = categories.stream().map(cat -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", cat.getId());
            map.put("name", cat.getName());
            map.put("description", cat.getDescription());
            map.put("icon", cat.getIcon() != null ? cat.getIcon() : "📚");
            map.put("active", cat.isActive());
            map.put("createdAt", cat.getCreatedAt());

            long count = allCourses.stream()
                    .filter(c -> c.getCategory() != null && c.getCategory().equalsIgnoreCase(cat.getName()))
                    .count();
            map.put("coursesCount", count);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody Map<String, Object> payload, Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        String name = (String) payload.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category name is required"));
        }

        if (categoryRepository.findByNameIgnoreCase(name).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category '" + name + "' already exists."));
        }

        Category cat = Category.builder()
                .name(name.trim())
                .description((String) payload.getOrDefault("description", ""))
                .icon((String) payload.getOrDefault("icon", "📚"))
                .active(Boolean.parseBoolean(String.valueOf(payload.getOrDefault("active", true))))
                .build();

        categoryRepository.save(cat);
        return ResponseEntity.ok(Map.of("message", "Category created successfully", "category", cat));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        getAuthenticatedAdmin(authentication);
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (payload.containsKey("name")) cat.setName((String) payload.get("name"));
        if (payload.containsKey("description")) cat.setDescription((String) payload.get("description"));
        if (payload.containsKey("icon")) cat.setIcon((String) payload.get("icon"));
        if (payload.containsKey("active")) cat.setActive(Boolean.parseBoolean(String.valueOf(payload.get("active"))));

        categoryRepository.save(cat);
        return ResponseEntity.ok(Map.of("message", "Category updated successfully", "category", cat));
    }

    @PatchMapping("/categories/{id}/toggle-status")
    public ResponseEntity<?> toggleCategoryStatus(@PathVariable Long id, Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        cat.setActive(!cat.isActive());
        categoryRepository.save(cat);

        return ResponseEntity.ok(Map.of("message", "Category status toggled", "active", cat.isActive()));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id, Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        categoryRepository.delete(cat);

        return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
    }

    private void seedDefaultCategoriesIfEmpty() {
        if (categoryRepository.count() == 0) {
            List<Category> defaults = List.of(
                    Category.builder().name("Java").description("Core Java, OOPs, Spring Boot, Microservices").icon("☕").active(true).build(),
                    Category.builder().name("Web Development").description("React, HTML5, CSS3, JavaScript, Full-Stack").icon("🌐").active(true).build(),
                    Category.builder().name("Database").description("MySQL, PostgreSQL, JPA, Hibernate, NoSQL").icon("🗄️").active(true).build(),
                    Category.builder().name("Python").description("Python programming, scripting, Automation, AI/ML").icon("🐍").active(true).build(),
                    Category.builder().name("Data Structures").description("Algorithms, Trees, Graphs, LeetCode preparation").icon("🧩").active(true).build(),
                    Category.builder().name("Cloud & DevOps").description("Docker, Kubernetes, AWS, CI/CD pipelines").icon("☁️").active(true).build()
            );
            categoryRepository.saveAll(defaults);
        }
    }

    // ==========================================
    // 5. ENROLLMENTS MONITOR
    // ==========================================
    @GetMapping("/enrollments")
    public ResponseEntity<?> getAllEnrollments(Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        List<Enrollment> enrollments = enrollmentRepository.findAll();

        List<Map<String, Object>> result = enrollments.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getId());
            map.put("studentId", e.getStudent() != null ? e.getStudent().getId() : null);
            map.put("studentName", e.getStudent() != null ? e.getStudent().getFullName() : "Unknown");
            map.put("studentEmail", e.getStudent() != null ? e.getStudent().getEmail() : "");
            map.put("courseId", e.getCourse() != null ? e.getCourse().getId() : null);
            map.put("courseTitle", e.getCourse() != null ? e.getCourse().getTitle() : "Unknown");
            map.put("instructorName", e.getCourse() != null && e.getCourse().getInstructor() != null ? e.getCourse().getInstructor().getFullName() : "Instructor");
            map.put("progressPercentage", e.getProgressPercentage());
            map.put("enrollmentDate", e.getEnrolledAt());

            String status = "IN_PROGRESS";
            if (e.getProgressPercentage() >= 100.0) status = "COMPLETED";
            else if (e.getProgressPercentage() == 0.0) status = "NOT_STARTED";
            map.put("status", status);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ==========================================
    // 6. CERTIFICATES REGISTRY & VERIFICATION
    // ==========================================
    @GetMapping("/certificates")
    public ResponseEntity<?> getAllCertificates(Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        List<Certificate> certs = certificateRepository.findAll();

        List<Map<String, Object>> result = certs.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("certificateId", c.getCertificateId());
            map.put("studentId", c.getStudent() != null ? c.getStudent().getId() : null);
            map.put("studentName", c.getStudent() != null ? c.getStudent().getFullName() : "Student");
            map.put("studentEmail", c.getStudent() != null ? c.getStudent().getEmail() : "");
            map.put("courseId", c.getCourse() != null ? c.getCourse().getId() : null);
            map.put("courseTitle", c.getCourse() != null ? c.getCourse().getTitle() : "Course");
            map.put("instructorName", c.getCourse() != null && c.getCourse().getInstructor() != null ? c.getCourse().getInstructor().getFullName() : "Instructor");
            map.put("issueDate", c.getIssueDate());
            map.put("status", c.getStatus() != null ? c.getStatus() : "ACTIVE");
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/certificates/{id}/toggle-status")
    public ResponseEntity<?> toggleCertificateStatus(@PathVariable Long id, Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        Certificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        String current = cert.getStatus() != null ? cert.getStatus() : "ACTIVE";
        String next = "ACTIVE".equalsIgnoreCase(current) ? "REVOKED" : "ACTIVE";
        cert.setStatus(next);
        certificateRepository.save(cert);

        return ResponseEntity.ok(Map.of("message", "Certificate status changed to " + next, "status", next));
    }

    // ==========================================
    // 7. REVIEWS & REPORTS MODERATION
    // ==========================================
    @GetMapping("/reviews")
    public ResponseEntity<?> getAllReviews(Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        List<CourseReview> reviews = courseReviewRepository.findAll();

        List<Map<String, Object>> result = reviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("studentName", r.getStudent() != null ? r.getStudent().getFullName() : "Student");
            map.put("studentEmail", r.getStudent() != null ? r.getStudent().getEmail() : "");
            map.put("courseId", r.getCourse() != null ? r.getCourse().getId() : null);
            map.put("courseTitle", r.getCourse() != null ? r.getCourse().getTitle() : "Course");
            map.put("rating", r.getRating());
            map.put("comment", r.getReviewText());
            map.put("reviewText", r.getReviewText());
            map.put("instructorReply", r.getInstructorReply());
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id, Authentication authentication) {
        getAuthenticatedAdmin(authentication);
        CourseReview review = courseReviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        courseReviewRepository.delete(review);

        return ResponseEntity.ok(Map.of("message", "Review removed by administrator."));
    }

    // ==========================================
    // 8. NOTIFICATIONS & ANNOUNCEMENTS
    // ==========================================
    @GetMapping("/notifications")
    public ResponseEntity<?> getAdminNotifications(Authentication authentication) {
        User admin = getAuthenticatedAdmin(authentication);
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(admin.getId());

        List<Map<String, Object>> alerts = new ArrayList<>();
        for (Notification n : notifs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("isRead", n.isRead());
            map.put("createdAt", n.getCreatedAt());
            alerts.add(map);
        }

        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/announcements/broadcast")
    public ResponseEntity<?> broadcastAnnouncement(
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        User admin = getAuthenticatedAdmin(authentication);
        String title = (String) payload.getOrDefault("title", "Platform Announcement 📢");
        String message = (String) payload.getOrDefault("message", "");
        String targetAudience = (String) payload.getOrDefault("targetAudience", "ALL");

        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Announcement message cannot be blank"));
        }

        List<User> targetUsers = userRepository.findAll().stream().filter(u -> {
            if ("STUDENTS".equalsIgnoreCase(targetAudience)) return u.getRole() == Role.STUDENT;
            if ("INSTRUCTORS".equalsIgnoreCase(targetAudience)) return u.getRole() == Role.INSTRUCTOR;
            return true;
        }).collect(Collectors.toList());

        List<Notification> notifications = targetUsers.stream().map(u -> Notification.builder()
                .user(u)
                .title(title)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build()
        ).collect(Collectors.toList());

        notificationRepository.saveAll(notifications);

        return ResponseEntity.ok(Map.of(
                "message", "Announcement broadcasted successfully to " + targetUsers.size() + " users.",
                "recipientCount", targetUsers.size()
        ));
    }

    // ==========================================
    // 9. PLATFORM ANALYTICS
    // ==========================================
    @GetMapping("/analytics")
    public ResponseEntity<?> getPlatformAnalytics(Authentication authentication) {
        getAuthenticatedAdmin(authentication);

        List<User> users = userRepository.findAll();
        List<Course> courses = courseRepository.findAll();
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        List<Certificate> certs = certificateRepository.findAll();
        List<QuizSubmission> quizSubs = quizSubmissionRepository.findAll();
        List<AssignmentSubmission> assignmentSubs = assignmentSubmissionRepository.findAll();

        long studentCount = users.stream().filter(u -> u.getRole() == Role.STUDENT).count();
        long instructorCount = users.stream().filter(u -> u.getRole() == Role.INSTRUCTOR).count();

        long completedEnrollments = enrollments.stream().filter(e -> e.getProgressPercentage() >= 100.0).count();
        double completionRate = enrollments.isEmpty() ? 0.0 : ((double) completedEnrollments / enrollments.size()) * 100.0;

        double avgQuizScore = quizSubs.isEmpty() ? 0.0 :
                quizSubs.stream().mapToDouble(q -> (double) q.getScore() / Math.max(1, q.getTotalQuestions()) * 100.0).average().orElse(0.0);

        long gradedAssignments = assignmentSubs.stream().filter(AssignmentSubmission::isGraded).count();

        // Top Active Instructors by enrolled students
        Map<User, Long> instructorStudentMap = enrollments.stream()
                .filter(e -> e.getCourse() != null && e.getCourse().getInstructor() != null)
                .collect(Collectors.groupingBy(e -> e.getCourse().getInstructor(), Collectors.counting()));

        List<Map<String, Object>> topInstructors = instructorStudentMap.entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                        "id", entry.getKey().getId(),
                        "name", entry.getKey().getFullName(),
                        "email", entry.getKey().getEmail(),
                        "studentsCount", entry.getValue(),
                        "coursesCount", courses.stream().filter(c -> c.getInstructor() != null && c.getInstructor().getId().equals(entry.getKey().getId())).count()
                ))
                .sorted((a, b) -> ((Long) b.get("studentsCount")).compareTo((Long) a.get("studentsCount")))
                .limit(5)
                .collect(Collectors.toList());

        // Category Breakdown
        Map<String, Long> categoryMap = courses.stream()
                .collect(Collectors.groupingBy(c -> c.getCategory() != null ? c.getCategory() : "General", Collectors.counting()));
        List<Map<String, Object>> categoriesData = categoryMap.entrySet().stream()
                .map(e -> Map.<String, Object>of(
                        "category", e.getKey(),
                        "courses", e.getValue()
                )).collect(Collectors.toList());

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalUsers", users.size());
        analytics.put("studentsCount", studentCount);
        analytics.put("instructorsCount", instructorCount);
        analytics.put("coursesCount", courses.size());
        analytics.put("enrollmentsCount", enrollments.size());
        analytics.put("certificatesCount", certs.size());
        analytics.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
        analytics.put("avgQuizScore", Math.round(avgQuizScore * 10.0) / 10.0);
        analytics.put("totalQuizzesTaken", quizSubs.size());
        analytics.put("gradedAssignmentsCount", gradedAssignments);
        analytics.put("topInstructors", topInstructors);
        analytics.put("categoriesBreakdown", categoriesData);

        return ResponseEntity.ok(analytics);
    }
}
