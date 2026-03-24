<?php
session_start();
include '../includes/db.php';

if(!isset($_SESSION['user_id']) || $_SESSION['role']!='student'){
    header("Location: ../login.php");
    exit();
}

$student_id = $_SESSION['user_id'];
$course_id = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
$rating = isset($_POST['rating']) ? (int) $_POST['rating'] : 0;
$comment = isset($_POST['comment']) ? $_POST['comment'] : (($_POST['review'] ?? '') );
$comment = trim($comment);

if($course_id <= 0){
    die("Invalid course");
}
if($rating < 1 || $rating > 5){
    die("Invalid rating");
}
$comment = mb_substr($comment, 0, 2000);

// Prevent duplicate review
$check = $conn->prepare("SELECT id FROM reviews WHERE student_id=? AND course_id=?");
$check->bind_param("ii",$student_id,$course_id);
$check->execute();
$check->store_result();

if($check->num_rows==0){
    // Prefer `review` column, fallback to `comment` for older schema.
    $stmt = $conn->prepare("INSERT INTO reviews(student_id,course_id,rating,review) VALUES(?,?,?,?)");
    if($stmt){
        $stmt->bind_param("iiis",$student_id,$course_id,$rating,$comment);
        $stmt->execute();
    } else {
        $stmt2 = $conn->prepare("INSERT INTO reviews(student_id,course_id,rating,comment) VALUES(?,?,?,?)");
        if($stmt2){
            $stmt2->bind_param("iiis",$student_id,$course_id,$rating,$comment);
            $stmt2->execute();
        }
    }
}

header("Location: course_details.php?id=".$course_id);
exit();