package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.SacramentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for sacrament audit log. Append-only; no update/delete methods used.
 */
public interface SacramentAuditLogRepository extends JpaRepository<SacramentAuditLog, Long> {
}
