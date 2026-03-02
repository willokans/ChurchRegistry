package com.wyloks.churchRegistry.security;

import com.wyloks.churchRegistry.entity.AppUser;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class AppUserDetails implements UserDetails {

    private final AppUser user;
    private final String role;
    private final Long parishId;

    public AppUserDetails(AppUser user) {
        this.user = user;
        this.role = user.getRole();
        this.parishId = user.getParish() != null ? user.getParish().getId() : null;
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null || role.isBlank()) {
            return Collections.emptyList();
        }
        return Stream.of("ROLE_" + role.toUpperCase())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public AppUser getAppUser() {
        return user;
    }

    public String getRole() {
        return role;
    }

    public Long getParishId() {
        return parishId;
    }
}
