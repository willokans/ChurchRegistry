package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface MarriageService {

    List<MarriageResponse> findByParishId(Long parishId);

    Page<MarriageResponse> findByParishId(Long parishId, Pageable pageable);

    Page<MarriageResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable);

    Optional<MarriageResponse> findById(Long id);

    Optional<MarriageResponse> findByConfirmationId(Long confirmationId);

    MarriageResponse create(MarriageRequest request);

    MarriageResponse updateNote(Long id, String note);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
