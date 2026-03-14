package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.BaptismCertificateDataResponse;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.MarriagePartyLegacy;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.MarriagePartyLegacyRepository;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.BaptismService;
import com.wyloks.churchRegistry.service.RemoteFileService;
import com.wyloks.churchRegistry.service.SacramentAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CertificateController {

    private final BaptismService baptismService;
    private final BaptismRepository baptismRepository;
    private final FirstHolyCommunionRepository communionRepository;
    private final MarriagePartyLegacyRepository marriagePartyLegacyRepository;
    private final SacramentAuthorizationService authorizationService;
    private final RemoteFileService remoteFileService;
    private final SacramentAuditService auditService;

    @GetMapping("/baptisms/{id}/certificate-data")
    public BaptismCertificateDataResponse getBaptismCertificateData(@PathVariable Long id) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireParishAccess);
        BaptismResponse baptism = baptismService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Baptism not found"));

        Long parishId = baptism.getParishId();
        auditService.logRead(SacramentType.BAPTISM, id, parishId);

        Baptism entity = baptismRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Baptism not found"));
        String parishName = entity.getParish() != null ? entity.getParish().getParishName() : null;
        String dioceseName = entity.getParish() != null && entity.getParish().getDiocese() != null
                ? entity.getParish().getDiocese().getDioceseName()
                : null;

        return BaptismCertificateDataResponse.builder()
                .baptism(baptism)
                .parishName(parishName)
                .dioceseName(dioceseName)
                .build();
    }

    @GetMapping("/baptisms/{id}/external-certificate")
    public ResponseEntity<byte[]> getBaptismExternalCertificate(@PathVariable Long id) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireParishAccess);
        Long parishId = authorizationService.findBaptismParishId(id).orElse(null);
        auditService.logCertificateDownload(SacramentType.BAPTISM, id, parishId, "baptism_external");
        Baptism baptism = baptismRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Baptism not found"));
        // Legacy Next API stored external baptism cert path on communion.baptism_certificate_path,
        // while Spring stores it on baptism.external_certificate_path. Fallback preserves old uploads.
        String path = baptism.getExternalCertificatePath();
        if (path == null || path.isBlank()) {
            path = communionRepository.findByBaptismId(id)
                    .map(FirstHolyCommunion::getBaptismCertificatePath)
                    .orElse(null);
        }
        return fileResponse(remoteFileService.download(withBucketIfNeeded(
                path,
                "baptism-certificates"
        )));
    }

    @PostMapping("/baptisms/{id}/email-certificate")
    public ResponseEntity<Map<String, String>> emailBaptismCertificate(@PathVariable Long id, @RequestBody Map<String, String> body) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireParishAccess);
        if (body == null || body.getOrDefault("to", "").isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient email is required");
        }
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Email certificate sending is not implemented yet");
    }

    @GetMapping("/communions/{id}/communion-certificate")
    public ResponseEntity<byte[]> getCommunionCertificate(@PathVariable Long id) {
        authorizationService.findCommunionParishId(id).ifPresent(authorizationService::requireParishAccess);
        Long parishId = authorizationService.findCommunionParishId(id).orElse(null);
        auditService.logCertificateDownload(SacramentType.COMMUNION, id, parishId, "communion");
        FirstHolyCommunion communion = communionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "First Holy Communion not found"));
        return fileResponse(remoteFileService.download(withBucketIfNeeded(
                communion.getCommunionCertificatePath(),
                "communion-certificates"
        )));
    }

    @GetMapping("/marriages/{id}/party-certificate")
    public ResponseEntity<byte[]> getMarriagePartyCertificate(
            @PathVariable Long id,
            @RequestParam String role,
            @RequestParam String type
    ) {
        authorizationService.findMarriageParishId(id).ifPresent(authorizationService::requireParishAccess);
        Long parishId = authorizationService.findMarriageParishId(id).orElse(null);
        auditService.logCertificateDownload(SacramentType.MARRIAGE, id, parishId, "party_" + type);
        Integer legacyMarriageId = Math.toIntExact(id);
        List<MarriagePartyLegacy> parties = marriagePartyLegacyRepository.findByMarriageId(legacyMarriageId);
        String normalizedRole = role.trim().toUpperCase(Locale.ROOT);
        MarriagePartyLegacy party = parties.stream()
                .filter(p -> normalizedRole.equals(p.getRole() != null ? p.getRole().trim().toUpperCase(Locale.ROOT) : null))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marriage party not found"));

        String normalizedType = type.trim().toLowerCase(Locale.ROOT);
        String path = switch (normalizedType) {
            case "baptism" -> party.getBaptismCertificatePath();
            case "communion" -> party.getCommunionCertificatePath();
            case "confirmation" -> party.getConfirmationCertificatePath();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type");
        };

        String bucket = switch (normalizedType) {
            case "baptism" -> "baptism-certificates";
            case "communion" -> "communion-certificates";
            case "confirmation" -> "confirmation-certificates";
            default -> "";
        };

        return fileResponse(remoteFileService.download(withBucketIfNeeded(path, bucket)));
    }

    @PostMapping(path = "/parishes/{parishId}/marriages/upload-certificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadMarriageCertificate(
            @PathVariable Long parishId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("certificateType") String certificateType,
            @RequestParam("role") String role
    ) {
        authorizationService.requireWriteAccessForParish(parishId);
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_IMPLEMENTED,
                "Certificate upload endpoint is not implemented yet"
        );
    }

    private ResponseEntity<byte[]> fileResponse(RemoteFileService.RemoteFile file) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, file.contentType())
                .body(file.bytes());
    }

    private String withBucketIfNeeded(String rawPath, String bucket) {
        if (rawPath == null || rawPath.isBlank()) {
            return rawPath;
        }
        String p = rawPath.trim();
        if (p.startsWith("http://") || p.startsWith("https://")) {
            return p;
        }
        if (p.contains("/")) {
            return p.startsWith("/") ? p.substring(1) : p;
        }
        return bucket + "/" + p;
    }
}
