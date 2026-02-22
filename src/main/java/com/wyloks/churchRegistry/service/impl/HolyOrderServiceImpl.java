package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.HolyOrderRequest;
import com.wyloks.churchRegistry.dto.HolyOrderResponse;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.HolyOrder;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import com.wyloks.churchRegistry.repository.ParishRepository;
import com.wyloks.churchRegistry.service.HolyOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HolyOrderServiceImpl implements HolyOrderService {

    private final HolyOrderRepository holyOrderRepository;
    private final ConfirmationRepository confirmationRepository;
    private final MarriageRepository marriageRepository;
    private final ParishRepository parishRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HolyOrderResponse> findByParishId(Long parishId) {
        return holyOrderRepository.findByBaptismParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<HolyOrderResponse> findById(Long id) {
        return holyOrderRepository.findById(id).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<HolyOrderResponse> findByConfirmationId(Long confirmationId) {
        return holyOrderRepository.findByConfirmationId(confirmationId).map(this::toResponse);
    }

    @Override
    @Transactional
    public HolyOrderResponse create(HolyOrderRequest request) {
        Confirmation confirmation = confirmationRepository.findById(request.getConfirmationId())
                .orElseThrow(() -> new IllegalArgumentException("Confirmation not found: " + request.getConfirmationId()));
        if (holyOrderRepository.findByConfirmationId(request.getConfirmationId()).isPresent()) {
            throw new IllegalArgumentException("Holy Order already exists for this confirmation");
        }
        if (marriageRepository.findByConfirmationId(request.getConfirmationId()).isPresent()) {
            throw new IllegalArgumentException("Cannot receive Holy Order: person has already received Marriage");
        }
        Parish parish = request.getParishId() != null
                ? parishRepository.findById(request.getParishId()).orElse(null)
                : null;
        HolyOrder entity = HolyOrder.builder()
                .baptism(confirmation.getBaptism())
                .firstHolyCommunion(confirmation.getFirstHolyCommunion())
                .confirmation(confirmation)
                .ordinationDate(request.getOrdinationDate())
                .orderType(request.getOrderType())
                .officiatingBishop(request.getOfficiatingBishop())
                .parish(parish)
                .build();
        entity = holyOrderRepository.save(entity);
        return toResponse(entity);
    }

    private HolyOrderResponse toResponse(HolyOrder e) {
        return HolyOrderResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionId(e.getFirstHolyCommunion().getId())
                .confirmationId(e.getConfirmation().getId())
                .ordinationDate(e.getOrdinationDate())
                .orderType(e.getOrderType())
                .officiatingBishop(e.getOfficiatingBishop())
                .parishId(e.getParish() != null ? e.getParish().getId() : null)
                .build();
    }
}
