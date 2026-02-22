package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.LoginResponse;
import com.wyloks.churchRegistry.entity.AppUser;
import com.wyloks.churchRegistry.entity.RefreshToken;
import com.wyloks.churchRegistry.repository.AppUserRepository;
import com.wyloks.churchRegistry.repository.RefreshTokenRepository;
import com.wyloks.churchRegistry.security.JwtService;
import com.wyloks.churchRegistry.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Profile("!auth-slice")
public class AuthServiceImpl implements AuthService {

    private final AppUserRepository appUserRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Override
    @Transactional
    public LoginResponse login(String username, String password) {
        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        String accessToken = jwtService.generateToken(user.getUsername(), user.getRole());
        String refreshTokenValue = createRefreshTokenForUser(user);
        return LoginResponse.builder()
                .token(accessToken)
                .refreshToken(refreshTokenValue)
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional
    public LoginResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenValue(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadCredentialsException("Refresh token expired");
        }
        AppUser user = refreshToken.getUser();
        refreshTokenRepository.delete(refreshToken);
        String newRefreshTokenValue = createRefreshTokenForUser(user);
        String newAccessToken = jwtService.generateToken(user.getUsername(), user.getRole());
        return LoginResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshTokenValue)
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .build();
    }

    private String createRefreshTokenForUser(AppUser user) {
        Instant now = Instant.now();
        String value = UUID.randomUUID().toString().replace("-", "");
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenValue(value)
                .expiresAt(now.plusMillis(refreshExpirationMs))
                .createdAt(now)
                .build();
        refreshTokenRepository.save(token);
        return value;
    }
}
