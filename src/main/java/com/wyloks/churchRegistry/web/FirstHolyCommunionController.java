package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.dto.NoteUpdateRequest;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
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
public class FirstHolyCommunionController {

    private final FirstHolyCommunionService communionService;
    private final SacramentAuthorizationService authorizationService;
    private final SacramentAuditService auditService;

    @GetMapping("/parishes/{parishId}/communions")
    public List<FirstHolyCommunionResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        List<FirstHolyCommunionResponse> result = communionService.findByParishId(parishId);
        auditService.logReadList(SacramentType.COMMUNION, parishId);
        return result;
    }

    @GetMapping("/communions/{id}")
    public ResponseEntity<FirstHolyCommunionResponse> getById(@PathVariable Long id) {
        authorizationService.findCommunionParishId(id).ifPresent(authorizationService::requireParishAccess);
        return communionService.findById(id)
                .map(r -> {
                    Long parishId = authorizationService.findCommunionParishId(id).orElse(null);
                    auditService.logRead(SacramentType.COMMUNION, id, parishId);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/baptisms/{baptismId}/communions")
    public ResponseEntity<FirstHolyCommunionResponse> getByBaptismId(@PathVariable Long baptismId) {
        authorizationService.findBaptismParishIdForCommunionRequest(baptismId)
                .ifPresent(authorizationService::requireParishAccess);
        return communionService.findByBaptismId(baptismId)
                .map(r -> {
                    Long parishId = authorizationService.findBaptismParishIdForCommunionRequest(baptismId).orElse(null);
                    auditService.logRead(SacramentType.COMMUNION, r.getId(), parishId);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/communions")
    public ResponseEntity<FirstHolyCommunionResponse> create(@Valid @RequestBody FirstHolyCommunionRequest request) {
        Long parishId = authorizationService.findBaptismParishIdForCommunionRequest(request.getBaptismId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Baptism not found or has no parish"));
        authorizationService.requireWriteAccessForParish(parishId);
        FirstHolyCommunionResponse created = communionService.create(request);
        auditService.logCreate(SacramentType.COMMUNION, created.getId(), parishId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/communions/{id}")
    public ResponseEntity<FirstHolyCommunionResponse> updateNote(@PathVariable Long id, @RequestBody NoteUpdateRequest request) {
        authorizationService.findCommunionParishId(id).ifPresent(authorizationService::requireWriteAccessForParish);
        FirstHolyCommunionResponse updated = communionService.updateNote(id, request != null ? request.getNote() : null);
        Long parishId = authorizationService.findCommunionParishId(id).orElse(null);
        auditService.logUpdate(SacramentType.COMMUNION, id, parishId, "note");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/communions/{id}/notes")
    public List<SacramentNoteResponse> getNoteHistory(@PathVariable Long id) {
        authorizationService.findCommunionParishId(id).ifPresent(authorizationService::requireParishAccess);
        List<SacramentNoteResponse> result = communionService.getNoteHistory(id);
        Long parishId = authorizationService.findCommunionParishId(id).orElse(null);
        auditService.logRead(SacramentType.COMMUNION, id, parishId);
        return result;
    }
}
