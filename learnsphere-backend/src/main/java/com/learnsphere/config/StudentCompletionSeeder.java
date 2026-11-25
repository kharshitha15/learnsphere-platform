package com.learnsphere.config;

import com.learnsphere.entity.*;
import com.learnsphere.entity.Module;
import com.learnsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class StudentCompletionSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CertificateRepository certificateRepository;
    private final StudentActivityRepository studentActivityRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        User priya = userRepository.findByEmail("priya.sharma@example.com").orElse(null);
        User anjali = userRepository.findByEmail("anjali.rao@example.com").orElse(null);
        User arjun = userRepository.findByEmail("arjun.kumar@example.com").orElse(null);

        if (priya != null && countCertificates(priya) == 0) {
            seedEnrollmentsAndProgress(priya, "HTML, CSS & JavaScript", 100);
        }
        if (anjali != null && countCertificates(anjali) == 0) {
            seedEnrollmentsAndProgress(anjali, "SQL & Database Management", 100);
        }
        if (arjun != null && countCertificates(arjun) == 0) {
            seedEnrollmentsAndProgress(arjun, "Git & GitHub for Developers", 100);
        }
        System.out.println("Additional completions and certificates seeded for all students.");
    }

    private long countCertificates(User u) {
        return certificateRepository.findAll().stream().filter(c -> c.getStudent().getId().equals(u.getId())).count();
    }

    private void seedEnrollmentsAndProgress(User student, String courseTitle, int targetProgressPercent) {
        Course course = courseRepository.findAll().stream()
                .filter(c -> c.getTitle().equals(courseTitle))
                .findFirst()
                .orElse(null);

        if (course == null) return;

        Enrollment e = enrollmentRepository.findAll().stream()
                .filter(en -> en.getStudent().getId().equals(student.getId()) && en.getCourse().getId().equals(course.getId()))
                .findFirst()
                .orElse(new Enrollment());
        
        if (e.getId() == null) {
            e.setStudent(student);
            e.setCourse(course);
            e.setEnrolledAt(LocalDateTime.now().minusDays(15));
        }
        e.setProgressPercentage(targetProgressPercent);
        enrollmentRepository.save(e);

        if (targetProgressPercent > 0) {
            List<Lesson> allLessons = new ArrayList<>();
            List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(course.getId());
            for (Module m : modules) {
                allLessons.addAll(lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()));
            }

            for (int i = 0; i < allLessons.size(); i++) {
                Lesson l = allLessons.get(i);
                
                boolean exists = lessonProgressRepository.findAll().stream()
                    .anyMatch(lp -> lp.getStudent().getId().equals(student.getId()) && lp.getLesson().getId().equals(l.getId()));
                
                if (!exists) {
                    LessonProgress lp = new LessonProgress();
                    lp.setStudent(student);
                    lp.setLesson(l);
                    lp.setCompleted(true);
                    lp.setCompletedAt(LocalDateTime.now().minusDays(14).plusHours(i));
                    lessonProgressRepository.save(lp);
                }
            }

            if (targetProgressPercent == 100) {
                boolean hasCert = certificateRepository.findAll().stream()
                    .anyMatch(c -> c.getStudent().getId().equals(student.getId()) && c.getCourse().getId().equals(course.getId()));
                
                if (!hasCert) {
                    Certificate cert = new Certificate();
                    cert.setStudent(student);
                    cert.setCourse(course);
                    cert.setCertificateId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    cert.setIssueDate(LocalDateTime.now().minusDays(2));
                    certificateRepository.save(cert);

                    StudentActivity activity = new StudentActivity();
                    activity.setStudent(student);
                    activity.setActivityType("CERTIFICATE_EARNED");
                    activity.setDescription("Earned certificate for " + course.getTitle());
                    activity.setTimestamp(LocalDateTime.now().minusDays(2));
                    studentActivityRepository.save(activity);
                }
            }
        }
    }
}
