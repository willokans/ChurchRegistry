package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.ParishMarriageRequirementsResponse;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.repository.DioceseRepository;
import com.wyloks.churchRegistry.repository.ParishRepository;
import com.wyloks.churchRegistry.security.CurrentUserAccessService;
import com.wyloks.churchRegistry.service.impl.ParishServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParishServiceImplTest {

    @Mock
    ParishRepository parishRepository;

    @Mock
    DioceseRepository dioceseRepository;

    @Mock
    CurrentUserAccessService currentUserAccessService;

    @InjectMocks
    ParishServiceImpl parishService;

    @Test
    void getMarriageRequirements_returnsEmpty_whenParishMissing() {
        when(parishRepository.findById(99L)).thenReturn(Optional.empty());

        assertThat(parishService.getMarriageRequirements(99L)).isEmpty();
    }

    @Test
    void getMarriageRequirements_mapsParishFlag() {
        Diocese diocese = Diocese.builder().id(1L).dioceseName("D").build();
        Parish parish = Parish.builder()
                .id(5L)
                .parishName("St Mary")
                .diocese(diocese)
                .requireMarriageConfirmation(false)
                .build();
        when(parishRepository.findById(5L)).thenReturn(Optional.of(parish));

        Optional<ParishMarriageRequirementsResponse> res = parishService.getMarriageRequirements(5L);

        assertThat(res).isPresent();
        assertThat(res.get().getParishId()).isEqualTo(5L);
        assertThat(res.get().isRequireMarriageConfirmation()).isFalse();
    }

    @Test
    void updateMarriageRequirements_persistsAndReturns() {
        Diocese diocese = Diocese.builder().id(1L).dioceseName("D").build();
        Parish parish = Parish.builder()
                .id(7L)
                .parishName("St John")
                .diocese(diocese)
                .requireMarriageConfirmation(true)
                .build();
        when(parishRepository.findById(7L)).thenReturn(Optional.of(parish));

        ParishMarriageRequirementsResponse updated =
                parishService.updateMarriageRequirements(7L, false);

        assertThat(updated.getParishId()).isEqualTo(7L);
        assertThat(updated.isRequireMarriageConfirmation()).isFalse();

        ArgumentCaptor<Parish> captor = ArgumentCaptor.forClass(Parish.class);
        verify(parishRepository).save(captor.capture());
        assertThat(captor.getValue().isRequireMarriageConfirmation()).isFalse();
    }

    @Test
    void updateMarriageRequirements_throwsWhenParishMissing() {
        when(parishRepository.findById(8L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> parishService.updateMarriageRequirements(8L, true))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Parish not found");
    }

    @Test
    void isMarriageConfirmationRequired_defaultsToTrueWhenParishMissing() {
        when(parishRepository.findById(404L)).thenReturn(Optional.empty());

        assertThat(parishService.isMarriageConfirmationRequired(404L)).isTrue();
    }

    @Test
    void isMarriageConfirmationRequired_readsParishFlag() {
        Diocese diocese = Diocese.builder().id(1L).dioceseName("D").build();
        Parish parish = Parish.builder()
                .id(3L)
                .parishName("P")
                .diocese(diocese)
                .requireMarriageConfirmation(false)
                .build();
        when(parishRepository.findById(3L)).thenReturn(Optional.of(parish));

        assertThat(parishService.isMarriageConfirmationRequired(3L)).isFalse();
    }
}
