<?php
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.php");
    exit();
}

// Legacy route: keep this path working but serve the canonical admin dashboard.
header("Location: ../admin/dashboard.php");
exit();
?>