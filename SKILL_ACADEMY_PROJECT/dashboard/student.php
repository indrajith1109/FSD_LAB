<?php
session_start();
include '../includes/db.php';

if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'student'){
    header("Location: ../login.php");
    exit();
}
include '../includes/header.php';

$student_id = $_SESSION['user_id'];

/* GET STUDENT NAME */
$user_query = $conn->prepare("SELECT name FROM users WHERE id=?");
$user_query->bind_param("i",$student_id);
$user_query->execute();
$user_result = $user_query->get_result();
$user = $user_result->fetch_assoc();
$name = $user['name'];

/* GET ENROLLED COURSES */
$query = $conn->prepare("
SELECT courses.*, enrollments.progress
FROM enrollments
JOIN courses ON enrollments.course_id = courses.id
WHERE enrollments.student_id = ?
");

$query->bind_param("i",$student_id);
$query->execute();
$result = $query->get_result();
?>

<section class="section">

<h2>Welcome, <?php echo $name; ?> 👋</h2>

<h3 style="margin-top:30px;">My Enrolled Courses</h3>

<div class="course-grid">

<?php
while($course = $result->fetch_assoc()){

$progress = isset($course['progress']) ? $course['progress'] : 0;
?>

<div class="course-card">

<?php
    $candidate = !empty($course['thumbnail']) ? $course['thumbnail']
        : (!empty($course['image']) ? $course['image']
        : (!empty($course['images']) ? $course['images'] : ''));
    $candidate = basename($candidate);
    $img = (!empty($candidate) && file_exists("../assets/images/" . $candidate)) ? $candidate : "default.png";
?>
<img src="../assets/images/<?php echo $img; ?>">

<h3><?php echo $course['title']; ?></h3>

<p>₹<?php echo $course['price']; ?></p>

<!-- Progress Bar -->

<div style="background:#eee;border-radius:6px;height:8px;margin:10px 0;">
<div style="background:#2563eb;width:<?php echo $progress; ?>%;height:8px;border-radius:6px;"></div>
</div>

<p><?php echo $progress; ?>% Completed</p>

<?php if($progress < 100){ ?>

<form method="POST" action="complete_course.php">

<input type="hidden" name="course_id" value="<?php echo $course['id']; ?>">

<button class="btn">Mark as Completed</button>

</form>

<?php } else { ?>

<a class="btn" href="certificate.php?course_id=<?php echo $course['id']; ?>">
Download Certificate
</a>

<?php } ?>

</div>

<?php } ?>

</div>

</section>

<?php include '../includes/footer.php'; ?>