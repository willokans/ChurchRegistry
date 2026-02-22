package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolyOrderRequest {

    @NotNull(message = "confirmationId is required")
    private Long confirmationId;

    @NotNull(message = "ordinationDate is required")
    private LocalDate ordinationDate;

    @NotBlank(message = "orderType is required")
    @Size(max = 20)
    private String orderType;

    @NotBlank(message = "officiatingBishop is required")
    @Size(max = 255)
    private String officiatingBishop;

    private Long parishId;
}
