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
public class MarriageResponse {

    private Long id;
    private Long baptismId;
    private Long communionId;
    private Long confirmationId;
    private String partnersName;
    private LocalDate marriageDate;
    private String officiatingPriest;
    private String parish;
}
