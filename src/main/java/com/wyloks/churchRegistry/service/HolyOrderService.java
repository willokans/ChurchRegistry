package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.HolyOrderRequest;
import com.wyloks.churchRegistry.dto.HolyOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface HolyOrderService {

    List<HolyOrderResponse> findByParishId(Long parishId);

    Page<HolyOrderResponse> findByParishId(Long parishId, Pageable pageable);

    Optional<HolyOrderResponse> findById(Long id);

    Optional<HolyOrderResponse> findByConfirmationId(Long confirmationId);

    HolyOrderResponse create(HolyOrderRequest request);
}
