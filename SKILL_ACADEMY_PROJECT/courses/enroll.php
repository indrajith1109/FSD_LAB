<?php
session_start();
include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'student') {
    header("Location: ../login.php");
    exit();
}

$student_id = $_SESSION['user_id'];
$course_id = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
if($course_id <= 0){
    header("Location: ../courses/course_list.php");
    exit();
}

// Check duplicate enrollment
$check = $conn->prepare("SELECT id FROM enrollments WHERE student_id=? AND course_id=?");
$check->bind_param("ii", $student_id, $course_id);
$check->execute();
$check->store_result();

if ($check->num_rows == 0) {

    $stmt = $conn->prepare("INSERT INTO enrollments (student_id, course_id) VALUES (?,?)");
    $stmt->bind_param("ii", $student_id, $course_id);
    $stmt->execute();
}

header("Location: ../dashboard/student.php");
exit();