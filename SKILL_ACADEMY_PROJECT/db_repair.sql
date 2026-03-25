-- SkillAcademy schema compatibility repair
-- Run this once in phpMyAdmin (skillacademy_db)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS dob DATE NULL,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) NULL;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS instructor_id INT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) NULL;

-- Copy legacy image fields into thumbnail when empty
UPDATE courses
SET thumbnail = image
WHERE (thumbnail IS NULL OR thumbnail = '')
  AND image IS NOT NULL
  AND image <> '';

UPDATE courses
SET thumbnail = images
WHERE (thumbnail IS NULL OR thumbnail = '')
  AND images IS NOT NULL
  AND images <> '';

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS review TEXT NULL;

-- Copy legacy comment field into review when empty
UPDATE reviews
SET review = comment
WHERE (review IS NULL OR review = '')
  AND comment IS NOT NULL
  AND comment <> '';

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS progress INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed TINYINT(1) NOT NULL DEFAULT 0;
