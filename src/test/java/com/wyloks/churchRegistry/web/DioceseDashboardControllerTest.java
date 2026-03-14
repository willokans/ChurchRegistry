package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.DioceseDashboardResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.DioceseDashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.wyloks.churchRegistry.config.TestSecurityConfig;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DioceseDashboardController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class DioceseDashboardControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    DioceseDashboardService dioceseDashboardService;

    @MockBean
    SacramentAuthorizationService authorizationService;

    @Test
    void getDioceseDashboard_returns200AndResponse_whenAuthorized() throws Exception {
        Long dioceseId = 1L;
        DioceseDashboardResponse response = DioceseDashboardResponse.builder()
                .counts(Map.of(
                        "parishes", 3L,
                        "baptisms", 10L,
                        "communions", 8L,
                        "confirmations", 6L,
                        "marriages", 4L,
                        "holyOrders", 2L))
                .parishActivity(List.of(
                        DioceseDashboardResponse.ParishActivityItem.builder()
                                .parishId(1L)
                                .parishName("St. Joseph")
                                .baptisms(5L)
                                .communions(4L)
                                .confirmations(3L)
                                .marriages(2L)
                                .build()))
                .recentSacraments(DioceseDashboardResponse.RecentSacraments.builder()
                        .baptisms(List.of())
                        .communions(List.of())
                        .confirmations(List.of())
                        .marriages(List.of())
                        .build())
                .monthly(DioceseDashboardResponse.MonthlyData.builder()
                        .baptisms(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .communions(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .confirmations(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .marriages(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .build())
                .build();

        doNothing().when(authorizationService).requireDioceseAccess(dioceseId);
        when(dioceseDashboardService.getDioceseDashboard(dioceseId)).thenReturn(response);

        mvc.perform(get("/api/dioceses/{dioceseId}/dashboard", dioceseId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.counts.parishes").value(3))
                .andExpect(jsonPath("$.counts.baptisms").value(10))
                .andExpect(jsonPath("$.counts.communions").value(8))
                .andExpect(jsonPath("$.counts.confirmations").value(6))
                .andExpect(jsonPath("$.counts.marriages").value(4))
                .andExpect(jsonPath("$.counts.holyOrders").value(2))
                .andExpect(jsonPath("$.parishActivity").isArray())
                .andExpect(jsonPath("$.parishActivity.length()").value(1))
                .andExpect(jsonPath("$.parishActivity[0].parishId").value(1))
                .andExpect(jsonPath("$.parishActivity[0].parishName").value("St. Joseph"))
                .andExpect(jsonPath("$.recentSacraments").exists())
                .andExpect(jsonPath("$.monthly").exists());
    }

    @Test
    void getDioceseDashboard_returns403_whenAuthorizationDenied() throws Exception {
        Long dioceseId = 1L;

        doThrow(new ResponseStatusException(FORBIDDEN, "Diocese access denied"))
                .when(authorizationService).requireDioceseAccess(eq(dioceseId));

        mvc.perform(get("/api/dioceses/{dioceseId}/dashboard", dioceseId))
                .andExpect(status().isForbidden());
    }

    @Test
    void getDioceseDashboard_delegatesToService_withCorrectDioceseId() throws Exception {
        Long dioceseId = 42L;
        DioceseDashboardResponse response = DioceseDashboardResponse.builder()
                .counts(Map.of("parishes", 0L, "baptisms", 0L, "communions", 0L,
                        "confirmations", 0L, "marriages", 0L, "holyOrders", 0L))
                .parishActivity(List.of())
                .recentSacraments(DioceseDashboardResponse.RecentSacraments.builder()
                        .baptisms(List.of())
                        .communions(List.of())
                        .confirmations(List.of())
                        .marriages(List.of())
                        .build())
                .monthly(DioceseDashboardResponse.MonthlyData.builder()
                        .baptisms(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .communions(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .confirmations(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .marriages(List.of(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                        .build())
                .build();

        doNothing().when(authorizationService).requireDioceseAccess(dioceseId);
        when(dioceseDashboardService.getDioceseDashboard(dioceseId)).thenReturn(response);

        mvc.perform(get("/api/dioceses/{dioceseId}/dashboard", dioceseId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.parishes").value(0));
    }
}
