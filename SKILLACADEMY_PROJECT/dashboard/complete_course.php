<?php

session_start();
include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'student') {
    header("Location: ../login.php");
    exit();
}

$course_id = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
$student_id = $_SESSION['user_id'];

if ($course_id <= 0) {
    header("Location: student.php");
    exit();
}

$query = $conn->prepare("
UPDATE enrollments
SET progress = 100
WHERE student_id=? AND course_id=?
");

$query->bind_param("ii",$student_id,$course_id);
$query->execute();

header("Location: student.php");
exit();

?>