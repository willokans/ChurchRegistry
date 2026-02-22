package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.LoginResponse;

public interface AuthService {

    /**
     * Authenticates user and returns JWT, refresh token and user info, or throws BadCredentialsException.
     */
    LoginResponse login(String username, String password);

    /**
     * Exchanges a valid refresh token for a new access token (and new refresh token). Throws BadCredentialsException if invalid or expired.
     */
    LoginResponse refresh(String refreshToken);

    /**
     * Invalidates the given refresh token (e.g. on logout). Idempotent: safe to call if token already invalid or missing.
     */
    void logout(String refreshToken);
}
