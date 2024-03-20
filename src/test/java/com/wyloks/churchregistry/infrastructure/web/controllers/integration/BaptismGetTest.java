package com.wyloks.churchregistry.infrastructure.web.controllers.integration;

import com.wyloks.churchregistry.application.dtos.BaptismDTO;
import com.wyloks.churchregistry.domain.models.Baptism;
import com.wyloks.churchregistry.domain.repositories.BaptismRepository;
import com.wyloks.churchregistry.testTemplates.IntegrationTestTemplate;
import lombok.Getter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

public class BaptismGetTest extends IntegrationTestTemplate {

    private static final String URL = "/api/v1/church-registry";

    @Autowired
    private TestRestTemplate restTemplate;

    @MockBean
    private BaptismRepository baptismRepository;

    private final List<BaptismDTO> testBaptism = new ArrayList<>();

    @BeforeEach
    void initData(){
        Mockito.when(baptismRepository.findAllById(Mockito.any())).thenAnswer(invocationOnMock -> {
            List<Long> ids = invocationOnMock.getArgument(0);
            return ids.stream().map(id -> {
                Baptism baptism = new Baptism();
                baptism.setId(id);
                return baptism;
            }).collect(Collectors.toList());
        });
    }

//    @Test
//    void getBaptismRecord_shouldReturnBaptismRecord(){
//        ResponseEntity<BaptismPage> response = fetch(URL);
//        assertEquals(HttpStatus.OK, response.getStatusCode());
//        assertNotNull(response.getBody());
//        assertTrue(response.getBody().getRecords().size()>1);
//    }
//
//    @Getter
//    private static class BaptismPage {
//        private final List<BaptismDTO.GetResponse> records = new ArrayList<>();
//    }
//
//    private ResponseEntity<BaptismPage> fetch(String url){
//        ParameterizedTypeReference<BaptismPage> responseType = new ParameterizedTypeReference<>() {};
//        return restTemplate.exchange(url, HttpMethod.GET, null, responseType);
//    }
}
