package com.wyloks.churchRegistry.web;

import com.wyloks.churchRegistry.dto.ParishRequest;
import com.wyloks.churchRegistry.dto.ParishResponse;
import com.wyloks.churchRegistry.service.ParishService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parishes")
@RequiredArgsConstructor
public class ParishController {

    private final ParishService parishService;

    @GetMapping("/{id}")
    public ResponseEntity<ParishResponse> getById(@PathVariable Long id) {
        return parishService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ParishResponse> create(@Valid @RequestBody ParishRequest request) {
        ParishResponse created = parishService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
