package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wyloks.churchRegistry.dto.CreateMarriageWithPartiesRequest;
import com.wyloks.churchRegistry.dto.MarriagePartyResponse;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.dto.MarriageWitnessResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.MarriageService;
import com.wyloks.churchRegistry.service.SacramentAuditService;
import org.junit.jupiter.api.BeforeEach;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.wyloks.churchRegistry.config.TestSecurityConfig;

@WebMvcTest(controllers = MarriageController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class MarriageControllerWithPartiesTest {

    @Autowired
    MockMvc mvc;

    ObjectMapper objectMapper;

    @MockBean
    MarriageService marriageService;

    @MockBean
    SacramentAuthorizationService sacramentAuthorizationService;

    @MockBean
    SacramentAuditService sacramentAuditService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void createWithParties_returns201_andResponseBody() throws Exception {
        CreateMarriageWithPartiesRequest request = CreateMarriageWithPartiesRequest.builder()
                .marriage(CreateMarriageWithPartiesRequest.MarriageDetails.builder()
                        .partnersName("Lewis Hamilton & Jessica Uche")
                        .parishId(1L)
                        .marriageDate(LocalDate.of(2025, 6, 15))
                        .marriageTime(null)
                        .churchName("Holy Family Catholic Church")
                        .marriageRegister("Book 2")
                        .diocese("Abuja Diocese")
                        .civilRegistryNumber("MAR-HFCA-2026-0000077")
                        .dispensationGranted(false)
                        .canonicalNotes("Freedom to marry confirmed")
                        .officiatingPriest("Fr. Rahp Okamunsch")
                        .parish("Life Camp, Abuja")
                        .build())
                .groom(CreateMarriageWithPartiesRequest.PartyDetails.builder()
                        .fullName("Lewis Josh Hamilton")
                        .confirmationId(101)
                        .build())
                .bride(CreateMarriageWithPartiesRequest.PartyDetails.builder()
                        .fullName("Jessica Lynn Uche")
                        .confirmationId(101)
                        .build())
                .witnesses(List.of(
                        CreateMarriageWithPartiesRequest.WitnessDetails.builder()
                                .fullName("Witness One")
                                .phone(null)
                                .address(null)
                                .sortOrder(0)
                                .build(),
                        CreateMarriageWithPartiesRequest.WitnessDetails.builder()
                                .fullName("Witness Two")
                                .phone(null)
                                .address(null)
                                .sortOrder(1)
                                .build()
                ))
                .build();

        MarriagePartyResponse groomParty = MarriagePartyResponse.builder()
                .role("GROOM")
                .fullName("Lewis Josh Hamilton")
                .confirmationId(101L)
                .build();
        MarriagePartyResponse brideParty = MarriagePartyResponse.builder()
                .role("BRIDE")
                .fullName("Jessica Lynn Uche")
                .confirmationId(101L)
                .build();
        MarriageWitnessResponse w1 = MarriageWitnessResponse.builder().fullName("Witness One").sortOrder(0).build();
        MarriageWitnessResponse w2 = MarriageWitnessResponse.builder().fullName("Witness Two").sortOrder(1).build();

        MarriageResponse response = MarriageResponse.builder()
                .id(55L)
                .confirmationId(101L)
                .partnersName("Lewis Hamilton & Jessica Uche")
                .marriageDate(LocalDate.of(2025, 6, 15))
                .officiatingPriest("Fr. Rahp Okamunsch")
                .parish("Life Camp, Abuja")
                .parties(List.of(groomParty, brideParty))
                .witnesses(List.of(w1, w2))
                .build();

        when(marriageService.createWithParties(any(CreateMarriageWithPartiesRequest.class))).thenReturn(response);
        when(sacramentAuthorizationService.findMarriageParishIdByConfirmationId(eq(101L))).thenReturn(Optional.of(10L));

        mvc.perform(post("/api/marriages/with-parties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(55))
                .andExpect(jsonPath("$.confirmationId").value(101))
                .andExpect(jsonPath("$.partnersName").value("Lewis Hamilton & Jessica Uche"))
                .andExpect(jsonPath("$.parties[0].fullName").value("Lewis Josh Hamilton"))
                .andExpect(jsonPath("$.witnesses[1].fullName").value("Witness Two"));
    }

    @Test
    void createWithParties_returns400_whenRequiredNestedFieldsMissing() throws Exception {
        CreateMarriageWithPartiesRequest request = CreateMarriageWithPartiesRequest.builder()
                .marriage(CreateMarriageWithPartiesRequest.MarriageDetails.builder()
                        .partnersName("Lewis Hamilton & Jessica Uche")
                        .parishId(1L)
                        .marriageDate(LocalDate.of(2025, 6, 15))
                        .churchName("Holy Family Catholic Church")
                        // Missing required: officiatingPriest and parish
                        .officiatingPriest("")
                        .parish("")
                        .build())
                .groom(CreateMarriageWithPartiesRequest.PartyDetails.builder()
                        .fullName("Lewis Josh Hamilton")
                        .confirmationId(101)
                        .build())
                .bride(CreateMarriageWithPartiesRequest.PartyDetails.builder()
                        .fullName("Jessica Lynn Uche")
                        .confirmationId(101)
                        .build())
                .witnesses(List.of(
                        CreateMarriageWithPartiesRequest.WitnessDetails.builder()
                                .fullName("Witness One")
                                .sortOrder(0)
                                .build()
                ))
                .build();

        mvc.perform(post("/api/marriages/with-parties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}

