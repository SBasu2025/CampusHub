package com.campushub.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final DemoAdminDeleteInterceptor demoAdminDeleteInterceptor;

    public WebConfig(
            DemoAdminDeleteInterceptor demoAdminDeleteInterceptor) {

        this.demoAdminDeleteInterceptor =
                demoAdminDeleteInterceptor;
    }

    @Override
    public void addInterceptors(
            InterceptorRegistry registry) {

        registry.addInterceptor(
                demoAdminDeleteInterceptor
        );
    }
}