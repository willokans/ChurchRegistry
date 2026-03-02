package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.MarriageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MarriageController {

    private final MarriageService marriageService;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/parishes/{parishId}/marriages")
    public List<MarriageResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        return marriageService.findByParishId(parishId);
    }

    @GetMapping("/marriages/{id}")
    public ResponseEntity<MarriageResponse> getById(@PathVariable Long id) {
        authorizationService.findMarriageParishId(id).ifPresent(authorizationService::requireParishAccess);
        return marriageService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/marriages")
    public ResponseEntity<MarriageResponse> create(@Valid @RequestBody MarriageRequest request) {
        MarriageResponse created = authorizationService.findMarriageParishIdByConfirmationId(request.getConfirmationId())
                .map(parishId -> {
                    authorizationService.requireWriteAccessForParish(parishId);
                    return marriageService.create(request);
                })
                .orElseGet(() -> marriageService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
