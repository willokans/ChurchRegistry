package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.ParishRequest;
import com.wyloks.churchRegistry.dto.ParishResponse;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.repository.DioceseRepository;
import com.wyloks.churchRegistry.repository.ParishRepository;
import com.wyloks.churchRegistry.service.ParishService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParishServiceImpl implements ParishService {

    private final ParishRepository parishRepository;
    private final DioceseRepository dioceseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ParishResponse> findByDioceseId(Long dioceseId) {
        return parishRepository.findByDioceseId(dioceseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ParishResponse> findById(Long id) {
        return parishRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional
    public ParishResponse create(ParishRequest request) {
        Diocese diocese = dioceseRepository.findById(request.getDioceseId())
                .orElseThrow(() -> new IllegalArgumentException("Diocese not found: " + request.getDioceseId()));
        Parish entity = Parish.builder()
                .parishName(request.getParishName())
                .diocese(diocese)
                .description(request.getDescription())
                .build();
        entity = parishRepository.save(entity);
        return toResponse(entity);
    }

    private ParishResponse toResponse(Parish e) {
        return ParishResponse.builder()
                .id(e.getId())
                .parishName(e.getParishName())
                .dioceseId(e.getDiocese().getId())
                .description(e.getDescription())
                .build();
    }
}
