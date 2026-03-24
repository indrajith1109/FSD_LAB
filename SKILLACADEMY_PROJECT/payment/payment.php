<?php
session_start();
include_once "../includes/db.php";

if(!isset($_SESSION['user_id'])){
    header("Location: ../login.php");
    exit();
}
if(!isset($_SESSION['role']) || $_SESSION['role'] !== 'student'){
    header("Location: ../login.php");
    exit();
}

$course_id = $_GET['course_id'];
$course_id = (int) $course_id;
if($course_id <= 0){
    die("Invalid course");
}

$stmt = $conn->prepare("SELECT * FROM courses WHERE id=?");
$stmt->bind_param("i",$course_id);
$stmt->execute();
$result = $stmt->get_result();
$course = $result->fetch_assoc();
if(!$course){
    die("Course not found");
}
?>

<!DOCTYPE html>
<html>
<head>
<title>Payment</title>
<link rel="stylesheet" href="../assets/css/style.css">
</head>

<body>

<div class="payment-container">

<h2>Course Payment</h2>

<h3><?php echo $course['title']; ?></h3>

<p>Price: ₹<?php echo $course['price']; ?></p>

<form action="process_payment.php" method="POST">

<input type="hidden" name="course_id" value="<?php echo $course['id']; ?>">

<label>Card Holder Name</label>
<input type="text" name="name" required>

<label>Card Number</label>
<input type="text" name="card" required>

<label>Expiry Date</label>
<input type="text" name="expiry" placeholder="MM/YY" required>

<label>CVV</label>
<input type="password" name="cvv" required>

<button type="submit" class="pay-btn">Pay Now</button>

</form>

</div>

</body>
</html>