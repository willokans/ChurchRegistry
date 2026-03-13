package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FirstHolyCommunionService {

    List<FirstHolyCommunionResponse> findByParishId(Long parishId);

    Page<FirstHolyCommunionResponse> findByParishId(Long parishId, Pageable pageable);

    Page<FirstHolyCommunionResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable);

    Optional<FirstHolyCommunionResponse> findById(Long id);

    Optional<FirstHolyCommunionResponse> findByBaptismId(Long baptismId);

    FirstHolyCommunionResponse create(FirstHolyCommunionRequest request);

    FirstHolyCommunionResponse updateNote(Long id, String note);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
