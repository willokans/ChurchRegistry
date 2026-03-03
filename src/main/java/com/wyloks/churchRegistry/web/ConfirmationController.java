package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.ConfirmationRequest;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.NoteUpdateRequest;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.ConfirmationService;
import com.wyloks.churchRegistry.service.SacramentAuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConfirmationController {

    private final ConfirmationService confirmationService;
    private final SacramentAuthorizationService authorizationService;
    private final SacramentAuditService auditService;

    @GetMapping("/parishes/{parishId}/confirmations")
    public List<ConfirmationResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        List<ConfirmationResponse> result = confirmationService.findByParishId(parishId);
        auditService.logReadList(SacramentType.CONFIRMATION, parishId);
        return result;
    }

    @GetMapping("/confirmations/{id}")
    public ResponseEntity<ConfirmationResponse> getById(@PathVariable Long id) {
        authorizationService.findConfirmationParishId(id).ifPresent(authorizationService::requireParishAccess);
        return confirmationService.findById(id)
                .map(r -> {
                    Long parishId = authorizationService.findConfirmationParishId(id).orElse(null);
                    auditService.logRead(SacramentType.CONFIRMATION, id, parishId);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/confirmations")
    public ResponseEntity<ConfirmationResponse> create(@Valid @RequestBody ConfirmationRequest request) {
        Long parishId = authorizationService.findConfirmationParishIdByCommunionId(request.getCommunionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Communion not found or has no parish"));
        authorizationService.requireWriteAccessForParish(parishId);
        ConfirmationResponse created = confirmationService.create(request);
        auditService.logCreate(SacramentType.CONFIRMATION, created.getId(), parishId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/confirmations/{id}")
    public ResponseEntity<ConfirmationResponse> updateNote(@PathVariable Long id, @RequestBody NoteUpdateRequest request) {
        authorizationService.findConfirmationParishId(id).ifPresent(authorizationService::requireWriteAccessForParish);
        ConfirmationResponse updated = confirmationService.updateNote(id, request != null ? request.getNote() : null);
        Long parishId = authorizationService.findConfirmationParishId(id).orElse(null);
        auditService.logUpdate(SacramentType.CONFIRMATION, id, parishId, "note");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/confirmations/{id}/notes")
    public List<SacramentNoteResponse> getNoteHistory(@PathVariable Long id) {
        authorizationService.findConfirmationParishId(id).ifPresent(authorizationService::requireParishAccess);
        List<SacramentNoteResponse> result = confirmationService.getNoteHistory(id);
        Long parishId = authorizationService.findConfirmationParishId(id).orElse(null);
        auditService.logRead(SacramentType.CONFIRMATION, id, parishId);
        return result;
    }
}
