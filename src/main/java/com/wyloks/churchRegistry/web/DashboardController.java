package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Dashboard counts endpoint for accurate parish record totals.
 * Uses count queries instead of paginated list to avoid undercount for parishes with 50+ records.
 */
@RestController
@RequestMapping("/api/parishes")
@RequiredArgsConstructor
public class DashboardController {

    private final BaptismRepository baptismRepository;
    private final FirstHolyCommunionRepository communionRepository;
    private final ConfirmationRepository confirmationRepository;
    private final MarriageRepository marriageRepository;
    private final HolyOrderRepository holyOrderRepository;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/{parishId}/dashboard-counts")
    public Map<String, Long> getDashboardCounts(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);

        long baptisms = baptismRepository.countByParishId(parishId);
        long communions = communionRepository.countByBaptismParishId(parishId);
        long confirmations = confirmationRepository.countByBaptismParishId(parishId);
        long marriages = marriageRepository.countByBaptismParishId(parishId);
        long holyOrders = holyOrderRepository.countByBaptismParishId(parishId);

        return Map.of(
                "baptisms", baptisms,
                "communions", communions,
                "confirmations", confirmations,
                "marriages", marriages,
                "holyOrders", holyOrders
        );
    }
}
