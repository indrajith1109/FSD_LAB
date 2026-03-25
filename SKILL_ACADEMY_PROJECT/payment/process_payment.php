<?php
session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/mailer.php';

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
$check = $conn->prepare("SELECT COUNT(*) AS cnt FROM enrollments WHERE student_id=? AND course_id=?");
$check->bind_param("ii", $student_id, $course_id);
$check->execute();
$count_row = $check->get_result()->fetch_assoc();
$check->close();
$already_enrolled = $count_row && (int) $count_row['cnt'] > 0;

if (!$already_enrolled) {
    $stmt = $conn->prepare("INSERT INTO enrollments (student_id, course_id, progress, completed) VALUES (?, ?, 0, 0)");
    $stmt->bind_param("ii", $student_id, $course_id);
    $stmt->execute();
    $stmt->close();
}

// Load mail fields with simple queries (avoids multi-statement / JOIN edge cases on some mysqli builds).
$student_name = '';
$student_email = '';
$course_title = '';

$uq = $conn->prepare("SELECT name, email FROM users WHERE id=? LIMIT 1");
$uq->bind_param("i", $student_id);
$uq->execute();
$ur = $uq->get_result()->fetch_assoc();
$uq->close();
if ($ur) {
    $student_name = (string) $ur['name'];
    $student_email = trim((string) $ur['email']);
}

$cq = $conn->prepare("SELECT title FROM courses WHERE id=? LIMIT 1");
$cq->bind_param("i", $course_id);
$cq->execute();
$cr = $cq->get_result()->fetch_assoc();
$cq->close();
if ($cr) {
    $course_title = (string) $cr['title'];
}

if ($student_email !== '' && $course_title !== '') {
    $mail_subject = "Payment Successful - " . $course_title;
    $mail_message = "Hi " . $student_name . ",\n\n"
        . "Your payment was successful and you are now enrolled in:\n"
        . $course_title . "\n\n"
        . "You can access your course from your student dashboard.\n\n"
        . "Regards,\nSkill Academy";
    register_shutdown_function(function () use ($student_email, $mail_subject, $mail_message) {
        sa_send_mail($student_email, $mail_subject, $mail_message);
    });
}

session_write_close();
header("Location: success.php");
exit();
?>