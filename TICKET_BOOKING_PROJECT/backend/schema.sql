CREATE DATABASE IF NOT EXISTS ticket_booking;
USE ticket_booking;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  department VARCHAR(120) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_name VARCHAR(120) NOT NULL,
  department_name VARCHAR(120) NOT NULL,
  event_date_time DATETIME NOT NULL,
  venue VARCHAR(200) NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL,
  available_tickets INT NOT NULL CHECK (available_tickets >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  booking_code VARCHAR(40) UNIQUE NOT NULL,
  user_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  user_department VARCHAR(120) NOT NULL,
  ticket_count INT NOT NULL CHECK (ticket_count > 0),
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending_payment', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'paid',
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cancelled_at DATETIME NULL,
  cancellation_reason VARCHAR(255) NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (full_name, email, department, role, password_hash)
SELECT
  'System Admin',
  'admin@college.edu',
  'Computer Science',
  'admin',
  '$2b$10$smJXI1Q1ptIJnTzen9HZa.j.Ww4QdDzxonidYriX/HmfBPzJ7gnbW'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@college.edu');

INSERT INTO users (full_name, email, department, role, password_hash)
SELECT
  'Student User',
  'student@college.edu',
  'Electronics',
  'user',
  '$2b$10$GStpfnj0f0L9qwVNsJ4U1.cvJ9.ki7d.x.Q0oH1r./CeDjtvwVxFa'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student@college.edu');

INSERT INTO events (
  event_name,
  department_name,
  event_date_time,
  venue,
  ticket_price,
  available_tickets
)
SELECT
  'InnovateX Technical Fest 2026',
  'Computer Science Department',
  '2026-05-10 10:00:00',
  'Main Seminar Hall',
  299.00,
  150
WHERE NOT EXISTS (SELECT 1 FROM events);
