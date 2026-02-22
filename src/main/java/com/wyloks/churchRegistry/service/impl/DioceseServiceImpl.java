package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.DioceseRequest;
import com.wyloks.churchRegistry.dto.DioceseResponse;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.repository.DioceseRepository;
import com.wyloks.churchRegistry.service.DioceseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DioceseServiceImpl implements DioceseService {

    private final DioceseRepository dioceseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DioceseResponse> findAll() {
        return dioceseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DioceseResponse> findById(Long id) {
        return dioceseRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional
    public DioceseResponse create(DioceseRequest request) {
        Diocese entity = Diocese.builder()
                .dioceseName(request.getDioceseName())
                .code(request.getCode())
                .description(request.getDescription())
                .build();
        entity = dioceseRepository.save(entity);
        return toResponse(entity);
    }

    private DioceseResponse toResponse(Diocese e) {
        return DioceseResponse.builder()
                .id(e.getId())
                .dioceseName(e.getDioceseName())
                .code(e.getCode())
                .description(e.getDescription())
                .build();
    }
}
