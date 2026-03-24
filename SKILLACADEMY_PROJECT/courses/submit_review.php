<?php
session_start();
include "../includes/db.php";

if(!isset($_SESSION['user_id'])){
    die("Please login first");
}
if(isset($_SESSION['role']) && $_SESSION['role'] !== 'student'){
    header("Location: ../login.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$course_id = isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0;
$rating = isset($_POST['rating']) ? (int) $_POST['rating'] : 0;
$review = isset($_POST['review']) ? trim($_POST['review']) : '';

if($course_id <= 0){
    die("Invalid course");
}
if($rating < 1 || $rating > 5){
    die("Invalid rating");
}
$review = mb_substr($review, 0, 2000);

/* Insert Review */
$sql = "INSERT INTO reviews (course_id, student_id, rating, review)
        VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iiis", $course_id, $user_id, $rating, $review);

if($stmt->execute()){
    header("Location: course_details.php?id=".$course_id);
    exit();
}else{
    echo "Error submitting review";
}
?>