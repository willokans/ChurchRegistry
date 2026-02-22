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
public class HolyOrderResponse {

    private Long id;
    private Long baptismId;
    private Long communionId;
    private Long confirmationId;
    private LocalDate ordinationDate;
    private String orderType;
    private String officiatingBishop;
    private Long parishId;
}
