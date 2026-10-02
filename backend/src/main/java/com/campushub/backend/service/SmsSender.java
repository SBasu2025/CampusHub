package com.campushub.backend.service;

public interface SmsSender {

    void sendOtp(String phoneNumber, String otp);
}