package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.DashboardResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Dashboard endpoints. Consolidated /dashboard returns counts + recent records in one call.
 * Parish dashboard is cached for 2 minutes to reduce database load.
 */
@RestController
@RequestMapping("/api/parishes")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/{parishId}/dashboard")
    public DashboardResponse getDashboard(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        return dashboardService.getDashboard(parishId);
    }

    @GetMapping("/{parishId}/dashboard-counts")
    public Map<String, Long> getDashboardCounts(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        return dashboardService.getParishCounts(parishId);
    }
}
