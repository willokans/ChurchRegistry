package com.wyloks.churchregistry.testTemplates;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;

import java.util.Collections;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class IntegrationTestTemplate {

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeAll
    void setRestTemplate(){
        restTemplate.getRestTemplate().setInterceptors(Collections.singletonList((request, body, execute) -> {
//            request.getHeaders().add("USER", "test@db.com");
            return execute.execute(request, body);
        }));
    }
}
