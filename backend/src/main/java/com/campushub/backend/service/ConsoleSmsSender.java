package com.campushub.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "campushub.sms.provider",
        havingValue = "console",
        matchIfMissing = true
)
public class ConsoleSmsSender implements SmsSender {

    private static final Logger log =
            LoggerFactory.getLogger(ConsoleSmsSender.class);

    @Override
    public void sendOtp(String phoneNumber, String code) {

        log.info(
                "=== CampusHub OTP ===  Phone: {}  Code: {}",
                phoneNumber,
                code
        );
    }
}