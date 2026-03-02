package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.ConfirmationRequest;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.ConfirmationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConfirmationController {

    private final ConfirmationService confirmationService;
    private final SacramentAuthorizationService authorizationService;

    @GetMapping("/parishes/{parishId}/confirmations")
    public List<ConfirmationResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        return confirmationService.findByParishId(parishId);
    }

    @GetMapping("/confirmations/{id}")
    public ResponseEntity<ConfirmationResponse> getById(@PathVariable Long id) {
        authorizationService.findConfirmationParishId(id).ifPresent(authorizationService::requireParishAccess);
        return confirmationService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/confirmations")
    public ResponseEntity<ConfirmationResponse> create(@Valid @RequestBody ConfirmationRequest request) {
        ConfirmationResponse created = authorizationService.findConfirmationParishIdByCommunionId(request.getCommunionId())
                .map(parishId -> {
                    authorizationService.requireWriteAccessForParish(parishId);
                    return confirmationService.create(request);
                })
                .orElseGet(() -> confirmationService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
