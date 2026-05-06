<?php
session_start();
include "../includes/db.php";

$search = "";

if(isset($_GET['search'])){
    $search = trim($_GET['search']);
}

$sql = "SELECT * FROM courses WHERE title LIKE ?";
$stmt = $conn->prepare($sql);

$search_param = "%".$search."%";
$stmt->bind_param("s",$search_param);
$stmt->execute();

$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html>
<head>

<title>Browse Courses</title>

<link rel="stylesheet" href="../assets/css/style.css">

<style>

.courses-container{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
gap:30px;
padding:40px;
}

.course-card{
background:white;
border-radius:12px;
box-shadow:0 6px 20px rgba(0,0,0,0.08);
overflow:hidden;
transition:0.3s;
}

.course-card:hover{
transform:translateY(-5px);
}

.course-img{
width:100%;
height:160px;
object-fit:cover;
}

.course-body{
padding:20px;
}

.course-title{
font-size:18px;
font-weight:600;
margin-bottom:8px;
}

.course-price{
color:#444;
margin:10px 0;
}

.btn{
display:inline-block;
padding:8px 16px;
border-radius:6px;
text-decoration:none;
font-size:14px;
margin-top:8px;
}

.enroll-btn{
background:#2563eb;
color:white;
}

.view-btn{
color:#2563eb;
display:block;
margin-top:10px;
}

.search-box{
text-align:center;
margin-top:30px;
}

.search-box input{
padding:10px;
width:300px;
border:1px solid #ccc;
border-radius:6px;
}

.search-box button{
padding:10px 15px;
border:none;
background:#2563eb;
color:white;
border-radius:6px;
cursor:pointer;
}

</style>

</head>

<body>

<?php include "../includes/header.php"; ?>

<h2 style="text-align:center;margin-top:30px;">Browse Courses</h2>

<div class="search-box">
<form method="GET">
<input type="text" name="search" placeholder="Search courses..." value="<?php echo htmlspecialchars($search); ?>">
<button type="submit">Search</button>
</form>
</div>

<div class="courses-container">

<?php while($row = $result->fetch_assoc()){ ?>
<?php
    // Resolve image filename across possible DB column names.
    $candidate = !empty($row['thumbnail']) ? $row['thumbnail'] : (!empty($row['image']) ? $row['image'] : (!empty($row['images']) ? $row['images'] : ''));
    $candidate = basename($candidate);
    $image = (!empty($candidate) && file_exists("../assets/images/" . $candidate)) ? $candidate : "default.png";
?>

<div class="course-card">

<img src="../assets/images/<?php echo $image; ?>" class="course-img">

<div class="course-body">

<div class="course-title">
<?php echo htmlspecialchars($row['title']); ?>
</div>

<p>Instructor: <?php echo htmlspecialchars(!empty($row['created_by']) ? $row['created_by'] : 'Admin'); ?></p>

<div class="course-price">
₹<?php echo $row['price']; ?>
</div>

<?php if(isset($_SESSION['role']) && $_SESSION['role'] == "student"){ ?>

<a href="../payment/payment.php?course_id=<?php echo $row['id']; ?>" class="btn enroll-btn">
Enroll Now
</a>

<?php } ?>

<a href="course_details.php?id=<?php echo $row['id']; ?>" class="view-btn">
View Course
</a>

</div>

</div>

<?php } ?>

</div>

<?php include "../includes/footer.php"; ?>

</body>
</html>