package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.HolyOrderRequest;
import com.wyloks.churchRegistry.dto.HolyOrderResponse;

import java.util.List;
import java.util.Optional;

public interface HolyOrderService {

    List<HolyOrderResponse> findByParishId(Long parishId);

    Optional<HolyOrderResponse> findById(Long id);

    Optional<HolyOrderResponse> findByConfirmationId(Long confirmationId);

    HolyOrderResponse create(HolyOrderRequest request);
}
