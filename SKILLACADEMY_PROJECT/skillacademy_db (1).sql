-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 24, 2026 at 04:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillacademy_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image` varchar(255) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `description`, `price`, `thumbnail`, `instructor_id`, `created_at`, `image`, `created_by`) VALUES
(44, 'JAVA', 'This course provides a comprehensive introduction to Java programming, covering both basic and advanced concepts.\r\nStudents will learn object-oriented programming concepts such as classes, objects, inheritance, polymorphism, and encapsulation.\r\nThe course includes hands-on coding exercises to build real-world applications.\r\nTopics like exception handling, file handling, and database connectivity are also covered.\r\nHelps learners develop strong problem-solving and programming skills.\r\nSuitable for beginners as well as intermediate learners.', 999.00, '1774285708_java.png', 3, '2026-03-23 17:08:28', NULL, 'jith'),
(45, 'PYTHON', 'This course introduces Python programming from basic to advanced levels.\r\nCovers fundamental concepts like variables, data types, loops, and functions.\r\nExplains object-oriented programming and file handling in Python.\r\nIncludes real-world applications such as data analysis and automation.\r\nHelps improve problem-solving and logical thinking skills.\r\nSuitable for beginners and intermediate learners.', 1999.00, '1774285776_PYTHON.png', 3, '2026-03-23 17:09:36', NULL, 'jith'),
(46, 'REACT', 'This course introduces React for building modern and dynamic web applications.\r\nCovers core concepts like components, props, state, and hooks.\r\nTeaches how to create reusable UI components and manage application state.\r\nIncludes hands-on projects to build responsive and interactive user interfaces.\r\nExplains integration with APIs and frontend optimization techniques.\r\nSuitable for beginners with basic knowledge of HTML, CSS, and JavaScript.', 599.00, '1774285829_react.png', 3, '2026-03-23 17:10:29', NULL, 'jith'),
(47, 'JAVA SCRIPT', 'This course introduces JavaScript for building interactive and dynamic web pages.\r\nCovers core concepts like variables, functions, events, and DOM manipulation.\r\nTeaches how to handle user input and create responsive UI behavior.\r\nIncludes practical examples and mini-projects for real-world applications.\r\nExplains asynchronous programming using callbacks, promises, and async/await.\r\nSuitable for beginners with basic knowledge of HTML and CSS.', 799.00, '1774285886_js.png', 3, '2026-03-23 17:11:26', NULL, 'jith'),
(48, 'ARTIFICIAL INTELLIGENCE', 'This course introduces the fundamentals of Artificial Intelligence and its real-world applications.\r\nCovers key concepts like machine learning, neural networks, and data processing.\r\nExplains how AI systems learn from data and make intelligent decisions.\r\nIncludes basic algorithms and hands-on examples for practical understanding.\r\nHighlights applications in areas like healthcare, automation, and recommendation systems.\r\nSuitable for beginners with basic programming knowledge.', 999.00, '1774286027_ai.png', 3, '2026-03-23 17:13:47', NULL, 'jith'),
(49, 'WEB DEVELOPMENT', 'This course introduces the fundamentals of building websites and web applications.\r\nCovers frontend technologies like HTML, CSS, and JavaScript.\r\nExplains backend basics and how websites interact with databases.\r\nTeaches how to design responsive and user-friendly web pages.\r\nIncludes hands-on projects to build real-world websites.\r\nSuitable for beginners who want to become full-stack developers.', 1499.00, '1774286422_web development.png', 3, '2026-03-23 17:20:22', NULL, 'jith'),
(50, 'MACHINE LEARNING', 'This course introduces the fundamentals of machine learning and data-driven decision making.\r\nCovers key concepts like supervised and unsupervised learning algorithms.\r\nExplains techniques such as regression, classification, and clustering.\r\nTeaches how to train models using real-world datasets.\r\nIncludes hands-on projects for practical implementation.\r\nSuitable for beginners with basic programming and mathematics knowledge.', 1999.00, '1774286491_ml.png', 3, '2026-03-23 17:21:31', NULL, 'jith'),
(51, 'DATA STRUCTURE', 'This course introduces fundamental data structures used in programming.\r\nCovers concepts like arrays, linked lists, stacks, queues, trees, and graphs.\r\nExplains how to store, organize, and manage data efficiently.\r\nTeaches algorithms for searching, sorting, and optimization.\r\nImproves problem-solving and coding skills for technical interviews.\r\nSuitable for beginners with basic programming knowledge.', 899.00, '1774286575_ds.png', 3, '2026-03-23 17:22:55', NULL, 'jith'),
(52, 'DevOps', 'This course introduces DevOps practices for continuous development and deployment.\r\nCovers tools like Git, Docker, Jenkins, and CI/CD pipelines.\r\nExplains automation of build, testing, and deployment processes.\r\nTeaches infrastructure management and cloud basics.\r\nIncludes real-world workflows for faster and reliable software delivery.\r\nSuitable for beginners with basic programming and system knowledge', 1799.00, '1774286630_devops.png', 3, '2026-03-23 17:23:50', NULL, 'jith'),
(53, 'CLOUD COMPUTING COURSE', 'This course introduces the fundamentals of cloud computing and its service models.\r\nCovers concepts like IaaS, PaaS, and SaaS.\r\nExplains cloud platforms such as AWS, Azure, and Google Cloud.\r\nTeaches deployment, storage, and virtualization in cloud environments.\r\nIncludes real-world applications and basic cloud security practices.\r\nSuitable for beginners with basic knowledge of networking and computing.', 999.00, '1774286730_cc.png', 3, '2026-03-23 17:25:30', NULL, 'jith');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `progress` int(11) DEFAULT 0,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `student_id`, `course_id`, `progress`, `enrolled_at`, `completed`) VALUES
(24, 5, 44, 100, '2026-03-23 17:29:43', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `review` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `course_id`, `student_id`, `rating`, `review`, `created_at`) VALUES
(8, 33, 5, 5, 'wefhh', '2026-03-23 04:45:03'),
(9, 44, 5, 4, 'WSDFGHNJM,', '2026-03-23 17:30:03');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','instructor','admin') DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `phone`, `dob`, `gender`, `course`, `profile_image`) VALUES
(3, 'TEACHER 1', 'indrajithmehanathan@gmail.com', '$2y$10$jynUDLyR6kBrlTW4fMNrtOt6UzfzEnM7xNxrXIPZStRRqW8QUq4Fq', 'instructor', '2026-03-03 14:45:45', '7904664751', '2026-03-05', 'Male', NULL, '1774286900_T1.png'),
(5, 'STUDENT 1', 'vtu24668@veltech.edu.in', '$2y$10$KDC1ZcWXB.5qhOO4SGTlue8FxuQmU65zSueywS2SVkJFag1PdyKqm', 'student', '2026-03-05 03:49:17', '6369798579', '2005-10-13', 'Male', NULL, '1772724108_1772721907_kis.png'),
(6, 'vj', 'vj@gmail.com', '$2y$10$bIhau6aDHpNUN/EesSeV5uQg1aB0Xv12jh52WqYsxzsD3XPfkm5y.', 'admin', '2026-03-05 07:44:55', NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
