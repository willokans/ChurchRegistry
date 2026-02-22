package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.ConfirmationRequest;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.service.ConfirmationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfirmationServiceImpl implements ConfirmationService {

    private final ConfirmationRepository confirmationRepository;
    private final FirstHolyCommunionRepository communionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ConfirmationResponse> findByParishId(Long parishId) {
        return confirmationRepository.findByBaptismParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConfirmationResponse> findById(Long id) {
        return confirmationRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConfirmationResponse> findByCommunionId(Long communionId) {
        return confirmationRepository.findByFirstHolyCommunionId(communionId).map(this::toResponse);
    }

    @Override
    @Transactional
    public ConfirmationResponse create(ConfirmationRequest request) {
        FirstHolyCommunion communion = communionRepository.findById(request.getCommunionId())
                .orElseThrow(() -> new IllegalArgumentException("First Holy Communion not found: " + request.getCommunionId()));
        if (confirmationRepository.findByFirstHolyCommunionId(request.getCommunionId()).isPresent()) {
            throw new IllegalArgumentException("Confirmation already exists for this communion");
        }
        Confirmation entity = Confirmation.builder()
                .baptism(communion.getBaptism())
                .firstHolyCommunion(communion)
                .confirmationDate(request.getConfirmationDate())
                .officiatingBishop(request.getOfficiatingBishop())
                .parish(request.getParish())
                .build();
        entity = confirmationRepository.save(entity);
        return toResponse(entity);
    }

    private ConfirmationResponse toResponse(Confirmation e) {
        return ConfirmationResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionId(e.getFirstHolyCommunion().getId())
                .confirmationDate(e.getConfirmationDate())
                .officiatingBishop(e.getOfficiatingBishop())
                .parish(e.getParish())
                .build();
    }
}
