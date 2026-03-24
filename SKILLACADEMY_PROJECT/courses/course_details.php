<?php
session_start();
include "../includes/db.php";

if(!isset($_GET['id'])){
    die("Course not found");
}

$course_id = (int) $_GET['id'];
if($course_id <= 0){
    die("Course not found");
}

/* Fetch Course */
$sql = "SELECT * FROM courses WHERE id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i",$course_id);
$stmt->execute();
$course = $stmt->get_result()->fetch_assoc();
if(!$course){
    die("Course not found");
}

/* Fetch Reviews */
$review_expr = "''";
if (sa_column_exists($conn, "reviews", "review") && sa_column_exists($conn, "reviews", "comment")) {
    $review_expr = "COALESCE(reviews.review, reviews.comment, '')";
} elseif (sa_column_exists($conn, "reviews", "review")) {
    $review_expr = "COALESCE(reviews.review, '')";
} elseif (sa_column_exists($conn, "reviews", "comment")) {
    $review_expr = "COALESCE(reviews.comment, '')";
}

$sql_reviews = "SELECT reviews.rating, {$review_expr} AS review, users.name 
                FROM reviews 
                JOIN users ON reviews.student_id = users.id
                WHERE reviews.course_id=?";

$stmt_reviews = $conn->prepare($sql_reviews);
$stmt_reviews->bind_param("i",$course_id);
$stmt_reviews->execute();
$reviews_result = $stmt_reviews->get_result();
?>

<!DOCTYPE html>
<html>
<head>

<title><?php echo htmlspecialchars($course['title']); ?></title>

<link rel="stylesheet" href="../assets/css/style.css">

<style>
.container{
    width:80%;
    margin:auto;
    padding:40px;
}

.course-img{
    width:100%;
    max-width:500px;
    border-radius:10px;
}

.review-box{
    background:#f5f5f5;
    padding:15px;
    margin-bottom:15px;
    border-radius:8px;
}
</style>

</head>

<body>

<?php include "../includes/header.php"; ?>

<div class="container">

<h2><?php echo htmlspecialchars($course['title']); ?></h2>

<?php
$candidate = !empty($course['thumbnail']) ? $course['thumbnail']
    : (!empty($course['image']) ? $course['image']
    : (!empty($course['images']) ? $course['images'] : ''));
$candidate = basename($candidate);
$image = (!empty($candidate) && file_exists("../assets/images/" . $candidate)) ? $candidate : "default.png";
?>
<img src="../assets/images/<?php echo $image; ?>" class="course-img">

<p style="margin-top:20px;">
<?php echo nl2br(htmlspecialchars($course['description'])); ?>
</p>

<h3>Price: ₹<?php echo $course['price']; ?></h3>

<?php if(isset($_SESSION['role']) && $_SESSION['role']=="student"){ ?>

<a href="../payment/payment.php?course_id=<?php echo $course['id']; ?>" class="btn enroll-btn">
Enroll Now
</a>

<?php } ?>

<hr style="margin:40px 0">

<h3>Student Reviews</h3>

<?php
if($reviews_result->num_rows > 0){

    while($review = $reviews_result->fetch_assoc()){
?>

<div class="review-box">

<strong><?php echo htmlspecialchars($review['name']); ?></strong><br>

⭐ Rating: <?php echo $review['rating']; ?>/5

<p><?php echo htmlspecialchars($review['review']); ?></p>

</div>

<?php
    }

}else{
    echo "<p>No reviews yet</p>";
}
?>

<!-- ADD REVIEW FORM -->
<?php if(isset($_SESSION['role']) && $_SESSION['role']=="student"){ ?>

<hr>

<h3>Add Review</h3>

<form action="submit_review.php" method="POST">

<input type="hidden" name="course_id" value="<?php echo $course_id; ?>">

<label>Rating:</label><br>
<select name="rating" required>
<option value="5">5</option>
<option value="4">4</option>
<option value="3">3</option>
<option value="2">2</option>
<option value="1">1</option>
</select>

<br><br>

<textarea name="review" placeholder="Write your review..." required style="width:100%;height:100px;"></textarea>

<br><br>

<button type="submit">Submit Review</button>

</form>

<?php } ?>

</div>

<?php include "../includes/footer.php"; ?>

</body>
</html>