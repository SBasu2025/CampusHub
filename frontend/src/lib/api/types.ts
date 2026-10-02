// ============================================================
// CAMPUSHUB API TYPES
// ============================================================
//
// These interfaces mirror the JSON shapes returned by the
// CampusHub Spring Boot backend.
//
// IMPORTANT:
// The backend serializes JPA relationships directly, so many
// objects arrive with nested related entities rather than only
// foreign-key IDs.
// ============================================================

// ============================================================
// DEPARTMENT
// ============================================================

export interface Department {
  deptId: string;
  deptName: string;
}

// ============================================================
// COURSE
// ============================================================

export interface Course {
  courseId: string;
  courseName: string;
  department: Department;
}

// ============================================================
// SUBJECT
// ============================================================

export interface Subject {
  subjectId: string;
  subjectName: string;
  course: Course;
}

// ============================================================
// PROFESSOR
// ============================================================

export interface Professor {
  profId: string;
  professorName: string;

  /**
   * Registered phone number used for OTP login.
   */
  phoneNumber: string;

  department: Department;
  active: boolean;
}

// ============================================================
// STUDENT
// ============================================================

export interface Student {
  studentId: string;
  studentName: string;

  /**
   * Registered phone number used for OTP login.
   */
  phoneNumber: string;

  section: string;
  semester: number;
  course: Course;
  active: boolean;
}

// ============================================================
// TEACHING
// ============================================================
//
// Composite key:
//   profId + subjectId
// ============================================================

export interface Teaching {
  id: {
    profId: string;
    subjectId: string;
  };

  professor: Professor;
  subject: Subject;
}

// ============================================================
// SELECTS SUBJECT
// ============================================================
//
// Composite key:
//   studentId + subjectId
// ============================================================

export interface SelectsSubject {
  id: {
    studentId: string;
    subjectId: string;
  };

  student: Student;
  subject: Subject;
}

// ============================================================
// CLASS SESSION
// ============================================================
//
// FINALIZED CAMPUSHUB DESIGN:
//
// One ClassSession row = one real-world dated occurrence.
//
// day:
//   YYYY-MM-DD
//
// Example:
//   2026-09-14
//
// startTime / endTime:
//   HH:mm:ss
//
// DO NOT reinterpret day as:
//   MONDAY
//   TUESDAY
//   etc.
//
// The frontend uses ISO date strings for reliable sorting,
// filtering and "today / past / upcoming" comparisons.
// ============================================================

export interface ClassSession {
  sessionId: string;

  course: Course;

  teaching: Teaching;

  semester: number;

  section: string;

  /**
   * Actual calendar date.
   *
   * Format:
   * YYYY-MM-DD
   */
  day: string;

  /**
   * LocalTime serialized by Jackson.
   *
   * Format:
   * HH:mm:ss
   */
  startTime: string;

  /**
   * LocalTime serialized by Jackson.
   *
   * Format:
   * HH:mm:ss
   */
  endTime: string;
}

// ============================================================
// ATTENDANCE
// ============================================================
//
// Composite key:
//   sessionId + studentId
// ============================================================

export interface Attendance {
  id: {
    sessionId: string;
    studentId: string;
  };

  classSession: ClassSession;

  student: Student;

  /**
   * Backend stores this as a free-text String.
   *
   * Frontend always writes exactly:
   *   "Present"
   *   "Absent"
   *
   * Comparisons should be case-insensitive where needed.
   */
  status: "Present" | "Absent" | string;
}

// ============================================================
// ATTENDANCE SUMMARY
// ============================================================

export interface AttendanceSummary {
  studentId: string;
  studentName: string;

  subjectId: string;
  subjectName: string;

  totalSessions: number;
  presentSessions: number;
  absentSessions: number;

  /**
   * Percentage in range 0-100.
   */
  attendancePercentage: number;
}

// ============================================================
// ADMIN
// ============================================================

export interface Admin {
  adminId: string;
  adminName: string;

  /**
   * Registered phone number used for OTP login.
   */
  phoneNumber: string;

  active: boolean;
}

// ============================================================
// USER SESSION
// ============================================================
//
// One persistent USER_SESSION row is created for every
// successful login.
//
// logoutTime:
//   null -> session is still open
//
//   non-null -> user has logged out
// ============================================================

export interface UserSession {
  sessionId: string;

  userId: string;

  role: UserRole;

  /**
   * Registered phone number used during login.
   *
   * USER_SESSION allows this column to be null, so the
   * frontend must handle null safely.
   */
  phoneNumber: string | null;

  /**
   * LocalDateTime serialized by Jackson.
   *
   * Example:
   * 2026-09-22T14:03:11
   */
  loginTime: string;

  /**
   * Null while the session is still active/open.
   */
  logoutTime: string | null;
}

// ============================================================
// STAFF ATTENDANCE
// ============================================================

export interface StaffAttendance {
  /**
   * Backend-generated identifier.
   *
   * Documented format:
   * <PROF_ID|ADMIN_ID>/<CAMPUS>/<YYMMDD>
   */
  attendanceId: string;

  /**
   * Exactly one should normally be populated.
   */
  professor: Professor | null;

  admin: Admin | null;

  /**
   * Actual calendar date.
   *
   * Format:
   * YYYY-MM-DD
   */
  day: string;

  status: "Present" | "Absent" | string;
}

// ============================================================
// EXAMINATION
// ============================================================

export type ExamType =
  | "INTERNAL"
  | "FINAL";

export interface Examination {
  examId: string;

  subject: Subject;

  semester: number;

  /**
   * Section configured by the administrator for this
   * specific examination.
   *
   * This is the source of truth for the professor marks
   * workflow.
   *
   * The professor must NOT choose a different section.
   */
  section: string;

  examType: ExamType;

  /**
   * INTERNAL:
   *   1, 2, 3...
   *
   * FINAL:
   *   null
   */
  internalNumber: number | null;

  maxMarks: number;

  /**
   * Professor assigned by the administrator to conduct
   * this specific examination.
   */
  professor: Professor;
}

// ============================================================
// STUDENT MARK
// ============================================================
//
// Composite key:
//   studentId + examId
// ============================================================

export interface StudentMark {
  id: {
    studentId: string;
    examId: string;
  };

  student: Student;

  examination: Examination;

  marksObtained: number;
}

// ============================================================
// ADMIN DASHBOARD ANALYTICS
// ============================================================

export interface DashboardAnalytics {
  totalStudents: number;
  activeStudents: number;

  totalProfessors: number;
  activeProfessors: number;

  totalCourses: number;
  totalSubjects: number;
  totalDepartments: number;

  totalAdmins: number;
  activeAdmins: number;

  totalAttendanceRecords: number;
  presentAttendanceRecords: number;
  absentAttendanceRecords: number;

  /**
   * Percentage in range 0-100.
   */
  attendancePercentage: number;
}

// ============================================================
// STUDENT MARKS / EXAM MARK
// ============================================================

export interface ExamMark {
  examId: string;

  examType: ExamType;

  internalNumber: number | null;

  maxMarks: number;

  /**
   * null means marks have not been entered yet.
   */
  marksObtained: number | null;
}

// ============================================================
// SUBJECT MARKS RESULT
// ============================================================

export interface SubjectMarksResult {
  studentId: string;

  subjectId: string;

  semester: number;

  examinations: ExamMark[];

  internalObtained: number;

  internalMaximum: number;

  internalContribution: number | null;

  finalObtained: number;

  finalMaximum: number;

  finalContribution: number | null;

  /**
   * null until all required marks are available.
   */
  subjectTotal: number | null;

  /**
   * true when all marks required to calculate the
   * subject total are present.
   */
  allMarksAvailable: boolean;
}

// ============================================================
// SUBJECT SCORE
// ============================================================

export interface SubjectScore {
  subjectId: string;

  examinations: ExamMark[];

  subjectTotal: number;
}

// ============================================================
// SEMESTER SGPA RESULT
// ============================================================

export interface SemesterSGPAResult {
  studentId: string;

  semester: number;

  subjectCount: number;

  subjects: SubjectScore[];

  sgpa: number;
}

// ============================================================
// AUTHENTICATION
// ============================================================

export type UserRole =
  | "ADMIN"
  | "PROFESSOR"
  | "STUDENT";

export interface AuthUser {
  id: string;

  role: UserRole;

  displayName: string;

  /**
   * True only when the backend has identified the
   * authenticated ADMIN as the configured Special Admin.
   *
   * The frontend must use this server-provided flag
   * instead of comparing the Special Admin ID locally.
   */
  specialAdmin: boolean;
}

// ============================================================
// API ERROR
// ============================================================
//
// Spring Boot responses in this project can be:
//   - plain string
//   - JSON object containing message
//   - empty body
//
// Keeping this type here lets shared utilities reason about
// structured error responses without using "any".
// ============================================================

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}