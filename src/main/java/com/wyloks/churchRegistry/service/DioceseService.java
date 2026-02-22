package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.DioceseRequest;
import com.wyloks.churchRegistry.dto.DioceseResponse;

import java.util.List;
import java.util.Optional;

public interface DioceseService {

    List<DioceseResponse> findAll();

    Optional<DioceseResponse> findById(Long id);

    DioceseResponse create(DioceseRequest request);
}
