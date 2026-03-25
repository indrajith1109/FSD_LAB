<?php

session_start();
include '../includes/db.php';

$course_id = isset($_GET['course_id']) ? (int) $_GET['course_id'] : 0;
$student_id = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

if(!$student_id || empty($_SESSION['role']) || $_SESSION['role'] !== 'student'){
    header("Location: ../login.php");
    exit();
}
if($course_id <= 0){
    die("Course not found");
}
$student_id = $_SESSION['user_id'];

$query = $conn->prepare("
SELECT users.name, courses.title
FROM enrollments
JOIN users ON enrollments.student_id = users.id
JOIN courses ON enrollments.course_id = courses.id
WHERE users.id=? AND courses.id=?
");

$query->bind_param("ii",$student_id,$course_id);
$query->execute();

$result = $query->get_result();
$data = $result->fetch_assoc();
if(!$data){
    die("Certificate not available");
}

?>

<html>

<head>

<title>Certificate</title>

<style>

body{
text-align:center;
font-family:Poppins;
background:#f4f6fb;
}

.certificate{
width:800px;
margin:100px auto;
padding:60px;
background:white;
border:10px solid #2563eb;
}

h1{
font-size:40px;
}

</style>

</head>

<body>

<div class="certificate">

<h1>Certificate of Completion</h1>

<p>This certifies that</p>

<h2><?php echo $data['name']; ?></h2>

<p>has successfully completed</p>

<h2><?php echo $data['title']; ?></h2>

<p>Skill Academy</p>

</div>

</body>

</html>