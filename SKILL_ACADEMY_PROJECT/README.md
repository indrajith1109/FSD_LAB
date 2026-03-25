📚 Full-Stack Skill Learning Academy Marketplace with Secure Authentication

This project is a full-stack web application developed using PHP, MySQL, HTML, CSS, and JavaScript, designed to simulate an online learning platform similar to Skill Academy.

🚀 Features Implemented

- 🔐 User Authentication System
  
  - Secure login and registration for students and instructors
  - Role-based access (Admin / Student)

- 📖 Course Management
  
  - Admin can add, view, and manage courses
  - Course details include title, price, instructor, and image
  - Image upload functionality with default fallback support

- 🖼️ Dynamic Course Display
  
  - Courses are fetched from the database and displayed dynamically
  - Handles missing images using a default placeholder
  - Responsive UI with card-based layout

- 💳 Enrollment & Payment Flow
  
  - Students can enroll in courses
  - Simulated payment system
  - On successful payment → course enrollment is stored in database

- ⭐ Review System
  
  - Students can submit reviews for courses
  - Reviews are stored and displayed using JOIN queries
  - Includes student name and feedback

- 📊 Student Dashboard
  
  - View enrolled courses
  - Track course completion status
  - Download certificates for completed courses

---

🛠️ Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: PHP
- Database: MySQL (phpMyAdmin)
- Server: XAMPP

---

⚙️ Key Functionalities

- File upload handling using "$_FILES"
- Secure database operations using prepared statements
- Dynamic image rendering with fallback logic
- Relational database design (users, courses, enrollments, reviews)
- Session management for authentication

---

📌 Key Learning Outcomes

- Full-stack development using PHP & MySQL
- Handling real-world issues like missing data and file paths
- Debugging database errors and fixing SQL queries
- Building a complete end-to-end web application

---

📷 Note

- Course images are stored in "/assets/images/"
- Default image ("default.png") is used when no image is uploaded
- Ensure proper file permissions for image upload functionality

---

💡 Future Enhancements

- Payment gateway integration (Razorpay / Stripe)
- Star rating system for reviews
- Instructor dashboard improvements
- Search & filter optimization
- UI/UX enhancements

---

👨‍💻 Developed By

M INDRAJITH
