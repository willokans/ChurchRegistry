package com.wyloks.churchregistry.application.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.List;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class BaptismDTO {

    private interface Id { @NotNull Long getId(); }

    private interface BaptismalName { @NotNull String getBaptismalName(); }

    private interface Surname { @NotNull String getSurname(); }

    private interface DateOfBirth { @NotBlank ZonedDateTime getDateOfBirth(); }

    private interface MotherFullName { @NotBlank String getMotherFullName(); }

    private interface  FatherFullName { @NotBlank String getFatherFullName(); }

    private interface  FatherFullAddress { @NotBlank String getFatherFullAddress(); }

    private interface MotherFullAddress { @NotBlank String getMotherFullAddress(); }

    private interface Sponsor1FullName { @NotBlank String getSponsor1FullName(); }

    private interface Sponsor2FullName { @NotBlank String getSponsor2FullName(); }

    private interface Church { @NotBlank String getChurch(); }

    private interface OfficiatingPriest { @NotBlank String getOfficiatingPriest(); }


    @Data
    @Builder
    public static class GetRequest {
        private List<Long> ids;
        private List<String> baptismalNames;
        private List<String> surnames;
        private List<Long> dateOfBirths;
        private List<String> fatherFullNames;
        private List<String> motherFullNames;
        private List<String> fatherFullAddresses;
        private List<String> motherFullAddresses;
        private List<String> sponsor1FullNames;
        private List<String> sponsor2FullNames;
        private List<String> churches;
        private List<String> officiatingPriests;
    }

    @Data
    @Builder
    public static class GetResponse implements Id, BaptismalName, Surname, DateOfBirth, FatherFullName, MotherFullName, FatherFullAddress, MotherFullAddress, Sponsor1FullName, Sponsor2FullName, Church, OfficiatingPriest {
        private Long id;
        private String baptismalName;
        private String surname;
        private ZonedDateTime dateOfBirth;
        private String fatherFullName;
        private String motherFullName;
        private String fatherFullAddress;
        private String motherFullAddress;
        private String sponsor1FullName;
        private String sponsor2FullName;
        private String church;
        private String officiatingPriest;
    }
}
