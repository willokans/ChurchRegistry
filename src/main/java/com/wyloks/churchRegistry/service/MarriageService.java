package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.MarriageRequest;
import com.wyloks.churchRegistry.dto.MarriageResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;

import java.util.List;
import java.util.Optional;

public interface MarriageService {

    List<MarriageResponse> findByParishId(Long parishId);

    Optional<MarriageResponse> findById(Long id);

    Optional<MarriageResponse> findByConfirmationId(Long confirmationId);

    MarriageResponse create(MarriageRequest request);

    MarriageResponse updateNote(Long id, String note);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
