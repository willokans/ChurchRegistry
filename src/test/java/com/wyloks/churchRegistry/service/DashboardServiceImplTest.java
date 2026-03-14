package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.repository.DashboardRepository;
import com.wyloks.churchRegistry.repository.projection.ParishDashboardCounts;
import com.wyloks.churchRegistry.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    DashboardRepository dashboardRepository;

    @Mock
    BaptismService baptismService;

    @Mock
    FirstHolyCommunionService communionService;

    @Mock
    ConfirmationService confirmationService;

    @Mock
    MarriageService marriageService;

    @InjectMocks
    DashboardServiceImpl dashboardService;

    @Test
    void getParishCounts_returnsMapFromBatchQuery() {
        long parishId = 1L;
        ParishDashboardCounts counts = new ParishDashboardCounts() {
            @Override
            public long getBaptisms() { return 10; }
            @Override
            public long getCommunions() { return 5; }
            @Override
            public long getConfirmations() { return 3; }
            @Override
            public long getMarriages() { return 2; }
            @Override
            public long getHolyOrders() { return 1; }
        };
        when(dashboardRepository.getParishCounts(parishId)).thenReturn(counts);

        Map<String, Long> result = dashboardService.getParishCounts(parishId);

        assertThat(result)
                .containsEntry("baptisms", 10L)
                .containsEntry("communions", 5L)
                .containsEntry("confirmations", 3L)
                .containsEntry("marriages", 2L)
                .containsEntry("holyOrders", 1L);
    }

    @Test
    void getDashboard_returnsCountsAndRecentRecords() {
        long parishId = 1L;
        ParishDashboardCounts counts = new ParishDashboardCounts() {
            @Override
            public long getBaptisms() { return 1; }
            @Override
            public long getCommunions() { return 0; }
            @Override
            public long getConfirmations() { return 0; }
            @Override
            public long getMarriages() { return 0; }
            @Override
            public long getHolyOrders() { return 0; }
        };
        when(dashboardRepository.getParishCounts(parishId)).thenReturn(counts);
        when(baptismService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(new BaptismResponse())));
        when(communionService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(confirmationService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(marriageService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = dashboardService.getDashboard(parishId);

        assertThat(result.getCounts()).containsEntry("baptisms", 1L);
        assertThat(result.getBaptisms()).hasSize(1);
        assertThat(result.getCommunions()).isEmpty();
        assertThat(result.getConfirmations()).isEmpty();
        assertThat(result.getMarriages()).isEmpty();
    }

    @Test
    void getDashboard_requestsPageSize20ForLowBandwidthOptimization() {
        long parishId = 1L;
        ParishDashboardCounts counts = new ParishDashboardCounts() {
            @Override
            public long getBaptisms() { return 0; }
            @Override
            public long getCommunions() { return 0; }
            @Override
            public long getConfirmations() { return 0; }
            @Override
            public long getMarriages() { return 0; }
            @Override
            public long getHolyOrders() { return 0; }
        };
        when(dashboardRepository.getParishCounts(parishId)).thenReturn(counts);
        when(baptismService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(communionService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(confirmationService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(marriageService.findByParishId(eq(parishId), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        dashboardService.getDashboard(parishId);

        ArgumentCaptor<PageRequest> pageCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(baptismService).findByParishId(eq(parishId), pageCaptor.capture());
        assertThat(pageCaptor.getValue().getPageSize()).isEqualTo(20);
        assertThat(pageCaptor.getValue().getPageNumber()).isZero();

        verify(communionService).findByParishId(eq(parishId), pageCaptor.capture());
        assertThat(pageCaptor.getValue().getPageSize()).isEqualTo(20);
        verify(confirmationService).findByParishId(eq(parishId), pageCaptor.capture());
        assertThat(pageCaptor.getValue().getPageSize()).isEqualTo(20);
        verify(marriageService).findByParishId(eq(parishId), pageCaptor.capture());
        assertThat(pageCaptor.getValue().getPageSize()).isEqualTo(20);
    }
}
