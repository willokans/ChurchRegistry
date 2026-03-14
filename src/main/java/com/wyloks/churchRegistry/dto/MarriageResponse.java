package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarriageResponse {

    private Long id;
    private Long baptismId;
    private Long communionId;
    private Long confirmationId;
    private String partnersName;
    private LocalDate marriageDate;
    private LocalTime marriageTime;
    private String churchName;
    private String marriageRegister;
    private String diocese;
    private String civilRegistryNumber;
    private Boolean dispensationGranted;
    private String canonicalNotes;
    private String officiatingPriest;
    private String parish;
    private OffsetDateTime createdAt;
    private List<MarriagePartyResponse> parties;
    private List<MarriageWitnessResponse> witnesses;
    private String groomName;
    private String brideName;
    private String groomFatherName;
    private String groomMotherName;
    private String brideFatherName;
    private String brideMotherName;
    private String witnessesDisplay;
    private String note;
}
