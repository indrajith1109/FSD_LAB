<?php
session_start();
include 'includes/db.php';

if(!isset($_SESSION['user_id'])){
header("Location: login.php");
exit();
}
include 'includes/header.php';

$user_id = $_SESSION['user_id'];

/* GET USER DETAILS */

$stmt = $conn->prepare("SELECT * FROM users WHERE id=?");
$stmt->bind_param("i",$user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

?>

<section class="section">

<h2>My Profile</h2>

<div class="profile-container">

<div class="profile-card">

<!-- PROFILE IMAGE -->

<div class="profile-image">

<?php
$image = !empty($user['profile_image']) ? $user['profile_image'] : "default.png";
?>

<img src="assets/profile/<?php echo $image; ?>">

</div>

<!-- USER INFO -->

<div class="profile-info">

<p><strong>Name:</strong> <?php echo $user['name']; ?></p>

<p><strong>Email:</strong> <?php echo $user['email']; ?></p>

<p><strong>Role:</strong> <?php echo ucfirst($user['role']); ?></p>

<p><strong>Phone:</strong> <?php echo $user['phone']; ?></p>

<p><strong>Date of Birth:</strong> <?php echo $user['dob']; ?></p>

<p><strong>Gender:</strong> <?php echo $user['gender']; ?></p>


<!-- COMPLETED COURSES -->

<?php

$stmt = $conn->prepare("
SELECT courses.title
FROM enrollments
JOIN courses ON enrollments.course_id = courses.id
WHERE enrollments.student_id = ?
");

$stmt->bind_param("i",$user_id);
$stmt->execute();
$result = $stmt->get_result();

?>

<p><strong>Completed Courses:</strong></p>

<ul>

<?php

if($result->num_rows > 0){

while($course = $result->fetch_assoc()){

echo "<li>".$course['title']."</li>";

}

}else{

echo "<li>No completed courses yet</li>";

}

?>

</ul>

<br>

<a href="edit_profile.php" class="btn">Edit Profile</a>

</div>

</div>

</div>

</section>

<?php include 'includes/footer.php'; ?>