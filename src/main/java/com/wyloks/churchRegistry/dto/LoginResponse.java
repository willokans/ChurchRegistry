package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String refreshToken;
    private String username;
    private String displayName;
    private String role;
    /** Default parish for this user (app_user.parish_id). Shown when user logs in. */
    private Long defaultParishId;
}
