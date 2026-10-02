package com.campushub.backend.controller;

import com.campushub.backend.entity.Attendance;
import com.campushub.backend.entity.AttendanceId;
import com.campushub.backend.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendances")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getAttendance(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String subjectId,
            @RequestParam(required = false) String courseId) {

        try {
            if (studentId != null) {
                return ResponseEntity.ok(
                        attendanceService.getAttendanceByStudent(studentId)
                );
            }

            if (sessionId != null) {
                return ResponseEntity.ok(
                        attendanceService.getAttendanceBySession(sessionId)
                );
            }

            if (subjectId != null) {
                return ResponseEntity.ok(
                        attendanceService.getAttendanceBySubject(subjectId)
                );
            }

            if (courseId != null) {
                return ResponseEntity.ok(
                        attendanceService.getAttendanceByCourse(courseId)
                );
            }

            return ResponseEntity.ok(
                    attendanceService.getAllAttendances()
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{sessionId}/{studentId}")
    public ResponseEntity<Attendance> getAttendanceById(
            @PathVariable String sessionId,
            @PathVariable String studentId) {

        AttendanceId id =
                new AttendanceId(sessionId, studentId);

        return attendanceService.getAttendanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Attendance> createAttendance(
            @RequestBody Attendance attendance) {

        try {
            Attendance savedAttendance =
                    attendanceService.saveAttendance(attendance);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedAttendance);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .build();

        } catch (IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }
    }

    @PutMapping("/{sessionId}/{studentId}")
    public ResponseEntity<Attendance> updateAttendance(
            @PathVariable String sessionId,
            @PathVariable String studentId,
            @RequestParam String status) {

        try {
            Attendance updatedAttendance =
                    attendanceService.updateAttendance(
                            sessionId,
                            studentId,
                            status
                    );

            return ResponseEntity.ok(updatedAttendance);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{sessionId}/{studentId}")
    public ResponseEntity<Void> deleteAttendance(
            @PathVariable String sessionId,
            @PathVariable String studentId) {

        AttendanceId id =
                new AttendanceId(sessionId, studentId);

        if (attendanceService.getAttendanceById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        attendanceService.deleteAttendanceById(id);

        return ResponseEntity.noContent().build();
    }
}