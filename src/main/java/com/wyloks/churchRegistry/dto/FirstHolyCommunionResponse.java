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
public class FirstHolyCommunionResponse {

    private Long id;
    private Long baptismId;
    private LocalDate communionDate;
    private String officiatingPriest;
    private String parish;
}
