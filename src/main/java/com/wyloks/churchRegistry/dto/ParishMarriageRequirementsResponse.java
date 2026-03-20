package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParishMarriageRequirementsResponse {

    private Long parishId;
    private boolean requireMarriageConfirmation;
}
