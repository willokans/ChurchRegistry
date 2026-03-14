package com.wyloks.churchRegistry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Consolidated diocesan dashboard data: aggregated counts, parish activity,
 * cross-parish recent sacraments, and monthly chart data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DioceseDashboardResponse {

    /** Aggregated counts across the diocese: parishes, baptisms, communions, confirmations, marriages, holyOrders. */
    private Map<String, Long> counts;

    /** Per-parish activity: parishId, parishName, and sacrament counts. */
    private List<ParishActivityItem> parishActivity;

    /** Cross-parish recent records for baptism, communion, confirmation, marriage. */
    private RecentSacraments recentSacraments;

    /** Monthly counts per sacrament type for chart (12 elements each). Same shape as parish dashboard. */
    private MonthlyData monthly;

    /**
     * Per-parish activity row for the parish activity table.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParishActivityItem {
        private Long parishId;
        private String parishName;
        private Long baptisms;
        private Long communions;
        private Long confirmations;
        private Long marriages;
    }

    /**
     * Cross-parish recent sacrament records.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentSacraments {
        private List<BaptismResponse> baptisms;
        private List<FirstHolyCommunionResponse> communions;
        private List<ConfirmationResponse> confirmations;
        private List<MarriageResponse> marriages;
    }

    /**
     * Monthly counts per sacrament type for the chart (12 elements per array).
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyData {
        private List<Long> baptisms;
        private List<Long> communions;
        private List<Long> confirmations;
        private List<Long> marriages;
    }
}
