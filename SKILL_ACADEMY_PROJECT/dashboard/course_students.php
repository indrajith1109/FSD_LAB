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

$course_stmt = $conn->prepare("SELECT id, title FROM courses WHERE id=? AND instructor_id=?");
$course_stmt->bind_param("ii", $course_id, $instructor_id);
$course_stmt->execute();
$course = $course_stmt->get_result()->fetch_assoc();
if (!$course) {
    die("Course not found or access denied.");
}

$message = "";
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['action'])) {
    $student_id = isset($_POST['student_id']) ? (int) $_POST['student_id'] : 0;
    if ($student_id > 0) {
        if ($_POST['action'] === 'remove') {
            $del = $conn->prepare("DELETE FROM enrollments WHERE course_id=? AND student_id=?");
            $del->bind_param("ii", $course_id, $student_id);
            $del->execute();
            $message = "Student removed from this course.";
        } elseif ($_POST['action'] === 'add') {
            $check = $conn->prepare("SELECT id FROM enrollments WHERE course_id=? AND student_id=?");
            $check->bind_param("ii", $course_id, $student_id);
            $check->execute();
            $check->store_result();
            if ($check->num_rows == 0) {
                $ins = $conn->prepare("INSERT INTO enrollments (student_id, course_id, progress, completed) VALUES (?, ?, 0, 0)");
                $ins->bind_param("ii", $student_id, $course_id);
                $ins->execute();
                $message = "Student added to this course.";
            } else {
                $message = "Student is already enrolled.";
            }
        }
    }
}

$enrolled_sql = "
SELECT u.id, u.name, u.email, e.progress
FROM enrollments e
JOIN users u ON u.id = e.student_id
WHERE e.course_id = ?
ORDER BY u.name ASC
";
$enrolled_stmt = $conn->prepare($enrolled_sql);
$enrolled_stmt->bind_param("i", $course_id);
$enrolled_stmt->execute();
$enrolled = $enrolled_stmt->get_result();

$available_sql = "
SELECT u.id, u.name, u.email
FROM users u
WHERE u.role='student'
AND u.id NOT IN (
    SELECT e.student_id
    FROM enrollments e
    WHERE e.course_id = ?
)
ORDER BY u.name ASC
";
$available_stmt = $conn->prepare($available_sql);
$available_stmt->bind_param("i", $course_id);
$available_stmt->execute();
$available = $available_stmt->get_result();
?>
<?php include '../includes/header.php'; ?>
<section class="section">
    <h2>Manage Students - <?php echo htmlspecialchars($course['title']); ?></h2>
    <?php if ($message !== "") { ?>
        <p class="error"><?php echo htmlspecialchars($message); ?></p>
    <?php } ?>

    <div style="margin:18px 0;padding:14px;background:#fff;border-radius:8px;">
        <h3>Add Student To Course</h3>
        <form method="POST" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <input type="hidden" name="course_id" value="<?php echo (int) $course_id; ?>">
            <input type="hidden" name="action" value="add">
            <select name="student_id" required>
                <option value="">Select student</option>
                <?php while ($s = $available->fetch_assoc()) { ?>
                    <option value="<?php echo (int) $s['id']; ?>">
                        <?php echo htmlspecialchars($s['name'] . " (" . $s['email'] . ")"); ?>
                    </option>
                <?php } ?>
            </select>
            <button class="btn" type="submit">Add Student</button>
        </form>
    </div>

    <div style="overflow:auto;">
        <table border="1" cellpadding="10" cellspacing="0" style="width:100%;background:#fff;">
            <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Progress</th>
                <th>Action</th>
            </tr>
            <?php while ($row = $enrolled->fetch_assoc()) { ?>
                <tr>
                    <td><?php echo htmlspecialchars($row['name']); ?></td>
                    <td><?php echo htmlspecialchars($row['email']); ?></td>
                    <td><?php echo (int) $row['progress']; ?>%</td>
                    <td>
                        <form method="POST" onsubmit="return confirm('Remove this student from course?');">
                            <input type="hidden" name="course_id" value="<?php echo (int) $course_id; ?>">
                            <input type="hidden" name="student_id" value="<?php echo (int) $row['id']; ?>">
                            <input type="hidden" name="action" value="remove">
                            <button class="btn" type="submit" style="background:#ef4444;color:white;">Remove Student</button>
                        </form>
                    </td>
                </tr>
            <?php } ?>
        </table>
    </div>
    <div style="margin-top:18px;">
        <a href="instructor.php" class="btn">Back to Instructor Dashboard</a>
    </div>
</section>
<?php include '../includes/footer.php'; ?>
