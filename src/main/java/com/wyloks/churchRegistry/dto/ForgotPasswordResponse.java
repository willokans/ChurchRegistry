package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForgotPasswordResponse {

    /**
     * Time-limited token to use with POST /api/auth/reset-password-by-token.
     * MVP: no email sent; Super Admin shares this token with the user.
     */
    private String token;

    /**
     * When the token expires (ISO-8601).
     */
    private Instant expiresAt;
}
