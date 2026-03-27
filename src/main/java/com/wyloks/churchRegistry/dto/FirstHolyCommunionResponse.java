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
public class FirstHolyCommunionResponse {

    private Long id;
    private Long baptismId;
    private LocalDate communionDate;
    private String officiatingPriest;
    private String parish;
    private String baptismCertificatePath;
    private String communionCertificatePath;
    /** True when baptism was recorded as external (another parish) but the certificate file is not yet stored. */
    private boolean baptismCertificatePending;
    private OffsetDateTime createdAt;

    private String baptismName;
    private String otherNames;
    private String surname;
    private LocalDate dateOfBirth;
    private String baptismParishName;
    private String gender;
    private String fathersName;
    private String mothersName;
    private String note;
}
