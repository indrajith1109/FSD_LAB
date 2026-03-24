<?php
session_start();
include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.php");
    exit();
}
include '../includes/header.php';

$result = $conn->query("
SELECT courses.*, users.name AS instructor
FROM courses
JOIN users ON courses.instructor_id = users.id
");
?>

<section class="section">

<h2>All Courses</h2>

<table border="1" cellpadding="10">

<tr>
<th>Course</th>
<th>Instructor</th>
<th>Price</th>
<th>Action</th>
</tr>

<?php while($course=$result->fetch_assoc()){ ?>

<tr>

<td><?php echo $course['title']; ?></td>

<td><?php echo $course['instructor']; ?></td>

<td>₹<?php echo $course['price']; ?></td>

<td>

<a href="delete_course.php?id=<?php echo $course['id']; ?>">Delete</a>

</td>

</tr>

<?php } ?>

</table>

</section>

<?php include '../includes/footer.php'; ?>