<?php

session_start();
include '../includes/db.php';
include '../includes/mailer.php';

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
WHERE student_id=? AND course_id=? AND progress < 100
");

$query->bind_param("ii",$student_id,$course_id);
$query->execute();

if ($query->affected_rows > 0) {
    $info = $conn->prepare("
    SELECT u.name AS student_name, u.email AS student_email, c.title AS course_title
    FROM users u
    JOIN courses c ON c.id = ?
    WHERE u.id = ?
    ");
    $info->bind_param("ii", $course_id, $student_id);
    $info->execute();
    $data = $info->get_result()->fetch_assoc();

    if ($data && !empty($data['student_email'])) {
        $subject = "Course Completed - " . $data['course_title'];
        $message = "Hi " . $data['student_name'] . ",\n\n"
            . "Congratulations! You have successfully completed:\n"
            . $data['course_title'] . "\n\n"
            . "Your certificate is now available in your dashboard.\n\n"
            . "Regards,\nSkill Academy";
        sa_send_mail($data['student_email'], $subject, $message);
    }
}

header("Location: student.php");
exit();

?>