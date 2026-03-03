package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.MarriagePartyResponse;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.dto.MarriageWitnessResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.Marriage;
import com.wyloks.churchRegistry.entity.MarriagePartyLegacy;
import com.wyloks.churchRegistry.entity.MarriageWitnessLegacy;
import com.wyloks.churchRegistry.entity.SacramentNoteHistory;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriagePartyLegacyRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import com.wyloks.churchRegistry.repository.MarriageWitnessLegacyRepository;
import com.wyloks.churchRegistry.repository.SacramentNoteHistoryRepository;
import com.wyloks.churchRegistry.security.AppUserDetails;
import com.wyloks.churchRegistry.service.MarriageService;
import com.wyloks.churchRegistry.util.NameUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarriageServiceImpl implements MarriageService {

    private final MarriageRepository marriageRepository;
    private final ConfirmationRepository confirmationRepository;
    private final HolyOrderRepository holyOrderRepository;
    private final MarriagePartyLegacyRepository marriagePartyLegacyRepository;
    private final MarriageWitnessLegacyRepository marriageWitnessLegacyRepository;
    private final BaptismRepository baptismRepository;
    private final SacramentNoteHistoryRepository noteHistoryRepository;

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
                .partnersName(NameUtils.capitalizeNameOrEmpty(request.getPartnersName()))
                .marriageDate(request.getMarriageDate())
                .marriageTime(request.getMarriageTime())
                .churchName(NameUtils.capitalizeNameOrEmpty(request.getChurchName()))
                .marriageRegister(request.getMarriageRegister())
                .diocese(NameUtils.capitalizeNameOrEmpty(request.getDiocese()))
                .civilRegistryNumber(request.getCivilRegistryNumber())
                .dispensationGranted(request.getDispensationGranted())
                .canonicalNotes(request.getCanonicalNotes())
                .officiatingPriest(NameUtils.capitalizeNameOrEmpty(request.getOfficiatingPriest()))
                .parish(NameUtils.capitalizeNameOrEmpty(request.getParish()))
                .build();
        entity = marriageRepository.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public MarriageResponse updateNote(Long id, String note) {
        Marriage marriage = marriageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Marriage not found: " + id));
        String safeNote = note == null ? "" : note;
        marriage.setNote(safeNote);
        marriage = marriageRepository.save(marriage);
        noteHistoryRepository.save(SacramentNoteHistory.builder()
                .sacramentType("MARRIAGE")
                .recordId(id)
                .content(safeNote)
                .createdBy(resolveActorName())
                .build());
        return toResponse(marriage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SacramentNoteResponse> getNoteHistory(Long id) {
        return noteHistoryRepository
                .findBySacramentTypeAndRecordIdOrderByCreatedAtDesc("MARRIAGE", id)
                .stream()
                .map(this::toNoteResponse)
                .collect(Collectors.toList());
    }

    private MarriageResponse toResponse(Marriage e) {
        Integer legacyMarriageId = toIntId(e.getId());
        List<MarriagePartyLegacy> legacyParties = legacyMarriageId == null
                ? List.of()
                : marriagePartyLegacyRepository.findByMarriageId(legacyMarriageId);
        List<MarriageWitnessLegacy> legacyWitnesses = legacyMarriageId == null
                ? List.of()
                : marriageWitnessLegacyRepository.findByMarriageIdOrderBySortOrderAsc(legacyMarriageId);

        List<MarriagePartyResponse> parties = legacyParties.stream()
                .map(this::toPartyResponse)
                .collect(Collectors.toList());
        List<MarriageWitnessResponse> witnesses = legacyWitnesses.stream()
                .map(this::toWitnessResponse)
                .collect(Collectors.toList());

        MarriagePartyLegacy groom = legacyParties.stream()
                .filter(p -> "GROOM".equals(normalizeRole(p.getRole())))
                .findFirst()
                .orElse(null);
        MarriagePartyLegacy bride = legacyParties.stream()
                .filter(p -> "BRIDE".equals(normalizeRole(p.getRole())))
                .findFirst()
                .orElse(null);

        Baptism groomBaptism = groom != null && groom.getBaptismId() != null
                ? baptismRepository.findById(groom.getBaptismId().longValue()).orElse(null)
                : null;
        Baptism brideBaptism = bride != null && bride.getBaptismId() != null
                ? baptismRepository.findById(bride.getBaptismId().longValue()).orElse(null)
                : null;

        return MarriageResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism().getId())
                .communionId(e.getFirstHolyCommunion().getId())
                .confirmationId(e.getConfirmation().getId())
                .partnersName(e.getPartnersName())
                .marriageDate(e.getMarriageDate())
                .marriageTime(e.getMarriageTime())
                .churchName(e.getChurchName())
                .marriageRegister(e.getMarriageRegister())
                .diocese(e.getDiocese())
                .civilRegistryNumber(e.getCivilRegistryNumber())
                .dispensationGranted(e.getDispensationGranted())
                .canonicalNotes(e.getCanonicalNotes())
                .officiatingPriest(e.getOfficiatingPriest())
                .parish(e.getParish())
                .createdAt(e.getCreatedAt())
                .parties(parties)
                .witnesses(witnesses)
                .groomName(groom != null ? groom.getFullName() : null)
                .brideName(bride != null ? bride.getFullName() : null)
                .groomFatherName(groomBaptism != null ? groomBaptism.getFathersName() : null)
                .groomMotherName(groomBaptism != null ? groomBaptism.getMothersName() : null)
                .brideFatherName(brideBaptism != null ? brideBaptism.getFathersName() : null)
                .brideMotherName(brideBaptism != null ? brideBaptism.getMothersName() : null)
                .witnessesDisplay(witnesses.stream()
                        .map(MarriageWitnessResponse::getFullName)
                        .filter(name -> name != null && !name.isBlank())
                        .collect(Collectors.joining(", ")))
                .note(e.getNote())
                .build();
    }

    private MarriagePartyResponse toPartyResponse(MarriagePartyLegacy party) {
        return MarriagePartyResponse.builder()
                .id(toLongId(party.getId()))
                .marriageId(toLongId(party.getMarriageId()))
                .role(normalizeRole(party.getRole()))
                .fullName(party.getFullName())
                .dateOfBirth(party.getDateOfBirth())
                .placeOfBirth(party.getPlaceOfBirth())
                .nationality(party.getNationality())
                .residentialAddress(party.getResidentialAddress())
                .phone(party.getPhone())
                .email(party.getEmail())
                .occupation(party.getOccupation())
                .maritalStatus(party.getMaritalStatus())
                .baptismId(toLongId(party.getBaptismId()))
                .communionId(toLongId(party.getCommunionId()))
                .confirmationId(toLongId(party.getConfirmationId()))
                .baptismCertificatePath(party.getBaptismCertificatePath())
                .communionCertificatePath(party.getCommunionCertificatePath())
                .confirmationCertificatePath(party.getConfirmationCertificatePath())
                .baptismChurch(party.getBaptismChurch())
                .communionChurch(party.getCommunionChurch())
                .confirmationChurch(party.getConfirmationChurch())
                .build();
    }

    private MarriageWitnessResponse toWitnessResponse(MarriageWitnessLegacy witness) {
        return MarriageWitnessResponse.builder()
                .id(toLongId(witness.getId()))
                .marriageId(toLongId(witness.getMarriageId()))
                .fullName(witness.getFullName())
                .phone(witness.getPhone())
                .address(witness.getAddress())
                .sortOrder(witness.getSortOrder())
                .build();
    }

    private String normalizeRole(String role) {
        return role == null ? null : role.trim().toUpperCase(Locale.ROOT);
    }

    private Integer toIntId(Long id) {
        return id == null ? null : Math.toIntExact(id);
    }

    private Long toLongId(Integer id) {
        return id == null ? null : id.longValue();
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
