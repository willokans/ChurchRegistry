package com.wyloks.churchregistry.repositoryTests;

import com.wyloks.churchregistry.domain.models.Baptism;
import com.wyloks.churchregistry.domain.models.Marriage;
import com.wyloks.churchregistry.domain.repositories.MarriageRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.InvalidDataAccessApiUsageException;

import java.time.ZonedDateTime;

@DataJpaTest
//@SpringBootTest
public class MarriageRepositoryTest {

    @Autowired
    private MarriageRepository marriageRepository;

//    @Test
//    void testMarriageCreateWithNoBaptismRecord_shouldThrowIllegalArgumentException() {
//        // Create a Marriage entity with null Baptism
//        Marriage marriage = Marriage.builder()
//                .marriageDate(ZonedDateTime.now())
//                .marriedTo("Mary John")
//                .id(1L)
//                .churchName("Test Church")
//                .churchAddress("Address")
//                .build();
//
//        // Check if IllegalArgumentException is thrown with the expected message
//        InvalidDataAccessApiUsageException exception = Assertions.assertThrows(InvalidDataAccessApiUsageException.class, () -> {
//            marriageRepository.saveMarriageRecord(marriage);
//        });
//
//        Assertions.assertTrue(exception.getMessage().contains("Baptism record for Marriage registry cannot be null"));
//    }
//
//    @Test
//    void testConfirmationCreateWithBaptismRecord_shouldSaveRecord() {
//        // Given
//        Baptism baptism = Baptism.builder().id(1L).build();
//
//
//        Marriage marriage = Marriage.builder()
//                .marriageDate(ZonedDateTime.now())
//                .marriedTo("Mary John")
//                .id(1L)
//                .churchName("Test Church")
//                .churchAddress("Address")
//                .baptism(baptism)
//                .build();
//
//        // When
//        marriageRepository.saveMarriageRecord(marriage);
//
//        // Then
//        Marriage savedMarriage = marriageRepository.findById(marriage.getId()).orElse(null);
//        Assertions.assertNotNull(savedMarriage);
//        Assertions.assertNotNull(savedMarriage.getBaptism());
//        Assertions.assertEquals(1L, savedMarriage.getBaptism().getId());
//    }
}
