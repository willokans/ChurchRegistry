package com.wyloks.churchRegistry.service.impl;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.MarriagePartyResponse;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.dto.CreateMarriageWithPartiesRequest;
import com.wyloks.churchRegistry.dto.MarriageWitnessResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.Marriage;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.entity.MarriagePartyLegacy;
import com.wyloks.churchRegistry.entity.MarriageWitnessLegacy;
import com.wyloks.churchRegistry.entity.SacramentNoteHistory;
import com.wyloks.churchRegistry.repository.BaptismRepository;
import com.wyloks.churchRegistry.repository.ConfirmationRepository;
import com.wyloks.churchRegistry.repository.HolyOrderRepository;
import com.wyloks.churchRegistry.repository.MarriagePartyLegacyRepository;
import com.wyloks.churchRegistry.repository.MarriageRepository;
import com.wyloks.churchRegistry.repository.MarriageWitnessLegacyRepository;
import com.wyloks.churchRegistry.repository.FirstHolyCommunionRepository;
import com.wyloks.churchRegistry.repository.ParishRepository;
import com.wyloks.churchRegistry.repository.SacramentNoteHistoryRepository;
import com.wyloks.churchRegistry.security.AppUserDetails;
import com.wyloks.churchRegistry.service.MarriageService;
import com.wyloks.churchRegistry.util.NameUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
    private final FirstHolyCommunionRepository firstHolyCommunionRepository;
    private final ParishRepository parishRepository;
    private final SacramentNoteHistoryRepository noteHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MarriageResponse> findByParishId(Long parishId) {
        List<Marriage> marriages = marriageRepository.findByBaptismParishId(parishId);
        return mapMarriagesToResponses(marriages);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MarriageResponse> findByParishId(Long parishId, Pageable pageable) {
        Page<Marriage> page = marriageRepository.findByBaptismParishId(parishId, pageable);
        List<MarriageResponse> content = mapMarriagesToResponses(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MarriageResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable) {
        if (parishIds == null || parishIds.isEmpty()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        Page<Marriage> page = marriageRepository.findByBaptismParishIdIn(parishIds, pageable);
        List<MarriageResponse> content = mapMarriagesToResponses(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    private List<MarriageResponse> mapMarriagesToResponses(List<Marriage> marriages) {
        if (marriages.isEmpty()) {
            return List.of();
        }
        List<Integer> marriageIds = marriages.stream()
                .map(m -> Math.toIntExact(m.getId()))
                .collect(Collectors.toList());
        List<MarriagePartyLegacy> allParties = marriagePartyLegacyRepository.findByMarriageIdIn(marriageIds);
        List<MarriageWitnessLegacy> allWitnesses = marriageWitnessLegacyRepository.findByMarriageIdInOrderByMarriageIdAscSortOrderAsc(marriageIds);
        Set<Long> baptismIds = allParties.stream()
                .filter(p -> p.getBaptismId() != null)
                .map(b -> b.getBaptismId().longValue())
                .collect(Collectors.toSet());
        Map<Long, Baptism> baptismById = baptismIds.isEmpty()
                ? Map.of()
                : baptismRepository.findAllById(baptismIds).stream()
                        .collect(Collectors.toMap(Baptism::getId, b -> b));
        Map<Integer, List<MarriagePartyLegacy>> partiesByMarriage = allParties.stream()
                .collect(Collectors.groupingBy(MarriagePartyLegacy::getMarriageId));
        Map<Integer, List<MarriageWitnessLegacy>> witnessesByMarriage = allWitnesses.stream()
                .collect(Collectors.groupingBy(MarriageWitnessLegacy::getMarriageId));
        return marriages.stream()
                .map(m -> toResponse(m, partiesByMarriage, witnessesByMarriage, baptismById))
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
    public MarriageResponse createWithParties(CreateMarriageWithPartiesRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is required");
        }
        if (request.getGroom() == null || request.getBride() == null || request.getMarriage() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groom, bride, and marriage are required");
        }

        Long parishId = request.getMarriage().getParishId();
        if (parishId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "marriage.parishId is required");
        }
        Parish parish = parishRepository.findById(parishId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parish not found: " + parishId));

        String partnersName = request.getMarriage().getPartnersName();
        if (partnersName == null || partnersName.isBlank()) {
            partnersName = (request.getGroom().getFullName() + " & " + request.getBride().getFullName()).trim();
        }

        java.util.Optional<Long> optionalConfirmationId = resolveOptionalConfirmationId(request);
        boolean parishRequiresConfirmation = parish.isRequireMarriageConfirmation();

        MarriageResponse created;
        if (parishRequiresConfirmation || optionalConfirmationId.isPresent()) {
            if (parishRequiresConfirmation) {
                validateBothPartiesDocumentConfirmation(request);
            }
            if (optionalConfirmationId.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "confirmationId is required (groom or bride confirmationId)");
            }
            long confirmationId = optionalConfirmationId.get();
            Long confirmationParishId = confirmationRepository.findParishIdById(confirmationId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Confirmation not found or has no parish"));
            if (!confirmationParishId.equals(parishId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Confirmation parish does not match marriage parish");
            }
            MarriageRequest marriageRequest = MarriageRequest.builder()
                    .confirmationId(confirmationId)
                    .partnersName(partnersName)
                    .marriageDate(request.getMarriage().getMarriageDate())
                    .marriageTime(request.getMarriage().getMarriageTime())
                    .churchName(request.getMarriage().getChurchName())
                    .marriageRegister(request.getMarriage().getMarriageRegister())
                    .diocese(request.getMarriage().getDiocese())
                    .civilRegistryNumber(request.getMarriage().getCivilRegistryNumber())
                    .dispensationGranted(request.getMarriage().getDispensationGranted())
                    .canonicalNotes(request.getMarriage().getCanonicalNotes())
                    .officiatingPriest(request.getMarriage().getOfficiatingPriest())
                    .parish(request.getMarriage().getParish())
                    .build();
            created = create(marriageRequest);
        } else {
            created = createMarriageWithoutConfirmationRecord(request, parishId, partnersName);
        }

        Integer marriageId = toIntId(created.getId());
        if (marriageId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid marriage id");
        }

        persistPartiesAndWitnesses(marriageId, request);

        return findById(created.getId()).orElse(created);
    }

    private void persistPartiesAndWitnesses(Integer marriageId, CreateMarriageWithPartiesRequest request) {
        MarriagePartyLegacy groomParty = toPartyLegacy(marriageId, "GROOM", request.getGroom());
        MarriagePartyLegacy brideParty = toPartyLegacy(marriageId, "BRIDE", request.getBride());
        marriagePartyLegacyRepository.save(groomParty);
        marriagePartyLegacyRepository.save(brideParty);

        if (request.getWitnesses() != null && !request.getWitnesses().isEmpty()) {
            List<MarriageWitnessLegacy> witnessEntities = new java.util.ArrayList<>();
            int idx = 0;
            for (CreateMarriageWithPartiesRequest.WitnessDetails w : request.getWitnesses()) {
                if (w == null || w.getFullName() == null || w.getFullName().isBlank()) continue;
                Integer sortOrder = w.getSortOrder() != null ? w.getSortOrder() : idx;
                witnessEntities.add(MarriageWitnessLegacy.builder()
                        .marriageId(marriageId)
                        .fullName(w.getFullName().trim())
                        .phone(w.getPhone() != null ? w.getPhone().trim() : null)
                        .address(w.getAddress() != null ? w.getAddress().trim() : null)
                        .sortOrder(sortOrder)
                        .build());
                idx++;
            }
            if (!witnessEntities.isEmpty()) {
                marriageWitnessLegacyRepository.saveAll(witnessEntities);
            }
        }
    }

    private MarriageResponse createMarriageWithoutConfirmationRecord(
            CreateMarriageWithPartiesRequest request,
            Long parishId,
            String partnersName) {
        CreateMarriageWithPartiesRequest.PartyDetails anchorParty;
        Baptism baptism;
        if (request.getGroom().getBaptismId() != null) {
            anchorParty = request.getGroom();
            baptism = loadBaptismForParish(anchorParty.getBaptismId(), parishId, "Groom");
        } else if (request.getBride().getBaptismId() != null) {
            anchorParty = request.getBride();
            baptism = loadBaptismForParish(anchorParty.getBaptismId(), parishId, "Bride");
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "In-parish baptism ID is required on groom or bride when confirmation is not linked for this parish");
        }
        FirstHolyCommunion communion = resolveCommunionForAnchor(anchorParty, baptism);
        if (marriageRepository.findByBaptismId(baptism.getId()).isPresent()) {
            throw new IllegalArgumentException("Marriage already exists for this baptism record");
        }
        if (holyOrderRepository.findByBaptismId(baptism.getId()).isPresent()) {
            throw new IllegalArgumentException("Cannot receive Marriage: person has already received Holy Order");
        }
        Marriage entity = Marriage.builder()
                .baptism(baptism)
                .firstHolyCommunion(communion)
                .confirmation(null)
                .partnersName(NameUtils.capitalizeNameOrEmpty(partnersName))
                .marriageDate(request.getMarriage().getMarriageDate())
                .marriageTime(request.getMarriage().getMarriageTime())
                .churchName(NameUtils.capitalizeNameOrEmpty(request.getMarriage().getChurchName()))
                .marriageRegister(request.getMarriage().getMarriageRegister())
                .diocese(NameUtils.capitalizeNameOrEmpty(request.getMarriage().getDiocese()))
                .civilRegistryNumber(request.getMarriage().getCivilRegistryNumber())
                .dispensationGranted(request.getMarriage().getDispensationGranted())
                .canonicalNotes(request.getMarriage().getCanonicalNotes())
                .officiatingPriest(NameUtils.capitalizeNameOrEmpty(request.getMarriage().getOfficiatingPriest()))
                .parish(NameUtils.capitalizeNameOrEmpty(request.getMarriage().getParish()))
                .build();
        entity = marriageRepository.save(entity);
        return toResponse(entity);
    }

    private Baptism loadBaptismForParish(Integer baptismId, Long parishId, String partyLabel) {
        Baptism b = baptismRepository.findById(baptismId.longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, partyLabel + " baptism not found"));
        if (!b.getParish().getId().equals(parishId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    partyLabel + " baptism is not in the selected parish");
        }
        return b;
    }

    private FirstHolyCommunion resolveCommunionForAnchor(
            CreateMarriageWithPartiesRequest.PartyDetails anchorParty,
            Baptism baptism) {
        if (anchorParty.getCommunionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "In-parish communion ID is required for the party used as sacramental anchor when confirmation is not linked");
        }
        FirstHolyCommunion c = firstHolyCommunionRepository.findById(anchorParty.getCommunionId().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Communion not found for anchor party"));
        if (!c.getBaptism().getId().equals(baptism.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Communion does not match the anchor baptism");
        }
        return c;
    }

    private java.util.Optional<Long> resolveOptionalConfirmationId(CreateMarriageWithPartiesRequest request) {
        Integer groomConfirmationId = request.getGroom().getConfirmationId();
        if (groomConfirmationId != null) {
            return java.util.Optional.of(groomConfirmationId.longValue());
        }
        Integer brideConfirmationId = request.getBride().getConfirmationId();
        if (brideConfirmationId != null) {
            return java.util.Optional.of(brideConfirmationId.longValue());
        }
        return java.util.Optional.empty();
    }

    /**
     * When the parish requires Confirmation, both parties must document it (parish record and/or certificate).
     * At least one in-parish {@code confirmationId} is required so the marriage row can link to the sacramental chain.
     */
    private void validateBothPartiesDocumentConfirmation(CreateMarriageWithPartiesRequest request) {
        CreateMarriageWithPartiesRequest.PartyDetails g = request.getGroom();
        CreateMarriageWithPartiesRequest.PartyDetails b = request.getBride();
        if (!partyDocumentsConfirmation(g) || !partyDocumentsConfirmation(b)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "When this parish requires Confirmation, both parties must document Confirmation (in-parish record or certificate).");
        }
        if (g.getConfirmationId() == null && b.getConfirmationId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "At least one party must have an in-parish Confirmation record linked for the marriage register.");
        }
    }

    private static boolean partyDocumentsConfirmation(CreateMarriageWithPartiesRequest.PartyDetails p) {
        if (p.getConfirmationId() != null) {
            return true;
        }
        String path = p.getConfirmationCertificatePath();
        return path != null && !path.isBlank();
    }

    private MarriagePartyLegacy toPartyLegacy(Integer marriageId, String role, CreateMarriageWithPartiesRequest.PartyDetails party) {
        if (party == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Party is required");
        }
        return MarriagePartyLegacy.builder()
                .marriageId(marriageId)
                .role(role)
                .fullName(party.getFullName().trim())
                .dateOfBirth(party.getDateOfBirth())
                .placeOfBirth(trimToNull(party.getPlaceOfBirth()))
                .nationality(trimToNull(party.getNationality()))
                .residentialAddress(trimToNull(party.getResidentialAddress()))
                .phone(trimToNull(party.getPhone()))
                .email(trimToNull(party.getEmail()))
                .occupation(trimToNull(party.getOccupation()))
                .maritalStatus(trimToNull(party.getMaritalStatus()))
                .baptismId(party.getBaptismId())
                .communionId(party.getCommunionId())
                .confirmationId(party.getConfirmationId())
                .baptismCertificatePath(trimToNull(party.getBaptismCertificatePath()))
                .communionCertificatePath(trimToNull(party.getCommunionCertificatePath()))
                .confirmationCertificatePath(trimToNull(party.getConfirmationCertificatePath()))
                .baptismChurch(trimToNull(party.getBaptismChurch()))
                .communionChurch(trimToNull(party.getCommunionChurch()))
                .confirmationChurch(trimToNull(party.getConfirmationChurch()))
                .build();
    }

    private String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
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
        return toResponse(e, null, null, null);
    }

    private MarriageResponse toResponse(Marriage e,
            Map<Integer, List<MarriagePartyLegacy>> partiesByMarriage,
            Map<Integer, List<MarriageWitnessLegacy>> witnessesByMarriage,
            Map<Long, Baptism> baptismById) {
        Integer legacyMarriageId = toIntId(e.getId());
        List<MarriagePartyLegacy> legacyParties;
        List<MarriageWitnessLegacy> legacyWitnesses;
        if (partiesByMarriage != null && witnessesByMarriage != null && legacyMarriageId != null) {
            legacyParties = partiesByMarriage.getOrDefault(legacyMarriageId, List.of());
            legacyWitnesses = witnessesByMarriage.getOrDefault(legacyMarriageId, List.of());
        } else if (legacyMarriageId != null) {
            legacyParties = marriagePartyLegacyRepository.findByMarriageId(legacyMarriageId);
            legacyWitnesses = marriageWitnessLegacyRepository.findByMarriageIdOrderBySortOrderAsc(legacyMarriageId);
        } else {
            legacyParties = List.of();
            legacyWitnesses = List.of();
        }

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

        Baptism groomBaptism = null;
        Baptism brideBaptism = null;
        if (groom != null && groom.getBaptismId() != null && baptismById != null) {
            groomBaptism = baptismById.get(groom.getBaptismId().longValue());
        } else if (groom != null && groom.getBaptismId() != null) {
            groomBaptism = baptismRepository.findById(groom.getBaptismId().longValue()).orElse(null);
        }
        if (bride != null && bride.getBaptismId() != null && baptismById != null) {
            brideBaptism = baptismById.get(bride.getBaptismId().longValue());
        } else if (bride != null && bride.getBaptismId() != null) {
            brideBaptism = baptismRepository.findById(bride.getBaptismId().longValue()).orElse(null);
        }

        return MarriageResponse.builder()
                .id(e.getId())
                .baptismId(e.getBaptism() != null ? e.getBaptism().getId() : null)
                .communionId(e.getFirstHolyCommunion() != null ? e.getFirstHolyCommunion().getId() : null)
                .confirmationId(e.getConfirmation() != null ? e.getConfirmation().getId() : null)
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
