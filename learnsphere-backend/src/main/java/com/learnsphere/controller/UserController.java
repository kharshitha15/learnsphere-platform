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

import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonResourceRepository lessonResourceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;
    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CourseReviewRepository courseReviewRepository;
    private final LessonNoteRepository lessonNoteRepository;
    private final LessonDiscussionRepository lessonDiscussionRepository;
    private final LessonDiscussionReplyRepository lessonDiscussionReplyRepository;
    private final WishlistRepository wishlistRepository;
    private final StudentActivityRepository studentActivityRepository;
    private final NotificationRepository notificationRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated user");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));
    }

    /**
     * Get current user profile
     */
    @GetMapping({"/me", "/profile"})
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("username", user.getUsername());
        map.put("bio", user.getBio());
        map.put("skills", user.getSkills());
        map.put("careerInterest", user.getCareerInterest());
        map.put("location", user.getLocation());
        map.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(map);
    }

    /**
     * Permanently delete own account (Student or Instructor)
     */
    @DeleteMapping({"/account", "/me"})
    @Transactional
    public ResponseEntity<?> deleteMyAccount(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Long userId = user.getId();
        Role role = user.getRole();

        if (role == Role.STUDENT) {
            deleteStudentData(userId);
        } else if (role == Role.INSTRUCTOR) {
            deleteInstructorData(userId);
        } else if (role == Role.ADMIN) {
            long adminCount = userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).count();
            if (adminCount <= 1) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Cannot delete the sole Administrator account."));
            }
            deleteStudentData(userId);
        }

        userRepository.delete(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Your " + role.name().toLowerCase() + " account and all associated records have been permanently deleted."
        ));
    }

    private void deleteStudentData(Long studentId) {
        // 1. Activities
        List<StudentActivity> activities = studentActivityRepository.findByStudentId(studentId);
        studentActivityRepository.deleteAll(activities);

        // 2. Wishlist
        List<Wishlist> wishlists = wishlistRepository.findByUserIdOrderByCreatedAtDesc(studentId);
        wishlistRepository.deleteAll(wishlists);

        // 3. Lesson Notes
        List<LessonNote> notes = lessonNoteRepository.findByStudentId(studentId);
        lessonNoteRepository.deleteAll(notes);

        // 4. Discussion Replies & Discussions
        List<LessonDiscussionReply> replies = lessonDiscussionReplyRepository.findAll().stream()
                .filter(r -> r.getUser() != null && r.getUser().getId().equals(studentId))
                .toList();
        lessonDiscussionReplyRepository.deleteAll(replies);

        List<LessonDiscussion> discussions = lessonDiscussionRepository.findAll().stream()
                .filter(d -> d.getUser() != null && d.getUser().getId().equals(studentId))
                .toList();
        for (LessonDiscussion d : discussions) {
            List<LessonDiscussionReply> dReplies = lessonDiscussionReplyRepository.findByDiscussionIdOrderByCreatedAtAsc(d.getId());
            lessonDiscussionReplyRepository.deleteAll(dReplies);
        }
        lessonDiscussionRepository.deleteAll(discussions);

        // 5. Course Reviews
        List<CourseReview> reviews = courseReviewRepository.findByStudentId(studentId);
        courseReviewRepository.deleteAll(reviews);

        // 6. Submissions
        List<AssignmentSubmission> aSubs = assignmentSubmissionRepository.findByStudentId(studentId);
        assignmentSubmissionRepository.deleteAll(aSubs);

        List<QuizSubmission> qSubs = quizSubmissionRepository.findByStudentId(studentId);
        quizSubmissionRepository.deleteAll(qSubs);

        // 7. Lesson Progress
        List<LessonProgress> progresses = lessonProgressRepository.findByStudentId(studentId);
        lessonProgressRepository.deleteAll(progresses);

        // 8. Certificates
        List<Certificate> certs = certificateRepository.findByStudentId(studentId);
        certificateRepository.deleteAll(certs);

        // 9. Enrollments
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        enrollmentRepository.deleteAll(enrollments);

        // 10. Notifications
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(studentId);
        notificationRepository.deleteAll(notifs);
    }

    private void deleteInstructorData(Long instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);

        for (Course c : courses) {
            Long cId = c.getId();

            List<Enrollment> enrs = enrollmentRepository.findAll().stream()
                    .filter(e -> e.getCourse() != null && e.getCourse().getId().equals(cId)).toList();
            enrollmentRepository.deleteAll(enrs);

            List<Certificate> certs = certificateRepository.findAll().stream()
                    .filter(cert -> cert.getCourse() != null && cert.getCourse().getId().equals(cId)).toList();
            certificateRepository.deleteAll(certs);

            List<CourseReview> revs = courseReviewRepository.findAll().stream()
                    .filter(r -> r.getCourse() != null && r.getCourse().getId().equals(cId)).toList();
            courseReviewRepository.deleteAll(revs);

            List<Wishlist> wishes = wishlistRepository.findAll().stream()
                    .filter(w -> w.getCourse() != null && w.getCourse().getId().equals(cId)).toList();
            wishlistRepository.deleteAll(wishes);

            List<Assignment> assignments = assignmentRepository.findByCourseId(cId);
            for (Assignment a : assignments) {
                List<AssignmentSubmission> subs = assignmentSubmissionRepository.findAll().stream()
                        .filter(s -> s.getAssignment() != null && s.getAssignment().getId().equals(a.getId())).toList();
                assignmentSubmissionRepository.deleteAll(subs);
            }
            assignmentRepository.deleteAll(assignments);

            List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(cId);
            for (Module m : modules) {
                List<Quiz> quizzes = quizRepository.findByModuleId(m.getId());
                for (Quiz q : quizzes) {
                    List<QuizSubmission> qSubs = quizSubmissionRepository.findAll().stream()
                            .filter(qs -> qs.getQuiz() != null && qs.getQuiz().getId().equals(q.getId())).toList();
                    quizSubmissionRepository.deleteAll(qSubs);
                }
                quizRepository.deleteAll(quizzes);

                List<Lesson> lessons = lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId());
                for (Lesson l : lessons) {
                    List<LessonResource> resList = lessonResourceRepository.findByLessonId(l.getId());
                    lessonResourceRepository.deleteAll(resList);

                    List<LessonProgress> lps = lessonProgressRepository.findAll().stream()
                            .filter(lp -> lp.getLesson() != null && lp.getLesson().getId().equals(l.getId())).toList();
                    lessonProgressRepository.deleteAll(lps);

                    List<LessonNote> notes = lessonNoteRepository.findAll().stream()
                            .filter(n -> n.getLesson() != null && n.getLesson().getId().equals(l.getId())).toList();
                    lessonNoteRepository.deleteAll(notes);

                    List<LessonDiscussion> discs = lessonDiscussionRepository.findByLessonIdOrderByCreatedAtDesc(l.getId());
                    for (LessonDiscussion d : discs) {
                        List<LessonDiscussionReply> dReplies = lessonDiscussionReplyRepository.findByDiscussionIdOrderByCreatedAtAsc(d.getId());
                        lessonDiscussionReplyRepository.deleteAll(dReplies);
                    }
                    lessonDiscussionRepository.deleteAll(discs);
                }
                lessonRepository.deleteAll(lessons);
            }
            moduleRepository.deleteAll(modules);

            courseRepository.delete(c);
        }

        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(instructorId);
        notificationRepository.deleteAll(notifs);

        List<LessonDiscussionReply> replies = lessonDiscussionReplyRepository.findAll().stream()
                .filter(r -> r.getUser() != null && r.getUser().getId().equals(instructorId)).toList();
        lessonDiscussionReplyRepository.deleteAll(replies);
    }
}
