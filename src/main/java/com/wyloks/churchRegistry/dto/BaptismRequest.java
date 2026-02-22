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
public class BaptismRequest {

    @NotBlank(message = "baptismName is required")
    @Size(max = 255)
    private String baptismName;

    @NotBlank(message = "surname is required")
    @Size(max = 255)
    private String surname;

    @NotBlank(message = "gender is required")
    @Size(max = 10)
    private String gender;

    @NotNull(message = "dateOfBirth is required")
    private LocalDate dateOfBirth;

    @NotBlank(message = "fathersName is required")
    @Size(max = 255)
    private String fathersName;

    @NotBlank(message = "mothersName is required")
    @Size(max = 255)
    private String mothersName;

    @NotBlank(message = "sponsorNames is required")
    @Size(max = 255)
    private String sponsorNames;

    private Long parishId;

    @Size(max = 500)
    private String address;

    @Size(max = 500)
    private String parishAddress;

    @Size(max = 500)
    private String parentAddress;
}
