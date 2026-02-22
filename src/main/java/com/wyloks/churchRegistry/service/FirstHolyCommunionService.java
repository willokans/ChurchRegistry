package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.FirstHolyCommunionRequest;
import com.wyloks.churchRegistry.dto.FirstHolyCommunionResponse;

import java.util.List;
import java.util.Optional;

public interface FirstHolyCommunionService {

    List<FirstHolyCommunionResponse> findByParishId(Long parishId);

    Optional<FirstHolyCommunionResponse> findById(Long id);

    Optional<FirstHolyCommunionResponse> findByBaptismId(Long baptismId);

    FirstHolyCommunionResponse create(FirstHolyCommunionRequest request);
}
