USE CampusHub;


-- =========================================================
-- 1. DEPARTMENT
-- =========================================================

CREATE TABLE IF NOT EXISTS DEPARTMENT (
    dept_id VARCHAR(20) PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL
);


-- =========================================================
-- 2. PROFESSOR
-- =========================================================

CREATE TABLE IF NOT EXISTS PROFESSOR (
    prof_id VARCHAR(15) PRIMARY KEY,
    professor_name VARCHAR(70) NOT NULL,
    phone_number VARCHAR(15),
    dept_id VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT Professor_dept_fk
        FOREIGN KEY (dept_id)
        REFERENCES DEPARTMENT (dept_id)
);


-- =========================================================
-- 3. COURSE
-- =========================================================

CREATE TABLE IF NOT EXISTS COURSE (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(60) NOT NULL,
    dept_id VARCHAR(20) NOT NULL,

    CONSTRAINT Course_dept_fk
        FOREIGN KEY (dept_id)
        REFERENCES DEPARTMENT (dept_id)
);


-- =========================================================
-- 4. STUDENT
-- =========================================================

CREATE TABLE IF NOT EXISTS STUDENT (
    student_id VARCHAR(14) PRIMARY KEY,
    student_name VARCHAR(70) NOT NULL,
    phone_number VARCHAR(15),
    section VARCHAR(10) NOT NULL,
    semester INT NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT Student_course_fk
        FOREIGN KEY (course_id)
        REFERENCES COURSE (course_id)
);


-- =========================================================
-- 5. SUBJECT
-- =========================================================

CREATE TABLE IF NOT EXISTS SUBJECT (
    subject_id VARCHAR(10) PRIMARY KEY,
    subject_name VARCHAR(40) NOT NULL,
    semester INT NOT NULL,
    course_id VARCHAR(20) NOT NULL,

    CONSTRAINT Subject_course_fk
        FOREIGN KEY (course_id)
        REFERENCES COURSE (course_id)
);


-- =========================================================
-- 6. TEACHING
-- Composite Primary Key: (subject_id, prof_id)
-- =========================================================

CREATE TABLE IF NOT EXISTS TEACHING (
    subject_id VARCHAR(10) NOT NULL,
    prof_id VARCHAR(15) NOT NULL,

    PRIMARY KEY (subject_id, prof_id),

    CONSTRAINT Teaching_subject_fk
        FOREIGN KEY (subject_id)
        REFERENCES SUBJECT (subject_id),

    CONSTRAINT Teaching_professor_fk
        FOREIGN KEY (prof_id)
        REFERENCES PROFESSOR (prof_id)
);


-- =========================================================
-- 7. CLASS_SESSION
-- =========================================================

CREATE TABLE IF NOT EXISTS CLASS_SESSION (
    session_id VARCHAR(10) PRIMARY KEY,
    subject_id VARCHAR(10) NOT NULL,
    prof_id VARCHAR(15) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    day VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    CONSTRAINT ClassSession_course_fk
        FOREIGN KEY (course_id)
        REFERENCES COURSE (course_id),

    CONSTRAINT ClassSession_teaching_fk
        FOREIGN KEY (subject_id, prof_id)
        REFERENCES TEACHING (subject_id, prof_id)
);


-- =========================================================
-- 8. SELECTS_SUBJECT
-- Composite Primary Key: (student_id, subject_id)
-- =========================================================

CREATE TABLE IF NOT EXISTS SELECTS_SUBJECT (
    student_id VARCHAR(14) NOT NULL,
    subject_id VARCHAR(10) NOT NULL,

    PRIMARY KEY (student_id, subject_id),

    CONSTRAINT Selects_student_fk
        FOREIGN KEY (student_id)
        REFERENCES STUDENT (student_id),

    CONSTRAINT Selects_subject_fk
        FOREIGN KEY (subject_id)
        REFERENCES SUBJECT (subject_id)
);


-- =========================================================
-- 9. ATTENDANCE
-- Composite Primary Key: (session_id, student_id)
-- =========================================================

CREATE TABLE IF NOT EXISTS ATTENDANCE (
    session_id VARCHAR(10) NOT NULL,
    student_id VARCHAR(14) NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,

    PRIMARY KEY (session_id, student_id),

    CONSTRAINT Attendance_session_fk
        FOREIGN KEY (session_id)
        REFERENCES CLASS_SESSION (session_id),

    CONSTRAINT Attendance_student_fk
        FOREIGN KEY (student_id)
        REFERENCES STUDENT (student_id)
);


-- =========================================================
-- 10. ADMIN
-- =========================================================

CREATE TABLE IF NOT EXISTS ADMIN (
    admin_id VARCHAR(16) PRIMARY KEY,
    admin_name VARCHAR(40) NOT NULL,
    phone_number VARCHAR(15),
    active BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================================================
-- 11. LOGIN_OTP
--
-- Stores OTP verification information.
--
-- IMPORTANT:
-- The actual OTP is never stored.
-- otp_hash contains the BCrypt hash.
-- =========================================================

CREATE TABLE IF NOT EXISTS LOGIN_OTP (
    otp_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    target_id VARCHAR(16) NOT NULL,
    role VARCHAR(10) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,

    otp_hash VARCHAR(100) NOT NULL,

    generated_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,

    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,

    INDEX idx_login_otp_target (target_id)
);


-- =========================================================
-- 12. USER_SESSION
--
-- Stores every successful login session.
--
-- logout_time remains NULL while the user is logged in.
-- =========================================================

CREATE TABLE IF NOT EXISTS USER_SESSION (
    session_id VARCHAR(40) PRIMARY KEY,

    user_id VARCHAR(16) NOT NULL,
    role VARCHAR(10) NOT NULL,
    phone_number VARCHAR(15),

    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,

    INDEX idx_user_session_user (user_id)
);


-- =========================================================
-- 13. STAFF_ATTENDANCE
-- Either prof_id OR admin_id must be present, never both.
-- =========================================================

CREATE TABLE IF NOT EXISTS STAFF_ATTENDANCE (
    attendance_id VARCHAR(27) PRIMARY KEY,
    prof_id VARCHAR(15),
    admin_id VARCHAR(16),
    day DATE NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,

    CONSTRAINT StaffAttendance_professor_fk
        FOREIGN KEY (prof_id)
        REFERENCES PROFESSOR (prof_id),

    CONSTRAINT StaffAttendance_admin_fk
        FOREIGN KEY (admin_id)
        REFERENCES ADMIN (admin_id),

    CONSTRAINT StaffAttendance_owner_chk
        CHECK (
            (prof_id IS NOT NULL AND admin_id IS NULL)
            OR
            (prof_id IS NULL AND admin_id IS NOT NULL)
        )
);


-- =========================================================
-- 14. EXAMINATION
--
-- One examination configuration belongs to exactly one:
--
--   Subject
--   Semester
--   Section
--   Professor
--
-- Department and Course are derived through:
--
--   EXAMINATION
--       -> SUBJECT
--           -> COURSE
--               -> DEPARTMENT
--
-- INTERNAL:
--     internal_number = 1, 2, 3, ...
--
-- FINAL:
--     internal_number = NULL
--
-- SECTION:
--     Stored directly on EXAMINATION because the section is
--     part of the administrator's examination configuration.
-- =========================================================

CREATE TABLE IF NOT EXISTS EXAMINATION (
    exam_id VARCHAR(10) PRIMARY KEY,

    subject_id VARCHAR(10) NOT NULL,

    semester INT NOT NULL,

    section VARCHAR(10) NOT NULL,

    exam_type VARCHAR(10) NOT NULL,

    internal_number INT,

    max_marks INT NOT NULL,

    prof_id VARCHAR(15) NOT NULL,

    /*
     * Used only for enforcing uniqueness.
     *
     * Internal 1, 2, 3 ... keep their own number.
     * Final has internal_number = NULL, which is converted
     * to 0 only for the unique constraint.
     */
    exam_number_unique INT
        GENERATED ALWAYS AS (
            COALESCE(
                internal_number,
                0
            )
        ) STORED,

    CONSTRAINT Examination_subject_fk
        FOREIGN KEY (subject_id)
        REFERENCES SUBJECT (subject_id),

    CONSTRAINT Examination_professor_fk
        FOREIGN KEY (prof_id)
        REFERENCES PROFESSOR (prof_id),

    CONSTRAINT Examination_section_chk
        CHECK (
            TRIM(section) <> ''
        ),

    CONSTRAINT Examination_semester_chk
        CHECK (
            semester > 0
        ),

    CONSTRAINT Examination_type_chk
        CHECK (
            (exam_type = 'INTERNAL' AND internal_number IS NOT NULL)
            OR
            (exam_type = 'FINAL' AND internal_number IS NULL)
        ),

    CONSTRAINT Examination_internal_number_chk
        CHECK (
            internal_number IS NULL
            OR internal_number > 0
        ),

    CONSTRAINT Examination_max_marks_chk
        CHECK (
            max_marks > 0
        ),

    CONSTRAINT Examination_type_value_chk
        CHECK (
            exam_type IN ('INTERNAL', 'FINAL')
        ),

    /*
     * Section is part of examination uniqueness.
     *
     * Therefore:
     *
     *   Subject + Semester + Section A + Internal 1
     *
     * and
     *
     *   Subject + Semester + Section B + Internal 1
     *
     * are different valid configurations.
     */
    CONSTRAINT Examination_unique_exam_chk
        UNIQUE (
            subject_id,
            semester,
            section,
            exam_type,
            exam_number_unique
        )
);


-- =========================================================
-- 15. STUDENT_MARK
--
-- One Student-Examination combination has one mark record.
--
-- Composite Primary Key:
--     (student_id, exam_id)
--
-- marks_obtained <= max_marks is validated by the backend
-- service because MySQL CHECK constraints cannot use a
-- subquery to compare against EXAMINATION.max_marks.
-- =========================================================

CREATE TABLE IF NOT EXISTS STUDENT_MARK (
    student_id VARCHAR(14) NOT NULL,
    exam_id VARCHAR(10) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,

    PRIMARY KEY (
        student_id,
        exam_id
    ),

    CONSTRAINT StudentMark_student_fk
        FOREIGN KEY (student_id)
        REFERENCES STUDENT (student_id),

    CONSTRAINT StudentMark_examination_fk
        FOREIGN KEY (exam_id)
        REFERENCES EXAMINATION (exam_id),

    CONSTRAINT StudentMark_nonnegative_chk
        CHECK (
            marks_obtained >= 0
        )
);