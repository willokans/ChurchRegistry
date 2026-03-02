package com.wyloks.churchRegistry.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

@Component
public class CurrentUserAccessService {

    public CurrentUserAccess currentUser() {
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

        return new CurrentUserAccess(role, userDetails.getParishAccessIds());
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

    public record CurrentUserAccess(String role, Set<Long> parishIds) {
        public boolean isAdmin() {
            return "ADMIN".equals(role);
        }
    }
}
