package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Verifies that API is protected by JWT: unauthenticated requests get 401,
 * login returns token, and authenticated requests with token succeed.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiSecurityIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void getDioceses_withoutToken_returns401() throws Exception {
        mvc.perform(get("/api/dioceses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withValidCredentials_returns200AndToken() throws Exception {
        String body = "{\"username\":\"admin\",\"password\":\"password\"}";
        ResultActions result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("admin"));
        String token = objectMapper.readTree(result.andReturn().getResponse().getContentAsString()).get("token").asText();

        mvc.perform(get("/api/dioceses")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void getDioceses_withInvalidToken_returns401() throws Exception {
        mvc.perform(get("/api/dioceses")
                        .header("Authorization", "Bearer invalid-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withInvalidCredentials_returns401() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_returnsRefreshToken() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").exists());
    }

    @Test
    void refresh_returnsNewAccessToken_andNewTokenWorksForApi() throws Exception {
        String loginBody = "{\"username\":\"admin\",\"password\":\"password\"}";
        String loginResponse = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(loginResponse).get("refreshToken").asText();

        ResultActions refreshResult = mvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("admin"));
        String newAccessToken = objectMapper.readTree(refreshResult.andReturn().getResponse().getContentAsString()).get("token").asText();

        mvc.perform(get("/api/dioceses")
                        .header("Authorization", "Bearer " + newAccessToken))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_withInvalidToken_returns401() throws Exception {
        mvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"invalid-or-expired\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_invalidatesRefreshToken_thenRefreshReturns401() throws Exception {
        String loginResponse = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(loginResponse).get("refreshToken").asText();

        mvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }
}
