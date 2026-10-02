import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

// ============================================================
// APPLICATION GATE / SHELL
// ============================================================

import AuthGate from "./AuthGate";

import RoleShell from "../components/layout/RoleShell";

// ============================================================
// AUTH
// ============================================================

import Login from "../features/auth/Login";

// ============================================================
// ADMIN
// ============================================================

import AdminDashboard from "../features/admin/dashboard/AdminDashboard";

import AdminDepartments from "../features/admin/departments/AdminDepartments";

import AdminCourses from "../features/admin/courses/AdminCourses";

import AdminSubjects from "../features/admin/subjects/AdminSubjects";

import AdminProfessors from "../features/admin/professors/AdminProfessors";

import AdminProfessorDetail from "../features/admin/professors/AdminProfessorDetail";

import AdminStudents from "../features/admin/students/AdminStudents";



import AdminStudentProfile from "../features/admin/students/AdminStudentProfile";

import AdminTeaching from "../features/admin/teaching/AdminTeaching";

import AdminTimetable from "../features/admin/timetable/AdminTimetable";

import AdminAttendance from "../features/admin/attendance-oversight/AdminAttendance";

import AdminStaffAttendance from "../features/admin/staff-attendance/AdminStaffAttendance";

import AdminExams from "../features/admin/exams/AdminExams";

import AdminAccounts from "../features/admin/accounts/AdminAccounts";

// ============================================================
// PROFESSOR
// ============================================================

import ProfessorDashboard from "../features/professor/dashboard/ProfessorDashboard";

import ProfessorProfile from "../features/professor/profile/ProfessorProfile";

import ProfessorSubjects from "../features/professor/subjects/ProfessorSubjects";

import ProfessorTimetable from "../features/professor/timetable/ProfessorTimetable";

import ProfessorAttendanceIndex from "../features/professor/attendance/ProfessorAttendanceIndex";

import ProfessorAttendance from "../features/professor/attendance/ProfessorAttendance";

import ProfessorAttendanceHistory from "../features/professor/attendance-history/ProfessorAttendanceHistory";

import ProfessorStudents from "../features/professor/students/ProfessorStudents";

import ProfessorStaffAttendance from "../features/professor/staff-attendance/ProfessorStaffAttendance";

import ProfessorExams from "../features/professor/exams/ProfessorExams";

// ============================================================
// STUDENT
// ============================================================

import StudentDashboard from "../features/student/dashboard/StudentDashboard";

import StudentProfile from "../features/student/profile/StudentProfile";

import StudentTimetable from "../features/student/timetable/StudentTimetable";

import StudentAttendance from "../features/student/attendance/StudentAttendance";

import StudentSubjects from "../features/student/subjects/StudentSubjects";

import StudentProfessors from "../features/student/professors/StudentProfessors";

import StudentMarks from "../features/student/marks/StudentMarks";

// ============================================================
// TYPES
// ============================================================

import type { UserRole } from "../lib/api/types";

// ============================================================
// ROUTE METADATA TYPES
// ============================================================

export type RouteRole =
  | "PUBLIC"
  | UserRole;

export interface AppRouteDefinition {
  path: string;
  label: string;
  role: RouteRole;
}

// ============================================================
// ROUTE METADATA
// ============================================================
//
// This metadata is useful for:
// - navigation
// - breadcrumbs
// - future search
// - permission-aware UI
//
// The actual React Router definitions below remain the runtime
// source of truth for navigation.
// ============================================================

export const appRoutes: AppRouteDefinition[] = [
  // ==========================================================
  // PUBLIC
  // ==========================================================

  {
    path: "/login",
    label: "Login",
    role: "PUBLIC",
  },

  // ==========================================================
  // ADMIN
  // ==========================================================

  {
    path: "/admin",
    label: "Dashboard",
    role: "ADMIN",
  },

  {
    path: "/admin/departments",
    label: "Departments",
    role: "ADMIN",
  },

  {
    path: "/admin/courses",
    label: "Courses",
    role: "ADMIN",
  },

  {
    path: "/admin/subjects",
    label: "Subjects",
    role: "ADMIN",
  },

  {
    path: "/admin/professors",
    label: "Professors",
    role: "ADMIN",
  },

  {
    path: "/admin/professors/:id",
    label: "Professor",
    role: "ADMIN",
  },

  {
    path: "/admin/students",
    label: "Students",
    role: "ADMIN",
  },

  {
    path: "/admin/students/:id",
    label: "Student",
    role: "ADMIN",
  },

  {
    path: "/admin/teaching",
    label: "Teaching",
    role: "ADMIN",
  },

  {
    path: "/admin/timetable",
    label: "Timetable",
    role: "ADMIN",
  },

  {
    path: "/admin/attendance",
    label: "Attendance",
    role: "ADMIN",
  },

  {
    path: "/admin/staff-attendance",
    label: "Staff Attendance",
    role: "ADMIN",
  },

  {
    path: "/admin/exams",
    label: "Exams",
    role: "ADMIN",
  },

  {
    path: "/admin/accounts",
    label: "Accounts",
    role: "ADMIN",
  },

  // ==========================================================
  // PROFESSOR
  // ==========================================================

  {
    path: "/professor",
    label: "Dashboard",
    role: "PROFESSOR",
  },

  {
    path: "/professor/profile",
    label: "My Profile",
    role: "PROFESSOR",
  },

  {
    path: "/professor/subjects",
    label: "My Subjects",
    role: "PROFESSOR",
  },

  {
    path: "/professor/timetable",
    label: "Timetable",
    role: "PROFESSOR",
  },

  {
    path: "/professor/attendance",
    label: "Mark Attendance",
    role: "PROFESSOR",
  },

  {
    path: "/professor/attendance/:sessionId",
    label: "Attendance Session",
    role: "PROFESSOR",
  },

  {
    path: "/professor/attendance-history",
    label: "Attendance History",
    role: "PROFESSOR",
  },

  {
    path: "/professor/students",
    label: "Students",
    role: "PROFESSOR",
  },

  {
    path: "/professor/staff-attendance",
    label: "Staff Attendance",
    role: "PROFESSOR",
  },

  {
    path: "/professor/exams",
    label: "Exams",
    role: "PROFESSOR",
  },

  // ==========================================================
  // STUDENT
  // ==========================================================

  {
    path: "/student",
    label: "Dashboard",
    role: "STUDENT",
  },

  {
    path: "/student/profile",
    label: "My Profile",
    role: "STUDENT",
  },

  {
    path: "/student/timetable",
    label: "Timetable",
    role: "STUDENT",
  },

  {
    path: "/student/attendance",
    label: "Attendance",
    role: "STUDENT",
  },

  {
    path: "/student/subjects",
    label: "Subjects",
    role: "STUDENT",
  },

  {
    path: "/student/professors",
    label: "Professors",
    role: "STUDENT",
  },

  {
    path: "/student/marks",
    label: "Marks",
    role: "STUDENT",
  },
];

// ============================================================
// APPLICATION ROUTES
// ============================================================

export default function AppRoutes() {
  return (
    <Routes>
      {/* ======================================================
          PUBLIC
          ====================================================== */}

      <Route
        path="/login"
        element={
          <Login />
        }
      />

      {/* ======================================================
          AUTHENTICATED APPLICATION
          ====================================================== */}

      <Route
        element={
          <AuthGate>
            <Outlet />
          </AuthGate>
        }
      >
        {/* ====================================================
            ADMIN
            ==================================================== */}

        <Route
          path="/admin"
          element={
            <RoleShell role="ADMIN" />
          }
        >
          {/* ==================================================
              DASHBOARD
              ================================================== */}

          <Route
            index
            element={
              <AdminDashboard />
            }
          />

          {/* ==================================================
              ACADEMIC MANAGEMENT
              ================================================== */}

          <Route
            path="departments"
            element={
              <AdminDepartments />
            }
          />

          <Route
            path="courses"
            element={
              <AdminCourses />
            }
          />

          <Route
            path="subjects"
            element={
              <AdminSubjects />
            }
          />

          <Route
            path="professors"
            element={
              <AdminProfessors />
            }
          />

          <Route
            path="professors/:id"
            element={
              <AdminProfessorDetail />
            }
          />

          <Route
            path="students"
            element={
              <AdminStudents />
            }
          />

          {/* ==================================================
              INDIVIDUAL STUDENT PROFILE

              IMPORTANT:
              The original AdminStudentDetail component is kept
              intact elsewhere. The :id route now opens the new
              dedicated profile component so clicking the eye
              icon displays the selected student's information.
              ================================================== */}

          <Route
            path="students/:id"
            element={
              <AdminStudentProfile />
            }
          />

          <Route
            path="teaching"
            element={
              <AdminTeaching />
            }
          />

          <Route
            path="timetable"
            element={
              <AdminTimetable />
            }
          />

          <Route
            path="attendance"
            element={
              <AdminAttendance />
            }
          />

          <Route
            path="staff-attendance"
            element={
              <AdminStaffAttendance />
            }
          />

          {/* ==================================================
              EXAMINATIONS
              ================================================== */}

          <Route
            path="exams"
            element={
              <AdminExams />
            }
          />

          {/* ==================================================
              ADMIN ACCOUNTS
              ================================================== */}

          <Route
            path="accounts"
            element={
              <AdminAccounts />
            }
          />
        </Route>

        {/* ====================================================
            PROFESSOR
            ==================================================== */}

        <Route
          path="/professor"
          element={
            <RoleShell role="PROFESSOR" />
          }
        >
          {/* ==================================================
              DASHBOARD
              ================================================== */}

          <Route
            index
            element={
              <ProfessorDashboard />
            }
          />

          {/* ==================================================
              PROFILE
              ================================================== */}

          <Route
            path="profile"
            element={
              <ProfessorProfile />
            }
          />

          {/* ==================================================
              SUBJECTS
              ================================================== */}

          <Route
            path="subjects"
            element={
              <ProfessorSubjects />
            }
          />

          {/* ==================================================
              TIMETABLE
              ================================================== */}

          <Route
            path="timetable"
            element={
              <ProfessorTimetable />
            }
          />

          {/* ==================================================
              ATTENDANCE INDEX
              ================================================== */}

          <Route
            path="attendance"
            element={
              <ProfessorAttendanceIndex />
            }
          />

          {/* ==================================================
              ATTENDANCE SESSION
              ================================================== */}

          <Route
            path="attendance/:sessionId"
            element={
              <ProfessorAttendance />
            }
          />

          {/* ==================================================
              ATTENDANCE HISTORY
              ================================================== */}

          <Route
            path="attendance-history"
            element={
              <ProfessorAttendanceHistory />
            }
          />

          {/* ==================================================
              STUDENTS
              ================================================== */}

          <Route
            path="students"
            element={
              <ProfessorStudents />
            }
          />

          {/* ==================================================
              STAFF ATTENDANCE
              ================================================== */}

          <Route
            path="staff-attendance"
            element={
              <ProfessorStaffAttendance />
            }
          />

          {/* ==================================================
              EXAMINATIONS
              ================================================== */}

          <Route
            path="exams"
            element={
              <ProfessorExams />
            }
          />
        </Route>

        {/* ====================================================
            STUDENT
            ==================================================== */}

        <Route
          path="/student"
          element={
            <RoleShell role="STUDENT" />
          }
        >
          {/* ==================================================
              DASHBOARD
              ================================================== */}

          <Route
            index
            element={
              <StudentDashboard />
            }
          />

          {/* ==================================================
              PROFILE
              ================================================== */}

          <Route
            path="profile"
            element={
              <StudentProfile />
            }
          />

          {/* ==================================================
              TIMETABLE
              ================================================== */}

          <Route
            path="timetable"
            element={
              <StudentTimetable />
            }
          />

          {/* ==================================================
              ATTENDANCE
              ================================================== */}

          <Route
            path="attendance"
            element={
              <StudentAttendance />
            }
          />

          {/* ==================================================
              SUBJECTS
              ================================================== */}

          <Route
            path="subjects"
            element={
              <StudentSubjects />
            }
          />

          {/* ==================================================
              PROFESSORS
              ================================================== */}

          <Route
            path="professors"
            element={
              <StudentProfessors />
            }
          />

          {/* ==================================================
              MARKS + SGPA
              ================================================== */}

          <Route
            path="marks"
            element={
              <StudentMarks />
            }
          />
        </Route>
      </Route>

      {/* ======================================================
          FALLBACK
          ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}