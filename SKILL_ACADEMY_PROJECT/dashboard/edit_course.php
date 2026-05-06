<?php
session_start();
include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'instructor') {
    header("Location: ../login_instructor.php");
    exit();
}

$instructor_id = (int) $_SESSION['user_id'];
$course_id = isset($_GET['id']) ? (int) $_GET['id'] : (isset($_POST['course_id']) ? (int) $_POST['course_id'] : 0);
if ($course_id <= 0) {
    header("Location: instructor.php");
    exit();
}

$course_stmt = $conn->prepare("SELECT * FROM courses WHERE id=? AND instructor_id=?");
$course_stmt->bind_param("ii", $course_id, $instructor_id);
$course_stmt->execute();
$course = $course_stmt->get_result()->fetch_assoc();
if (!$course) {
    die("Course not found or access denied.");
}

$message = "";
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['save_course'])) {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = $_POST['price'] ?? '';

    if ($title === '') {
        $message = "Course title is required.";
    } elseif (!is_numeric($price)) {
        $message = "Invalid price.";
    } else {
        $image_name = !empty($course['thumbnail']) ? $course['thumbnail'] : (!empty($course['image']) ? $course['image'] : "default.png");

        if (!empty($_FILES['image']['name'])) {
            $safe_name = basename($_FILES['image']['name']);
            $ext = strtolower(pathinfo($safe_name, PATHINFO_EXTENSION));
            $allowed = ["png", "jpg", "jpeg", "webp", "gif"];
            if (in_array($ext, $allowed, true)) {
                $target = "../assets/images/" . time() . "_" . $safe_name;
                if (move_uploaded_file($_FILES['image']['tmp_name'], $target)) {
                    $image_name = basename($target);
                }
            }
        }

        $ok = false;
        $sql1 = "UPDATE courses SET title=?, description=?, price=?, thumbnail=? WHERE id=? AND instructor_id=?";
        $st1 = $conn->prepare($sql1);
        if ($st1) {
            $st1->bind_param("ssdsii", $title, $description, $price, $image_name, $course_id, $instructor_id);
            $ok = $st1->execute();
        }

        if (!$ok) {
            $sql2 = "UPDATE courses SET title=?, description=?, price=?, image=? WHERE id=? AND instructor_id=?";
            $st2 = $conn->prepare($sql2);
            if ($st2) {
                $st2->bind_param("ssdsii", $title, $description, $price, $image_name, $course_id, $instructor_id);
                $ok = $st2->execute();
            }
        }

        if (!$ok) {
            $sql3 = "UPDATE courses SET title=?, price=?, thumbnail=? WHERE id=? AND instructor_id=?";
            $st3 = $conn->prepare($sql3);
            if ($st3) {
                $st3->bind_param("sdsii", $title, $price, $image_name, $course_id, $instructor_id);
                $ok = $st3->execute();
            }
        }

        if (!$ok) {
            $sql4 = "UPDATE courses SET title=?, price=?, image=? WHERE id=? AND instructor_id=?";
            $st4 = $conn->prepare($sql4);
            if ($st4) {
                $st4->bind_param("sdsii", $title, $price, $image_name, $course_id, $instructor_id);
                $ok = $st4->execute();
            }
        }

        if ($ok) {
            header("Location: instructor.php");
            exit();
        }
        $message = "Failed to update course.";
    }
}
?>
<?php include '../includes/header.php'; ?>
<div class="form-container">
    <h2>Edit Course</h2>
    <?php if ($message !== "") { ?>
        <p class="error"><?php echo htmlspecialchars($message); ?></p>
    <?php } ?>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="course_id" value="<?php echo (int) $course_id; ?>">
        <input type="text" name="title" value="<?php echo htmlspecialchars($course['title'] ?? ''); ?>" required>
        <textarea name="description" rows="5" placeholder="Course Description"><?php echo htmlspecialchars($course['description'] ?? ''); ?></textarea>
        <input type="number" step="0.01" name="price" value="<?php echo htmlspecialchars((string) ($course['price'] ?? '')); ?>" required>
        <input type="file" name="image">
        <button type="submit" name="save_course">Save Changes</button>
    </form>
</div>
<?php include '../includes/footer.php'; ?>
