package com.campushub.backend.service;

import com.campushub.backend.entity.UserSession;
import com.campushub.backend.repository.UserSessionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserSessionService {

    private final UserSessionRepository userSessionRepository;

    public UserSessionService(
            UserSessionRepository userSessionRepository) {

        this.userSessionRepository = userSessionRepository;
    }

    // -------------------------------------------------------------------
    // START SESSION
    // -------------------------------------------------------------------

    public UserSession startSession(
            String userId,
            String role,
            String phoneNumber) {

        UserSession session = new UserSession();

        session.setSessionId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setRole(role);
        session.setPhoneNumber(phoneNumber);
        session.setLoginTime(LocalDateTime.now());
        session.setLogoutTime(null);

        return userSessionRepository.save(session);
    }

    // -------------------------------------------------------------------
    // END SESSION
    // -------------------------------------------------------------------

    public void endSession(String sessionId) {

        if (sessionId == null || sessionId.isBlank()) {
            return;
        }

        userSessionRepository.findById(sessionId)
                .ifPresent(session -> {

                    // Only close an active session.
                    // If logout_time is already populated,
                    // leave the existing logout time unchanged.
                    if (session.getLogoutTime() == null) {

                        session.setLogoutTime(LocalDateTime.now());

                        userSessionRepository.save(session);
                    }
                });
    }

    // -------------------------------------------------------------------
    // GET ALL SESSIONS
    // -------------------------------------------------------------------

    public List<UserSession> getAllSessions() {

        return userSessionRepository
                .findAllByOrderByLoginTimeDesc();
    }

    // -------------------------------------------------------------------
    // GET SESSIONS FOR ONE USER
    // -------------------------------------------------------------------

    public List<UserSession> getSessionsForUser(String userId) {

        if (userId == null || userId.isBlank()) {
            return List.of();
        }

        return userSessionRepository
                .findByUserIdOrderByLoginTimeDesc(userId);
    }
}