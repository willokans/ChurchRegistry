package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    /** Email address or username. */
    @NotBlank(message = "Email or username is required")
    private String identifier;
}
