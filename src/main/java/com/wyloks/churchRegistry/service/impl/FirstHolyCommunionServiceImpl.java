package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.SacramentNoteHistory;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.SacramentNoteHistoryRepository;
import com.wyloks.churchRegistry.security.AppUserDetails;
import com.wyloks.churchRegistry.service.FirstHolyCommunionService;
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
public class FirstHolyCommunionServiceImpl implements FirstHolyCommunionService {

    private final FirstHolyCommunionRepository communionRepository;
    private final BaptismRepository baptismRepository;
    private final SacramentNoteHistoryRepository noteHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FirstHolyCommunionResponse> findByParishId(Long parishId) {
        return communionRepository.findByBaptismParishId(parishId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FirstHolyCommunionResponse> findByParishId(Long parishId, Pageable pageable) {
        return communionRepository.findByBaptismParishId(parishId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FirstHolyCommunionResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable) {
        if (parishIds == null || parishIds.isEmpty()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        return communionRepository.findByBaptismParishIdIn(parishIds, pageable).map(this::toResponse);
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
                .officiatingPriest(NameUtils.capitalizeNameOrEmpty(request.getOfficiatingPriest()))
                .parish(request.getParish())
                .baptismCertificatePath(request.getBaptismCertificatePath())
                .communionCertificatePath(request.getCommunionCertificatePath())
                .build();
        entity = communionRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public FirstHolyCommunionResponse updateNote(Long id, String note) {
        FirstHolyCommunion communion = communionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("First Holy Communion not found: " + id));
        String safeNote = note == null ? "" : note;
        communion.setNote(safeNote);
        communion = communionRepository.save(communion);
        noteHistoryRepository.save(SacramentNoteHistory.builder()
                .sacramentType("COMMUNION")
                .recordId(id)
                .content(safeNote)
                .createdBy(resolveActorName())
                .build());
        return toResponse(communion);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SacramentNoteResponse> getNoteHistory(Long id) {
        return noteHistoryRepository
                .findBySacramentTypeAndRecordIdOrderByCreatedAtDesc("COMMUNION", id)
                .stream()
                .map(this::toNoteResponse)
                .collect(Collectors.toList());
    }

    private FirstHolyCommunionResponse toResponse(FirstHolyCommunion e) {
        return FirstHolyCommunionResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionDate(e.getCommunionDate())
                .officiatingPriest(e.getOfficiatingPriest())
                .parish(e.getParish())
                .baptismCertificatePath(e.getBaptismCertificatePath())
                .communionCertificatePath(e.getCommunionCertificatePath())
                .createdAt(e.getCreatedAt())
                .baptismName(e.getBaptism().getBaptismName())
                .otherNames(e.getBaptism().getOtherNames())
                .surname(e.getBaptism().getSurname())
                .dateOfBirth(e.getBaptism().getDateOfBirth())
                .baptismParishName(e.getBaptism().getParish() != null ? e.getBaptism().getParish().getParishName() : null)
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
