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
public class FirstHolyCommunionRequest {

    @NotNull(message = "baptismId is required")
    private Long baptismId;

    @NotNull(message = "communionDate is required")
    private LocalDate communionDate;

    @NotBlank(message = "officiatingPriest is required")
    @Size(max = 255)
    private String officiatingPriest;

    @NotBlank(message = "parish is required")
    @Size(max = 255)
    private String parish;
}
