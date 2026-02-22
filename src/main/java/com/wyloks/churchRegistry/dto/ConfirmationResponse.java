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
public class ConfirmationResponse {

    private Long id;
    private Long baptismId;
    private Long communionId;
    private LocalDate confirmationDate;
    private String officiatingBishop;
    private String parish;
}
