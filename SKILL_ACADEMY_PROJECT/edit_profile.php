<?php
session_start();
include 'includes/db.php';

if(!isset($_SESSION['user_id'])){
header("Location: login.php");
exit();
}
include 'includes/header.php';

$user_id = $_SESSION['user_id'];

/* GET USER DATA */

$stmt = $conn->prepare("SELECT * FROM users WHERE id=?");
$stmt->bind_param("i",$user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();


/* UPDATE PROFILE */

if(isset($_POST['update'])){

$name = $_POST['name'];
$phone = $_POST['phone'];
$dob = $_POST['dob'];
$gender = $_POST['gender'];

$image_name = $user['profile_image'];

if(!empty($_FILES['profile_image']['name'])){

$filename = time()."_".$_FILES['profile_image']['name'];
$target = "assets/profile/".$filename;

move_uploaded_file($_FILES['profile_image']['tmp_name'],$target);

$image_name = $filename;

}

$update = $conn->prepare("
UPDATE users 
SET name=?, phone=?, dob=?, gender=?, profile_image=?
WHERE id=?
");

$update->bind_param("sssssi",$name,$phone,$dob,$gender,$image_name,$user_id);
$update->execute();

header("Location: profile.php");
exit();
}

?>

<section class="section">

<h2>Edit Profile</h2>

<div class="form-container">

<form method="POST" enctype="multipart/form-data">

<label>Name</label>
<input type="text" name="name" value="<?php echo $user['name']; ?>" required>

<label>Phone</label>
<input type="text" name="phone" value="<?php echo $user['phone']; ?>">

<label>Date of Birth</label>
<input type="date" name="dob" value="<?php echo $user['dob']; ?>">

<label>Gender</label>
<select name="gender">
<option value="">Select Gender</option>
<option value="Male" <?php if($user['gender']=="Male") echo "selected"; ?>>Male</option>
<option value="Female" <?php if($user['gender']=="Female") echo "selected"; ?>>Female</option>
</select>

<label>Profile Image</label>
<input type="file" name="profile_image">

<button type="submit" name="update">Update Profile</button>

</form>

</div>

</section>

<?php include 'includes/footer.php'; ?>