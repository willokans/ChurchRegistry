package com.wyloks.churchRegistry.security;

import com.wyloks.churchRegistry.entity.AppUser;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class SacramentAuthorizationServiceTest {

    @Mock
    BaptismRepository baptismRepository;

    @Mock
    FirstHolyCommunionRepository communionRepository;

    @Mock
    ConfirmationRepository confirmationRepository;

    @Mock
    MarriageRepository marriageRepository;

    @Mock
    HolyOrderRepository holyOrderRepository;

    SacramentAuthorizationService service;

    @BeforeEach
    void setUp() {
        service = new SacramentAuthorizationService(
                baptismRepository,
                communionRepository,
                confirmationRepository,
                marriageRepository,
                holyOrderRepository
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void requireDioceseAccess_admin_allowsAccess() {
        setCurrentUser("ADMIN");

        assertThatCode(() -> service.requireDioceseAccess(1L))
                .doesNotThrowAnyException();
    }

    @Test
    void requireDioceseAccess_superAdmin_allowsAccess() {
        setCurrentUser("SUPER_ADMIN");

        assertThatCode(() -> service.requireDioceseAccess(1L))
                .doesNotThrowAnyException();
    }

    @Test
    void requireDioceseAccess_parishPriest_throwsForbidden() {
        setCurrentUser("PARISH_PRIEST");

        assertThatThrownBy(() -> service.requireDioceseAccess(1L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("Diocese access denied");
                });
    }

    @Test
    void requireDioceseAccess_parishViewer_throwsForbidden() {
        setCurrentUser("PARISH_VIEWER");

        assertThatThrownBy(() -> service.requireDioceseAccess(1L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                });
    }

    @Test
    void requireDioceseAccess_nullDioceseId_throwsForbidden() {
        setCurrentUser("ADMIN");

        assertThatThrownBy(() -> service.requireDioceseAccess(null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).contains("Diocese ID is required");
                });
    }

    private void setCurrentUser(String role) {
        AppUser user = AppUser.builder()
                .username("testuser")
                .passwordHash("hash")
                .role(role)
                .parish(null)
                .build();
        AppUserDetails userDetails = new AppUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
