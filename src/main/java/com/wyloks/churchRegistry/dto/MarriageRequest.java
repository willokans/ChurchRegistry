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
public class MarriageRequest {

    @NotNull(message = "confirmationId is required")
    private Long confirmationId;

    @NotBlank(message = "partnersName is required")
    @Size(max = 255)
    private String partnersName;

    @NotNull(message = "marriageDate is required")
    private LocalDate marriageDate;

    @NotBlank(message = "officiatingPriest is required")
    @Size(max = 255)
    private String officiatingPriest;

    @NotBlank(message = "parish is required")
    @Size(max = 255)
    private String parish;
}
