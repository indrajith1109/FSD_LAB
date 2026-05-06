<?php
session_start();
include "../includes/db.php";

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'instructor') {
    header("Location: ../login_instructor.php");
    exit();
}

if(isset($_POST['submit'])){

    $title = trim($_POST['title']);
    $price = $_POST['price'];
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $instructor_id = (int) $_SESSION['user_id'];
    $created_by = isset($_SESSION['user_name']) ? $_SESSION['user_name'] : 'Instructor';
    if ($title === '') {
        echo "Course title is required";
        exit();
    }
    if (!is_numeric($price)) {
        echo "Invalid course price";
        exit();
    }

    // IMAGE UPLOAD
    $image_name = isset($_FILES['image']['name']) ? $_FILES['image']['name'] : '';
    $tmp = isset($_FILES['image']['tmp_name']) ? $_FILES['image']['tmp_name'] : '';

    // If no image selected → use default
    if(empty($image_name)){
        $image_name = "default.png";
    } else {
        // Basic filename hardening to avoid path traversal.
        $safe_name = basename($image_name);
        $ext = strtolower(pathinfo($safe_name, PATHINFO_EXTENSION));
        $allowed = ["png", "jpg", "jpeg", "webp", "gif"];
        if(!in_array($ext, $allowed, true)){
            $safe_name = "default.png";
        }
        $target_dir = "../assets/images/";
        $target = $target_dir . time() . "_" . $safe_name;
        if(!move_uploaded_file($tmp, $target)){
            $image_name = "default.png";
        } else {
            $image_name = basename($target);
        }
    }

    // INSERT INTO DATABASE
    // Include `instructor_id` so instructor dashboard can list the course.
    // Some schemas may use `thumbnail` or `image`, so we fall back automatically.
    $has_description = function_exists("sa_column_exists") && sa_column_exists($conn, "courses", "description");

    $insert_sql_thumbnail = $has_description
        ? "INSERT INTO courses (title, description, price, thumbnail, instructor_id, created_by) VALUES (?, ?, ?, ?, ?, ?)"
        : "INSERT INTO courses (title, price, thumbnail, instructor_id, created_by) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insert_sql_thumbnail);
    $ok = false;

    if($stmt){
        if ($has_description) {
            $stmt->bind_param("ssdsis", $title, $description, $price, $image_name, $instructor_id, $created_by);
        } else {
            $stmt->bind_param("sdsis", $title, $price, $image_name, $instructor_id, $created_by);
        }
        $ok = $stmt->execute();
    }

    if(!$ok){
        // Try without `created_by` if the column doesn't exist in this schema.
        $insert_sql_thumbnail_nocreated = $has_description
            ? "INSERT INTO courses (title, description, price, thumbnail, instructor_id) VALUES (?, ?, ?, ?, ?)"
            : "INSERT INTO courses (title, price, thumbnail, instructor_id) VALUES (?, ?, ?, ?)";
        $stmt_nc = $conn->prepare($insert_sql_thumbnail_nocreated);
        if($stmt_nc){
            if ($has_description) {
                $stmt_nc->bind_param("ssdsi", $title, $description, $price, $image_name, $instructor_id);
            } else {
                $stmt_nc->bind_param("sdsi", $title, $price, $image_name, $instructor_id);
            }
            $ok = $stmt_nc->execute();
        }
    }

    if(!$ok){
        $insert_sql_image = $has_description
            ? "INSERT INTO courses (title, description, price, image, instructor_id, created_by) VALUES (?, ?, ?, ?, ?, ?)"
            : "INSERT INTO courses (title, price, image, instructor_id, created_by) VALUES (?, ?, ?, ?, ?)";
        $stmt2 = $conn->prepare($insert_sql_image);
        if(!$stmt2){
            echo "Error: " . $conn->error;
            exit();
        }
        if ($has_description) {
            $stmt2->bind_param("ssdsis", $title, $description, $price, $image_name, $instructor_id, $created_by);
        } else {
            $stmt2->bind_param("sdsis", $title, $price, $image_name, $instructor_id, $created_by);
        }
        $ok = $stmt2->execute();
    }

    if(!$ok){
        // Final fallback: `image` column without `created_by`.
        $insert_sql_image_nocreated = $has_description
            ? "INSERT INTO courses (title, description, price, image, instructor_id) VALUES (?, ?, ?, ?, ?)"
            : "INSERT INTO courses (title, price, image, instructor_id) VALUES (?, ?, ?, ?)";
        $stmt3 = $conn->prepare($insert_sql_image_nocreated);
        if(!$stmt3){
            echo "Error: " . $conn->error;
            exit();
        }
        if ($has_description) {
            $stmt3->bind_param("ssdsi", $title, $description, $price, $image_name, $instructor_id);
        } else {
            $stmt3->bind_param("sdsi", $title, $price, $image_name, $instructor_id);
        }
        $ok = $stmt3->execute();
    }

    if($ok){
        echo "<script>alert('Course Added Successfully'); window.location='instructor.php';</script>";
    } else {
        echo "Error: " . ($stmt ? $stmt->error : $conn->error);
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Add Course</title>
    <link rel="stylesheet" href="../assets/css/style.css">

    <style>
    .form-container{
        width:400px;
        margin:50px auto;
        background:white;
        padding:30px;
        border-radius:10px;
        box-shadow:0 5px 15px rgba(0,0,0,0.1);
    }

    input,textarea,button{
        width:100%;
        padding:10px;
        margin:10px 0;
        border-radius:6px;
        border:1px solid #ccc;
    }

    button{
        background:#2563eb;
        color:white;
        border:none;
        cursor:pointer;
    }
    </style>

</head>

<body>

<?php include "../includes/header.php"; ?>

<div class="form-container">

<h2>Add Course</h2>

<form method="POST" enctype="multipart/form-data">

<input type="text" name="title" placeholder="Course Title" required>

<textarea name="description" placeholder="Course Description" rows="4"></textarea>

<input type="number" step="0.01" name="price" placeholder="Price" required>

<input type="file" name="image">

<button type="submit" name="submit">Add Course</button>

</form>

</div>

<?php include "../includes/footer.php"; ?>

</body>
</html>