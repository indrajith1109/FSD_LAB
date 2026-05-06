CREATE DATABASE AuditDB;
USE AuditDB;
CREATE TABLE Employees (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE Employee_Audit_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT,
    action_type VARCHAR(20),
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DELIMITER //

CREATE TRIGGER trg_employee_insert
AFTER INSERT ON Employees
FOR EACH ROW
BEGIN
    INSERT INTO Employee_Audit_Log (emp_id, action_type, new_salary)
    VALUES (NEW.emp_id, 'INSERT', NEW.salary);
END;
//

DELIMITER ;
DELIMITER //

CREATE TRIGGER trg_employee_update
AFTER UPDATE ON Employees
FOR EACH ROW
BEGIN
    INSERT INTO Employee_Audit_Log (emp_id, action_type, old_salary, new_salary)
    VALUES (OLD.emp_id, 'UPDATE', OLD.salary, NEW.salary);
END;
//

DELIMITER ;
CREATE VIEW Daily_Activity_Report AS
SELECT 
    DATE(changed_at) AS activity_date,
    action_type,
    COUNT(*) AS total_actions
FROM Employee_Audit_Log
GROUP BY DATE(changed_at), action_type;
INSERT INTO Employees VALUES (1,'Arun','IT',50000,DEFAULT);
UPDATE Employees SET salary=60000 WHERE emp_id=1;

SELECT * FROM Employee_Audit_Log;
SELECT * FROM Daily_Activity_Report;