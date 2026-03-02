package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.ConfirmationRequest;
import com.wyloks.churchRegistry.dto.ConfirmationResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;

import java.util.List;
import java.util.Optional;

public interface ConfirmationService {

    List<ConfirmationResponse> findByParishId(Long parishId);

    Optional<ConfirmationResponse> findById(Long id);

    Optional<ConfirmationResponse> findByCommunionId(Long communionId);

    ConfirmationResponse create(ConfirmationRequest request);

    ConfirmationResponse updateNote(Long id, String note);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
