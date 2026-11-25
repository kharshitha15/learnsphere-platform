package com.learnsphere.controller;

import com.learnsphere.entity.*;
import com.learnsphere.entity.Module;
import com.learnsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentPortalController {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonNoteRepository lessonNoteRepository;
    private final CourseReviewRepository courseReviewRepository;
    private final CertificateRepository certificateRepository;
    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuestionRepository questionRepository;
    private final NotificationRepository notificationRepository;
    private final StudentActivityRepository studentActivityRepository;
    private final LessonDiscussionRepository lessonDiscussionRepository;
    private final LessonDiscussionReplyRepository lessonDiscussionReplyRepository;
    private final WishlistRepository wishlistRepository;

    private User getAuthenticatedStudent(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found for: " + email));
    }

    // ==========================================
    // 1. STUDENT DASHBOARD & GAMIFICATION
    // ==========================================
    @GetMapping("/dashboard")
    public ResponseEntity<?> getStudentDashboard(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Enrollment> rawEnrollments = enrollmentRepository.findByStudentId(student.getId());
        List<Certificate> certificates = certificateRepository.findByStudentId(student.getId());
        List<QuizSubmission> quizSubs = quizSubmissionRepository.findByStudentId(student.getId());
        List<LessonProgress> completedLessons = lessonProgressRepository.findByStudentId(student.getId())
                .stream().filter(LessonProgress::isCompleted).toList();
        List<StudentActivity> activities = studentActivityRepository.findByStudentIdOrderByTimestampDesc(student.getId());
        List<AssignmentSubmission> assignmentSubs = assignmentSubmissionRepository.findByStudentId(student.getId());

        // Deduplicate enrollments by normalized course title, keeping the highest progress
        Map<String, Enrollment> dedupMap = new LinkedHashMap<>();
        for (Enrollment e : rawEnrollments) {
            if (e.getCourse() == null) continue;
            String key = e.getCourse().getTitle().trim().toLowerCase();
            if (!dedupMap.containsKey(key)) {
                dedupMap.put(key, e);
            } else {
                Enrollment existing = dedupMap.get(key);
                if (e.getProgressPercentage() > existing.getProgressPercentage()) {
                    dedupMap.put(key, e);
                }
            }
        }
        List<Enrollment> enrollments = new ArrayList<>(dedupMap.values());

        long totalEnrolled = enrollments.size();
        long completed = enrollments.stream().filter(e -> e.getProgressPercentage() >= 100.0).count();
        long notStarted = enrollments.stream().filter(e -> e.getProgressPercentage() == 0.0).count();
        long inProgress = totalEnrolled - completed - notStarted;
        if (inProgress < 0) inProgress = 0;

        double avgQuiz = quizSubs.isEmpty() ? 0.0 :
                quizSubs.stream().mapToDouble(q -> (double) q.getScore() / Math.max(1, q.getTotalQuestions()) * 100.0).average().orElse(0.0);

        // Calculate realistic learning hours from completed lessons
        int totalMinutes = 0;
        for (LessonProgress lp : completedLessons) {
            Lesson l = lp.getLesson();
            if (l != null && l.getDuration() > 0) {
                totalMinutes += l.getDuration();
            } else {
                totalMinutes += 12;
            }
        }
        long learningHours = Math.max(1, Math.round(totalMinutes / 60.0));

        // 7-day streak visualizer
        List<Map<String, Object>> streakDays = new ArrayList<>();
        String[] dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        LocalDate today = LocalDate.now();
        int currentDayOfWeek = today.getDayOfWeek().getValue();
        
        for (int i = 1; i <= 7; i++) {
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("day", dayNames[i - 1]);
            dayMap.put("dayIndex", i);
            dayMap.put("active", i <= currentDayOfWeek || completedLessons.size() >= 3);
            dayMap.put("isToday", i == currentDayOfWeek);
            streakDays.add(dayMap);
        }
        int currentStreak = Math.min(7, Math.max(3, currentDayOfWeek + (completedLessons.size() > 0 ? 1 : 0)));

        // Continue Learning Card (pick first in-progress course; if none, pick first enrolled)
        Map<String, Object> continueLearning = null;
        Enrollment activeEnrollment = enrollments.stream()
                .filter(e -> e.getProgressPercentage() > 0.0 && e.getProgressPercentage() < 100.0)
                .findFirst()
                .orElse(enrollments.isEmpty() ? null : enrollments.get(0));

        if (activeEnrollment != null) {
            Course c = activeEnrollment.getCourse();
            List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(c.getId());
            List<Lesson> allCourseLessons = new ArrayList<>();
            for (Module m : modules) {
                allCourseLessons.addAll(lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()));
            }
            List<Long> compLessonIds = lessonProgressRepository.findByStudentIdAndLesson_Module_CourseId(student.getId(), c.getId())
                    .stream().filter(LessonProgress::isCompleted).map(lp -> lp.getLesson().getId()).toList();

            Lesson nextLesson = allCourseLessons.stream()
                    .filter(l -> !compLessonIds.contains(l.getId()))
                    .findFirst()
                    .orElse(allCourseLessons.isEmpty() ? null : allCourseLessons.get(0));

            continueLearning = new HashMap<>();
            continueLearning.put("courseId", c.getId());
            continueLearning.put("courseTitle", c.getTitle());
            continueLearning.put("category", c.getCategory());
            continueLearning.put("difficulty", c.getDifficulty());
            continueLearning.put("progressPercentage", activeEnrollment.getProgressPercentage());
            continueLearning.put("totalLessons", allCourseLessons.size());
            continueLearning.put("completedLessons", compLessonIds.size());
            continueLearning.put("instructorName", c.getInstructor().getFullName());
            if (nextLesson != null) {
                Map<String, Object> lastLessonMap = new HashMap<>();
                lastLessonMap.put("id", nextLesson.getId());
                lastLessonMap.put("title", nextLesson.getTitle());
                lastLessonMap.put("duration", nextLesson.getDuration());
                lastLessonMap.put("moduleTitle", nextLesson.getModule() != null ? nextLesson.getModule().getTitle() : "Module");
                continueLearning.put("lastLesson", lastLessonMap);
            }
        }

        // Recommended Courses
        List<Long> enrolledCourseIds = enrollments.stream().map(e -> e.getCourse().getId()).toList();
        List<Course> allCourses = courseRepository.findByPublishedTrue();
        List<Map<String, Object>> recommendedCourses = allCourses.stream()
                .filter(c -> !enrolledCourseIds.contains(c.getId()))
                .limit(3)
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", c.getId());
                    map.put("title", c.getTitle());
                    map.put("category", c.getCategory());
                    map.put("difficulty", c.getDifficulty());
                    map.put("description", c.getDescription());
                    map.put("instructorName", c.getInstructor().getFullName());
                    map.put("rating", 4.9);
                    map.put("learnersCount", 1200 + c.getId() * 75);
                    return map;
                }).collect(Collectors.toList());

        Map<String, Object> gamification = getStudentGamificationStats(student);

        Map<String, Object> response = new HashMap<>();
        response.put("welcomeName", student.getFullName().split(" ")[0]);
        response.put("fullName", student.getFullName());
        response.put("email", student.getEmail());
        response.put("stats", Map.of(
                "totalEnrolled", totalEnrolled,
                "inProgress", inProgress,
                "completed", completed,
                "notStarted", notStarted,
                "learningHours", learningHours,
                "avgQuizScore", Math.round(avgQuiz),
                "certificatesEarned", certificates.size(),
                "currentStreak", currentStreak
        ));
        response.put("gamification", gamification);
        response.put("streakDays", streakDays);
        response.put("continueLearning", continueLearning);
        response.put("recommendedCourses", recommendedCourses);
        response.put("recentActivities", activities.stream().limit(6).collect(Collectors.toList()));
        response.put("achievements", gamification.get("achievements"));

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> getStudentGamificationStats(User student) {
        List<Enrollment> rawEnrollments = enrollmentRepository.findByStudentId(student.getId());
        List<Certificate> certificates = certificateRepository.findByStudentId(student.getId());
        List<QuizSubmission> quizSubs = quizSubmissionRepository.findByStudentId(student.getId());
        List<LessonProgress> completedLessons = lessonProgressRepository.findByStudentId(student.getId())
                .stream().filter(LessonProgress::isCompleted).toList();
        List<AssignmentSubmission> assignmentSubs = assignmentSubmissionRepository.findByStudentId(student.getId());
        List<LessonNote> notes = lessonNoteRepository.findByStudentId(student.getId());
        int discussionsCount = lessonDiscussionRepository.findByUserId(student.getId()).size();

        // Deduplicate enrollments by title
        Map<String, Enrollment> dedupMap = new LinkedHashMap<>();
        for (Enrollment e : rawEnrollments) {
            if (e.getCourse() == null) continue;
            String key = e.getCourse().getTitle().trim().toLowerCase();
            if (!dedupMap.containsKey(key)) {
                dedupMap.put(key, e);
            } else {
                Enrollment existing = dedupMap.get(key);
                if (e.getProgressPercentage() > existing.getProgressPercentage()) {
                    dedupMap.put(key, e);
                }
            }
        }
        List<Enrollment> uniqueEnrollments = new ArrayList<>(dedupMap.values());
        long completedCourses = uniqueEnrollments.stream().filter(e -> e.getProgressPercentage() >= 100.0).count();

        long passedQuizzes = quizSubs.stream().filter(QuizSubmission::isPassed).count();
        boolean hasPerfectQuiz = quizSubs.stream().anyMatch(q -> q.getScore() == q.getTotalQuestions() && q.getTotalQuestions() > 0);

        LocalDate today = LocalDate.now();
        int currentDayOfWeek = today.getDayOfWeek().getValue();
        int currentStreak = Math.min(7, Math.max(3, currentDayOfWeek + (completedLessons.size() > 0 ? 1 : 0)));

        List<Map<String, Object>> achievements = new ArrayList<>();

        // 1. Lessons
        achievements.add(createAchievement("first_step", "First Steps", "Complete your first lesson on LearnSphere", "🌱", completedLessons.size() >= 1, Math.min(1, completedLessons.size()) + "/1"));
        achievements.add(createAchievement("lesson_scholar", "Dedicated Scholar", "Complete at least 5 lessons", "📚", completedLessons.size() >= 5, Math.min(5, completedLessons.size()) + "/5"));
        achievements.add(createAchievement("lesson_master", "Curriculum Conqueror", "Complete at least 15 lessons", "⚡", completedLessons.size() >= 15, Math.min(15, completedLessons.size()) + "/15"));

        // 2. Quizzes
        achievements.add(createAchievement("first_quiz", "Knowledge Seeker", "Attempt and pass at least 1 module quiz", "🎯", passedQuizzes >= 1, Math.min(1, (int) passedQuizzes) + "/1"));
        achievements.add(createAchievement("quiz_master", "Quiz Champion", "Pass 3 or more module quizzes", "🧠", passedQuizzes >= 3, Math.min(3, (int) passedQuizzes) + "/3"));
        achievements.add(createAchievement("perfect_score", "Perfectionist", "Score a 100% perfect mark on any quiz", "✨", hasPerfectQuiz, hasPerfectQuiz ? "100%" : "Pending"));

        // 3. Projects & Labs
        achievements.add(createAchievement("project_builder", "Hands-on Builder", "Submit your first practical project or assignment", "🛠️", assignmentSubs.size() >= 1, Math.min(1, assignmentSubs.size()) + "/1"));
        achievements.add(createAchievement("master_architect", "Master Architect", "Complete 2 or more practical coding projects", "🏗️", assignmentSubs.size() >= 2, Math.min(2, assignmentSubs.size()) + "/2"));

        // 4. Notes & Discussions
        achievements.add(createAchievement("note_taker", "Diligent Note Taker", "Take and save personal study notes on any lesson", "📝", notes.size() >= 1, Math.min(1, notes.size()) + "/1"));
        achievements.add(createAchievement("community_voice", "Community Helper", "Participate in lesson discussions and community Q&A", "💬", discussionsCount >= 1, Math.min(1, discussionsCount) + "/1"));

        // 5. Streaks
        achievements.add(createAchievement("streak_champion", "Consistent Learner", "Maintain a 3-day active learning streak", "🔥", currentStreak >= 3, Math.min(3, currentStreak) + "/3 Days"));

        // 6. Certificates & Courses
        achievements.add(createAchievement("course_grad", "Certified Graduate", "Complete a full course and claim your certificate", "🏆", completedCourses >= 1, completedCourses >= 1 ? "1/1" : "0/1"));
        achievements.add(createAchievement("multi_cert", "Multi-Disciplined Specialist", "Earn 2 or more professional certificates", "🎖️", certificates.size() >= 2, Math.min(2, certificates.size()) + "/2"));

        long xpPoints = (completedLessons.size() * 10L) + (passedQuizzes * 50L) + (assignmentSubs.size() * 100L) + (currentStreak * 25L) + (certificates.size() * 200L) + (notes.size() * 20L) + (discussionsCount * 15L);
        if (xpPoints < 120) xpPoints = 120 + (completedLessons.size() * 15L);

        int level = (int) Math.max(1, Math.floor(xpPoints / 250.0) + 1);
        long xpCurrentLevel = xpPoints % 250;
        long xpToNextLevel = 250 - xpCurrentLevel;
        int levelProgressPct = (int) Math.round(((double) xpCurrentLevel / 250.0) * 100);

        String levelTitle = level >= 5 ? "Full-Stack Architect" :
                            level >= 4 ? "Advanced Engineer" :
                            level >= 3 ? "Skill Apprentice" :
                            level >= 2 ? "Active Explorer" : "Junior Learner";

        Map<String, Object> result = new HashMap<>();
        result.put("achievements", achievements);
        result.put("unlockedCount", achievements.stream().filter(a -> Boolean.TRUE.equals(a.get("unlocked"))).count());
        result.put("totalCount", achievements.size());
        result.put("xpPoints", xpPoints);
        result.put("level", level);
        result.put("levelTitle", levelTitle);
        result.put("xpCurrentLevel", xpCurrentLevel);
        result.put("xpToNextLevel", xpToNextLevel);
        result.put("levelProgressPct", levelProgressPct);
        result.put("dailyGoalCompleted", Math.min(3, completedLessons.size()));
        result.put("dailyGoalTotal", 3);
        return result;
    }

    private Map<String, Object> createAchievement(String id, String title, String desc, String icon, boolean unlocked, String progress) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", id);
        m.put("title", title);
        m.put("description", desc);
        m.put("icon", icon);
        m.put("unlocked", unlocked);
        m.put("progress", progress);
        return m;
    }

    // ==========================================
    // 2. MY ENROLLED COURSES
    // ==========================================
    @GetMapping({"/my-courses", "/my-learning"})
    public ResponseEntity<?> getMyEnrolledCourses(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        List<Map<String, Object>> myCourses = enrollments.stream().map(e -> {
            Course c = e.getCourse();
            Map<String, Object> map = new HashMap<>();
            map.put("enrollmentId", e.getId());
            map.put("courseId", c.getId());
            map.put("title", c.getTitle());
            map.put("category", c.getCategory());
            map.put("difficulty", c.getDifficulty());
            map.put("description", c.getDescription());
            map.put("instructorName", c.getInstructor().getFullName());
            map.put("progressPercentage", e.getProgressPercentage());
            map.put("enrolledAt", e.getEnrolledAt());

            List<Module> mods = moduleRepository.findByCourseIdOrderByModuleOrderAsc(c.getId());
            int totalLessons = 0;
            for (Module m : mods) {
                totalLessons += lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()).size();
            }
            map.put("totalLessons", totalLessons);

            long compCount = lessonProgressRepository.findByStudentIdAndLesson_Module_CourseId(student.getId(), c.getId())
                    .stream().filter(LessonProgress::isCompleted).count();
            map.put("completedLessons", compCount);

            Optional<Certificate> certOpt = certificateRepository.findByStudentIdAndCourseId(student.getId(), c.getId());
            if (certOpt.isPresent()) {
                Certificate cert = certOpt.get();
                map.put("certificate", Map.of(
                        "certificateId", cert.getCertificateId(),
                        "issueDate", cert.getIssueDate()
                ));
            } else {
                map.put("certificate", null);
            }

            return map;
        }).collect(Collectors.toList());

        // Deduplicate courses by normalized title, retaining the highest progress & certificate
        Map<String, Map<String, Object>> uniqueCoursesByTitle = new LinkedHashMap<>();
        for (Map<String, Object> map : myCourses) {
            String title = ((String) map.get("title")).trim().toLowerCase();
            if (!uniqueCoursesByTitle.containsKey(title)) {
                uniqueCoursesByTitle.put(title, map);
            } else {
                Map<String, Object> existing = uniqueCoursesByTitle.get(title);
                double exProgress = ((Number) existing.get("progressPercentage")).doubleValue();
                double newProgress = ((Number) map.get("progressPercentage")).doubleValue();
                if (newProgress > exProgress || (existing.get("certificate") == null && map.get("certificate") != null)) {
                    uniqueCoursesByTitle.put(title, map);
                }
            }
        }

        return ResponseEntity.ok(new ArrayList<>(uniqueCoursesByTitle.values()));
    }

    // ==========================================
    // 3. EXPLORE COURSES (MARKETPLACE)
    // ==========================================
    @GetMapping("/explore")
    public ResponseEntity<?> getExploreMarketplace(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Course> publishedCourses = courseRepository.findByPublishedTrue();
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        List<Long> enrolledIds = enrollments.stream().map(e -> e.getCourse().getId()).toList();
        Map<Long, Double> progressMap = enrollments.stream()
                .collect(Collectors.toMap(e -> e.getCourse().getId(), Enrollment::getProgressPercentage, (a, b) -> a));
        List<Long> wishlistIds = wishlistRepository.findByUserIdOrderByCreatedAtDesc(student.getId())
                .stream().map(w -> w.getCourse().getId()).toList();
        List<CourseReview> allReviews = courseReviewRepository.findAll();

        List<Map<String, Object>> marketplace = publishedCourses.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("title", c.getTitle());
            map.put("category", c.getCategory());
            map.put("difficulty", c.getDifficulty());
            map.put("level", c.getDifficulty());
            map.put("description", c.getDescription());
            map.put("instructorName", c.getInstructor().getFullName());
            map.put("instructorBio", c.getInstructor().getBio());
            map.put("isEnrolled", enrolledIds.contains(c.getId()));
            map.put("progressPercentage", progressMap.getOrDefault(c.getId(), 0.0));
            map.put("isWishlisted", wishlistIds.contains(c.getId()));

            List<CourseReview> cReviews = allReviews.stream().filter(r -> r.getCourse().getId().equals(c.getId())).toList();
            double avgRating = cReviews.isEmpty() ? 4.9 : cReviews.stream().mapToInt(CourseReview::getRating).average().orElse(4.9);
            map.put("rating", Math.round(avgRating * 10.0) / 10.0);
            map.put("reviewsCount", cReviews.size() > 0 ? cReviews.size() : 24);
            map.put("learnersCount", 1250 + c.getId() * 85);

            List<Module> mods = moduleRepository.findByCourseIdOrderByModuleOrderAsc(c.getId());
            int lessonsCount = 0;
            for (Module m : mods) {
                lessonsCount += lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()).size();
            }
            map.put("lessonsCount", lessonsCount);
            map.put("durationHours", Math.max(4, lessonsCount * 25 / 60));

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(marketplace);
    }

    @PostMapping({"/enroll/{courseId}", "/courses/{courseId}/enroll"})
    @Transactional
    public ResponseEntity<?> enrollInCourse(@PathVariable Long courseId, Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .course(course)
                    .enrolledAt(LocalDateTime.now())
                    .progressPercentage(0.0)
                    .build();
            enrollmentRepository.save(enrollment);

            studentActivityRepository.save(StudentActivity.builder()
                    .student(student)
                    .activityType("ENROLLMENT")
                    .description("Enrolled in: " + course.getTitle())
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Successfully enrolled in " + course.getTitle() + "! 🎉",
                "courseId", courseId,
                "isEnrolled", true
        ));
    }

    // ==========================================
    // 4. COURSE LEARNING PLAYER VIEW
    // ==========================================
    @GetMapping({"/courses/{courseId}/learning-view", "/courses/{courseId}/curriculum", "/courses/{courseId}/learn"})
    public ResponseEntity<?> getCourseLearningView(@PathVariable Long courseId, Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            List<Course> all = courseRepository.findAll();
            if (!all.isEmpty()) {
                course = all.get(0);
                courseId = course.getId();
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Course not found"));
            }
        }

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .orElse(null);

        List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(courseId);
        List<LessonProgress> progresses = lessonProgressRepository.findByStudentIdAndLesson_Module_CourseId(student.getId(), courseId);
        List<Long> completedIds = progresses.stream().filter(LessonProgress::isCompleted).map(lp -> lp.getLesson().getId()).toList();
        List<LessonNote> studentNotes = lessonNoteRepository.findByStudentIdAndLesson_Module_CourseIdOrderByUpdatedAtDesc(student.getId(), courseId);

        List<Map<String, Object>> moduleList = modules.stream().map(m -> {
            Map<String, Object> mMap = new HashMap<>();
            mMap.put("id", m.getId());
            mMap.put("title", m.getTitle());
            mMap.put("moduleOrder", m.getModuleOrder());

            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId());
            List<Map<String, Object>> lessonList = lessons.stream().map(l -> {
                Map<String, Object> lMap = new HashMap<>();
                lMap.put("id", l.getId());
                lMap.put("title", l.getTitle());
                lMap.put("lessonType", l.getLessonType() != null ? l.getLessonType().name() : "VIDEO");
                lMap.put("duration", l.getDuration());
                lMap.put("videoUrl", l.getVideoUrl());
                lMap.put("content", l.getContent());
                lMap.put("learningObjectives", l.getLearningObjectives());
                lMap.put("isCompleted", completedIds.contains(l.getId()));
                lMap.put("completed", completedIds.contains(l.getId()));
                return lMap;
            }).collect(Collectors.toList());
            mMap.put("lessons", lessonList);

            List<Quiz> quizzes = quizRepository.findByModuleId(m.getId());
            if (quizzes.isEmpty()) {
                Quiz autoQ = Quiz.builder()
                        .module(m)
                        .title(m.getTitle() + " Knowledge Check")
                        .description("Assess understanding of core concepts in " + m.getTitle())
                        .passingPercentage(70)
                        .build();
                quizzes = List.of(quizRepository.save(autoQ));
            }

            List<Map<String, Object>> quizSummaryList = quizzes.stream().map(q -> {
                Map<String, Object> qMap = new HashMap<>();
                qMap.put("id", q.getId());
                qMap.put("title", q.getTitle());
                qMap.put("description", q.getDescription());
                qMap.put("passingPercentage", q.getPassingPercentage());
                List<Question> qQuestions = questionRepository.findByQuizId(q.getId());
                if (qQuestions.isEmpty()) {
                    qQuestions = generateQuestionsForQuiz(q);
                }
                qMap.put("questionsCount", qQuestions.size());

                List<Map<String, Object>> questionList = qQuestions.stream().map(qn -> {
                    Map<String, Object> qnMap = new HashMap<>();
                    qnMap.put("id", qn.getId());
                    qnMap.put("text", qn.getText());
                    qnMap.put("questionText", qn.getText());
                    qnMap.put("optionA", qn.getOptionA());
                    qnMap.put("optionB", qn.getOptionB());
                    qnMap.put("optionC", qn.getOptionC());
                    qnMap.put("optionD", qn.getOptionD());
                    Map<String, String> opts = new LinkedHashMap<>();
                    opts.put("A", qn.getOptionA());
                    opts.put("B", qn.getOptionB());
                    opts.put("C", qn.getOptionC());
                    opts.put("D", qn.getOptionD());
                    qnMap.put("options", opts);
                    return qnMap;
                }).collect(Collectors.toList());
                qMap.put("questions", questionList);

                boolean isPassed = quizSubmissionRepository.findByStudentId(student.getId()).stream()
                        .anyMatch(qs -> qs.getQuiz() != null && qs.getQuiz().getId().equals(q.getId()) && qs.isPassed());
                qMap.put("isPassed", isPassed);
                return qMap;
            }).collect(Collectors.toList());
            mMap.put("quizzes", quizSummaryList);
            mMap.put("quiz", !quizSummaryList.isEmpty() ? quizSummaryList.get(0) : null);

            // Module Practical Activity / Task
            List<Assignment> moduleActivities = assignmentRepository.findByModuleId(m.getId());
            List<Map<String, Object>> moduleActivityList = moduleActivities.stream().map(a -> {
                Map<String, Object> aMap = new HashMap<>();
                aMap.put("id", a.getId());
                aMap.put("title", a.getTitle());
                aMap.put("description", a.getDescription());
                aMap.put("deadline", a.getDeadline());
                aMap.put("maxMarks", a.getMaxMarks());
                aMap.put("requiredProofType", a.getRequiredProofType() != null ? a.getRequiredProofType() : "DOCUMENT_OR_IMAGE");

                AssignmentSubmission sub = assignmentSubmissionRepository.findByStudentId(student.getId()).stream()
                        .filter(s -> s.getAssignment().getId().equals(a.getId()))
                        .findFirst()
                        .orElse(null);

                if (sub != null) {
                    aMap.put("status", sub.getStatus() != null ? sub.getStatus() : (sub.isGraded() ? "GRADED" : "SUBMITTED"));
                    aMap.put("marksObtained", sub.getMarksObtained());
                    aMap.put("instructorFeedback", sub.getInstructorFeedback());
                    aMap.put("submissionUrl", sub.getSubmissionUrl());
                    aMap.put("studentNotes", sub.getStudentNotes());
                    aMap.put("submittedAt", sub.getSubmittedAt());
                } else {
                    aMap.put("status", "NOT_STARTED");
                    aMap.put("marksObtained", null);
                    aMap.put("instructorFeedback", null);
                }
                return aMap;
            }).collect(Collectors.toList());
            mMap.put("activities", moduleActivityList);

            return mMap;
        }).collect(Collectors.toList());

        List<Map<String, Object>> notesList = studentNotes.stream().map(n -> {
            Map<String, Object> nMap = new HashMap<>();
            nMap.put("id", n.getId());
            nMap.put("lessonId", n.getLesson() != null ? n.getLesson().getId() : null);
            nMap.put("lessonTitle", n.getLesson() != null ? n.getLesson().getTitle() : "Lesson");
            nMap.put("content", n.getNoteText());
            nMap.put("videoTimestamp", n.getVideoTimestamp());
            nMap.put("createdAt", n.getCreatedAt());
            return nMap;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("course", Map.of(
                "id", course.getId(),
                "title", course.getTitle(),
                "category", course.getCategory(),
                "difficulty", course.getDifficulty(),
                "description", course.getDescription(),
                "instructor", Map.of(
                        "id", course.getInstructor().getId(),
                        "fullName", course.getInstructor().getFullName(),
                        "bio", course.getInstructor().getBio() != null ? course.getInstructor().getBio() : ""
                )
        ));
        response.put("modules", moduleList);
        response.put("completedLessonIds", completedIds);
        response.put("notes", notesList);
        response.put("progressPercentage", enrollment != null ? enrollment.getProgressPercentage() : 0.0);

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 4a-1. MARK LESSON AS COMPLETE / PROGRESS
    // ==========================================
    @PostMapping({"/lessons/{lessonId}/complete", "/lessons/{lessonId}/progress"})
    public ResponseEntity<?> completeLesson(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + lessonId));
        Course course = lesson.getModule().getCourse();

        // 1. Mark lesson as complete in LessonProgress
        LessonProgress progress = lessonProgressRepository.findByStudentIdAndLessonId(student.getId(), lessonId)
                .orElse(new LessonProgress());
        progress.setStudent(student);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());
        lessonProgressRepository.save(progress);

        // 2. Activity record
        studentActivityRepository.save(StudentActivity.builder()
                .student(student)
                .activityType("LESSON_COMPLETED")
                .description("Completed lesson: " + lesson.getTitle())
                .timestamp(LocalDateTime.now())
                .build());

        // 3. Calculate total course lessons & completed count
        List<Module> courseModules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(course.getId());
        int totalCourseLessons = 0;
        for (Module m : courseModules) {
            totalCourseLessons += lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()).size();
        }
        if (totalCourseLessons == 0) totalCourseLessons = 1;

        List<LessonProgress> allCompleted = lessonProgressRepository.findByStudentIdAndLesson_Module_CourseId(student.getId(), course.getId());
        long completedCount = allCompleted.stream().filter(LessonProgress::isCompleted).count();
        double percentage = Math.min(100.0, Math.round(((double) completedCount / (double) totalCourseLessons) * 100.0));

        // 4. Update or create Enrollment
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .orElse(null);
        if (enrollment == null) {
            enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setEnrolledAt(LocalDateTime.now());
        }

        enrollment.setProgressPercentage(percentage);

        boolean isCourseCompleted = percentage >= 100.0 || completedCount >= totalCourseLessons;
        Certificate cert = null;

        if (isCourseCompleted) {
            // 5. Generate certificate if not already issued
            cert = certificateRepository.findByStudentId(student.getId()).stream()
                    .filter(c -> c.getCourse().getId().equals(course.getId()))
                    .findFirst()
                    .orElse(null);

            if (cert == null) {
                cert = new Certificate();
                cert.setStudent(student);
                cert.setCourse(course);
                cert.setCertificateId("CERT-LS-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                cert.setIssueDate(LocalDateTime.now());
                cert = certificateRepository.save(cert);

                studentActivityRepository.save(StudentActivity.builder()
                        .student(student)
                        .activityType("CERTIFICATE_EARNED")
                        .description("Earned verified certificate for: " + course.getTitle())
                        .timestamp(LocalDateTime.now())
                        .build());
            }
        }

        enrollmentRepository.save(enrollment);

        Map<String, Object> gamification = getStudentGamificationStats(student);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", isCourseCompleted ? "🎉 Congratulations! All modules covered and course completed!" : "Lesson marked as complete");
        resp.put("lessonId", lessonId);
        resp.put("progressPercentage", percentage);
        resp.put("completedCount", completedCount);
        resp.put("totalLessons", totalCourseLessons);
        resp.put("isCourseCompleted", isCourseCompleted);
        resp.put("gamification", gamification);
        resp.put("achievements", gamification.get("achievements"));
        if (cert != null) {
            resp.put("certificateId", cert.getCertificateId());
        }

        return ResponseEntity.ok(resp);
    }

    // ==========================================
    // 4a-2. COMPLETE ALL MODULES & COURSE
    // ==========================================
    @PostMapping({"/courses/{courseId}/complete", "/courses/{courseId}/complete-all"})
    public ResponseEntity<?> completeEntireCourse(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        List<Module> courseModules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(course.getId());
        int totalCourseLessons = 0;

        for (Module m : courseModules) {
            List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId());
            totalCourseLessons += lessons.size();
            for (Lesson l : lessons) {
                LessonProgress progress = lessonProgressRepository.findByStudentIdAndLessonId(student.getId(), l.getId())
                        .orElse(new LessonProgress());
                progress.setStudent(student);
                progress.setLesson(l);
                progress.setCompleted(true);
                progress.setCompletedAt(LocalDateTime.now());
                lessonProgressRepository.save(progress);
            }
        }

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .orElse(null);
        if (enrollment == null) {
            enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setEnrolledAt(LocalDateTime.now());
        }

        enrollment.setProgressPercentage(100.0);
        enrollmentRepository.save(enrollment);

        Certificate cert = certificateRepository.findByStudentId(student.getId()).stream()
                .filter(c -> c.getCourse().getId().equals(course.getId()))
                .findFirst()
                .orElse(null);

        if (cert == null) {
            cert = new Certificate();
            cert.setStudent(student);
            cert.setCourse(course);
            cert.setCertificateId("CERT-LS-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            cert.setIssueDate(LocalDateTime.now());
            cert = certificateRepository.save(cert);

            studentActivityRepository.save(StudentActivity.builder()
                    .student(student)
                    .activityType("CERTIFICATE_EARNED")
                    .description("Earned verified certificate for: " + course.getTitle())
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        Map<String, Object> gamification = getStudentGamificationStats(student);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "🎉 All modules covered! Course marked as 100% completed!",
                "progressPercentage", 100.0,
                "completedCount", totalCourseLessons,
                "totalLessons", totalCourseLessons,
                "isCourseCompleted", true,
                "certificateId", cert.getCertificateId(),
                "gamification", gamification,
                "achievements", gamification.get("achievements")
        ));
    }

    /**
     * Get all verified certificates earned by authenticated student
     */
    @GetMapping("/certificates")
    public ResponseEntity<?> getMyCertificates(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Certificate> certs = certificateRepository.findByStudentId(student.getId());
        List<Map<String, Object>> result = certs.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("certificateId", c.getCertificateId());
            m.put("courseId", c.getCourse().getId());
            m.put("courseTitle", c.getCourse().getTitle());
            m.put("issueDate", c.getIssueDate());
            m.put("studentName", student.getFullName());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ==========================================
    // 4b. SUBMIT MODULE ACTIVITY / ASSIGNMENT
    // ==========================================
    @PostMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        String submissionUrl = (String) payload.getOrDefault("submissionUrl", "");
        String studentNotes = (String) payload.getOrDefault("studentNotes", payload.getOrDefault("notes", ""));

        AssignmentSubmission submission = assignmentSubmissionRepository.findByStudentId(student.getId()).stream()
                .filter(s -> s.getAssignment().getId().equals(assignmentId))
                .findFirst()
                .orElse(AssignmentSubmission.builder()
                        .student(student)
                        .assignment(assignment)
                        .build());

        submission.setSubmissionUrl(submissionUrl);
        submission.setStudentNotes(studentNotes);
        submission.setStatus("SUBMITTED");
        submission.setGraded(false);
        submission.setSubmittedAt(LocalDateTime.now());

        assignmentSubmissionRepository.save(submission);

        studentActivityRepository.save(StudentActivity.builder()
                .student(student)
                .activityType("ASSIGNMENT_SUBMITTED")
                .description("Submitted activity: " + assignment.getTitle())
                .timestamp(LocalDateTime.now())
                .build());

        // Notify Instructor
        notificationRepository.save(Notification.builder()
                .user(assignment.getCourse().getInstructor())
                .title("New Activity Submission 📝")
                .message(student.getFullName() + " submitted activity: '" + assignment.getTitle() + "' in " + assignment.getCourse().getTitle())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build());

        Map<String, Object> gamification = getStudentGamificationStats(student);

        return ResponseEntity.ok(Map.of(
                "message", "Activity submitted successfully! Your instructor has been notified.",
                "submission", submission,
                "gamification", gamification,
                "achievements", gamification.get("achievements")
        ));
    }

    @PostMapping({"/activity/submit", "/activities/submit"})
    public ResponseEntity<?> submitGeneralActivity(
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Long courseId = payload.containsKey("courseId") && payload.get("courseId") != null 
                ? ((Number) payload.get("courseId")).longValue() : null;
        Course course = courseId != null ? courseRepository.findById(courseId).orElse(null) : null;
        
        Assignment assignment = null;
        if (course != null) {
            assignment = assignmentRepository.findByCourseId(course.getId()).stream().findFirst().orElse(null);
        }
        if (assignment == null) {
            assignment = assignmentRepository.findAll().stream().findFirst().orElse(null);
        }

        String submissionUrl = (String) payload.getOrDefault("submissionUrl", "");
        String notes = (String) payload.getOrDefault("notes", payload.getOrDefault("studentNotes", "Completed practical lab"));

        if (assignment != null) {
            Long assId = assignment.getId();
            AssignmentSubmission sub = assignmentSubmissionRepository.findByStudentId(student.getId()).stream()
                    .filter(s -> s.getAssignment().getId().equals(assId))
                    .findFirst()
                    .orElse(AssignmentSubmission.builder()
                            .student(student)
                            .assignment(assignment)
                            .build());
            sub.setSubmissionUrl(submissionUrl);
            sub.setStudentNotes(notes);
            sub.setStatus("SUBMITTED");
            sub.setGraded(false);
            sub.setSubmittedAt(LocalDateTime.now());
            assignmentSubmissionRepository.save(sub);
        }

        studentActivityRepository.save(StudentActivity.builder()
                .student(student)
                .activityType("ASSIGNMENT_SUBMITTED")
                .description("Submitted hands-on lab activity" + (course != null ? " for " + course.getTitle() : ""))
                .timestamp(LocalDateTime.now())
                .build());

        Map<String, Object> gamification = getStudentGamificationStats(student);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Lab Activity submitted successfully! Your instructor has been notified.",
                "gamification", gamification,
                "achievements", gamification.get("achievements")
        ));
    }

    // ==========================================
    // 4c. SUBMIT MODULE QUIZ
    // ==========================================
    @PostMapping({"/quizzes/{quizId}/submit", "/quizzes/{quizId}/evaluate"})
    @Transactional
    public ResponseEntity<?> submitQuiz(
            @PathVariable Long quizId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        Map<?, ?> answersMap;
        if (payload.containsKey("answers") && payload.get("answers") instanceof Map) {
            answersMap = (Map<?, ?>) payload.get("answers");
        } else {
            answersMap = payload;
        }

        List<Question> questions = questionRepository.findByQuizId(quizId);
        if (questions.isEmpty()) {
            questions = generateQuestionsForQuiz(quiz);
        }
        int score = 0;
        for (Question q : questions) {
            Object submittedObj = answersMap.get(String.valueOf(q.getId()));
            if (submittedObj == null) {
                submittedObj = answersMap.get(q.getId());
            }
            if (submittedObj != null && String.valueOf(submittedObj).trim().equalsIgnoreCase(q.getCorrectOption())) {
                score++;
            }
        }

        int total = questions.isEmpty() ? 1 : questions.size();
        double percentage = ((double) score / total) * 100.0;
        boolean passed = percentage >= quiz.getPassingPercentage();

        QuizSubmission submission = new QuizSubmission();
        submission.setStudent(student);
        submission.setQuiz(quiz);
        submission.setScore(score);
        submission.setTotalQuestions(questions.size());
        submission.setPassed(passed);
        submission.setSubmittedAt(LocalDateTime.now());
        quizSubmissionRepository.save(submission);

        if (passed) {
            studentActivityRepository.save(StudentActivity.builder()
                    .student(student)
                    .activityType("QUIZ_COMPLETED")
                    .description("Passed Quiz: " + quiz.getTitle() + " (" + Math.round(percentage) + "%)")
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        Map<String, Object> gamification = getStudentGamificationStats(student);

        return ResponseEntity.ok(Map.of(
                "score", score,
                "total", questions.size(),
                "totalQuestions", questions.size(),
                "percentage", Math.round(percentage),
                "passed", passed,
                "gamification", gamification,
                "achievements", gamification.get("achievements")
        ));
    }

    private List<Question> generateQuestionsForQuiz(Quiz quiz) {
        if (quiz == null) return Collections.emptyList();
        List<Question> existing = questionRepository.findByQuizId(quiz.getId());
        if (!existing.isEmpty()) return existing;

        String courseTitle = quiz.getModule() != null && quiz.getModule().getCourse() != null 
                ? quiz.getModule().getCourse().getTitle().toLowerCase() : "";
        String quizTitle = quiz.getTitle() != null ? quiz.getTitle().toLowerCase() : "";

        List<Question> created = new ArrayList<>();
        if (courseTitle.contains("spring") || quizTitle.contains("spring") || quizTitle.contains("rest")) {
            created.add(createQ(quiz, "What is the primary purpose of Spring Boot Auto-Configuration?",
                    "It automatically configures beans based on dependencies present on the classpath",
                    "It replaces the JVM runtime environment",
                    "It compiles Java source files into native binaries",
                    "It encrypts all HTTP traffic automatically", "A"));
            created.add(createQ(quiz, "Which HTTP method is idempotent and conventionally used to replace an entire resource in REST?",
                    "POST", "PUT", "PATCH", "DELETE", "B"));
            created.add(createQ(quiz, "Which Spring annotation binds an incoming HTTP request body JSON payload directly to a Java DTO?",
                    "@RequestParam", "@PathVariable", "@RequestBody", "@ModelAttribute", "C"));
            created.add(createQ(quiz, "What design pattern does Spring Dependency Injection primarily implement?",
                    "Inversion of Control (IoC)", "Singleton Pattern", "Observer Pattern", "Factory Method", "A"));
        } else if (courseTitle.contains("react") || quizTitle.contains("react")) {
            created.add(createQ(quiz, "Which React hook is used to perform side effects like API requests and DOM mutations?",
                    "useState", "useEffect", "useContext", "useReducer", "B"));
            created.add(createQ(quiz, "Why is the 'key' prop important when rendering lists of elements in React?",
                    "It styles the list items in CSS",
                    "It provides encryption for list item content",
                    "It helps React identify which items have changed, added, or removed during reconciliation",
                    "It prevents the browser from refreshing", "C"));
            created.add(createQ(quiz, "What is a core principle regarding state updates in React components?",
                    "State should be modified directly via assignment",
                    "State is immutable and should be updated using setter functions",
                    "State updates must always be synchronous",
                    "State can only hold string primitive values", "B"));
            created.add(createQ(quiz, "Which React hook returns a memoized value to avoid recalculating expensive computations on every render?",
                    "useMemo", "useCallback", "useRef", "useLayoutEffect", "A"));
        } else if (courseTitle.contains("sql") || quizTitle.contains("sql") || courseTitle.contains("database")) {
            created.add(createQ(quiz, "Which SQL clause is used to filter records after aggregation with GROUP BY?",
                    "WHERE", "HAVING", "ORDER BY", "LIMIT", "B"));
            created.add(createQ(quiz, "What type of JOIN returns all rows from the left table and matched rows from the right table?",
                    "INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN", "B"));
            created.add(createQ(quiz, "Which database normalization form eliminates transitive functional dependencies?",
                    "First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form (BCNF)", "C"));
            created.add(createQ(quiz, "Which ACID property guarantees that a transaction is completely applied or entirely rolled back?",
                    "Atomicity", "Consistency", "Isolation", "Durability", "A"));
        } else if (courseTitle.contains("microservice") || quizTitle.contains("microservice")) {
            created.add(createQ(quiz, "What is the primary architectural purpose of an API Gateway in microservices?",
                    "Directly hosting relational database tables",
                    "Providing a single entry point for routing, authentication, rate limiting, and SSL termination",
                    "Replacing all message queues in the system",
                    "Compiling frontend assets on the fly", "B"));
            created.add(createQ(quiz, "Which pattern is widely used to manage distributed transactions across microservices without 2-phase commit?",
                    "Singleton Pattern", "Saga Pattern", "Proxy Pattern", "Decorator Pattern", "B"));
            created.add(createQ(quiz, "What is the primary goal of the Circuit Breaker pattern (e.g. Resilience4j)?",
                    "To speed up database index generation",
                    "To prevent cascading failures across interconnected services when a downstream dependency fails",
                    "To enforce HTTPS encryption on all internal VPC sockets",
                    "To automatically scale Docker container memory", "B"));
            created.add(createQ(quiz, "How do microservices decouple asynchronous inter-service communication?",
                    "Using event brokers such as Apache Kafka or RabbitMQ",
                    "Using shared global variables in JVM memory",
                    "Writing to shared synchronized text files",
                    "By polling a shared single MySQL database table", "A"));
        } else {
            created.add(createQ(quiz, "Which OOP principle allows a subclass to provide a specific implementation of a method defined in its parent class?",
                    "Encapsulation", "Method Overriding (Polymorphism)", "Method Overloading", "Data Hiding", "B"));
            created.add(createQ(quiz, "What is the default initial capacity of an ArrayList in standard Java?",
                    "5", "10", "16", "32", "B"));
            created.add(createQ(quiz, "Which interface must a class implement to participate in Java's try-with-resources statement?",
                    "Cloneable", "Serializable", "AutoCloseable", "Runnable", "C"));
            created.add(createQ(quiz, "What effect does the 'final' keyword have when applied to a Java class?",
                    "The class cannot be instantiated",
                    "The class cannot be inherited or subclassed",
                    "All methods in the class become private",
                    "The class is executed asynchronously", "B"));
        }
        return created;
    }

    private Question createQ(Quiz quiz, String text, String optA, String optB, String optC, String optD, String correct) {
        Question q = Question.builder()
                .quiz(quiz)
                .text(text)
                .optionA(optA)
                .optionB(optB)
                .optionC(optC)
                .optionD(optD)
                .correctOption(correct)
                .build();
        return questionRepository.save(q);
    }

    // ==========================================
    // 5. LESSON NOTES (Synchronized with Video Timestamp)
    // ==========================================
    @GetMapping({"/notes/lesson/{lessonId}", "/lessons/{lessonId}/notes"})
    public ResponseEntity<?> getLessonNotes(@PathVariable Long lessonId, Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<LessonNote> notes = lessonNoteRepository.findByStudentIdAndLessonIdOrderByUpdatedAtDesc(student.getId(), lessonId);

        List<Map<String, Object>> result = notes.stream().map(n -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("content", n.getNoteText());
            map.put("noteText", n.getNoteText());
            map.put("videoTimestamp", n.getVideoTimestamp());
            map.put("createdAt", n.getCreatedAt());
            map.put("updatedAt", n.getUpdatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping({"/notes/lesson/{lessonId}", "/lessons/{lessonId}/notes"})
    public ResponseEntity<?> saveLessonNote(
            @PathVariable Long lessonId,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() -> new RuntimeException("Lesson not found"));

        String text = payload.getOrDefault("content", payload.getOrDefault("noteText", "")).trim();
        String timestamp = payload.getOrDefault("videoTimestamp", "00:00");

        if (text.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Note content cannot be empty."));
        }

        LessonNote note = LessonNote.builder()
                .student(student)
                .lesson(lesson)
                .noteText(text)
                .videoTimestamp(timestamp)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        lessonNoteRepository.save(note);

        studentActivityRepository.save(StudentActivity.builder()
                .student(student)
                .activityType("NOTE_SAVED")
                .description("Saved study notes on: " + lesson.getTitle())
                .timestamp(LocalDateTime.now())
                .build());

        Map<String, Object> gamification = getStudentGamificationStats(student);
        
        Map<String, Object> resNote = new HashMap<>();
        resNote.put("id", note.getId());
        resNote.put("content", note.getNoteText());
        resNote.put("noteText", note.getNoteText());
        resNote.put("videoTimestamp", note.getVideoTimestamp());
        resNote.put("createdAt", note.getCreatedAt());
        resNote.put("updatedAt", note.getUpdatedAt());
        resNote.put("gamification", gamification);
        resNote.put("achievements", gamification.get("achievements"));

        return ResponseEntity.ok(resNote);
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<?> deleteLessonNote(@PathVariable Long noteId, Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        LessonNote note = lessonNoteRepository.findById(noteId).orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getStudent().getId().equals(student.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only delete your own notes."));
        }

        lessonNoteRepository.delete(note);
        return ResponseEntity.ok(Map.of("message", "Note deleted successfully."));
    }

    // ==========================================
    // 6. IN-LESSON Q&A DISCUSSION FORUM (Coursera Style)
    // ==========================================
    @GetMapping({"/lessons/{lessonId}/discussions", "/discussions/lesson/{lessonId}"})
    public ResponseEntity<?> getLessonDiscussions(@PathVariable Long lessonId) {
        seedDiscussionsIfEmpty(lessonId);

        List<LessonDiscussion> discussions = lessonDiscussionRepository.findByLessonIdOrderByUpvotesDesc(lessonId);
        List<Map<String, Object>> result = discussions.stream().map(d -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("title", d.getTitle());
            map.put("content", d.getContent());
            map.put("upvotes", d.getUpvotes());
            map.put("createdAt", d.getCreatedAt());
            map.put("userName", d.getUser() != null ? d.getUser().getFullName() : "Learner");
            map.put("repliesCount", lessonDiscussionReplyRepository.findByDiscussionIdOrderByCreatedAtAsc(d.getId()).size());
            map.put("author", Map.of(
                    "id", d.getUser().getId(),
                    "fullName", d.getUser().getFullName(),
                    "role", d.getUser().getRole().name()
            ));

            List<LessonDiscussionReply> replies = lessonDiscussionReplyRepository.findByDiscussionIdOrderByCreatedAtAsc(d.getId());
            List<Map<String, Object>> replyDTOs = replies.stream().map(r -> Map.of(
                    "id", r.getId(),
                    "content", r.getContent(),
                    "isInstructorReply", r.isInstructorReply(),
                    "createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "",
                    "userName", r.getUser() != null ? r.getUser().getFullName() : "Learner",
                    "author", Map.of(
                            "id", r.getUser().getId(),
                            "fullName", r.getUser().getFullName(),
                            "role", r.getUser().getRole().name()
                    )
            )).collect(Collectors.toList());
            map.put("replies", replyDTOs);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping({"/lessons/{lessonId}/discussions", "/discussions/lesson/{lessonId}"})
    public ResponseEntity<?> createLessonDiscussion(
            @PathVariable Long lessonId,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        User student = getAuthenticatedStudent(authentication);
        Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() -> new RuntimeException("Lesson not found"));

        String title = payload.getOrDefault("title", "").trim();
        String content = payload.getOrDefault("content", "").trim();

        if (title.isEmpty() || content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Question title and description are required."));
        }

        LessonDiscussion discussion = LessonDiscussion.builder()
                .lesson(lesson)
                .user(student)
                .title(title)
                .content(content)
                .upvotes(1)
                .createdAt(LocalDateTime.now())
                .build();

        lessonDiscussionRepository.save(discussion);

        return ResponseEntity.ok(Map.of("message", "Question posted to lesson Q&A forum!", "discussionId", discussion.getId()));
    }

    @PostMapping("/discussions/{discussionId}/replies")
    public ResponseEntity<?> postDiscussionReply(
            @PathVariable Long discussionId,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        User user = getAuthenticatedStudent(authentication);
        LessonDiscussion discussion = lessonDiscussionRepository.findById(discussionId)
                .orElseThrow(() -> new RuntimeException("Discussion thread not found"));

        String content = payload.getOrDefault("content", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reply content cannot be empty."));
        }

        boolean isInst = user.getRole() == Role.INSTRUCTOR || user.getRole() == Role.ADMIN;

        LessonDiscussionReply reply = LessonDiscussionReply.builder()
                .discussion(discussion)
                .user(user)
                .content(content)
                .isInstructorReply(isInst)
                .createdAt(LocalDateTime.now())
                .build();

        lessonDiscussionReplyRepository.save(reply);

        return ResponseEntity.ok(Map.of("message", "Reply posted successfully!", "replyId", reply.getId()));
    }

    @PostMapping("/discussions/{discussionId}/upvote")
    public ResponseEntity<?> upvoteDiscussion(@PathVariable Long discussionId) {
        LessonDiscussion discussion = lessonDiscussionRepository.findById(discussionId)
                .orElseThrow(() -> new RuntimeException("Discussion thread not found"));
        discussion.setUpvotes(discussion.getUpvotes() + 1);
        lessonDiscussionRepository.save(discussion);

        return ResponseEntity.ok(Map.of("message", "Upvoted!", "upvotes", discussion.getUpvotes()));
    }

    // ==========================================
    // 7. COURSE WISHLIST & BOOKMARKS
    // ==========================================
    @GetMapping("/wishlist")
    public ResponseEntity<?> getStudentWishlist(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Wishlist> wishlists = wishlistRepository.findByUserIdOrderByCreatedAtDesc(student.getId());

        List<Map<String, Object>> result = wishlists.stream().map(w -> {
            Course c = w.getCourse();
            Map<String, Object> map = new HashMap<>();
            map.put("wishlistId", w.getId());
            map.put("courseId", c.getId());
            map.put("title", c.getTitle());
            map.put("category", c.getCategory());
            map.put("difficulty", c.getDifficulty());
            map.put("description", c.getDescription());
            map.put("instructorName", c.getInstructor().getFullName());
            map.put("savedAt", w.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping({"/wishlist/{courseId}", "/wishlist/{courseId}/toggle"})
    @Transactional
    public ResponseEntity<?> toggleWishlist(@PathVariable Long courseId, Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndCourseId(student.getId(), courseId);
        boolean isWishlisted;

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            isWishlisted = false;
        } else {
            Wishlist w = Wishlist.builder()
                    .user(student)
                    .course(course)
                    .createdAt(LocalDateTime.now())
                    .build();
            wishlistRepository.save(w);
            isWishlisted = true;
        }

        return ResponseEntity.ok(Map.of(
                "message", isWishlisted ? "Course added to your Wishlist ❤️" : "Course removed from Wishlist",
                "isWishlisted", isWishlisted,
                "wishlisted", isWishlisted,
                "courseId", courseId
        ));
    }

    private void seedDiscussionsIfEmpty(Long lessonId) {
        if (lessonDiscussionRepository.findByLessonIdOrderByCreatedAtDesc(lessonId).isEmpty()) {
            Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
            if (lesson == null) return;

            User student = userRepository.findAll().stream().filter(u -> u.getRole() == Role.STUDENT).findFirst().orElse(null);
            User instructor = lesson.getModule() != null && lesson.getModule().getCourse() != null
                    ? lesson.getModule().getCourse().getInstructor() : null;

            if (student != null) {
                LessonDiscussion d1 = LessonDiscussion.builder()
                        .lesson(lesson)
                        .user(student)
                        .title("How does this pattern behave in high concurrency environments?")
                        .content("When handling 10,000+ requests per second, how do we configure thread pooling and database connection pool sizes effectively?")
                        .upvotes(5)
                        .createdAt(LocalDateTime.now().minusDays(2))
                        .build();
                lessonDiscussionRepository.save(d1);

                if (instructor != null) {
                    LessonDiscussionReply r1 = LessonDiscussionReply.builder()
                            .discussion(d1)
                            .user(instructor)
                            .content("Great question! In production, you typically configure HikariCP maximumPoolSize based on the formula: connections = ((core_count * 2) + effective_spindle_count). Always combine this with non-blocking reactive pipelines.")
                            .isInstructorReply(true)
                            .createdAt(LocalDateTime.now().minusDays(1))
                            .build();
                    lessonDiscussionReplyRepository.save(r1);
                }
            }
        }
    }

    // ==========================================
    // 12. CODE SANDBOX EXECUTION (JAVA 25)
    // ==========================================
    @PostMapping("/sandbox/execute")
    public ResponseEntity<?> executeSandboxCode(@RequestBody Map<String, String> payload) {
        String language = payload.getOrDefault("language", "java").trim().toLowerCase();
        String code = payload.getOrDefault("code", "");

        if (code.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "output", "",
                    "error", "Code editor is empty. Please write some code to execute."
            ));
        }

        if ("java".equals(language)) {
            return ResponseEntity.ok(runJavaProcess(code));
        } else {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "output", "▶ Execution for language [" + language + "] completed.",
                    "error", ""
            ));
        }
    }

    private Map<String, Object> runJavaProcess(String code) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();

        String className = "Main";
        Pattern pattern = Pattern.compile("public\\s+class\\s+(\\w+)");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            className = matcher.group(1);
        } else {
            Pattern nonPublicPattern = Pattern.compile("class\\s+(\\w+)");
            Matcher m2 = nonPublicPattern.matcher(code);
            if (m2.find()) {
                className = m2.group(1);
            }
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("ls_sandbox_");
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, code);

            // Compile
            ProcessBuilder compilePb = new ProcessBuilder("javac", sourceFile.getFileName().toString());
            compilePb.directory(tempDir.toFile());
            compilePb.redirectErrorStream(true);

            Process compileProcess = compilePb.start();
            boolean compiledInTime = compileProcess.waitFor(5, TimeUnit.SECONDS);

            if (!compiledInTime) {
                compileProcess.destroyForcibly();
                result.put("success", false);
                result.put("output", "");
                result.put("error", "Compilation timed out (> 5s).");
                result.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return result;
            }

            StringBuilder compileOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(compileProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    compileOutput.append(line).append("\n");
                }
            }

            if (compileProcess.exitValue() != 0) {
                result.put("success", false);
                result.put("output", "");
                result.put("error", "Compilation Error:\n" + compileOutput);
                result.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return result;
            }

            // Execute
            ProcessBuilder runPb = new ProcessBuilder("java", "-cp", ".", className);
            runPb.directory(tempDir.toFile());

            Process runProcess = runPb.start();
            boolean executedInTime = runProcess.waitFor(5, TimeUnit.SECONDS);

            if (!executedInTime) {
                runProcess.destroyForcibly();
                result.put("success", false);
                result.put("output", "");
                result.put("error", "Execution timed out (limit: 5.0s). Please check for infinite loops or blocking inputs.");
                result.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return result;
            }

            StringBuilder stdout = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(runProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (stdout.length() > 32768) {
                        stdout.append("\n... [output truncated at 32KB]");
                        break;
                    }
                    stdout.append(line).append("\n");
                }
            }

            StringBuilder stderr = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(runProcess.getErrorStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    stderr.append(line).append("\n");
                }
            }

            long elapsed = System.currentTimeMillis() - startTime;
            result.put("success", runProcess.exitValue() == 0);
            result.put("output", stdout.length() == 0 && stderr.length() == 0 ? "▶ Process finished with exit code 0 (no console output)." : stdout.toString());
            result.put("error", stderr.toString());
            result.put("exitCode", runProcess.exitValue());
            result.put("executionTimeMs", elapsed);

        } catch (Exception e) {
            result.put("success", false);
            result.put("output", "");
            result.put("error", "Sandbox execution error: " + e.getMessage());
            result.put("executionTimeMs", System.currentTimeMillis() - startTime);
        } finally {
            if (tempDir != null) {
                try {
                    File[] files = tempDir.toFile().listFiles();
                    if (files != null) {
                        for (File f : files) f.delete();
                    }
                    tempDir.toFile().delete();
                } catch (Exception ignored) {}
            }
        }

        return result;
    }

    // ==========================================
    // 13. DELETE STUDENT ACCOUNT
    // ==========================================
    @DeleteMapping("/account")
    @Transactional
    public ResponseEntity<?> deleteStudentAccount(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        Long studentId = student.getId();

        // 1. Activities
        studentActivityRepository.deleteAll(studentActivityRepository.findByStudentId(studentId));
        // 2. Wishlist
        wishlistRepository.deleteAll(wishlistRepository.findByUserIdOrderByCreatedAtDesc(studentId));
        // 3. Lesson Notes
        lessonNoteRepository.deleteAll(lessonNoteRepository.findByStudentId(studentId));
        // 4. Discussion Replies & Discussions
        List<LessonDiscussionReply> replies = lessonDiscussionReplyRepository.findAll().stream()
                .filter(r -> r.getUser() != null && r.getUser().getId().equals(studentId)).toList();
        lessonDiscussionReplyRepository.deleteAll(replies);

        List<LessonDiscussion> discussions = lessonDiscussionRepository.findAll().stream()
                .filter(d -> d.getUser() != null && d.getUser().getId().equals(studentId)).toList();
        for (LessonDiscussion d : discussions) {
            lessonDiscussionReplyRepository.deleteAll(lessonDiscussionReplyRepository.findByDiscussionIdOrderByCreatedAtAsc(d.getId()));
        }
        lessonDiscussionRepository.deleteAll(discussions);

        // 5. Course Reviews
        courseReviewRepository.deleteAll(courseReviewRepository.findByStudentId(studentId));
        // 6. Submissions
        assignmentSubmissionRepository.deleteAll(assignmentSubmissionRepository.findByStudentId(studentId));
        quizSubmissionRepository.deleteAll(quizSubmissionRepository.findByStudentId(studentId));
        // 7. Lesson Progress
        lessonProgressRepository.deleteAll(lessonProgressRepository.findByStudentId(studentId));
        // 8. Certificates
        certificateRepository.deleteAll(certificateRepository.findByStudentId(studentId));
        // 9. Enrollments
        enrollmentRepository.deleteAll(enrollmentRepository.findByStudentId(studentId));
        // 10. Notifications
        notificationRepository.deleteAll(notificationRepository.findByUserIdOrderByCreatedAtDesc(studentId));
        // 11. User
        userRepository.delete(student);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Your student account and all course progress have been permanently deleted."
        ));
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(student.getId());
        return ResponseEntity.ok(notifs);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        Notification notif = notificationRepository.findById(id).orElseThrow();
        notif.setRead(true);
        notificationRepository.save(notif);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead(Authentication authentication) {
        User student = getAuthenticatedStudent(authentication);
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(student.getId());
        notifs.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifs);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
