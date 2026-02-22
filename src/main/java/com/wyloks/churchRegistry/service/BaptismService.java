package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;

import java.util.List;
import java.util.Optional;

public interface BaptismService {

    List<BaptismResponse> findByParishId(Long parishId);

    Optional<BaptismResponse> findById(Long id);

    BaptismResponse create(Long parishId, BaptismRequest request);
}
