package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.CreateMarriageWithPartiesRequest;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.dto.NoteUpdateRequest;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.MarriageService;
import com.wyloks.churchRegistry.service.SacramentAuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MarriageController {

    private final MarriageService marriageService;
    private final SacramentAuthorizationService authorizationService;
    private final SacramentAuditService auditService;

    @GetMapping("/parishes/{parishId}/marriages")
    public Page<MarriageResponse> getByParish(
            @PathVariable Long parishId,
            @PageableDefault(size = 50) Pageable pageable) {
        authorizationService.requireParishAccess(parishId);
        Page<MarriageResponse> result = marriageService.findByParishId(parishId, pageable);
        auditService.logReadList(SacramentType.MARRIAGE, parishId);
        return result;
    }

    @GetMapping("/marriages/{id}")
    public ResponseEntity<MarriageResponse> getById(@PathVariable Long id) {
        authorizationService.findMarriageParishId(id).ifPresent(authorizationService::requireParishAccess);
        return marriageService.findById(id)
                .map(r -> {
                    Long parishId = authorizationService.findMarriageParishId(id).orElse(null);
                    auditService.logRead(SacramentType.MARRIAGE, id, parishId);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/marriages")
    public ResponseEntity<MarriageResponse> create(@Valid @RequestBody MarriageRequest request) {
        Long parishId = authorizationService.findMarriageParishIdByConfirmationId(request.getConfirmationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Confirmation not found or has no parish"));
        authorizationService.requireWriteAccessForParish(parishId);
        MarriageResponse created = marriageService.create(request);
        auditService.logCreate(SacramentType.MARRIAGE, created.getId(), parishId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/marriages/with-parties")
    public ResponseEntity<MarriageResponse> createWithParties(@Valid @RequestBody CreateMarriageWithPartiesRequest request) {
        MarriageResponse created = marriageService.createWithParties(request);

        // Best-effort audit logging if we can resolve the parish via the same confirmation used by MarriageRequest.
        authorizationService
                .findMarriageParishIdByConfirmationId(created.getConfirmationId())
                .ifPresent(parishId -> auditService.logCreate(SacramentType.MARRIAGE, created.getId(), parishId));

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/marriages/{id}")
    public ResponseEntity<MarriageResponse> updateNote(@PathVariable Long id, @RequestBody NoteUpdateRequest request) {
        authorizationService.findMarriageParishId(id).ifPresent(authorizationService::requireWriteAccessForParish);
        MarriageResponse updated = marriageService.updateNote(id, request != null ? request.getNote() : null);
        Long parishId = authorizationService.findMarriageParishId(id).orElse(null);
        auditService.logUpdate(SacramentType.MARRIAGE, id, parishId, "note");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/marriages/{id}/notes")
    public List<SacramentNoteResponse> getNoteHistory(@PathVariable Long id) {
        authorizationService.findMarriageParishId(id).ifPresent(authorizationService::requireParishAccess);
        List<SacramentNoteResponse> result = marriageService.getNoteHistory(id);
        Long parishId = authorizationService.findMarriageParishId(id).orElse(null);
        auditService.logRead(SacramentType.MARRIAGE, id, parishId);
        return result;
    }
}
