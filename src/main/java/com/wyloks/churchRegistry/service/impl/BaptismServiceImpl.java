package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ParishRepository;
import com.wyloks.churchRegistry.service.BaptismService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaptismServiceImpl implements BaptismService {

    private final BaptismRepository baptismRepository;
    private final ParishRepository parishRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BaptismResponse> findByParishId(Long parishId) {
        return baptismRepository.findByParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BaptismResponse> findById(Long id) {
        return baptismRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional
    public BaptismResponse create(Long parishId, BaptismRequest request) {
        Parish parish = parishId != null
                ? parishRepository.findById(parishId).orElseThrow(() -> new IllegalArgumentException("Parish not found: " + parishId))
                : null;
        Baptism entity = Baptism.builder()
                .baptismName(request.getBaptismName())
                .surname(request.getSurname())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .fathersName(request.getFathersName())
                .mothersName(request.getMothersName())
                .sponsorNames(request.getSponsorNames())
                .parish(parish)
                .address(request.getAddress())
                .parishAddress(request.getParishAddress())
                .parentAddress(request.getParentAddress())
                .build();
        entity = baptismRepository.save(entity);
        return toResponse(entity);
    }

    private BaptismResponse toResponse(Baptism e) {
        return BaptismResponse.builder()
                .id(e.getId())
                .baptismName(e.getBaptismName())
                .surname(e.getSurname())
                .gender(e.getGender())
                .dateOfBirth(e.getDateOfBirth())
                .fathersName(e.getFathersName())
                .mothersName(e.getMothersName())
                .sponsorNames(e.getSponsorNames())
                .parishId(e.getParish() != null ? e.getParish().getId() : null)
                .address(e.getAddress())
                .parishAddress(e.getParishAddress())
                .parentAddress(e.getParentAddress())
                .build();
    }
}
