package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.ConfirmationRequest;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ConfirmationService {

    List<ConfirmationResponse> findByParishId(Long parishId);

    Page<ConfirmationResponse> findByParishId(Long parishId, Pageable pageable);

    Page<ConfirmationResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable);

    Optional<ConfirmationResponse> findById(Long id);

    Optional<ConfirmationResponse> findByCommunionId(Long communionId);

    ConfirmationResponse create(ConfirmationRequest request);

    ConfirmationResponse updateNote(Long id, String note);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
