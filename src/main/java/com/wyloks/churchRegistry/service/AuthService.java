package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.LoginResponse;

public interface AuthService {

    /**
     * Authenticates user and returns JWT and user info, or throws BadCredentialsException.
     */
    LoginResponse login(String username, String password);
}
