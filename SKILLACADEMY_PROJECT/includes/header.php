<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Skill Academy</title>

<link rel="stylesheet" href="/skillacademy/assets/css/style.css">

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>

<body>

<nav class="navbar">

<div class="logo">
<a href="/skillacademy/index.php">Skill Academy</a>
</div>

<ul>

<li><a href="/skillacademy/index.php">Home</a></li>

<?php if(isset($_SESSION['user_id'])) { ?>

<li><a href="/skillacademy/courses/course_list.php">Courses</a></li>

<?php if($_SESSION['role']=="student"){ ?>
<li><a href="/skillacademy/dashboard/student.php">My Courses</a></li>
<?php } ?>

<?php if($_SESSION['role']=="instructor"){ ?>
<li><a href="/skillacademy/dashboard/instructor.php">Instructor</a></li>
<?php } ?>
<?php if($_SESSION['role']=="admin"){ ?>
<li><a href="/skillacademy/admin/dashboard.php">Admin</a></li>
<?php } ?>
<li><a href="/skillacademy/profile.php">Profile</a></li>

<li><a href="/skillacademy/logout.php">Logout</a></li>

<?php } else { ?>

<li><a href="/skillacademy/login.php">Login</a></li>
<li><a href="/skillacademy/register.php">Register</a></li>

<?php } ?>
</ul>

</nav>