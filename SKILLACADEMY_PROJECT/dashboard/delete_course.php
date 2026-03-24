<?php
session_start();
include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'instructor') {
    header("Location: ../login.php");
    exit();
}

$course_id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if($course_id <= 0){
    header("Location: instructor.php");
    exit();
}
$instructor_id = $_SESSION['user_id'];


// Step 1: delete enrollments related to this course
$stmt1 = $conn->prepare("DELETE FROM enrollments WHERE course_id=?");
$stmt1->bind_param("i", $course_id);
$stmt1->execute();


// Step 2: delete the course (only if owned by instructor)
$stmt2 = $conn->prepare("DELETE FROM courses WHERE id=? AND instructor_id=?");
$stmt2->bind_param("ii", $course_id, $instructor_id);
$stmt2->execute();


header("Location: instructor.php");
exit();
?>