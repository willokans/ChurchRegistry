package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.dto.NoteUpdateRequest;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.BaptismService;
import com.wyloks.churchRegistry.service.SacramentAuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BaptismController {

    private final BaptismService baptismService;
    private final SacramentAuthorizationService authorizationService;
    private final SacramentAuditService auditService;

    @GetMapping("/api/parishes/{parishId}/baptisms")
    public List<BaptismResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        List<BaptismResponse> result = baptismService.findByParishId(parishId);
        auditService.logReadList(SacramentType.BAPTISM, parishId);
        return result;
    }

    @GetMapping("/api/baptisms/{id}")
    public ResponseEntity<BaptismResponse> getById(@PathVariable Long id) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireParishAccess);
        return baptismService.findById(id)
                .map(r -> {
                    auditService.logRead(SacramentType.BAPTISM, id, r.getParishId());
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/parishes/{parishId}/baptisms")
    public ResponseEntity<BaptismResponse> create(@PathVariable Long parishId, @Valid @RequestBody BaptismRequest request) {
        authorizationService.requireWriteAccessForParish(parishId);
        if (request.getParishId() != null && !parishId.equals(request.getParishId())) {
            return ResponseEntity.badRequest().build();
        }
        BaptismResponse created = baptismService.create(parishId, request);
        auditService.logCreate(SacramentType.BAPTISM, created.getId(), parishId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/api/baptisms/{id}")
    public ResponseEntity<BaptismResponse> updateNote(@PathVariable Long id, @RequestBody NoteUpdateRequest request) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireWriteAccessForParish);
        BaptismResponse updated = baptismService.updateNote(id, request != null ? request.getNote() : null);
        auditService.logUpdate(SacramentType.BAPTISM, id, updated.getParishId(), "note");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/api/baptisms/{id}/notes")
    public List<SacramentNoteResponse> getNoteHistory(@PathVariable Long id) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireParishAccess);
        List<SacramentNoteResponse> result = baptismService.getNoteHistory(id);
        Long parishId = authorizationService.findBaptismParishId(id).orElse(null);
        auditService.logRead(SacramentType.BAPTISM, id, parishId);
        return result;
    }
}
