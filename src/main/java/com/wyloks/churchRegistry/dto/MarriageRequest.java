package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

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

    private LocalTime marriageTime;

    @Size(max = 255)
    private String churchName;

    @Size(max = 255)
    private String marriageRegister;

    @Size(max = 255)
    private String diocese;

    @Size(max = 255)
    private String civilRegistryNumber;

    private Boolean dispensationGranted;

    private String canonicalNotes;

    @NotBlank(message = "officiatingPriest is required")
    @Size(max = 255)
    private String officiatingPriest;

    @NotBlank(message = "parish is required")
    @Size(max = 255)
    private String parish;
}
