package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Consolidated dashboard data: counts and recent records for charts and activity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    private Map<String, Long> counts;
    private List<BaptismResponse> baptisms;
    private List<FirstHolyCommunionResponse> communions;
    private List<ConfirmationResponse> confirmations;
    private List<MarriageResponse> marriages;
}
