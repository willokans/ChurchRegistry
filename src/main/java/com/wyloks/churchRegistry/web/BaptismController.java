package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.BaptismService;
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

    @GetMapping("/api/parishes/{parishId}/baptisms")
    public List<BaptismResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        return baptismService.findByParishId(parishId);
    }

    @GetMapping("/api/baptisms/{id}")
    public ResponseEntity<BaptismResponse> getById(@PathVariable Long id) {
        authorizationService.findBaptismParishId(id).ifPresent(authorizationService::requireParishAccess);
        return baptismService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/parishes/{parishId}/baptisms")
    public ResponseEntity<BaptismResponse> create(@PathVariable Long parishId, @Valid @RequestBody BaptismRequest request) {
        authorizationService.requireWriteAccessForParish(parishId);
        if (request.getParishId() != null && !parishId.equals(request.getParishId())) {
            return ResponseEntity.badRequest().build();
        }
        BaptismResponse created = baptismService.create(parishId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
