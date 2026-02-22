package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FirstHolyCommunionServiceImpl implements FirstHolyCommunionService {

    private final FirstHolyCommunionRepository communionRepository;
    private final BaptismRepository baptismRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FirstHolyCommunionResponse> findByParishId(Long parishId) {
        return communionRepository.findByBaptismParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FirstHolyCommunionResponse> findById(Long id) {
        return communionRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FirstHolyCommunionResponse> findByBaptismId(Long baptismId) {
        return communionRepository.findByBaptismId(baptismId).map(this::toResponse);
    }

    @Override
    @Transactional
    public FirstHolyCommunionResponse create(FirstHolyCommunionRequest request) {
        Baptism baptism = baptismRepository.findById(request.getBaptismId())
                .orElseThrow(() -> new IllegalArgumentException("Baptism not found: " + request.getBaptismId()));
        if (communionRepository.findByBaptismId(request.getBaptismId()).isPresent()) {
            throw new IllegalArgumentException("First Holy Communion already exists for this baptism");
        }
        FirstHolyCommunion entity = FirstHolyCommunion.builder()
                .baptism(baptism)
                .communionDate(request.getCommunionDate())
                .officiatingPriest(request.getOfficiatingPriest())
                .parish(request.getParish())
                .build();
        entity = communionRepository.save(entity);
        return toResponse(entity);
    }

    private FirstHolyCommunionResponse toResponse(FirstHolyCommunion e) {
        return FirstHolyCommunionResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionDate(e.getCommunionDate())
                .officiatingPriest(e.getOfficiatingPriest())
                .parish(e.getParish())
                .build();
    }
}
