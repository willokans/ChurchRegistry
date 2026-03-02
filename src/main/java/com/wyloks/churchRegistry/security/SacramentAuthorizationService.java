package com.wyloks.churchRegistry.security;

import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class SacramentAuthorizationService {

    private static final Set<String> WRITE_ROLES = Set.of("ADMIN", "PRIEST", "PARISH_PRIEST", "PARISH_SECRETARY");

    private final BaptismRepository baptismRepository;
    private final FirstHolyCommunionRepository communionRepository;
    private final ConfirmationRepository confirmationRepository;
    private final MarriageRepository marriageRepository;

    public void requireParishAccess(Long parishId) {
        CurrentUser user = currentUser();
        if (user.isAdmin()) {
            return;
        }
        if (parishId == null || user.parishId() == null || !parishId.equals(user.parishId())) {
            throw forbidden("Cross-parish access denied");
        }
    }

    public void requireWriteAccessForParish(Long parishId) {
        CurrentUser user = currentUser();
        if (!WRITE_ROLES.contains(user.role())) {
            throw forbidden("Insufficient role for sacrament write access");
        }
        if (!user.isAdmin()) {
            if (parishId == null || user.parishId() == null || !parishId.equals(user.parishId())) {
                throw forbidden("Cross-parish write denied");
            }
        }
    }

    public Optional<Long> findBaptismParishId(Long baptismId) {
        return baptismRepository.findParishIdById(baptismId);
    }

    public Optional<Long> findCommunionParishId(Long communionId) {
        return communionRepository.findParishIdById(communionId);
    }

    public Optional<Long> findCommunionParishIdByBaptismId(Long baptismId) {
        return communionRepository.findParishIdByBaptismId(baptismId);
    }

    public Optional<Long> findConfirmationParishId(Long confirmationId) {
        return confirmationRepository.findParishIdById(confirmationId);
    }

    public Optional<Long> findConfirmationParishIdByCommunionId(Long communionId) {
        return confirmationRepository.findParishIdByFirstHolyCommunionId(communionId);
    }

    public Optional<Long> findMarriageParishId(Long marriageId) {
        return marriageRepository.findParishIdById(marriageId);
    }

    public Optional<Long> findMarriageParishIdByConfirmationId(Long confirmationId) {
        return marriageRepository.findParishIdByConfirmationId(confirmationId);
    }

    public Optional<Long> findBaptismParishIdForCommunionRequest(Long baptismId) {
        return baptismRepository.findParishIdById(baptismId);
    }

    private CurrentUser currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw forbidden("Authentication required");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof AppUserDetails userDetails)) {
            throw forbidden("Invalid authentication principal");
        }

        String role = normalizeRole(userDetails.getRole());
        if (role == null) {
            throw forbidden("Role is required");
        }

        return new CurrentUser(role, userDetails.getParishId());
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }

    private ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    private record CurrentUser(String role, Long parishId) {
        boolean isAdmin() {
            return "ADMIN".equals(role);
        }
    }
}
