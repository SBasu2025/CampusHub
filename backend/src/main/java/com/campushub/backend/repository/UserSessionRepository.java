package com.campushub.backend.repository;

import com.campushub.backend.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {

    List<UserSession> findByUserIdOrderByLoginTimeDesc(String userId);

    List<UserSession> findAllByOrderByLoginTimeDesc();
}