package com.learnsphere.config;

import com.learnsphere.entity.*;
import com.learnsphere.entity.Module;
import com.learnsphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonResourceRepository lessonResourceRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CertificateRepository certificateRepository;
    private final StudentActivityRepository studentActivityRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final CourseReviewRepository courseReviewRepository;
    private final NotificationRepository notificationRepository;
    private final LessonNoteRepository lessonNoteRepository;
    private final LessonDiscussionRepository lessonDiscussionRepository;
    private final LessonDiscussionReplyRepository lessonDiscussionReplyRepository;
    private final WishlistRepository wishlistRepository;
    private final PasswordEncoder passwordEncoder;
    private final QuestionRepository questionRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        cleanupDuplicateCoursesAndEnrollments();
        
        String pass = passwordEncoder.encode("NewPassword@123");

        User admin = createUser("Admin User", "admin@example.com", "admin", null, null, null, null, pass, Role.ADMIN);
        User suresh = createUser("Suresh Babu", "suresh.babu@example.com", "suresh.babu", "Java and Spring Boot instructor focused on practical backend development.", "Java, Spring Boot, REST APIs, JPA, MySQL", "Backend Development", "Bengaluru, India", pass, Role.INSTRUCTOR);
        User lakshmi = createUser("Lakshmi Devi", "lakshmi.devi@example.com", "lakshmi.devi", "Frontend instructor teaching React and modern web development.", "React, JavaScript, HTML, CSS", "Frontend Development", "Hyderabad, India", pass, Role.INSTRUCTOR);

        User ravi = createUser("Ravi Kumar", "ravi.kumar@example.com", "ravi.kumar", "Aspiring Java Full Stack Developer interested in Spring Boot, React and databases.", "Java, Spring Boot, React, MySQL, Git", "Java Full Stack Developer", "Bengaluru, India", pass, Role.STUDENT);
        User raju = createUser("Raju Reddy", "raju.reddy@example.com", "raju.reddy", "Computer science student learning full-stack development and DSA.", "Java, DSA, SQL, React", "Software Engineer", "Hyderabad, India", pass, Role.STUDENT);
        User priya = createUser("Priya Sharma", "priya.sharma@example.com", "priya.sharma", "Beginner developer interested in frontend development.", "HTML, CSS, JavaScript, React", "Frontend Developer", "Chennai, India", pass, Role.STUDENT);
        User anjali = createUser("Anjali Rao", "anjali.rao@example.com", "anjali.rao", "Learning Java and backend development.", "Java, SQL, Spring Boot", "Backend Developer", "Bengaluru, India", pass, Role.STUDENT);
        User arjun = createUser("Arjun Kumar", "arjun.kumar@example.com", "arjun.kumar", "Interested in software engineering and problem solving.", "Java, DSA, Git", "Software Engineer", "Pune, India", pass, Role.STUDENT);

        // Read curriculum.json
        InputStream is = new ClassPathResource("curriculum.json").getInputStream();
        String jsonStr = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        JsonParser parser = JsonParserFactory.getJsonParser();
        List<Object> coursesRaw = parser.parseList(jsonStr);

        for (Object cObj : coursesRaw) {
            Map<String, Object> cMap = (Map<String, Object>) cObj;
            String cTitle = (String) cMap.get("title");
            
            // Avoid duplicate courses
            boolean exists = courseRepository.findAll().stream().anyMatch(c -> c.getTitle().equals(cTitle));
            if(exists) continue;

            Course c = new Course();
            c.setTitle(cTitle);
            c.setCategory((String) cMap.get("category"));
            c.setDifficulty((String) cMap.get("difficulty"));
            c.setDescription((String) cMap.get("description"));
            c.setInstructor(cTitle.contains("React") || cTitle.contains("HTML") || cTitle.contains("Git") || cTitle.contains("Python") ? lakshmi : suresh);
            c.setPublished(true);
            c.setCreatedAt(LocalDateTime.now().minusDays(30));
            courseRepository.save(c);

            List<Object> modulesRaw = (List<Object>) cMap.get("modules");
            int mOrder = 1;
            for (Object mObj : modulesRaw) {
                Map<String, Object> mMap = (Map<String, Object>) mObj;
                Module m = new Module();
                m.setTitle((String) mMap.get("title"));
                m.setModuleOrder(mOrder++);
                m.setCourse(c);
                moduleRepository.save(m);

                List<Object> lessonsRaw = (List<Object>) mMap.get("lessons");
                int lOrder = 1;
                for (Object lObj : lessonsRaw) {
                    Map<String, Object> lMap = (Map<String, Object>) lObj;
                    Lesson l = new Lesson();
                    l.setTitle((String) lMap.get("title"));
                    String lType = (String) lMap.get("lessonType");
                    l.setLessonType(lType != null ? LessonType.valueOf(lType) : LessonType.VIDEO);
                    
                    Object durationObj = lMap.get("duration");
                    if (durationObj != null) {
                        l.setDuration(((Number) durationObj).intValue());
                    }

                    l.setLearningObjectives((String) lMap.get("learningObjectives"));
                    l.setContent((String) lMap.get("content"));
                    l.setVideoProvider((String) lMap.get("videoProvider"));
                    l.setVideoUrl((String) lMap.get("videoUrl"));
                    l.setLessonOrder(lOrder++);
                    l.setModule(m);
                    lessonRepository.save(l);

                    if (lMap.containsKey("resources")) {
                        List<Object> resRaw = (List<Object>) lMap.get("resources");
                        for (Object rObj : resRaw) {
                            Map<String, Object> rMap = (Map<String, Object>) rObj;
                            LessonResource r = new LessonResource();
                            r.setLesson(l);
                            r.setResourceType((String) rMap.get("resourceType"));
                            r.setTitle((String) rMap.get("title"));
                            r.setUrl((String) rMap.get("url"));
                            r.setProvider((String) rMap.get("provider"));
                            lessonResourceRepository.save(r);
                        }
                    }

                    if (lMap.containsKey("quizQuestions")) {
                        List<Object> qRaw = (List<Object>) lMap.get("quizQuestions");
                        for (Object qObj : qRaw) {
                            Map<String, Object> qMap = (Map<String, Object>) qObj;
                            QuizQuestion q = new QuizQuestion();
                            q.setLesson(l);
                            q.setQuestionText((String) qMap.get("questionText"));
                            q.setOptionA((String) qMap.get("optionA"));
                            q.setOptionB((String) qMap.get("optionB"));
                            q.setOptionC((String) qMap.get("optionC"));
                            q.setOptionD((String) qMap.get("optionD"));
                            q.setCorrectOption((String) qMap.get("correctOption"));
                            quizQuestionRepository.save(q);
                        }
                    }
                }
            }
        }

        // ENROLLMENTS AND PROGRESS SEEDING
        if (enrollmentRepository.count() == 0) {
            seedEnrollmentsAndProgress(ravi, "Java Programming Fundamentals", 100);
            seedEnrollmentsAndProgress(ravi, "SQL & Database Management", 100);
            seedEnrollmentsAndProgress(ravi, "Git & GitHub for Developers", 100);
            seedEnrollmentsAndProgress(ravi, "Spring Boot & REST API Development", 68);
            seedEnrollmentsAndProgress(ravi, "React.js for Beginners", 32);

            seedEnrollmentsAndProgress(raju, "Java Programming Fundamentals", 100);
            seedEnrollmentsAndProgress(raju, "Data Structures & Algorithms in Java", 54);
            seedEnrollmentsAndProgress(raju, "React.js for Beginners", 23);
            seedEnrollmentsAndProgress(raju, "Git & GitHub for Developers", 0);

            seedEnrollmentsAndProgress(priya, "HTML, CSS & JavaScript", 100);
            seedEnrollmentsAndProgress(priya, "React.js for Beginners", 18);
            seedEnrollmentsAndProgress(priya, "Python Programming Fundamentals", 0);

            seedEnrollmentsAndProgress(anjali, "SQL & Database Management", 100);
            seedEnrollmentsAndProgress(anjali, "Java Programming Fundamentals", 45);
            seedEnrollmentsAndProgress(anjali, "Spring Boot & REST API Development", 15);

            seedEnrollmentsAndProgress(arjun, "Git & GitHub for Developers", 100);
            seedEnrollmentsAndProgress(arjun, "Data Structures & Algorithms in Java", 38);
            seedEnrollmentsAndProgress(arjun, "Java Programming Fundamentals", 20);
        }

        // SEED ASSIGNMENTS & SUBMISSIONS
        if (assignmentRepository.count() == 0) {
            Course springBoot = findCourse("Spring Boot & REST API Development");
            Course reactCourse = findCourse("React.js for Beginners");
            Course dsaCourse = findCourse("Data Structures & Algorithms in Java");
            Course htmlCourse = findCourse("HTML, CSS & JavaScript");
            Course sqlCourse = findCourse("SQL & Database Management");
            Course gitCourse = findCourse("Git & GitHub for Developers");
            Course javaCourse = findCourse("Java Programming Fundamentals");
            Course pythonCourse = findCourse("Python Programming Fundamentals");

            if (springBoot != null) {
                Assignment a1 = createAssignment(springBoot, "Build a REST API for Course Management", "Design and implement REST endpoints with proper HTTP verbs and JPA repository.", 10);
                Assignment a2 = createAssignment(springBoot, "Spring Security & JWT Authentication", "Implement JWT filter, authentication manager, and role-based access.", 10);

                createSubmission(ravi, a1, 8, "Good REST API implementation. Improve validation and exception handling.", "GRADED", "Implemented all 6 CRUD controllers and DTO mappings.");
                createSubmission(priya, a1, null, null, "SUBMITTED", "Completed controllers, please review security config.");
                createSubmission(ravi, a2, null, null, "SUBMITTED", "Integrated BCrypt password encoder and JWT token filter.");
            }

            if (reactCourse != null) {
                Assignment a3 = createAssignment(reactCourse, "Build a React Course Listing Page", "Create dynamic course cards with props, state, and search filtering.", 10);
                Assignment a4 = createAssignment(reactCourse, "Build a React Todo Application", "Implement todo state management with add, delete, and toggle complete.", 10);

                createSubmission(ravi, a3, null, null, "SUBMITTED", "Created CourseCard components with Tailwind.");
                createSubmission(raju, a4, null, "Improve component structure and state management.", "RETURNED", "Added add/delete features.");
            }

            if (dsaCourse != null) {
                Assignment a5 = createAssignment(dsaCourse, "Implement Binary Search & Complexity Analysis", "Implement Binary Search and analyze its time and space complexity.", 10);
                createSubmission(raju, a5, 7, "Correct implementation. Explain time complexity more clearly.", "GRADED", "Included iterative and recursive versions.");
            }

            if (htmlCourse != null) {
                Assignment a6 = createAssignment(htmlCourse, "Create a Responsive Portfolio Page", "Build a mobile-responsive portfolio page using HTML5 and CSS3.", 10);
                createSubmission(priya, a6, null, null, "SUBMITTED", "Designed with Flexbox and media queries.");
            }

            if (sqlCourse != null) {
                Assignment a7 = createAssignment(sqlCourse, "Database Normalization & Multi-Table SQL Joins", "Write complex queries using INNER/LEFT JOINs, GROUP BY, aggregate functions, and design a 3NF relational schema.", 10);
                createSubmission(ravi, a7, 9, "Excellent query optimization and proper 3NF schema breakdown.", "GRADED", "Implemented complex e-commerce order aggregation schema.");
                createSubmission(anjali, a7, 8, "Well structured schema. Ensure indexed foreign keys in future designs.", "GRADED", "Complete 3NF normalized tables with sample insert scripts.");
            }

            if (gitCourse != null) {
                Assignment a8 = createAssignment(gitCourse, "Feature Branch Workflow & Merge Conflict Resolution", "Set up a collaborative GitHub repo, practice branching, pull request reviews, and interactive rebase.", 10);
                createSubmission(ravi, a8, 10, "Flawless commit history and well-documented PR description.", "GRADED", "Demonstrated feature branching, squash merging, and conflict resolution.");
                createSubmission(arjun, a8, 9, "Great demonstration of cherry-picking and rebase.", "GRADED", "Submitted GitHub PR link and conflict resolution log.");
            }

            if (javaCourse != null) {
                Assignment a9 = createAssignment(javaCourse, "Object-Oriented Banking Management System", "Implement encapsulation, inheritance, polymorphism, and custom exception handling for accounts and transactions.", 10);
                createSubmission(ravi, a9, 10, "Exceptionally clean OOP hierarchy with robust exception handling.", "GRADED", "Created BankAccount, SavingsAccount, and InsufficientFundsException.");
                createSubmission(raju, a9, 8, "Good OOP principles applied. Consider adding JUnit tests next time.", "GRADED", "Full bank transaction system with deposit and withdrawal rules.");
            }

            if (pythonCourse != null) {
                Assignment a10 = createAssignment(pythonCourse, "Automated Log File Parser & Analytics CLI", "Build a Python command-line utility to parse server logs, extract error counts, and generate summary statistics.", 10);
                createSubmission(priya, a10, null, null, "SUBMITTED", "Submitted Python script with regex parsing and command-line flags.");
            }
        }

        // SEED QUIZZES & SUBMISSIONS
        if (quizRepository.count() == 0) {
            Course springBoot = findCourse("Spring Boot & REST API Development");
            Course javaCourse = findCourse("Java Programming Fundamentals");
            Course dsaCourse = findCourse("Data Structures & Algorithms in Java");
            Course reactCourse = findCourse("React.js for Beginners");
            Course sqlCourse = findCourse("SQL & Database Management");
            Course gitCourse = findCourse("Git & GitHub for Developers");
            Course htmlCourse = findCourse("HTML, CSS & JavaScript");
            Course pythonCourse = findCourse("Python Programming Fundamentals");

            if (springBoot != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(springBoot.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q1 = createQuiz(m, "Spring Boot & REST APIs Quiz", 70);
                    createQuizSubmission(ravi, q1, 9, 10, true);
                    createQuizSubmission(anjali, q1, 8, 10, true);
                }
            }

            if (javaCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(javaCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q2 = createQuiz(m, "Java OOP & Collections Quiz", 70);
                    createQuizSubmission(ravi, q2, 9, 10, true);
                    createQuizSubmission(raju, q2, 7, 10, true);
                    createQuizSubmission(arjun, q2, 8, 10, true);
                }
            }

            if (dsaCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(dsaCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q3 = createQuiz(m, "Arrays & Sorting Quiz", 70);
                    createQuizSubmission(raju, q3, 8, 10, true);
                    createQuizSubmission(arjun, q3, 7, 10, true);
                }
            }

            if (reactCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(reactCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q4 = createQuiz(m, "React Hooks & State Quiz", 70);
                    createQuizSubmission(raju, q4, 7, 10, true);
                    createQuizSubmission(priya, q4, 8, 10, true);
                }
            }

            if (sqlCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(sqlCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q5 = createQuiz(m, "SQL Queries, Joins & Normalization Quiz", 70);
                    createQuizSubmission(ravi, q5, 10, 10, true);
                    createQuizSubmission(anjali, q5, 9, 10, true);
                }
            }

            if (gitCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(gitCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q6 = createQuiz(m, "Git Branching, Rebasing & Workflows Quiz", 70);
                    createQuizSubmission(ravi, q6, 10, 10, true);
                    createQuizSubmission(arjun, q6, 9, 10, true);
                }
            }

            if (htmlCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(htmlCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q7 = createQuiz(m, "Modern JavaScript & DOM Quiz", 70);
                    createQuizSubmission(priya, q7, 9, 10, true);
                    createQuizSubmission(ravi, q7, 10, 10, true);
                }
            }

            if (pythonCourse != null) {
                Module m = moduleRepository.findByCourseIdOrderByModuleOrderAsc(pythonCourse.getId()).stream().findFirst().orElse(null);
                if (m != null) {
                    Quiz q8 = createQuiz(m, "Python Data Structures & OOP Quiz", 70);
                    createQuizSubmission(priya, q8, 8, 10, true);
                }
            }
        }

        // Ensure every module across all courses has a quiz with real questions
        seedAllQuizzesAndQuestions();

        // SEED COURSE REVIEWS
        if (courseReviewRepository.count() == 0) {
            Course springBoot = findCourse("Spring Boot & REST API Development");
            Course dsaCourse = findCourse("Data Structures & Algorithms in Java");
            Course htmlCourse = findCourse("HTML, CSS & JavaScript");
            Course javaCourse = findCourse("Java Programming Fundamentals");
            Course gitCourse = findCourse("Git & GitHub for Developers");

            if (springBoot != null) {
                createReview(ravi, springBoot, 5, "Very practical course. The REST API and JWT sections were especially useful.", "Thank you Ravi! Glad the JWT walkthrough was helpful for your full stack journey.");
            }
            if (dsaCourse != null) {
                createReview(raju, dsaCourse, 4, "The examples are useful, but I would like more coding exercises.", "Thanks Raju! I'm adding more dynamic programming and graph problems next week.");
            }
            if (htmlCourse != null) {
                createReview(priya, htmlCourse, 5, "Good beginner-friendly explanations and practical examples.", "Welcome to web development Priya! Happy coding.");
            }
            if (javaCourse != null) {
                createReview(anjali, javaCourse, 4, "Good course for learning OOP concepts.", null);
            }
            if (gitCourse != null) {
                createReview(arjun, gitCourse, 5, "Clear explanation of Git commands and GitHub workflow.", null);
            }
        }

        // SEED INSTRUCTOR NOTIFICATIONS
        if (notificationRepository.count() == 0) {
            createNotification(suresh, "New Submission", "Ravi Kumar submitted assignment: Build a REST API for Course Management");
            createNotification(suresh, "Grading Reminder", "3 assignments are waiting for your review and grading.");
            createNotification(suresh, "5-Star Review", "Ravi Kumar posted a 5-star review for Spring Boot & REST API Development.");
            createNotification(lakshmi, "New Submission", "Priya Sharma submitted assignment: Create a Responsive Portfolio Page.");
            createNotification(ravi, "Assignment Graded", "Your Spring Boot assignment has been graded. You received 8/10.");
        }

        System.out.println("Realistic Relational Demo Data Seeding Completed!");
    }

    private User createUser(String name, String email, String username, String bio, String skills, String career, String loc, String pwd, Role role) {
        User u = userRepository.findByEmail(email).orElse(new User());
        u.setFullName(name);
        u.setEmail(email);
        u.setUsername(username);
        u.setBio(bio);
        u.setSkills(skills);
        u.setCareerInterest(career);
        u.setLocation(loc);
        if (u.getPassword() == null) {
            u.setPassword(pwd);
        }
        u.setRole(role);
        if (u.getCreatedAt() == null) {
            u.setCreatedAt(LocalDateTime.now().minusDays(30));
        }
        return userRepository.save(u);
    }

    private Course findCourse(String title) {
        return courseRepository.findAll().stream().filter(c -> c.getTitle().equals(title)).findFirst().orElse(null);
    }

    private Assignment createAssignment(Course course, String title, String desc, int maxMarks) {
        Assignment a = Assignment.builder()
                .course(course)
                .title(title)
                .description(desc)
                .maxMarks(maxMarks)
                .deadline(LocalDateTime.now().plusDays(10))
                .build();
        return assignmentRepository.save(a);
    }

    private void createSubmission(User student, Assignment assignment, Integer marks, String feedback, String status, String notes) {
        AssignmentSubmission s = AssignmentSubmission.builder()
                .student(student)
                .assignment(assignment)
                .marksObtained(marks)
                .instructorFeedback(feedback)
                .status(status)
                .graded(marks != null || "GRADED".equalsIgnoreCase(status))
                .studentNotes(notes)
                .submissionUrl("https://github.com/learnsphere-student/assignment-submission")
                .submittedAt(LocalDateTime.now().minusDays(2))
                .gradedAt(marks != null ? LocalDateTime.now().minusDays(1) : null)
                .build();
        assignmentSubmissionRepository.save(s);
    }

    private Quiz createQuiz(Module module, String title, int passingPercent) {
        Quiz q = Quiz.builder()
                .module(module)
                .title(title)
                .description("Assess understanding of core concepts.")
                .passingPercentage(passingPercent)
                .build();
        Quiz saved = quizRepository.save(q);
        seedQuestionsForQuiz(saved);
        return saved;
    }

    private void seedAllQuizzesAndQuestions() {
        try {
            List<Module> allModules = moduleRepository.findAll();
            for (Module m : allModules) {
                List<Quiz> quizzes = quizRepository.findByModuleId(m.getId());
                if (quizzes.isEmpty()) {
                    createQuiz(m, m.getTitle() + " Knowledge Check", 70);
                } else {
                    for (Quiz q : quizzes) {
                        seedQuestionsForQuiz(q);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Notice: seedAllQuizzesAndQuestions: " + e.getMessage());
        }
    }

    private void seedQuestionsForQuiz(Quiz quiz) {
        if (quiz == null || quiz.getId() == null) return;
        List<Question> existing = questionRepository.findByQuizId(quiz.getId());
        if (!existing.isEmpty()) return;

        String courseTitle = quiz.getModule() != null && quiz.getModule().getCourse() != null 
                ? quiz.getModule().getCourse().getTitle().toLowerCase() : "";
        String quizTitle = quiz.getTitle() != null ? quiz.getTitle().toLowerCase() : "";

        if (courseTitle.contains("spring") || quizTitle.contains("spring") || quizTitle.contains("rest")) {
            addQuestion(quiz, "What is the primary purpose of Spring Boot Auto-Configuration?",
                    "It automatically configures beans based on dependencies present on the classpath",
                    "It replaces the JVM runtime environment",
                    "It compiles Java source files into native binaries",
                    "It encrypts all HTTP traffic automatically", "A");
            addQuestion(quiz, "Which HTTP method is idempotent and conventionally used to replace an entire resource in REST?",
                    "POST", "PUT", "PATCH", "DELETE", "B");
            addQuestion(quiz, "Which Spring annotation binds an incoming HTTP request body JSON payload directly to a Java DTO?",
                    "@RequestParam", "@PathVariable", "@RequestBody", "@ModelAttribute", "C");
            addQuestion(quiz, "What design pattern does Spring Dependency Injection primarily implement?",
                    "Inversion of Control (IoC)", "Singleton Pattern", "Observer Pattern", "Factory Method", "A");
        } else if (courseTitle.contains("react") || quizTitle.contains("react")) {
            addQuestion(quiz, "Which React hook is used to perform side effects like API requests and DOM mutations?",
                    "useState", "useEffect", "useContext", "useReducer", "B");
            addQuestion(quiz, "Why is the 'key' prop important when rendering lists of elements in React?",
                    "It styles the list items in CSS",
                    "It provides encryption for list item content",
                    "It helps React identify which items have changed, added, or removed during reconciliation",
                    "It prevents the browser from refreshing", "C");
            addQuestion(quiz, "What is a core principle regarding state updates in React components?",
                    "State should be modified directly via assignment",
                    "State is immutable and should be updated using setter functions",
                    "State updates must always be synchronous",
                    "State can only hold string primitive values", "B");
            addQuestion(quiz, "Which React hook returns a memoized value to avoid recalculating expensive computations on every render?",
                    "useMemo", "useCallback", "useRef", "useLayoutEffect", "A");
        } else if (courseTitle.contains("sql") || quizTitle.contains("sql") || courseTitle.contains("database")) {
            addQuestion(quiz, "Which SQL clause is used to filter records after aggregation with GROUP BY?",
                    "WHERE", "HAVING", "ORDER BY", "LIMIT", "B");
            addQuestion(quiz, "What type of JOIN returns all rows from the left table and matched rows from the right table?",
                    "INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN", "B");
            addQuestion(quiz, "Which database normalization form eliminates transitive functional dependencies?",
                    "First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form (BCNF)", "C");
            addQuestion(quiz, "Which ACID property guarantees that a transaction is completely applied or entirely rolled back?",
                    "Atomicity", "Consistency", "Isolation", "Durability", "A");
        } else if (courseTitle.contains("data structure") || courseTitle.contains("algorithm") || quizTitle.contains("array")) {
            addQuestion(quiz, "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
                    "O(1)", "O(n)", "O(log n)", "O(n log n)", "C");
            addQuestion(quiz, "Which data structure follows the Last-In, First-Out (LIFO) operational principle?",
                    "Queue", "Stack", "Linked List", "Priority Queue", "B");
            addQuestion(quiz, "What is the worst-case time complexity of the QuickSort algorithm?",
                    "O(n)", "O(n log n)", "O(n^2)", "O(2^n)", "C");
            addQuestion(quiz, "Which graph algorithm finds the shortest paths from a single source vertex to all other vertices with non-negative weights?",
                    "Dijkstra's Algorithm", "Kruskal's Algorithm", "Floyd-Warshall", "Prim's Algorithm", "A");
        } else if (courseTitle.contains("git") || quizTitle.contains("git")) {
            addQuestion(quiz, "Which Git command incorporates changes from a specified branch into the currently checked-out branch?",
                    "git branch", "git merge", "git fetch", "git rebase --abort", "B");
            addQuestion(quiz, "What is the primary function of 'git stash'?",
                    "Permanently deletes uncommitted work",
                    "Pushes local commits to the remote repository",
                    "Temporarily shelves uncommitted changes so you can switch branches cleanly",
                    "Creates a new release tag", "C");
            addQuestion(quiz, "Which command shows the project commit history in a concise single-line format?",
                    "git status", "git log --oneline", "git diff --stat", "git show --summary", "B");
            addQuestion(quiz, "What is the difference between 'git fetch' and 'git pull'?",
                    "'git fetch' downloads remote changes without merging, while 'git pull' fetches and merges",
                    "'git pull' only works on the main branch",
                    "They are identical aliases for the same operation",
                    "'git fetch' replaces the entire local working copy", "A");
        } else if (courseTitle.contains("microservice") || quizTitle.contains("microservice")) {
            addQuestion(quiz, "What is the primary architectural purpose of an API Gateway in microservices?",
                    "Directly hosting relational database tables",
                    "Providing a single entry point for routing, authentication, rate limiting, and SSL termination",
                    "Replacing all message queues in the system",
                    "Compiling frontend assets on the fly", "B");
            addQuestion(quiz, "Which pattern is widely used to manage distributed transactions across microservices without 2-phase commit?",
                    "Singleton Pattern", "Saga Pattern", "Proxy Pattern", "Decorator Pattern", "B");
            addQuestion(quiz, "What is the primary goal of the Circuit Breaker pattern (e.g. Resilience4j)?",
                    "To speed up database index generation",
                    "To prevent cascading failures across interconnected services when a downstream dependency fails",
                    "To enforce HTTPS encryption on all internal VPC sockets",
                    "To automatically scale Docker container memory", "B");
            addQuestion(quiz, "How do microservices decouple asynchronous inter-service communication?",
                    "Using event brokers such as Apache Kafka or RabbitMQ",
                    "Using shared global variables in JVM memory",
                    "Writing to shared synchronized text files",
                    "By polling a shared single MySQL database table", "A");
        } else if (courseTitle.contains("python") || quizTitle.contains("python")) {
            addQuestion(quiz, "Which Python built-in data type is immutable?",
                    "List", "Dictionary", "Tuple", "Set", "C");
            addQuestion(quiz, "What keyword is used to define an anonymous inline function in Python?",
                    "func", "lambda", "def", "inline", "B");
            addQuestion(quiz, "What does the '__init__' method represent in a Python class definition?",
                    "The class destructor",
                    "The object constructor called during instantiation",
                    "A static class utility method",
                    "An internal compiler directive", "B");
            addQuestion(quiz, "Which block is executed regardless of whether an exception occurred in a try-except block?",
                    "else", "finally", "catch", "ensure", "B");
        } else {
            addQuestion(quiz, "Which OOP principle allows a subclass to provide a specific implementation of a method defined in its parent class?",
                    "Encapsulation", "Method Overriding (Polymorphism)", "Method Overloading", "Data Hiding", "B");
            addQuestion(quiz, "What is the default initial capacity of an ArrayList in standard Java?",
                    "5", "10", "16", "32", "B");
            addQuestion(quiz, "Which interface must a class implement to participate in Java's try-with-resources statement?",
                    "Cloneable", "Serializable", "AutoCloseable", "Runnable", "C");
            addQuestion(quiz, "What effect does the 'final' keyword have when applied to a Java class?",
                    "The class cannot be instantiated",
                    "The class cannot be inherited or subclassed",
                    "All methods in the class become private",
                    "The class is executed asynchronously", "B");
        }
    }

    private void addQuestion(Quiz quiz, String text, String optA, String optB, String optC, String optD, String correct) {
        Question q = Question.builder()
                .quiz(quiz)
                .text(text)
                .optionA(optA)
                .optionB(optB)
                .optionC(optC)
                .optionD(optD)
                .correctOption(correct)
                .build();
        questionRepository.save(q);
    }

    private void createQuizSubmission(User student, Quiz quiz, int score, int total, boolean passed) {
        QuizSubmission qs = QuizSubmission.builder()
                .student(student)
                .quiz(quiz)
                .score(score)
                .totalQuestions(total)
                .passed(passed)
                .submittedAt(LocalDateTime.now().minusDays(3))
                .build();
        quizSubmissionRepository.save(qs);
    }

    private void createReview(User student, Course course, int rating, String text, String reply) {
        CourseReview r = CourseReview.builder()
                .student(student)
                .course(course)
                .rating(rating)
                .reviewText(text)
                .instructorReply(reply)
                .repliedAt(reply != null ? LocalDateTime.now().minusDays(1) : null)
                .createdAt(LocalDateTime.now().minusDays(4))
                .build();
        courseReviewRepository.save(r);
    }

    private void createNotification(User user, String title, String msg) {
        Notification n = Notification.builder()
                .user(user)
                .title(title)
                .message(msg)
                .isRead(false)
                .createdAt(LocalDateTime.now().minusHours(4))
                .build();
        notificationRepository.save(n);
    }

    private void seedEnrollmentsAndProgress(User student, String courseTitle, int targetProgressPercent) {
        Course course = courseRepository.findAll().stream()
                .filter(c -> c.getTitle().equals(courseTitle))
                .findFirst()
                .orElse(null);

        if (course == null) return;

        Enrollment e = new Enrollment();
        e.setStudent(student);
        e.setCourse(course);
        e.setProgressPercentage(targetProgressPercent);
        e.setEnrolledAt(LocalDateTime.now().minusDays(15));
        enrollmentRepository.save(e);

        if (targetProgressPercent > 0) {
            List<Lesson> allLessons = new ArrayList<>();
            List<Module> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(course.getId());
            for (Module m : modules) {
                allLessons.addAll(lessonRepository.findByModuleIdOrderByLessonOrderAsc(m.getId()));
            }

            if(allLessons.isEmpty()) return;

            int lessonsToComplete = (int) Math.round((targetProgressPercent / 100.0) * allLessons.size());

            for (int i = 0; i < lessonsToComplete; i++) {
                Lesson l = allLessons.get(i);
                LessonProgress lp = new LessonProgress();
                lp.setStudent(student);
                lp.setLesson(l);
                lp.setCompleted(true);
                lp.setCompletedAt(LocalDateTime.now().minusDays(14).plusHours(i));
                lessonProgressRepository.save(lp);
            }

            if (targetProgressPercent == 100) {
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

    private void cleanupDuplicateCoursesAndEnrollments() {
        try {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");

            // 1. Remove any disposable test courses
            jdbcTemplate.update("DELETE FROM courses WHERE LOWER(title) LIKE 'disposable course%'");

            // 2. Identify duplicate courses by title
            List<Map<String, Object>> dupTitles = jdbcTemplate.queryForList(
                "SELECT title, COUNT(*) as cnt FROM courses GROUP BY title HAVING COUNT(*) > 1"
            );

            for (Map<String, Object> row : dupTitles) {
                String title = (String) row.get("title");
                List<Map<String, Object>> courses = jdbcTemplate.queryForList(
                    "SELECT id FROM courses WHERE title = ? ORDER BY id ASC", title
                );
                if (courses.size() <= 1) continue;

                // Canonical course: prefer one with certificate or highest enrolled progress
                Long canonicalId = null;
                for (Map<String, Object> cRow : courses) {
                    Long cId = ((Number) cRow.get("id")).longValue();
                    Integer certCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM certificates WHERE course_id = ?", Integer.class, cId
                    );
                    if (certCount != null && certCount > 0) {
                        canonicalId = cId;
                        break;
                    }
                }
                if (canonicalId == null) {
                    canonicalId = ((Number) courses.get(0).get("id")).longValue();
                }

                for (Map<String, Object> cRow : courses) {
                    Long dupId = ((Number) cRow.get("id")).longValue();
                    if (dupId.equals(canonicalId)) continue;

                    // Move certificates to canonical course if student does not already have one
                    jdbcTemplate.update(
                        "UPDATE certificates SET course_id = ? WHERE course_id = ? AND student_id NOT IN (SELECT student_id FROM (SELECT student_id FROM certificates WHERE course_id = ?) as t)",
                        canonicalId, dupId, canonicalId
                    );
                    jdbcTemplate.update("DELETE FROM certificates WHERE course_id = ?", dupId);

                    // Move enrollments to canonical course if student is not already enrolled
                    jdbcTemplate.update(
                        "UPDATE enrollments SET course_id = ? WHERE course_id = ? AND student_id NOT IN (SELECT student_id FROM (SELECT student_id FROM enrollments WHERE course_id = ?) as t)",
                        canonicalId, dupId, canonicalId
                    );
                    jdbcTemplate.update("DELETE FROM enrollments WHERE course_id = ?", dupId);

                    // Delete reviews, wishlists, assignments for duplicate course
                    jdbcTemplate.update("DELETE FROM course_reviews WHERE course_id = ?", dupId);
                    jdbcTemplate.update("DELETE FROM wishlists WHERE course_id = ?", dupId);

                    jdbcTemplate.update("DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT id FROM (SELECT id FROM assignments WHERE course_id = ?) as t)", dupId);
                    jdbcTemplate.update("DELETE FROM assignments WHERE course_id = ?", dupId);

                    // Clean up modules and lessons
                    List<Map<String, Object>> modules = jdbcTemplate.queryForList("SELECT id FROM modules WHERE course_id = ?", dupId);
                    for (Map<String, Object> m : modules) {
                        Long mId = ((Number) m.get("id")).longValue();
                        List<Map<String, Object>> lessons = jdbcTemplate.queryForList("SELECT id FROM lessons WHERE module_id = ?", mId);
                        for (Map<String, Object> l : lessons) {
                            Long lId = ((Number) l.get("id")).longValue();
                            jdbcTemplate.update("DELETE FROM lesson_resources WHERE lesson_id = ?", lId);
                            jdbcTemplate.update("DELETE FROM quiz_questions WHERE lesson_id = ?", lId);
                            jdbcTemplate.update("DELETE FROM lesson_progress WHERE lesson_id = ?", lId);
                            jdbcTemplate.update("DELETE FROM lesson_notes WHERE lesson_id = ?", lId);
                            jdbcTemplate.update("DELETE FROM lesson_discussion_replies WHERE discussion_id IN (SELECT id FROM (SELECT id FROM lesson_discussions WHERE lesson_id = ?) as t)", lId);
                            jdbcTemplate.update("DELETE FROM lesson_discussions WHERE lesson_id = ?", lId);
                            jdbcTemplate.update("DELETE FROM lessons WHERE id = ?", lId);
                        }
                        jdbcTemplate.update("DELETE FROM quiz_submissions WHERE quiz_id IN (SELECT id FROM (SELECT id FROM quizzes WHERE module_id = ?) as t)", mId);
                        jdbcTemplate.update("DELETE FROM quizzes WHERE module_id = ?", mId);
                        jdbcTemplate.update("DELETE FROM modules WHERE id = ?", mId);
                    }

                    jdbcTemplate.update("DELETE FROM courses WHERE id = ?", dupId);
                }
            }

            // 3. Deduplicate student enrollments: retain single enrollment with maximum progress per student & course
            jdbcTemplate.execute(
                "DELETE e1 FROM enrollments e1 INNER JOIN enrollments e2 ON e1.student_id = e2.student_id AND e1.course_id = e2.course_id AND (e1.progress_percentage < e2.progress_percentage OR (e1.progress_percentage = e2.progress_percentage AND e1.id > e2.id))"
            );

            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
        } catch (Exception ex) {
            try { jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1"); } catch (Exception ignored) {}
            System.err.println("Notice: cleanupDuplicateCoursesAndEnrollments: " + ex.getMessage());
        }
    }
}
