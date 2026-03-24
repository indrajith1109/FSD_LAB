<?php
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'instructor') {
    header("Location: ../login.php");
    exit();
}

include '../includes/header.php';
include '../includes/db.php';

$instructor_id = $_SESSION['user_id'];

$query = $conn->prepare("SELECT * FROM courses WHERE instructor_id=?");
$query->bind_param("i", $instructor_id);
$query->execute();
$result = $query->get_result();
?>

<div class="courses-container">

<h2>Welcome, <?php echo $_SESSION['user_name']; ?> 👨‍🏫</h2>

<br>

<a href="add_course.php" class="btn">Add New Course</a>

<h3 style="margin-top:40px;">My Courses</h3>

<div class="course-grid">

<?php
if($result->num_rows == 0){
    echo "<p>You have not created any courses yet.</p>";
}
?>

<?php while($course = $result->fetch_assoc()) { ?>

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

<a href="delete_course.php?id=<?php echo $course['id']; ?>" 
class="btn" 
style="background:#ef4444;color:white;">
Delete Course
</a>

</div>

<?php } ?>

</div>

</div>

<?php include '../includes/footer.php'; ?>