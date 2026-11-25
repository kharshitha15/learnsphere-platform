# LearnSphere – Intelligent E-Learning Management System

![LearnSphere](https://via.placeholder.com/800x200?text=LearnSphere+-+Modern+E-Learning)

**LearnSphere** is a professional, modern educational SaaS platform built for universities and instructors to seamlessly manage the learning lifecycle. It connects Students, Instructors, and Administrators in a unified, intelligent environment.

## 🚀 Features

*   **Role-Based Access Control:** Secure JWT authentication for Students, Instructors, and Admins.
*   **Course Marketplace:** Discover, search, and filter courses by category and difficulty.
*   **Intelligent Learning Player:** Track progress precisely across modules and lessons.
*   **Assessments:** Built-in quiz module with automatic grading and assignment submissions.
*   **Analytics Dashboard:** Visual representation of student progress, quiz scores, and course completion rates.
*   **Automated Certification:** Unique certificate generation upon 100% course and assessment completion.
*   **AI Learning Assistant:** Integrated AI service to explain complex concepts and generate study plans.

## 🛠 Technology Stack

*   **Frontend:** React.js, React Router, Axios, Tailwind CSS, Vite
*   **Backend:** Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Hibernate
*   **Database:** MySQL
*   **Security:** BCrypt Password Hashing, JWT (JSON Web Tokens)

## 🏗 Architecture

The system utilizes a clean, normalized Monolithic REST architecture:
`React Frontend (UI)` ↔ `REST API (JSON)` ↔ `Spring Boot Controllers` ↔ `Services (Business Logic)` ↔ `Repositories (JPA)` ↔ `MySQL Database`

### Database Entities
*   `Users` / `Roles`
*   `Courses` / `Modules` / `Lessons`
*   `Enrollments` / `Progress`
*   `Quizzes` / `Assignments` / `Certificates`

## ⚙️ Setup Instructions

### Prerequisites
*   Java 21+
*   Node.js 18+
*   MySQL 8.0+

### 1. Database Configuration
1. Open MySQL and execute: `CREATE DATABASE learnsphere;`
2. Update the credentials in `learnsphere-backend/src/main/resources/application.properties` if they differ from `root`/`root`.

### 2. Running the Backend (Spring Boot)
```bash
cd learnsphere-backend
./mvnw clean install
./mvnw spring-boot:run
```
*The backend runs on `http://localhost:8080`. Hibernate will automatically execute DDL to generate the required database tables.*

### 3. Running the Frontend (React)
```bash
cd learnsphere-frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5173` (or the port specified by Vite).*

## 🌟 Future Enhancements
*   Payment Gateway integration for paid courses.
*   Live video streaming capabilities.
*   Advanced peer-review system for assignments.

---
*Developed as a capstone MCA software development project.*
