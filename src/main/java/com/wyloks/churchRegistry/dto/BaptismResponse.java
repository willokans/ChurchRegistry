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
public class BaptismResponse {

    private Long id;
    private String baptismName;
    private String surname;
    private String gender;
    private LocalDate dateOfBirth;
    private String fathersName;
    private String mothersName;
    private String sponsorNames;
    private Long parishId;
    private String address;
    private String parishAddress;
    private String parentAddress;
}
