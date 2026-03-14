package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.entity.SacramentAuditLog;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.EventType;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.repository.SacramentAuditLogRepository;
import com.wyloks.churchRegistry.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Service for appending immutable audit log entries for sacramental data access and mutations.
 * Failures are logged but do not affect the main operation.
 * Uses same transaction as caller to avoid REQUIRES_NEW commit issues with PgBouncer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SacramentAuditService {

    private final SacramentAuditLogRepository auditLogRepository;

    @Transactional(readOnly = false)
    public void logRead(SacramentType sacramentType, Long recordId, Long parishId) {
        logEvent(EventType.READ, sacramentType, recordId, parishId, null);
    }

    @Transactional(readOnly = false)
    public void logReadList(SacramentType sacramentType, Long parishId) {
        logEvent(EventType.READ_LIST, sacramentType, null, parishId, null);
    }

    @Transactional(readOnly = false)
    public void logCreate(SacramentType sacramentType, Long recordId, Long parishId) {
        logEvent(EventType.CREATE, sacramentType, recordId, parishId, null);
    }

    @Transactional(readOnly = false)
    public void logUpdate(SacramentType sacramentType, Long recordId, Long parishId, String details) {
        logEvent(EventType.UPDATE, sacramentType, recordId, parishId, details);
    }

    @Transactional(readOnly = false)
    public void logDelete(SacramentType sacramentType, Long recordId, Long parishId) {
        logEvent(EventType.DELETE, sacramentType, recordId, parishId, null);
    }

    @Transactional(readOnly = false)
    public void logCertificateDownload(SacramentType sacramentType, Long recordId, Long parishId, String certificateType) {
        String details = certificateType != null ? "certificate_download:" + certificateType : "certificate_download";
        logEvent(EventType.CERTIFICATE_DOWNLOAD, sacramentType, recordId, parishId, details);
    }

    private void logEvent(EventType eventType, SacramentType sacramentType, Long recordId, Long parishId, String details) {
        try {
            var actor = resolveActor();
            SacramentAuditLog entry = SacramentAuditLog.builder()
                    .eventType(eventType.name())
                    .sacramentType(sacramentType.name())
                    .recordId(recordId)
                    .parishId(parishId)
                    .actorId(actor.actorId())
                    .actorName(actor.actorName())
                    .details(details)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write sacrament audit log: event={} sacrament={} recordId={}", eventType, sacramentType, recordId, e);
        }
    }

    private ActorInfo resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails userDetails) {
            Long actorId = userDetails.getAppUser() != null ? userDetails.getAppUser().getId() : null;
            String actorName = resolveActorName(userDetails);
            return new ActorInfo(actorId, actorName);
        }
        return new ActorInfo(null, "System");
    }

    private String resolveActorName(AppUserDetails userDetails) {
        if (userDetails.getAppUser() != null && userDetails.getAppUser().getDisplayName() != null
                && !userDetails.getAppUser().getDisplayName().isBlank()) {
            return userDetails.getAppUser().getDisplayName().trim();
        }
        if (userDetails.getRole() != null && !userDetails.getRole().isBlank()) {
            String[] parts = userDetails.getRole().trim().toLowerCase(Locale.ROOT).split("_");
            return java.util.Arrays.stream(parts)
                    .filter(p -> !p.isBlank())
                    .map(p -> Character.toUpperCase(p.charAt(0)) + p.substring(1))
                    .collect(java.util.stream.Collectors.joining(" "));
        }
        return userDetails.getUsername() != null ? userDetails.getUsername() : "Unknown";
    }

    private record ActorInfo(Long actorId, String actorName) {}
}
