package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.HolyOrderRequest;
import com.wyloks.churchRegistry.dto.HolyOrderResponse;
import com.wyloks.churchRegistry.service.HolyOrderService;
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

    @GetMapping("/parishes/{parishId}/holy-orders")
    public List<HolyOrderResponse> getByParish(@PathVariable Long parishId) {
        return holyOrderService.findByParishId(parishId);
    }

    @GetMapping("/holy-orders/{id}")
    public ResponseEntity<HolyOrderResponse> getById(@PathVariable Long id) {
        return holyOrderService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/holy-orders")
    public ResponseEntity<HolyOrderResponse> create(@Valid @RequestBody HolyOrderRequest request) {
        HolyOrderResponse created = holyOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
