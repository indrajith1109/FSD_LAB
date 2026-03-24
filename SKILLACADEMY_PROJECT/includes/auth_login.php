<?php
function sa_login_user($conn, $email, $password, $required_role) {
    $email = trim($email);
    if ($email === "" || $password === "") {
        return "Please enter email and password.";
    }

    $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    if (!$stmt) {
        return "Login service unavailable.";
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows !== 1) {
        return "Account not found.";
    }

    $user = $result->fetch_assoc();
    if (!password_verify($password, $user['password'])) {
        return "Incorrect password.";
    }

    if ($user['role'] !== $required_role) {
        return "This account is not authorized for this login page.";
    }

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    return "";
}
