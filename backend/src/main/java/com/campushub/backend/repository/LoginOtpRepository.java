package com.campushub.backend.repository;

import com.campushub.backend.entity.LoginOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoginOtpRepository extends JpaRepository<LoginOtp, Long> {

    Optional<LoginOtp> findTopByTargetIdOrderByGeneratedAtDesc(
            String targetId
    );
}