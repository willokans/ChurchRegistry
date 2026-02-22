package com.wyloks.churchRegistry.security;

public interface JwtService {

    String generateToken(String username, String role);

    boolean isValid(String token);

    String getUsername(String token);
}
