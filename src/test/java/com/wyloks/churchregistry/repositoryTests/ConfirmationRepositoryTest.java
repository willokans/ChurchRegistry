package com.wyloks.churchregistry.repositoryTests;

import com.wyloks.churchregistry.domain.models.Baptism;
import com.wyloks.churchregistry.domain.models.Confirmation;
import com.wyloks.churchregistry.domain.repositories.ConfirmationRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.InvalidDataAccessApiUsageException;

import java.time.ZonedDateTime;

@DataJpaTest
@Transactional
public class ConfirmationRepositoryTest {

    @Autowired
    private ConfirmationRepository confirmationRepository;

//    @Test
//    @Transactional
//    void testConfirmationCreateWithNoBaptismRecord_shouldThrowIllegalArgumentException() {
//        // Create a Confirmation entity with null Baptism
//        Confirmation confirmation = Confirmation.builder()
//                .confirmationName("ConfirmationName")
//                .dateOfConfirmation(ZonedDateTime.now())
//                .churchAddress("ConfirmationAddress")
//                .churchName("ChurchName")
//                .build();
//
//        // Check if IllegalArgumentException is thrown with the expected message
//        InvalidDataAccessApiUsageException exception = Assertions.assertThrows(InvalidDataAccessApiUsageException.class, () -> {
//            confirmationRepository.saveConfirmationRecord(confirmation);
//        });
//
//        Assertions.assertTrue(exception.getMessage().contains("Baptism record for confirmation registry cannot be null"));
//    }
//
//    @Test
//    @Transactional
//    void testConfirmationCreateWithBaptismRecord_shouldSaveRecord() {
//        // Given
//        Baptism baptism = Baptism.builder().id(1L).build();
//
//
//        Confirmation confirmation = Confirmation.builder()
//                .confirmationName("TestConfirmation")
//                .churchName("TestChurch")
//                .churchAddress("TestAddress")
//                .dateOfConfirmation(ZonedDateTime.now())
//                .baptism(baptism)
//                .build();
//
//        // When
//        confirmationRepository.saveConfirmationRecord(confirmation);
//
//        // Then
//        Confirmation savedConfirmation = confirmationRepository.findById(confirmation.getId()).orElse(null);
//        Assertions.assertNotNull(savedConfirmation);
//        Assertions.assertNotNull(savedConfirmation.getBaptism());
//        Assertions.assertEquals(1L, savedConfirmation.getBaptism().getId());
//    }
}
