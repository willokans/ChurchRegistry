package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.DioceseDashboardResponse;

/**
 * Service for diocesan dashboard data: aggregated counts, parish activity,
 * cross-parish recent sacraments, and monthly chart data.
 */
public interface DioceseDashboardService {

    /**
     * Returns consolidated dashboard data for a diocese.
     */
    DioceseDashboardResponse getDioceseDashboard(Long dioceseId);
}
