package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.ConfirmationRequest;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.SacramentNoteHistory;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.SacramentNoteHistoryRepository;
import com.wyloks.churchRegistry.security.AppUserDetails;
import com.wyloks.churchRegistry.service.ConfirmationService;
import com.wyloks.churchRegistry.util.NameUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfirmationServiceImpl implements ConfirmationService {

    private final ConfirmationRepository confirmationRepository;
    private final FirstHolyCommunionRepository communionRepository;
    private final SacramentNoteHistoryRepository noteHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ConfirmationResponse> findByParishId(Long parishId) {
        return confirmationRepository.findByBaptismParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConfirmationResponse> findByParishId(Long parishId, Pageable pageable) {
        return confirmationRepository.findByBaptismParishId(parishId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConfirmationResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable) {
        if (parishIds == null || parishIds.isEmpty()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        return confirmationRepository.findByBaptismParishIdIn(parishIds, pageable).map(this::toResponse);
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
                .officiatingBishop(NameUtils.capitalizeNameOrEmpty(request.getOfficiatingBishop()))
                .parish(request.getParish() != null ? NameUtils.capitalizeName(request.getParish()) : null)
                .build();
        entity = confirmationRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public ConfirmationResponse updateNote(Long id, String note) {
        Confirmation confirmation = confirmationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Confirmation not found: " + id));
        String safeNote = note == null ? "" : note;
        confirmation.setNote(safeNote);
        confirmation = confirmationRepository.save(confirmation);
        noteHistoryRepository.save(SacramentNoteHistory.builder()
                .sacramentType("CONFIRMATION")
                .recordId(id)
                .content(safeNote)
                .createdBy(resolveActorName())
                .build());
        return toResponse(confirmation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SacramentNoteResponse> getNoteHistory(Long id) {
        return noteHistoryRepository
                .findBySacramentTypeAndRecordIdOrderByCreatedAtDesc("CONFIRMATION", id)
                .stream()
                .map(this::toNoteResponse)
                .collect(Collectors.toList());
    }

    private ConfirmationResponse toResponse(Confirmation e) {
        return ConfirmationResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionId(e.getFirstHolyCommunion().getId())
                .confirmationDate(e.getConfirmationDate())
                .officiatingBishop(e.getOfficiatingBishop())
                .parish(e.getParish())
                .createdAt(e.getCreatedAt())
                .baptismName(e.getBaptism().getBaptismName())
                .otherNames(e.getBaptism().getOtherNames())
                .surname(e.getBaptism().getSurname())
                .dateOfBirth(e.getBaptism().getDateOfBirth())
                .gender(e.getBaptism().getGender())
                .fathersName(e.getBaptism().getFathersName())
                .mothersName(e.getBaptism().getMothersName())
                .note(e.getNote())
                .build();
    }

    private SacramentNoteResponse toNoteResponse(SacramentNoteHistory n) {
        return SacramentNoteResponse.builder()
                .id(n.getId())
                .content(n.getContent())
                .createdAt(n.getCreatedAt())
                .createdBy(n.getCreatedBy())
                .build();
    }

    private String resolveActorName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails userDetails) {
            if (userDetails.getAppUser() != null && userDetails.getAppUser().getDisplayName() != null
                    && !userDetails.getAppUser().getDisplayName().isBlank()) {
                return userDetails.getAppUser().getDisplayName().trim();
            }
            if (userDetails.getRole() != null && !userDetails.getRole().isBlank()) {
                String[] parts = userDetails.getRole().trim().toLowerCase(Locale.ROOT).split("_");
                return java.util.Arrays.stream(parts)
                        .filter(p -> !p.isBlank())
                        .map(p -> Character.toUpperCase(p.charAt(0)) + p.substring(1))
                        .collect(Collectors.joining(" "));
            }
            return userDetails.getUsername();
        }
        return "System";
    }
}
