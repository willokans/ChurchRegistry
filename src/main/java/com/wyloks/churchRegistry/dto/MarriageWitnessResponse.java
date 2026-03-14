package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarriageWitnessResponse {

    private Long id;
    private Long marriageId;
    private String fullName;
    private String phone;
    private String address;
    private Integer sortOrder;
}
