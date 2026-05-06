<?php
$host = "localhost";
$user = "root";
$password = ""; // default XAMPP password is empty
$database = "skillacademy_db";

$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

function sa_table_exists($conn, $table_name) {
    $table_name = $conn->real_escape_string($table_name);
    $sql = "SHOW TABLES LIKE '{$table_name}'";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0;
}

function sa_column_exists($conn, $table_name, $column_name) {
    $table_name = $conn->real_escape_string($table_name);
    $column_name = $conn->real_escape_string($column_name);
    $sql = "SHOW COLUMNS FROM `{$table_name}` LIKE '{$column_name}'";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0;
}

// Compatibility repair for mixed schema versions.
if (sa_table_exists($conn, "users")) {
    if (!sa_column_exists($conn, "users", "phone")) {
        $conn->query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL");
    }
    if (!sa_column_exists($conn, "users", "dob")) {
        $conn->query("ALTER TABLE users ADD COLUMN dob DATE NULL");
    }
    if (!sa_column_exists($conn, "users", "gender")) {
        $conn->query("ALTER TABLE users ADD COLUMN gender VARCHAR(10) NULL");
    }
    if (!sa_column_exists($conn, "users", "profile_image")) {
        $conn->query("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL");
    }
}

if (sa_table_exists($conn, "courses")) {
    if (!sa_column_exists($conn, "courses", "description")) {
        $conn->query("ALTER TABLE courses ADD COLUMN description TEXT NULL");
    }
    if (!sa_column_exists($conn, "courses", "thumbnail")) {
        $conn->query("ALTER TABLE courses ADD COLUMN thumbnail VARCHAR(255) NULL");
    }
    if (!sa_column_exists($conn, "courses", "instructor_id")) {
        $conn->query("ALTER TABLE courses ADD COLUMN instructor_id INT NULL");
    }
    if (!sa_column_exists($conn, "courses", "created_by")) {
        $conn->query("ALTER TABLE courses ADD COLUMN created_by VARCHAR(100) NULL");
    }
    if (sa_column_exists($conn, "courses", "image")) {
        $conn->query("UPDATE courses SET thumbnail = image WHERE (thumbnail IS NULL OR thumbnail = '') AND image IS NOT NULL AND image <> ''");
    }
    if (sa_column_exists($conn, "courses", "images")) {
        $conn->query("UPDATE courses SET thumbnail = images WHERE (thumbnail IS NULL OR thumbnail = '') AND images IS NOT NULL AND images <> ''");
    }
}

if (sa_table_exists($conn, "reviews")) {
    if (!sa_column_exists($conn, "reviews", "review")) {
        $conn->query("ALTER TABLE reviews ADD COLUMN review TEXT NULL");
    }
    if (sa_column_exists($conn, "reviews", "comment")) {
        $conn->query("UPDATE reviews SET review = comment WHERE (review IS NULL OR review = '') AND comment IS NOT NULL AND comment <> ''");
    }
}

if (sa_table_exists($conn, "enrollments")) {
    if (!sa_column_exists($conn, "enrollments", "progress")) {
        $conn->query("ALTER TABLE enrollments ADD COLUMN progress INT NOT NULL DEFAULT 0");
    }
    if (!sa_column_exists($conn, "enrollments", "completed")) {
        $conn->query("ALTER TABLE enrollments ADD COLUMN completed TINYINT(1) NOT NULL DEFAULT 0");
    }
}
?>