<?php
session_start();
include '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.php");
    exit();
}

$message = "";
$allowed_roles = ["student", "instructor", "admin"];

if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST['user_id'], $_POST['role'])) {
    $target_user_id = (int) $_POST['user_id'];
    $new_role = trim($_POST['role']);

    if ($target_user_id > 0 && in_array($new_role, $allowed_roles, true)) {
        // Prevent admin from accidentally removing own admin role.
        if ($target_user_id === (int) $_SESSION['user_id'] && $new_role !== 'admin') {
            $message = "You cannot change your own admin role.";
        } else {
            $update = $conn->prepare("UPDATE users SET role=? WHERE id=?");
            $update->bind_param("si", $new_role, $target_user_id);
            if ($update->execute()) {
                $message = "Role updated successfully.";
            } else {
                $message = "Failed to update role.";
            }
        }
    } else {
        $message = "Invalid role update request.";
    }
}

$users_result = $conn->query("SELECT id, name, email, role FROM users ORDER BY id DESC");
?>

<?php include '../includes/header.php'; ?>

<section class="section">
    <h2>Manage User Roles</h2>
    <p style="margin-bottom:16px;color:#555;">New registrations are always Student. Change roles here.</p>

    <?php if ($message !== "") { ?>
        <p class="error" style="margin-bottom:16px;"><?php echo htmlspecialchars($message); ?></p>
    <?php } ?>

    <div style="overflow:auto;">
        <table border="1" cellpadding="10" cellspacing="0" style="width:100%;background:#fff;">
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Change Role</th>
            </tr>
            <?php while ($user = $users_result->fetch_assoc()) { ?>
                <tr>
                    <td><?php echo (int) $user['id']; ?></td>
                    <td><?php echo htmlspecialchars($user['name']); ?></td>
                    <td><?php echo htmlspecialchars($user['email']); ?></td>
                    <td><?php echo htmlspecialchars(ucfirst($user['role'])); ?></td>
                    <td>
                        <form method="POST" style="display:flex;gap:8px;align-items:center;">
                            <input type="hidden" name="user_id" value="<?php echo (int) $user['id']; ?>">
                            <select name="role" required>
                                <option value="student" <?php if ($user['role'] === 'student') echo "selected"; ?>>Student</option>
                                <option value="instructor" <?php if ($user['role'] === 'instructor') echo "selected"; ?>>Instructor</option>
                                <option value="admin" <?php if ($user['role'] === 'admin') echo "selected"; ?>>Admin</option>
                            </select>
                            <button type="submit" class="btn">Update</button>
                        </form>
                    </td>
                </tr>
            <?php } ?>
        </table>
    </div>
</section>

<?php include '../includes/footer.php'; ?>
