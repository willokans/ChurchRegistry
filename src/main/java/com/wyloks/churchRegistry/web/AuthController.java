package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.LoginRequest;
import com.wyloks.churchRegistry.dto.LoginResponse;
import com.wyloks.churchRegistry.dto.RefreshRequest;
import com.wyloks.churchRegistry.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login", description = "Authenticate with username and password. Returns access token (JWT) and refresh token. Use the access token in Authorization header for other API calls.")
    @ApiResponse(responseCode = "401", description = "Invalid credentials")
    @SecurityRequirements
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Refresh token", description = "Exchange a valid refresh token for a new access token and a new refresh token. The previous refresh token is invalidated.")
    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    @SecurityRequirements
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        LoginResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Void> handleBadCredentials() {
        return ResponseEntity.status(401).build();
    }
}
