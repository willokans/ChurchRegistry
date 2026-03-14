package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaptismCertificateDataResponse {

    private BaptismResponse baptism;
    private String parishName;
    private String dioceseName;
}
