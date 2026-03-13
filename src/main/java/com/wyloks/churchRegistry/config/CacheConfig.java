package com.wyloks.churchRegistry.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.wyloks.churchRegistry.security.CurrentUserAccessService;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.support.CompositeCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_DIOCESES_WITH_PARISHES = "dioceses-with-parishes";
    public static final String CACHE_PARISHES_BY_DIOCESE = "parishes-by-diocese";
    public static final String CACHE_PARISH_DASHBOARD = "parish-dashboard";
    public static final String CACHE_DIOCESE_DASHBOARD = "diocese-dashboard";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager dashboardCacheManager = new CaffeineCacheManager();
        dashboardCacheManager.registerCustomCache(CACHE_PARISH_DASHBOARD,
                Caffeine.newBuilder()
                        .expireAfterWrite(2, TimeUnit.MINUTES)
                        .maximumSize(500)
                        .build());
        dashboardCacheManager.registerCustomCache(CACHE_DIOCESE_DASHBOARD,
                Caffeine.newBuilder()
                        .expireAfterWrite(2, TimeUnit.MINUTES)
                        .maximumSize(100)
                        .build());

        ConcurrentMapCacheManager diocesesCacheManager = new ConcurrentMapCacheManager(
                CACHE_DIOCESES_WITH_PARISHES, CACHE_PARISHES_BY_DIOCESE);

        CompositeCacheManager composite = new CompositeCacheManager();
        composite.setCacheManagers(Arrays.asList(diocesesCacheManager, dashboardCacheManager));
        return composite;
    }

    /**
     * Key generator that includes user context (admin vs parish-filtered) so cache entries
     * are isolated per user access. Prevents cross-tenant cache leakage.
     */
    @Bean
    public DioceseParishCacheKeyGenerator dioceseParishCacheKeyGenerator(CurrentUserAccessService currentUserAccessService) {
        return new DioceseParishCacheKeyGenerator(currentUserAccessService);
    }

    public static class DioceseParishCacheKeyGenerator implements org.springframework.cache.interceptor.KeyGenerator {

        private final CurrentUserAccessService currentUserAccessService;

        public DioceseParishCacheKeyGenerator(CurrentUserAccessService currentUserAccessService) {
            this.currentUserAccessService = currentUserAccessService;
        }

        @Override
        public Object generate(Object target, java.lang.reflect.Method method, Object... params) {
            CurrentUserAccessService.CurrentUserAccess currentUser = currentUserAccessService.currentUser();
            String userKey = currentUser.isAdmin()
                    ? "admin"
                    : "parishes:" + currentUser.parishIds().stream()
                            .sorted()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","));

            if (params != null && params.length > 0 && params[0] instanceof Long dioceseId) {
                return "diocese:" + dioceseId + "::" + userKey;
            }
            return userKey;
        }
    }
}
