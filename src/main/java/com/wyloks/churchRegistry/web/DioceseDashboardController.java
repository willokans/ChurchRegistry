package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.DioceseDashboardResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.DioceseDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Diocese-level dashboard endpoints. Returns aggregated counts, parish activity,
 * cross-parish recent sacraments, and monthly chart data.
 * Access restricted to ADMIN and SUPER_ADMIN.
 * Diocese dashboard is cached for 2 minutes to reduce database load.
 */
@RestController
@RequestMapping("/api/dioceses")
@RequiredArgsConstructor
public class DioceseDashboardController {

    private final DioceseDashboardService dioceseDashboardService;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/{dioceseId}/dashboard")
    public DioceseDashboardResponse getDioceseDashboard(@PathVariable Long dioceseId) {
        authorizationService.requireDioceseAccess(dioceseId);
        return dioceseDashboardService.getDioceseDashboard(dioceseId);
    }
}
