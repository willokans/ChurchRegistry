package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RefreshTokenCleanupServiceTest {

    @Mock
    RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    RefreshTokenCleanupService refreshTokenCleanupService;

    @Test
    void cleanupExpiredRefreshTokens_deletesTokensExpiredBeforeNow() {
        Instant beforeCall = Instant.now();

        refreshTokenCleanupService.cleanupExpiredRefreshTokens();

        ArgumentCaptor<Instant> captor = ArgumentCaptor.forClass(Instant.class);
        verify(refreshTokenRepository).deleteAllByExpiresAtBefore(captor.capture());
        Instant captured = captor.getValue();
        assertThat(captured).isNotNull();
        assertThat(captured).isAfterOrEqualTo(beforeCall.minusSeconds(1));
        assertThat(captured).isBeforeOrEqualTo(Instant.now().plusSeconds(1));
    }
}
