package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.HolyOrderRequest;
import com.wyloks.churchRegistry.dto.HolyOrderResponse;
import com.wyloks.churchRegistry.entity.SacramentAuditLog.SacramentType;
import com.wyloks.churchRegistry.security.SacramentAuthorizationService;
import com.wyloks.churchRegistry.service.HolyOrderService;
import com.wyloks.churchRegistry.service.SacramentAuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HolyOrderController {

    private final HolyOrderService holyOrderService;
    private final SacramentAuthorizationService authorizationService;
    private final SacramentAuditService auditService;

    @GetMapping("/parishes/{parishId}/holy-orders")
    public List<HolyOrderResponse> getByParish(@PathVariable Long parishId) {
        authorizationService.requireParishAccess(parishId);
        List<HolyOrderResponse> result = holyOrderService.findByParishId(parishId);
        auditService.logReadList(SacramentType.HOLY_ORDER, parishId);
        return result;
    }

    @GetMapping("/holy-orders/{id}")
    public ResponseEntity<HolyOrderResponse> getById(@PathVariable Long id) {
        authorizationService.findHolyOrderParishId(id).ifPresent(authorizationService::requireParishAccess);
        return holyOrderService.findById(id)
                .map(r -> {
                    Long parishId = authorizationService.findHolyOrderParishId(id).orElse(r.getParishId());
                    auditService.logRead(SacramentType.HOLY_ORDER, id, parishId);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/holy-orders")
    public ResponseEntity<HolyOrderResponse> create(@Valid @RequestBody HolyOrderRequest request) {
        Long parishId = authorizationService.findConfirmationParishId(request.getConfirmationId())
                .or(() -> java.util.Optional.ofNullable(request.getParishId()))
                .orElse(null);
        if (parishId != null) {
            authorizationService.requireWriteAccessForParish(parishId);
        }
        HolyOrderResponse created = holyOrderService.create(request);
        Long auditParishId = created.getParishId() != null ? created.getParishId() : parishId;
        auditService.logCreate(SacramentType.HOLY_ORDER, created.getId(), auditParishId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
