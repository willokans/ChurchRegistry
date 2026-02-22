package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.service.BaptismService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BaptismController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class BaptismControllerTest {

    @Autowired
    MockMvc mvc;

    ObjectMapper objectMapper;

    @MockBean
    BaptismService baptismService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getBaptismsByParish_returnsEmptyList_whenNoneExist() throws Exception {
        when(baptismService.findByParishId(1L)).thenReturn(List.of());

        mvc.perform(get("/api/parishes/1/baptisms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createBaptism_returns201AndBody_whenValid() throws Exception {
        BaptismRequest request = BaptismRequest.builder()
                .baptismName("John")
                .surname("Doe")
                .gender("M")
                .dateOfBirth(LocalDate.of(2020, 1, 15))
                .fathersName("James Doe")
                .mothersName("Mary Doe")
                .sponsorNames("Peter, Paul")
                .parishId(1L)
                .build();
        BaptismResponse response = BaptismResponse.builder()
                .id(1L)
                .baptismName("John")
                .surname("Doe")
                .gender("M")
                .dateOfBirth(LocalDate.of(2020, 1, 15))
                .fathersName("James Doe")
                .mothersName("Mary Doe")
                .sponsorNames("Peter, Paul")
                .parishId(1L)
                .build();

        when(baptismService.create(eq(1L), any(BaptismRequest.class))).thenReturn(response);

        mvc.perform(post("/api/parishes/1/baptisms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.baptismName").value("John"))
                .andExpect(jsonPath("$.surname").value("Doe"));
    }

    @Test
    void getBaptismById_returns200_whenExists() throws Exception {
        BaptismResponse response = BaptismResponse.builder().id(1L).baptismName("John").surname("Doe").build();
        when(baptismService.findById(1L)).thenReturn(java.util.Optional.of(response));

        mvc.perform(get("/api/baptisms/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.baptismName").value("John"));
    }

    @Test
    void getBaptismById_returns404_whenNotExists() throws Exception {
        when(baptismService.findById(999L)).thenReturn(java.util.Optional.empty());

        mvc.perform(get("/api/baptisms/999"))
                .andExpect(status().isNotFound());
    }
}
