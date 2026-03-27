package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParishResponse {

    private Long id;
    private String parishName;
    private Long dioceseId;
    private String description;
    /** When true, creating a marriage requires a Confirmation record for this parish. */
    private boolean requireMarriageConfirmation;
}
