package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface BaptismService {

    List<BaptismResponse> findByParishId(Long parishId);

    Page<BaptismResponse> findByParishId(Long parishId, Pageable pageable);

    Optional<BaptismResponse> findById(Long id);

    BaptismResponse create(Long parishId, BaptismRequest request);

    BaptismResponse updateNote(Long id, String note);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
