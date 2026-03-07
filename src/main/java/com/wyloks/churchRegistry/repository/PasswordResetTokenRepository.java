package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.AppUser;
import com.wyloks.churchRegistry.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenValue(String tokenValue);

    void deleteByUser(AppUser user);
}
