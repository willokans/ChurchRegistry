package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmationRequest {

    @NotNull(message = "communionId is required")
    private Long communionId;

    @NotNull(message = "confirmationDate is required")
    private LocalDate confirmationDate;

    @NotBlank(message = "officiatingBishop is required")
    @Size(max = 255)
    private String officiatingBishop;

    @Size(max = 255)
    private String parish;
}
