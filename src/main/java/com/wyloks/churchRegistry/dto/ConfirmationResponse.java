package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmationResponse {

    private Long id;
    private Long baptismId;
    private Long communionId;
    private LocalDate confirmationDate;
    private String officiatingBishop;
    private String parish;
    private OffsetDateTime createdAt;
    private String baptismName;
    private String otherNames;
    private String surname;
    private LocalDate dateOfBirth;
    private String gender;
    private String fathersName;
    private String mothersName;
    private String note;
}
