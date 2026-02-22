package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
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

import com.wyloks.churchRegistry.config.TestSecurityConfig;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = FirstHolyCommunionController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class FirstHolyCommunionControllerTest {

    @Autowired
    MockMvc mvc;

    ObjectMapper objectMapper;

    @MockBean
    FirstHolyCommunionService communionService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void create_returns201_whenValid() throws Exception {
        FirstHolyCommunionRequest request = FirstHolyCommunionRequest.builder()
                .baptismId(1L)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .build();
        FirstHolyCommunionResponse response = FirstHolyCommunionResponse.builder()
                .id(1L)
                .baptismId(1L)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .build();

        when(communionService.create(any(FirstHolyCommunionRequest.class))).thenReturn(response);

        mvc.perform(post("/api/communions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.baptismId").value(1));
    }

    @Test
    void getByParish_returnsEmptyList_whenNone() throws Exception {
        when(communionService.findByParishId(1L)).thenReturn(List.of());

        mvc.perform(get("/api/parishes/1/communions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getById_returns404_whenNotExists() throws Exception {
        when(communionService.findById(999L)).thenReturn(java.util.Optional.empty());

        mvc.perform(get("/api/communions/999"))
                .andExpect(status().isNotFound());
    }
}
