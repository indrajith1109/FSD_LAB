<?php
session_start();
include 'includes/db.php';
include 'includes/auth_login.php';

$message = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $message = sa_login_user($conn, $_POST['email'] ?? '', $_POST['password'] ?? '', 'admin');
    if ($message === "") {
        header("Location: admin/dashboard.php");
        exit();
    }
}
?>
<?php include 'includes/header.php'; ?>
<div class="form-container">
    <h2>Admin Login</h2>
    <?php if ($message !== "") { ?>
        <p class="error"><?php echo htmlspecialchars($message); ?></p>
    <?php } ?>
    <form method="POST">
        <input type="email" name="email" placeholder="Email Address" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Login as Admin</button>
    </form>
</div>
<?php include 'includes/footer.php'; ?>
