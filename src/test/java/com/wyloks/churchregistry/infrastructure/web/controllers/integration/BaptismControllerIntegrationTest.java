package com.wyloks.churchregistry.infrastructure.web.controllers.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wyloks.churchregistry.domain.services.BaptismServiceV1;
import com.wyloks.churchregistry.application.dtos.BaptismDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BaptismControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

//    @Test
//    void testGetBaptisms_Success() throws Exception {
//        // Prepare a list of BaptismDTO.GetResponse objects
//        List<BaptismDTO.GetResponse> responseList = new ArrayList<>();
//
//        // Create a mock instance of BaptismServiceV1
//        BaptismServiceV1 baptismService = mock(BaptismServiceV1.class);
//
//        // Mock the service method to return a Page object
//        when(baptismService.getAllBaptismRecord(any(BaptismDTO.GetRequest.class), any(Pageable.class)))
//                .thenAnswer(invocation -> {
//                    // Retrieve the arguments passed to the method call
//                    BaptismDTO.GetRequest getRequest = invocation.getArgument(0);
//                    Pageable pageable = invocation.getArgument(1);
//
//                    // Return a Page object (dummy data for testing)
//                    return new PageImpl<>(responseList, pageable, responseList.size());
//                });
//
//        // Perform GET request
//        ResultActions resultActions = mockMvc.perform(get("/api/v1/church-registry")
//                .param("page", "0")
//                .param("size", "5")
//                .contentType(MediaType.APPLICATION_JSON));
//
//        // Verify the response
//        resultActions.andExpect(status().isOk())
//                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
//        // Add more assertions as needed
//    }
}

