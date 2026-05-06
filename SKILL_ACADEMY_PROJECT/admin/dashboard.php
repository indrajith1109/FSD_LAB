<?php
session_start();
include '../includes/db.php';

if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin'){
    header("Location: ../login.php");
    exit();
}
include '../includes/header.php';

/* COUNT USERS */

$user_count = $conn->query("SELECT COUNT(*) AS total FROM users")->fetch_assoc()['total'];

/* COUNT COURSES */

$course_count = $conn->query("SELECT COUNT(*) AS total FROM courses")->fetch_assoc()['total'];

/* COUNT ENROLLMENTS */

$enroll_count = $conn->query("SELECT COUNT(*) AS total FROM enrollments")->fetch_assoc()['total'];
?>

<section class="section">

<h2>Admin Dashboard</h2>

<div class="course-grid">

<div class="course-card">
<h3>Total Users</h3>
<p><?php echo $user_count; ?></p>
</div>

<div class="course-card">
<h3>Total Courses</h3>
<p><?php echo $course_count; ?></p>
</div>

<div class="course-card">
<h3>Total Enrollments</h3>
<p><?php echo $enroll_count; ?></p>
</div>

</div>

<div style="margin-top:24px;">
    <a class="btn" href="users.php">Manage User Roles</a>
</div>

</section>

<?php include '../includes/footer.php'; ?>