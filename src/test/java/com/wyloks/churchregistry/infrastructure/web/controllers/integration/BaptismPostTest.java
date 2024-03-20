package com.wyloks.churchregistry.infrastructure.web.controllers.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wyloks.churchregistry.application.dtos.BaptismDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BaptismPostTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

//    @MockBean
//    BaptismServiceV1 baptismServiceV1;

    @Test
    void testCreateBatchBaptismRecord_Success() throws Exception {
        // Create a list of BaptismDTO.PostRequest objects
        List<BaptismDTO.PostRequest> postRequests = new ArrayList<>();
        // Add your BaptismDTO.PostRequest objects here
        postRequests.add(BaptismDTO.PostRequest.builder()
                        .baptismalName("Test")
                        .church("test church")
                .build());


        // Convert the list of PostRequests to JSON
        String requestBody = objectMapper.writeValueAsString(postRequests);

        // Perform POST request
        ResultActions resultActions = mockMvc.perform(post("/api/v1/church-registry/baptisms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody));

        // Verify the response
        resultActions.andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        // Add more assertions as needed
    }

    @Test
    void testCreateBatchBaptismRecord_Failure() throws Exception {
        // Create an empty list of BaptismDTO.PostRequest objects
        List<BaptismDTO.PostRequest> postRequests = Collections.emptyList();
        // Convert the list of PostRequests to JSON
        String requestBody = objectMapper.writeValueAsString(postRequests);

        // Perform POST request
        ResultActions resultActions = mockMvc.perform(post("/api/v1/church-registry/baptisms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody));

        // Verify the response
        resultActions.andExpect(status().isInternalServerError());
    }

    @Test
    void testCreateSingleBaptismRecord_Success() throws Exception {
        // Create a list of BaptismDTO.PostRequest objects
        BaptismDTO.PostRequest postRequests = BaptismDTO.PostRequest.builder()
                .baptismalName("Test")
                .church("test church")
                .build();

        // Convert the list of PostRequests to JSON
        String requestBody = objectMapper.writeValueAsString(postRequests);

        // Perform POST request
        ResultActions resultActions = mockMvc.perform(post("/api/v1/church-registry/baptism")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody));

        // Verify the response
        resultActions.andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        // Add more assertions as needed
    }

//    @Test
//    void testCreateSingleBaptismRecord_Failure() throws Exception {
//
//        //when(baptismServiceV1.createSingleBaptismRecord(any(BaptismDTO.PostRequest.class))).thenReturn(null);
//        // Create an empty list of BaptismDTO.PostRequest objects
//        List<BaptismDTO.PostRequest> postRequests = Collections.emptyList();
//        // Convert the list of PostRequests to JSON
//        String requestBody = objectMapper.writeValueAsString(postRequests);
//
//        // Perform POST request
//        ResultActions resultActions = mockMvc.perform(post("/api/v1/church-registry/baptism")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(requestBody));
//
//        // Verify the response
//        resultActions.andExpect(status().isInternalServerError());
//    }
}

