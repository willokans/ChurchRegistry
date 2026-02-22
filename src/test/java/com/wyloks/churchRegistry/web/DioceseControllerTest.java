package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wyloks.churchRegistry.dto.DioceseRequest;
import com.wyloks.churchRegistry.dto.DioceseResponse;
import com.wyloks.churchRegistry.service.DioceseService;
import com.wyloks.churchRegistry.service.ParishService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DioceseController.class)
class DioceseControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    DioceseService dioceseService;

    @MockBean
    ParishService parishService;

    @Test
    void getAllDioceses_returnsEmptyList_whenNoneExist() throws Exception {
        when(dioceseService.findAll()).thenReturn(List.of());

        mvc.perform(get("/api/dioceses"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getParishesByDiocese_returnsEmptyList_whenNoneExist() throws Exception {
        when(parishService.findByDioceseId(1L)).thenReturn(List.of());

        mvc.perform(get("/api/dioceses/1/parishes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createDiocese_returns201AndBody_whenValid() throws Exception {
        DioceseRequest request = new DioceseRequest("Lagos Diocese", "LAG", "Archdiocese of Lagos");
        DioceseResponse response = new DioceseResponse(1L, "Lagos Diocese", "LAG", "Archdiocese of Lagos");

        when(dioceseService.create(any(DioceseRequest.class))).thenReturn(response);

        mvc.perform(post("/api/dioceses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.dioceseName").value("Lagos Diocese"))
                .andExpect(jsonPath("$.code").value("LAG"))
                .andExpect(jsonPath("$.description").value("Archdiocese of Lagos"));
    }

    @Test
    void getDioceseById_returns200AndBody_whenExists() throws Exception {
        DioceseResponse response = new DioceseResponse(1L, "Lagos Diocese", "LAG", null);
        when(dioceseService.findById(1L)).thenReturn(java.util.Optional.of(response));

        mvc.perform(get("/api/dioceses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.dioceseName").value("Lagos Diocese"));
    }

    @Test
    void getDioceseById_returns404_whenNotExists() throws Exception {
        when(dioceseService.findById(999L)).thenReturn(java.util.Optional.empty());

        mvc.perform(get("/api/dioceses/999"))
                .andExpect(status().isNotFound());
    }
}
