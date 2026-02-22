package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wyloks.churchRegistry.config.TestSecurityConfig;
import com.wyloks.churchRegistry.dto.LoginRequest;
import com.wyloks.churchRegistry.dto.LoginResponse;
import com.wyloks.churchRegistry.service.AuthService;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    AuthService authService;

    @Test
    void login_returns200AndToken_whenCredentialsValid() throws Exception {
        LoginRequest request = new LoginRequest("admin", "password");
        LoginResponse response = LoginResponse.builder()
                .token("jwt-token-here")
                .username("admin")
                .displayName("Administrator")
                .role("ADMIN")
                .build();
        when(authService.login("admin", "password")).thenReturn(response);

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-here"))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.displayName").value("Administrator"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void login_returns401_whenCredentialsInvalid() throws Exception {
        LoginRequest request = new LoginRequest("admin", "wrong");
        when(authService.login("admin", "wrong")).thenThrow(new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_returns400_whenUsernameMissing() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"p\"}"))
                .andExpect(status().isBadRequest());
    }
}
