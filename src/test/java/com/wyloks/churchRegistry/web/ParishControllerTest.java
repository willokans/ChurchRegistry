package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wyloks.churchRegistry.dto.ParishRequest;
import com.wyloks.churchRegistry.dto.ParishResponse;
import com.wyloks.churchRegistry.service.ParishService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ParishController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class ParishControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    ParishService parishService;

    @Test
    void createParish_returns201AndBody_whenValid() throws Exception {
        ParishRequest request = new ParishRequest("St Mary", 1L, "Main parish");
        ParishResponse response = new ParishResponse(1L, "St Mary", 1L, "Main parish");

        when(parishService.create(any(ParishRequest.class))).thenReturn(response);

        mvc.perform(post("/api/parishes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.parishName").value("St Mary"))
                .andExpect(jsonPath("$.dioceseId").value(1));
    }

    @Test
    void getParishById_returns200_whenExists() throws Exception {
        ParishResponse response = new ParishResponse(1L, "St Mary", 1L, null);
        when(parishService.findById(1L)).thenReturn(java.util.Optional.of(response));

        mvc.perform(get("/api/parishes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.parishName").value("St Mary"));
    }

    @Test
    void getParishById_returns404_whenNotExists() throws Exception {
        when(parishService.findById(999L)).thenReturn(java.util.Optional.empty());

        mvc.perform(get("/api/parishes/999"))
                .andExpect(status().isNotFound());
    }
}
