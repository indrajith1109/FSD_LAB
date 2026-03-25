<?php
session_start();
if(!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'student'){
    header("Location: ../login.php");
    exit();
}
?>

<!DOCTYPE html>
<html>
<head>
<title>Payment Success</title>
<link rel="stylesheet" href="../assets/css/style.css">
</head>

<body>

<div class="success-box">

<h1>✅ Payment Successful</h1>

<p>Your course has been successfully enrolled.</p>

<a href="../dashboard/student.php">Go to My Courses</a>

</div>

</body>
</html>