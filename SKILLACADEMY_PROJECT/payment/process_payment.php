<?php
session_start();
include_once "../includes/db.php";
include_once "../includes/mailer.php";

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

// Send enrollment/payment confirmation email.
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
    $subject = "Payment Successful - " . $data['course_title'];
    $message = "Hi " . $data['student_name'] . ",\n\n"
        . "Your payment was successful and you are now enrolled in:\n"
        . $data['course_title'] . "\n\n"
        . "You can access your course from your student dashboard.\n\n"
        . "Regards,\nSkill Academy";
    sa_send_mail($data['student_email'], $subject, $message);
}

header("Location: success.php");
exit();
?>