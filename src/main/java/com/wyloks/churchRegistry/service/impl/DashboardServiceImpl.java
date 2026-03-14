package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.config.CacheConfig;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.DashboardResponse;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.repository.DashboardRepository;
import com.wyloks.churchRegistry.service.BaptismService;
import com.wyloks.churchRegistry.service.ConfirmationService;
import com.wyloks.churchRegistry.service.DashboardService;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
import com.wyloks.churchRegistry.service.MarriageService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int DASHBOARD_PAGE_SIZE = 20;

    private final DashboardRepository dashboardRepository;
    private final BaptismService baptismService;
    private final FirstHolyCommunionService communionService;
    private final ConfirmationService confirmationService;
    private final MarriageService marriageService;

    @Override
    @Cacheable(cacheNames = CacheConfig.CACHE_PARISH_DASHBOARD, key = "#parishId")
    public DashboardResponse getDashboard(Long parishId) {
        Map<String, Long> counts = getParishCounts(parishId);

        PageRequest page = PageRequest.of(0, DASHBOARD_PAGE_SIZE);
        CompletableFuture<List<BaptismResponse>> baptismsFuture =
                CompletableFuture.supplyAsync(() -> baptismService.findByParishId(parishId, page).getContent());
        CompletableFuture<List<FirstHolyCommunionResponse>> communionsFuture =
                CompletableFuture.supplyAsync(() -> communionService.findByParishId(parishId, page).getContent());
        CompletableFuture<List<ConfirmationResponse>> confirmationsFuture =
                CompletableFuture.supplyAsync(() -> confirmationService.findByParishId(parishId, page).getContent());
        CompletableFuture<List<MarriageResponse>> marriagesFuture =
                CompletableFuture.supplyAsync(() -> marriageService.findByParishId(parishId, page).getContent());

        List<BaptismResponse> baptisms = baptismsFuture.join();
        List<FirstHolyCommunionResponse> communions = communionsFuture.join();
        List<ConfirmationResponse> confirmations = confirmationsFuture.join();
        List<MarriageResponse> marriages = marriagesFuture.join();

        return DashboardResponse.builder()
                .counts(counts)
                .baptisms(baptisms)
                .communions(communions)
                .confirmations(confirmations)
                .marriages(marriages)
                .build();
    }

    @Override
    public Map<String, Long> getParishCounts(Long parishId) {
        var counts = dashboardRepository.getParishCounts(parishId);
        return Map.of(
                "baptisms", counts.getBaptisms(),
                "communions", counts.getCommunions(),
                "confirmations", counts.getConfirmations(),
                "marriages", counts.getMarriages(),
                "holyOrders", counts.getHolyOrders()
        );
    }
}
