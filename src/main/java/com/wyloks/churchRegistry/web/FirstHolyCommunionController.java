package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FirstHolyCommunionController {

    private final FirstHolyCommunionService communionService;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/parishes/{parishId}/communions")
    public List<FirstHolyCommunionResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        return communionService.findByParishId(parishId);
    }

    @GetMapping("/communions/{id}")
    public ResponseEntity<FirstHolyCommunionResponse> getById(@PathVariable Long id) {
        authorizationService.findCommunionParishId(id).ifPresent(authorizationService::requireParishAccess);
        return communionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/baptisms/{baptismId}/communions")
    public ResponseEntity<FirstHolyCommunionResponse> getByBaptismId(@PathVariable Long baptismId) {
        authorizationService.findBaptismParishIdForCommunionRequest(baptismId)
                .ifPresent(authorizationService::requireParishAccess);
        return communionService.findByBaptismId(baptismId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/communions")
    public ResponseEntity<FirstHolyCommunionResponse> create(@Valid @RequestBody FirstHolyCommunionRequest request) {
        FirstHolyCommunionResponse created = authorizationService.findBaptismParishIdForCommunionRequest(request.getBaptismId())
                .map(parishId -> {
                    authorizationService.requireWriteAccessForParish(parishId);
                    return communionService.create(request);
                })
                .orElseGet(() -> communionService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
