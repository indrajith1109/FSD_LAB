<?php
session_start();

include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.php");
    exit();
}

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id > 0) {
    // Remove related enrollments first to avoid FK constraint failures.
    $stmt_enroll = $conn->prepare("DELETE FROM enrollments WHERE course_id=?");
    $stmt_enroll->bind_param("i", $id);
    $stmt_enroll->execute();

    $stmt = $conn->prepare("DELETE FROM courses WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
}

header("Location: courses.php");
exit();

?>