package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarriagePartyResponse {

    private Long id;
    private Long marriageId;
    private String role;
    private String fullName;
    private LocalDate dateOfBirth;
    private String placeOfBirth;
    private String nationality;
    private String residentialAddress;
    private String phone;
    private String email;
    private String occupation;
    private String maritalStatus;
    private Long baptismId;
    private Long communionId;
    private Long confirmationId;
    private String baptismCertificatePath;
    private String communionCertificatePath;
    private String confirmationCertificatePath;
    private String baptismChurch;
    private String communionChurch;
    private String confirmationChurch;
}
