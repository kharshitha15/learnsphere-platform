export const courseImageMap = {
  "Spring Boot & REST API Development": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
  "Java Programming Fundamentals": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
  "React.js for Beginners": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
  "SQL & Database Management": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80",
  "Git & GitHub for Developers": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80",
  "Data Structures & Algorithms in Java": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
  "HTML, CSS & JavaScript": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
  "Python Programming Fundamentals": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
};

export const coursePreviewVideoMap = {
  "Spring Boot & REST API Development": "https://www.youtube.com/embed/9SGDpanrc8U",
  "Java Programming Fundamentals": "https://www.youtube.com/embed/eIrMbAQSU34",
  "React.js for Beginners": "https://www.youtube.com/embed/bMknfKXIFA8",
  "SQL & Database Management": "https://www.youtube.com/embed/HXV3zeQKqGY",
  "Git & GitHub for Developers": "https://www.youtube.com/embed/RGOj5yH7evk",
  "Data Structures & Algorithms in Java": "https://www.youtube.com/embed/8hly31xKli0",
  "HTML, CSS & JavaScript": "https://www.youtube.com/embed/G3e-cpL7ofc",
  "Python Programming Fundamentals": "https://www.youtube.com/embed/_uQrJ0TkZlc"
};

export const getCourseImage = (title) =>
  courseImageMap[title] || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80";
