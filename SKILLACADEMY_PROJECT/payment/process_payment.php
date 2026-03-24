<?php
session_start();
include_once "../includes/db.php";

if(!isset($_SESSION['user_id'])){
    header("Location: ../login.php");
    exit();
}

$student_role = isset($_SESSION['role']) ? $_SESSION['role'] : '';
if($student_role !== 'student'){
    header("Location: ../login.php");
    exit();
}

$student_id = $_SESSION['user_id'];
$course_id = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
if($course_id <= 0){
    header("Location: payment.php");
    exit();
}

// Prevent duplicate enrollment.
$check = $conn->prepare("SELECT id FROM enrollments WHERE student_id=? AND course_id=?");
$check->bind_param("ii", $student_id, $course_id);
$check->execute();
$check->store_result();

if($check->num_rows == 0){
    $stmt = $conn->prepare("INSERT INTO enrollments (student_id, course_id, progress, completed) VALUES (?, ?, 0, 0)");
    $stmt->bind_param("ii", $student_id, $course_id);
    $stmt->execute();
}

header("Location: success.php");
exit();
?>