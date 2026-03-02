package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminUserAccessSecurityIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void adminUser_canAccessAdminUserParishEndpoints() throws Exception {
        String adminToken = loginAndGetToken("admin", "password");

        String listResponse = mvc.perform(get("/api/admin/users/parish-access")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long firstUserId = objectMapper.readTree(listResponse).get(0).get("userId").asLong();
        mvc.perform(get("/api/admin/users/{id}/parish-access", firstUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminUser_cannotAccessAdminUserParishEndpoints() throws Exception {
        String priestToken = loginAndGetToken("priest@church_registry.com", "password");

        mvc.perform(get("/api/admin/users/parish-access")
                        .header("Authorization", "Bearer " + priestToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").isString());

        mvc.perform(get("/api/admin/users/{id}/parish-access", 1L)
                        .header("Authorization", "Bearer " + priestToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").isString());
    }

    @Test
    void adminUser_getUnknownUserParishAccess_returnsStructured404() throws Exception {
        String adminToken = loginAndGetToken("admin", "password");

        mvc.perform(get("/api/admin/users/{id}/parish-access", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("User not found: " + Long.MAX_VALUE));
    }

    private String loginAndGetToken(String username, String password) throws Exception {
        String response = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode payload = objectMapper.readTree(response);
        return payload.get("token").asText();
    }
}
