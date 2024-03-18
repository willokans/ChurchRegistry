package com.wyloks.churchregistry.repositoryTests;

import com.wyloks.churchregistry.domain.models.Baptism;
import com.wyloks.churchregistry.domain.repositories.BaptismRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.ZonedDateTime;
import java.util.List;

@SpringBootTest
public class BaptismRepositoryTest {

    @Autowired
    private BaptismRepository baptismRepository;

    @BeforeEach
    void dataSetup(){
        Baptism baptism1 = new Baptism();
        baptism1.setBaptismalName("John");
        baptism1.setSurname("Walsh");
        baptism1.setDateOfBirth(ZonedDateTime.now());
        baptism1.setFatherFullName("fatherName1");
        baptism1.setMotherFullName("motherName1");
        baptism1.setFatherFullAddress("address11");
        baptism1.setMotherFullAddress("address21");
        baptism1.setSponsor1FullName("test1");
        baptism1.setSponsor2FullName("test1");
        baptism1.setChurch("church1");
        baptism1.setOfficiatingPriest("Priest1");
        baptismRepository.save(baptism1);
    }

    @Test
    void createBaptism_shouldCreateRecord(){
        List<Baptism> baptisms = baptismRepository.findAll();
        Assertions.assertEquals(1L, baptisms.get(0).getId());
        Assertions.assertEquals(1, baptisms.size());
    }

    @Test
    void createBaptism_shouldCreateRecordQWithBuilder(){
        baptismRepository.save(
                Baptism.builder()
                        .baptismalName("Pheobe")
                        .surname("Okan")
                        .dateOfBirth(ZonedDateTime.now())
                        .fatherFullName("fatherName2")
                        .motherFullName("motherName2")
                        .fatherFullAddress("address12")
                        .motherFullAddress("address21")
                        .sponsor1FullName("test2")
                        .sponsor2FullName("test2")
                        .church("church2")
                        .officiatingPriest("Priest1")
                        .build());
        baptismRepository.findAll();
        Assertions.assertEquals(2, baptismRepository.findAll().get(1).getId());
        Assertions.assertEquals(3, baptismRepository.count());
    }
}
