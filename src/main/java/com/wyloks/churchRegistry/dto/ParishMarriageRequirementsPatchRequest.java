package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParishMarriageRequirementsPatchRequest {

    @NotNull(message = "requireMarriageConfirmation is required")
    private Boolean requireMarriageConfirmation;
}
