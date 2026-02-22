package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.Marriage;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import com.wyloks.churchRegistry.service.MarriageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarriageServiceImpl implements MarriageService {

    private final MarriageRepository marriageRepository;
    private final ConfirmationRepository confirmationRepository;
    private final HolyOrderRepository holyOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MarriageResponse> findByParishId(Long parishId) {
        return marriageRepository.findByBaptismParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MarriageResponse> findById(Long id) {
        return marriageRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MarriageResponse> findByConfirmationId(Long confirmationId) {
        return marriageRepository.findByConfirmationId(confirmationId).map(this::toResponse);
    }

    @Override
    @Transactional
    public MarriageResponse create(MarriageRequest request) {
        Confirmation confirmation = confirmationRepository.findById(request.getConfirmationId())
                .orElseThrow(() -> new IllegalArgumentException("Confirmation not found: " + request.getConfirmationId()));
        if (marriageRepository.findByConfirmationId(request.getConfirmationId()).isPresent()) {
            throw new IllegalArgumentException("Marriage already exists for this confirmation");
        }
        if (holyOrderRepository.findByConfirmationId(request.getConfirmationId()).isPresent()) {
            throw new IllegalArgumentException("Cannot receive Marriage: person has already received Holy Order");
        }
        Marriage entity = Marriage.builder()
                .baptism(confirmation.getBaptism())
                .firstHolyCommunion(confirmation.getFirstHolyCommunion())
                .confirmation(confirmation)
                .partnersName(request.getPartnersName())
                .marriageDate(request.getMarriageDate())
                .officiatingPriest(request.getOfficiatingPriest())
                .parish(request.getParish())
                .build();
        entity = marriageRepository.save(entity);
        return toResponse(entity);
    }

    private MarriageResponse toResponse(Marriage e) {
        return MarriageResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionId(e.getFirstHolyCommunion().getId())
                .confirmationId(e.getConfirmation().getId())
                .partnersName(e.getPartnersName())
                .marriageDate(e.getMarriageDate())
                .officiatingPriest(e.getOfficiatingPriest())
                .parish(e.getParish())
                .build();
    }
}
