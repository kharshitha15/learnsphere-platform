-- Update orphaned quizzes
UPDATE quizzes SET module_id = 1, title = 'Spring Boot & REST APIs Quiz', description = 'Test your understanding of Spring Boot auto-configuration, dependency injection, and REST controllers.', passing_percentage = 70 WHERE id = 1;
UPDATE quizzes SET module_id = 7, title = 'Java Foundations & Syntax Quiz', description = 'Assess your knowledge of Java fundamentals, JVM execution, types, and control flow.', passing_percentage = 70 WHERE id = 2;
UPDATE quizzes SET module_id = 34, title = 'DSA & Complexity Analysis Quiz', description = 'Test your mastery of Big-O notation, algorithm efficiency, and fundamental data structures.', passing_percentage = 70 WHERE id = 3;
UPDATE quizzes SET module_id = 13, title = 'React.js Core & JSX Quiz', description = 'Evaluate your grasp of React components, virtual DOM, JSX, and unidirectional data flow.', passing_percentage = 70 WHERE id = 4;

-- Insert additional quizzes for other courses if not present
INSERT INTO quizzes (id, module_id, title, description, passing_percentage)
VALUES 
  (7, 19, 'SQL Fundamentals & Relational Queries Quiz', 'Test your understanding of SELECT, WHERE, JOINs, GROUP BY, and normalization.', 70),
  (8, 24, 'Git Version Control & Branching Mastery Quiz', 'Test your knowledge of git commits, staging, branching, merging, and pull requests.', 70),
  (9, 39, 'Sorting & Searching Algorithms Quiz', 'Test your skills in Binary Search, QuickSort, MergeSort, and time complexity.', 70),
  (10, 40, 'HTML5 & Modern Web Foundations Quiz', 'Assess your knowledge of semantic HTML tags, forms, accessibility, and modern layouts.', 70),
  (11, 43, 'JavaScript ES6+ & Async Programming Quiz', 'Check your mastery of closures, arrow functions, promises, async/await, and event loops.', 70),
  (12, 45, 'Python Syntax & Data Structures Quiz', 'Test your understanding of Python types, lists, dictionaries, tuples, and functions.', 70),
  (13, 2, 'REST API Design & Controller Patterns Quiz', 'Test your knowledge of HTTP methods, status codes, @RestController, and DTO patterns.', 70),
  (14, 10, 'Java OOP Principles & Polymorphism Quiz', 'Test your knowledge of encapsulation, inheritance, polymorphism, and interfaces.', 70),
  (15, 16, 'React Hooks & State Management Quiz', 'Test your knowledge of useState, useEffect, useMemo, useCallback, and custom hooks.', 70)
ON DUPLICATE KEY UPDATE 
  module_id = VALUES(module_id),
  title = VALUES(title),
  description = VALUES(description),
  passing_percentage = VALUES(passing_percentage);

-- Delete existing questions for quizzes 1..15 to cleanly re-populate
DELETE FROM questions WHERE quiz_id IN (1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15);

-- Questions for Quiz 1: Spring Boot Fundamentals (module 1)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(1, 'Which annotation enables Spring Boot auto-configuration, component scanning, and property support in one go?', '@Configuration', '@SpringBootApplication', '@EnableAutoConfiguration', '@ComponentScan', 'B'),
(1, 'What is the default embedded HTTP server used by Spring Boot starter web?', 'Apache Tomcat', 'Jetty', 'Undertow', 'Netty', 'A'),
(1, 'Which file is the primary configuration file for Spring Boot applications by convention?', 'spring-config.xml', 'application.properties or application.yml', 'settings.gradle', 'web.xml', 'B'),
(1, 'Which Spring Boot starter dependency is required to build RESTful web services?', 'spring-boot-starter-data-jpa', 'spring-boot-starter-web', 'spring-boot-starter-security', 'spring-boot-starter-actuator', 'B'),
(1, 'What is the primary role of Inversion of Control (IoC) in the Spring Framework?', 'To manually instantiate database connections', 'To allow the Spring container to manage object lifecycles and dependencies', 'To compile Java code directly into native binaries', 'To route HTTP packets between load balancers', 'B');

-- Questions for Quiz 2: Java Foundations (module 7)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(2, 'What does the Java Virtual Machine (JVM) execute?', 'Java Source Code (.java)', 'Bytecode (.class)', 'C++ Machine Code', 'Assembly instructions directly', 'B'),
(2, 'Which of the following is NOT a primitive data type in Java?', 'int', 'boolean', 'String', 'double', 'C'),
(2, 'What is the size of an int data type in Java?', '16 bits', '32 bits', '64 bits', '8 bits', 'B'),
(2, 'What keyword is used to declare a constant variable in Java that cannot be reassigned?', 'const', 'immutable', 'final', 'static', 'C'),
(2, 'Which method is the main entry point for executing any standalone Java application?', 'public void start(String[] args)', 'public static void main(String[] args)', 'public int main()', 'static void run(String[] args)', 'B');

-- Questions for Quiz 3: DSA & Complexity Analysis (module 34)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(3, 'What is the time complexity of accessing an element in an array by its index in Java?', 'O(1) - Constant Time', 'O(n) - Linear Time', 'O(log n) - Logarithmic Time', 'O(n^2) - Quadratic Time', 'A'),
(3, 'What is the worst-case time complexity of Linear Search in an unsorted array of size n?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'C'),
(3, 'Which Big-O notation represents the fastest growing and least efficient time complexity among the following?', 'O(n log n)', 'O(n^2)', 'O(2^n)', 'O(log n)', 'C'),
(3, 'What is the primary characteristic of an in-place algorithm?', 'It requires O(n) auxiliary memory', 'It solves the problem with O(1) or minimal extra memory', 'It never modifies the input array', 'It only works with primitive integers', 'B'),
(3, 'What data structure operates on a Last-In, First-Out (LIFO) order?', 'Queue', 'Stack', 'LinkedList', 'Heap', 'B');

-- Questions for Quiz 4: React.js Core & JSX (module 13)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(4, 'What is JSX in React?', 'A JavaScript syntax extension allowing HTML-like tags inside JavaScript', 'A database query language for MongoDB', 'A CSS preprocessor for React styles', 'A server-side template engine like JSP', 'A'),
(4, 'How does data flow between parent and child components in standard React architecture?', 'Bidirectional two-way binding', 'Unidirectional top-down data flow via props', 'Random peer-to-peer event emission', 'Via global SQL triggers', 'B'),
(4, 'What is the role of the Virtual DOM in React?', 'To replace the browser engine entirely', 'To minimize expensive real DOM manipulations by batching and diffing updates', 'To execute database migrations in the browser', 'To store user passwords securely in memory', 'B'),
(4, 'Which hook is used to introduce and update state in a functional React component?', 'useEffect', 'useContext', 'useState', 'useReducer', 'C'),
(4, 'Why must React list items have a unique key prop?', 'To style each list item differently with CSS', 'To help React identify which items have changed, been added, or removed for efficient re-rendering', 'To sort the array in alphabetical order', 'To bind input forms to state automatically', 'B');

-- Questions for Quiz 7: SQL Fundamentals (module 19)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(7, 'Which SQL clause is used to filter records returned by a SELECT statement?', 'GROUP BY', 'WHERE', 'ORDER BY', 'HAVING', 'B'),
(7, 'Which type of JOIN returns all records from the left table and matched records from the right table?', 'INNER JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL JOIN', 'B'),
(7, 'What aggregate function in SQL calculates the total number of rows matching a condition?', 'SUM()', 'COUNT()', 'AVG()', 'TOTAL()', 'B'),
(7, 'Which constraint uniquely identifies each record in a relational database table?', 'FOREIGN KEY', 'PRIMARY KEY', 'CHECK', 'NOT NULL', 'B'),
(7, 'What SQL command is used to permanently remove a table and its schema from the database?', 'DELETE TABLE', 'TRUNCATE TABLE', 'DROP TABLE', 'REMOVE TABLE', 'C');

-- Questions for Quiz 8: Git Version Control (module 24)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(8, 'Which command moves modified files from the working directory to the staging area in Git?', 'git commit', 'git add', 'git push', 'git checkout', 'B'),
(8, 'What is the command to create and switch to a new branch named feature-auth in Git?', 'git branch feature-auth', 'git switch -c feature-auth (or git checkout -b feature-auth)', 'git merge feature-auth', 'git clone feature-auth', 'B'),
(8, 'What command shows the difference between the working directory and the staging area?', 'git status', 'git diff', 'git log', 'git remote -v', 'B'),
(8, 'Which command uploads local repository commits to a remote repository like GitHub?', 'git pull', 'git fetch', 'git push', 'git rebase', 'C'),
(8, 'What does git pull do under the hood?', 'Runs git fetch followed by git merge', 'Deletes unstaged local changes', 'Uploads local commits to the server', 'Creates a new branch on the remote server', 'A');

-- Questions for Quiz 9: Sorting & Searching Algorithms (module 39)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(9, 'What precondition must be met before executing Binary Search on an array?', 'The array must be empty', 'The array must be sorted in order', 'The array must contain only positive integers', 'The array size must be a power of two', 'B'),
(9, 'What is the worst-case time complexity of MergeSort?', 'O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)', 'B'),
(9, 'Which sorting algorithm selects a pivot element and partitions array elements around it?', 'MergeSort', 'InsertionSort', 'QuickSort', 'BubbleSort', 'C'),
(9, 'What is the average time complexity of Binary Search on a sorted array of size n?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'B'),
(9, 'Which of the following sorting algorithms is stable and has O(n) best-case time complexity when already sorted?', 'QuickSort', 'HeapSort', 'InsertionSort', 'SelectionSort', 'C');

-- Questions for Quiz 10: HTML5 Foundations (module 40)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(10, 'Which HTML5 semantic tag represents the main navigation menu of a web page?', '<menu>', '<nav>', '<section>', '<header>', 'B'),
(10, 'Which attribute in the <img> tag specifies alternative text for screen readers and search engines?', 'title', 'alt', 'caption', 'href', 'B'),
(10, 'What is the purpose of the <!DOCTYPE html> declaration at the top of an HTML document?', 'To link external CSS files', 'To tell the browser to render the page in standard HTML5 mode', 'To load modern JavaScript modules', 'To configure server CORS headers', 'B'),
(10, 'Which input type in HTML5 provides built-in email validation in the browser?', '<input type="mail">', '<input type="email">', '<input type="validate-email">', '<input type="text" validate="true">', 'B'),
(10, 'Which tag is used to embed external CSS style sheets into an HTML document?', '<script>', '<link rel="stylesheet">', '<style src="...">', '<css>', 'B');

-- Questions for Quiz 11: JavaScript ES6+ & Async (module 43)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(11, 'Which keyword in modern JavaScript declares a block-scoped variable that cannot be reassigned?', 'var', 'let', 'const', 'static', 'C'),
(11, 'What is the output of typeof null in JavaScript?', 'null', 'undefined', 'object', 'number', 'C'),
(11, 'What does the spread operator (...) do when applied to an array in JavaScript?', 'Calculates the average of all numbers', 'Expands the elements of the iterable into individual items', 'Encodes the array into a Base64 string', 'Filters out null and undefined values', 'B'),
(11, 'Which keyword allows writing asynchronous promise-based code in a synchronous, readable fashion?', 'yield', 'async / await', 'defer', 'spawn', 'B'),
(11, 'What is a closure in JavaScript?', 'A method to terminate the browser event loop', 'A function bundled together with references to its surrounding lexical state (scope)', 'An error handler that catches uncaught exceptions', 'A syntax for closing HTML tags in JSX', 'B');

-- Questions for Quiz 12: Python Syntax & Data Structures (module 45)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(12, 'Which of the following built-in Python data types is immutable?', 'List [1, 2, 3]', 'Dictionary {"a": 1}', 'Tuple (1, 2, 3)', 'Set {1, 2, 3}', 'C'),
(12, 'How do you define a function in Python?', 'function myFunc():', 'def my_func():', 'func myFunc():', 'void myFunc():', 'B'),
(12, 'What keyword is used to handle exceptions in Python?', 'catch', 'except', 'rescue', 'handle', 'B'),
(12, 'What is the result of len("LearnSphere") in Python?', '10', '11', '12', '9', 'B'),
(12, 'Which method adds an element to the end of an existing Python list?', 'push()', 'insertEnd()', 'append()', 'add()', 'C');

-- Questions for Quiz 13: REST API Design & Controllers (module 2)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(13, 'Which HTTP method should be used to create a new resource on a RESTful server?', 'GET', 'POST', 'PUT', 'DELETE', 'B'),
(13, 'What HTTP status code represents 201 Created?', '200 OK', '201 Created', '204 No Content', '301 Moved', 'B'),
(13, 'In Spring MVC, which annotation extracts data from the URI path, such as /courses/{id}?', '@RequestParam', '@PathVariable', '@RequestBody', '@RequestHeader', 'B'),
(13, 'What is the main difference between @Controller and @RestController in Spring Boot?', '@RestController automatically serializes returned objects into JSON using @ResponseBody', '@Controller only works with XML', '@RestController can only handle GET requests', '@Controller does not support dependency injection', 'A'),
(13, 'Which HTTP status code should be returned when a requested resource is not found?', '400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found', 'D');

-- Questions for Quiz 14: Java OOP Principles (module 10)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(14, 'What OOP pillar is achieved by making class fields private and providing public getters and setters?', 'Inheritance', 'Encapsulation', 'Polymorphism', 'Abstraction', 'B'),
(14, 'Which keyword allows a Java subclass to inherit properties and methods from a superclass?', 'implements', 'extends', 'inherits', 'super', 'B'),
(14, 'What is method overriding in Java?', 'Defining methods with the same name but different parameters in the same class', 'Redefining a superclass method in a subclass with the same signature and return type', 'Calling a method recursively until a base condition is met', 'Hiding static variables across packages', 'B'),
(14, 'Can an abstract class in Java have concrete methods with method bodies?', 'No, abstract classes can only have abstract methods', 'Yes, abstract classes can contain both abstract and fully implemented concrete methods', 'Only if the class is marked static', 'Only in Java versions prior to Java 8', 'B'),
(14, 'What does the super keyword refer to in Java?', 'The current instance of the class', 'The immediate parent or superclass instance', 'The JVM root garbage collector', 'The main thread of execution', 'B');

-- Questions for Quiz 15: React Hooks & State (module 16)
INSERT INTO questions (quiz_id, text, optiona, optionb, optionc, optiond, correct_option) VALUES
(15, 'What is the primary purpose of the useEffect hook in React?', 'To declare mutable local component variables', 'To perform side effects such as data fetching, subscriptions, and DOM updates', 'To memoize expensive mathematical calculations', 'To render fallback error boundaries', 'B'),
(15, 'When does useEffect(fn, []) with an empty dependency array execute?', 'On every single re-render of the component', 'Only once when the component mounts', 'Only when the component is unmounted', 'Every time state changes in the parent component', 'B'),
(15, 'Which hook should you use to memoize a computationally expensive calculation so it is not recomputed on every render?', 'useCallback', 'useMemo', 'useRef', 'useReducer', 'B'),
(15, 'What hook returns a persistent mutable object whose .current property holds a value without causing a re-render?', 'useState', 'useRef', 'useContext', 'useId', 'B'),
(15, 'What are the two foundational Rules of Hooks in React?', 'Hooks can be called in loops and inside nested JS functions', 'Only call hooks at the top level of React functions, and only call hooks from React function components or custom hooks', 'Hooks must always take at least two arguments', 'Hooks can only be used in class components', 'B');
