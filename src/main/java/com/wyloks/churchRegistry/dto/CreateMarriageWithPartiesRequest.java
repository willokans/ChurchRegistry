package com.wyloks.churchRegistry.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMarriageWithPartiesRequest {

    @Valid
    @NotNull(message = "marriage is required")
    private MarriageDetails marriage;

    @Valid
    @NotNull(message = "groom is required")
    private PartyDetails groom;

    @Valid
    @NotNull(message = "bride is required")
    private PartyDetails bride;

    @Valid
    @NotNull(message = "witnesses are required")
    private List<WitnessDetails> witnesses;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MarriageDetails {

        @NotBlank(message = "partnersName is required")
        @Size(max = 255)
        private String partnersName;

        // Frontend sends `parishId` but Spring uses `parish` string in MarriageRequest.
        private Long parishId;

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

        @Size(max = 255)
        private String canonicalNotes;

        @NotBlank(message = "officiatingPriest is required")
        @Size(max = 255)
        private String officiatingPriest;

        @NotBlank(message = "parish is required")
        @Size(max = 255)
        private String parish;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartyDetails {
        @NotBlank(message = "fullName is required")
        @Size(max = 255)
        private String fullName;

        private LocalDate dateOfBirth;

        @Size(max = 255)
        private String placeOfBirth;

        @Size(max = 255)
        private String nationality;

        @Size(max = 255)
        private String residentialAddress;

        @Size(max = 255)
        private String phone;

        @Size(max = 255)
        private String email;

        @Size(max = 255)
        private String occupation;

        @Size(max = 255)
        private String maritalStatus;

        // Used only for display / linking certificate metadata; marriage creation uses confirmationId.
        private Integer baptismId;
        private Integer communionId;
        private Integer confirmationId;

        private String baptismCertificatePath;
        private String communionCertificatePath;
        private String confirmationCertificatePath;

        private String baptismChurch;
        private String communionChurch;
        private String confirmationChurch;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WitnessDetails {
        @NotBlank(message = "witness fullName is required")
        @Size(max = 255)
        private String fullName;

        @Size(max = 255)
        private String phone;

        @Size(max = 255)
        private String address;

        private Integer sortOrder;
    }
}

