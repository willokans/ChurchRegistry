package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.ParishRepository;
import com.wyloks.churchRegistry.repository.SacramentNoteHistoryRepository;
import com.wyloks.churchRegistry.service.impl.BaptismServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BaptismServiceImplTest {

    @Mock
    BaptismRepository baptismRepository;

    @Mock
    FirstHolyCommunionRepository firstHolyCommunionRepository;

    @Mock
    ParishRepository parishRepository;

    @Mock
    SacramentNoteHistoryRepository noteHistoryRepository;

    @InjectMocks
    BaptismServiceImpl baptismService;

    private static Baptism.BaptismBuilder baseExternalBaptism(long id) {
        return Baptism.builder()
                .id(id)
                .baptismName("John")
                .surname("Doe")
                .gender("M")
                .dateOfBirth(LocalDate.of(2015, 1, 1))
                .fathersName("F")
                .mothersName("M")
                .sponsorNames("S")
                .officiatingPriest("Fr. X")
                .otherNames("")
                .externalCertificateIssuingParish("Other Parish")
                .externalCertificatePath(null);
    }

    @Test
    void attachExternalCertificate_throwsWhenBaptismNotFound() {
        when(baptismRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> baptismService.attachExternalCertificate(99L, "baptism-certificates/x.pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Baptism not found");
    }

    @Test
    void attachExternalCertificate_throwsWhenNotExternalBaptism() {
        Baptism baptism = baseExternalBaptism(1L).externalCertificateIssuingParish(null).build();
        when(baptismRepository.findById(1L)).thenReturn(Optional.of(baptism));

        assertThatThrownBy(() -> baptismService.attachExternalCertificate(1L, "baptism-certificates/x.pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("only to external baptisms");
    }

    @Test
    void attachExternalCertificate_throwsWhenBaptismAlreadyHasCertificate() {
        Baptism baptism = baseExternalBaptism(1L)
                .externalCertificatePath("baptism-certificates/old.pdf")
                .build();
        when(baptismRepository.findById(1L)).thenReturn(Optional.of(baptism));

        assertThatThrownBy(() -> baptismService.attachExternalCertificate(1L, "baptism-certificates/new.pdf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already stored");
    }

    @Test
    void attachExternalCertificate_throwsWhenCommunionAlreadyHasBaptismCertificatePath() {
        Baptism baptism = baseExternalBaptism(1L).build();
        FirstHolyCommunion communion = FirstHolyCommunion.builder()
                .id(10L)
                .baptism(baptism)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .baptismCertificatePath("baptism-certificates/legacy.pdf")
                .build();
        when(baptismRepository.findById(1L)).thenReturn(Optional.of(baptism));
        when(firstHolyCommunionRepository.findByBaptismId(1L)).thenReturn(Optional.of(communion));

        assertThatThrownBy(() -> baptismService.attachExternalCertificate(1L, "baptism-certificates/x.pdf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("linked communion");
    }

    @Test
    void attachExternalCertificate_updatesBaptismOnly_whenNoCommunion() {
        Baptism baptism = baseExternalBaptism(1L).build();
        when(baptismRepository.findById(1L)).thenReturn(Optional.of(baptism));
        when(firstHolyCommunionRepository.findByBaptismId(1L)).thenReturn(Optional.empty());
        when(baptismRepository.save(any(Baptism.class))).thenAnswer(inv -> inv.getArgument(0));

        String path = "baptism-certificates/new.pdf";
        BaptismResponse result = baptismService.attachExternalCertificate(1L, path);

        assertThat(result.getExternalCertificatePath()).isEqualTo(path);
        ArgumentCaptor<Baptism> captor = ArgumentCaptor.forClass(Baptism.class);
        verify(baptismRepository).save(captor.capture());
        assertThat(captor.getValue().getExternalCertificatePath()).isEqualTo(path);
        verify(firstHolyCommunionRepository, never()).save(any());
    }

    @Test
    void attachExternalCertificate_updatesBaptismAndCommunion_whenCommunionExists() {
        Baptism baptism = baseExternalBaptism(1L).build();
        FirstHolyCommunion communion = FirstHolyCommunion.builder()
                .id(10L)
                .baptism(baptism)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. Smith")
                .parish("St Mary")
                .baptismCertificatePath(null)
                .build();
        when(baptismRepository.findById(1L)).thenReturn(Optional.of(baptism));
        when(firstHolyCommunionRepository.findByBaptismId(1L)).thenReturn(Optional.of(communion));
        when(baptismRepository.save(any(Baptism.class))).thenAnswer(inv -> inv.getArgument(0));
        when(firstHolyCommunionRepository.save(any(FirstHolyCommunion.class))).thenAnswer(inv -> inv.getArgument(0));

        String path = "baptism-certificates/new.pdf";
        baptismService.attachExternalCertificate(1L, path);

        ArgumentCaptor<FirstHolyCommunion> commCaptor = ArgumentCaptor.forClass(FirstHolyCommunion.class);
        verify(firstHolyCommunionRepository).save(commCaptor.capture());
        assertThat(commCaptor.getValue().getBaptismCertificatePath()).isEqualTo(path);
    }
}
