package com.wyloks.churchRegistry.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wyloks.churchRegistry.dto.ReplaceUserParishAccessRequest;
import com.wyloks.churchRegistry.dto.UserParishAccessResponse;
import com.wyloks.churchRegistry.service.UserParishAccessService;
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
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserAccessController.class)
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("auth-slice")
class UserAccessControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    UserParishAccessService userParishAccessService;

    @Test
    void listUsersWithParishAccess_returns200AndData() throws Exception {
        UserParishAccessResponse response = UserParishAccessResponse.builder()
                .userId(1L)
                .username("priest@church_registry.com")
                .displayName("Priest")
                .role("PRIEST")
                .defaultParishId(2L)
                .parishAccessIds(Set.of(2L, 3L))
                .build();
        when(userParishAccessService.listAllUsersWithParishAccess()).thenReturn(List.of(response));

        mvc.perform(get("/api/admin/users/parish-access"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].userId").value(1))
                .andExpect(jsonPath("$[0].username").value("priest@church_registry.com"))
                .andExpect(jsonPath("$[0].defaultParishId").value(2));
    }

    @Test
    void getUserParishAccess_returns200AndData() throws Exception {
        UserParishAccessResponse response = UserParishAccessResponse.builder()
                .userId(7L)
                .username("secretary@church_registry.com")
                .displayName("Secretary")
                .role("PARISH_SECRETARY")
                .defaultParishId(4L)
                .parishAccessIds(Set.of(4L))
                .build();
        when(userParishAccessService.getUserParishAccess(7L)).thenReturn(response);

        mvc.perform(get("/api/admin/users/7/parish-access"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.role").value("PARISH_SECRETARY"))
                .andExpect(jsonPath("$.parishAccessIds.length()").value(1));
    }

    @Test
    void replaceUserParishAccess_returns200AndUpdatedData() throws Exception {
        ReplaceUserParishAccessRequest request = ReplaceUserParishAccessRequest.builder()
                .parishIds(Set.of(8L, 9L))
                .defaultParishId(8L)
                .build();
        UserParishAccessResponse response = UserParishAccessResponse.builder()
                .userId(11L)
                .username("fr_tomas.walsh@church_registry.com")
                .displayName("Fr Tomas Walsh")
                .role("PRIEST")
                .defaultParishId(8L)
                .parishAccessIds(Set.of(8L, 9L))
                .build();
        when(userParishAccessService.replaceUserParishAccess(any(Long.class), any(ReplaceUserParishAccessRequest.class)))
                .thenReturn(response);

        mvc.perform(put("/api/admin/users/11/parish-access")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(11))
                .andExpect(jsonPath("$.defaultParishId").value(8));
    }
}
