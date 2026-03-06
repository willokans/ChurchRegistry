package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.DashboardResponse;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.BaptismService;
import com.wyloks.churchRegistry.service.ConfirmationService;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
import com.wyloks.churchRegistry.service.MarriageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Dashboard endpoints. Consolidated /dashboard returns counts + recent records in one call.
 */
@RestController
@RequestMapping("/api/parishes")
@RequiredArgsConstructor
public class DashboardController {

    private static final int DASHBOARD_PAGE_SIZE = 50;

    private final BaptismRepository baptismRepository;
    private final FirstHolyCommunionRepository communionRepository;
    private final ConfirmationRepository confirmationRepository;
    private final MarriageRepository marriageRepository;
    private final HolyOrderRepository holyOrderRepository;
    private final BaptismService baptismService;
    private final FirstHolyCommunionService communionService;
    private final ConfirmationService confirmationService;
    private final MarriageService marriageService;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/{parishId}/dashboard")
    public DashboardResponse getDashboard(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);

        Map<String, Long> counts = Map.of(
                "baptisms", baptismRepository.countByParishId(parishId),
                "communions", communionRepository.countByBaptismParishId(parishId),
                "confirmations", confirmationRepository.countByBaptismParishId(parishId),
                "marriages", marriageRepository.countByBaptismParishId(parishId),
                "holyOrders", holyOrderRepository.countByBaptismParishId(parishId)
        );

        PageRequest page = PageRequest.of(0, DASHBOARD_PAGE_SIZE);
        List<BaptismResponse> baptisms = baptismService.findByParishId(parishId, page).getContent();
        List<FirstHolyCommunionResponse> communions = communionService.findByParishId(parishId, page).getContent();
        List<ConfirmationResponse> confirmations = confirmationService.findByParishId(parishId, page).getContent();
        List<MarriageResponse> marriages = marriageService.findByParishId(parishId, page).getContent();

        return DashboardResponse.builder()
                .counts(counts)
                .baptisms(baptisms)
                .communions(communions)
                .confirmations(confirmations)
                .marriages(marriages)
                .build();
    }

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
