package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.DashboardResponse;

import java.util.Map;

public interface DashboardService {

    DashboardResponse getDashboard(Long parishId);

    Map<String, Long> getParishCounts(Long parishId);
}
