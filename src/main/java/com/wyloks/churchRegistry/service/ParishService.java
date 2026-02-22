package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.ParishRequest;
import com.wyloks.churchRegistry.dto.ParishResponse;

import java.util.List;
import java.util.Optional;

public interface ParishService {

    List<ParishResponse> findByDioceseId(Long dioceseId);

    Optional<ParishResponse> findById(Long id);

    ParishResponse create(ParishRequest request);
}
