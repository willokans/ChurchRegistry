package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FirstHolyCommunionServiceImplTest {

    @Mock
    FirstHolyCommunionRepository communionRepository;

    @Mock
    BaptismRepository baptismRepository;

    @InjectMocks
    com.wyloks.churchRegistry.service.impl.FirstHolyCommunionServiceImpl communionService;

    @Test
    void create_throwsWhenBaptismNotFound() {
        FirstHolyCommunionRequest request = FirstHolyCommunionRequest.builder()
                .baptismId(999L)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .build();
        when(baptismRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> communionService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Baptism not found");
    }

    @Test
    void create_throwsWhenCommunionAlreadyExistsForBaptism() {
        Baptism baptism = Baptism.builder().id(1L).baptismName("John").surname("Doe").gender("M")
                .dateOfBirth(LocalDate.of(2015, 1, 1)).fathersName("F").mothersName("M").sponsorNames("S").build();
        FirstHolyCommunion existing = FirstHolyCommunion.builder().id(1L).baptism(baptism)
                .communionDate(LocalDate.of(2022, 6, 1)).officiatingPriest("Fr. X").parish("St Mary").build();
        when(baptismRepository.findById(1L)).thenReturn(Optional.of(baptism));
        when(communionRepository.findByBaptismId(1L)).thenReturn(Optional.of(existing));

        FirstHolyCommunionRequest request = FirstHolyCommunionRequest.builder()
                .baptismId(1L)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .build();

        assertThatThrownBy(() -> communionService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void findById_baptismCertificatePendingTrue_whenExternalIssuingParishSetAndCertificateMissing() {
        Baptism baptism = baseBaptism(1L)
                .externalCertificateIssuingParish("Other Parish")
                .externalCertificatePath(null)
                .build();
        FirstHolyCommunion communion = communionFor(baptism);

        when(communionRepository.findById(10L)).thenReturn(Optional.of(communion));

        Optional<FirstHolyCommunionResponse> result = communionService.findById(10L);

        assertThat(result).isPresent();
        assertThat(result.get().isBaptismCertificatePending()).isTrue();
    }

    @Test
    void findById_baptismCertificatePendingFalse_whenExternalCertificateUploaded() {
        Baptism baptism = baseBaptism(1L)
                .externalCertificateIssuingParish("Other Parish")
                .externalCertificatePath("baptism-certificates/abc.pdf")
                .build();
        FirstHolyCommunion communion = communionFor(baptism);

        when(communionRepository.findById(10L)).thenReturn(Optional.of(communion));

        Optional<FirstHolyCommunionResponse> result = communionService.findById(10L);

        assertThat(result).isPresent();
        assertThat(result.get().isBaptismCertificatePending()).isFalse();
    }

    @Test
    void findById_baptismCertificatePendingFalse_whenInParishBaptism() {
        Baptism baptism = baseBaptism(1L)
                .externalCertificateIssuingParish(null)
                .externalCertificatePath(null)
                .build();
        FirstHolyCommunion communion = communionFor(baptism);

        when(communionRepository.findById(10L)).thenReturn(Optional.of(communion));

        Optional<FirstHolyCommunionResponse> result = communionService.findById(10L);

        assertThat(result).isPresent();
        assertThat(result.get().isBaptismCertificatePending()).isFalse();
    }

    @Test
    void findById_baptismCertificatePendingFalse_whenExternalIssuingParishBlank() {
        Baptism baptism = baseBaptism(1L)
                .externalCertificateIssuingParish("   ")
                .externalCertificatePath(null)
                .build();
        FirstHolyCommunion communion = communionFor(baptism);

        when(communionRepository.findById(10L)).thenReturn(Optional.of(communion));

        Optional<FirstHolyCommunionResponse> result = communionService.findById(10L);

        assertThat(result).isPresent();
        assertThat(result.get().isBaptismCertificatePending()).isFalse();
    }

    private static Baptism.BaptismBuilder baseBaptism(long id) {
        return Baptism.builder()
                .id(id)
                .baptismName("John")
                .surname("Doe")
                .gender("M")
                .dateOfBirth(LocalDate.of(2015, 1, 1))
                .fathersName("F")
                .mothersName("M")
                .sponsorNames("S")
                .officiatingPriest("Fr. X");
    }

    private static FirstHolyCommunion communionFor(Baptism baptism) {
        return FirstHolyCommunion.builder()
                .id(10L)
                .baptism(baptism)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .build();
    }
}
