package com.wyloks.churchRegistry.config;

import com.wyloks.churchRegistry.security.CurrentUserAccessService;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.stream.Collectors;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_DIOCESES_WITH_PARISHES = "dioceses-with-parishes";
    public static final String CACHE_PARISHES_BY_DIOCESE = "parishes-by-diocese";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(CACHE_DIOCESES_WITH_PARISHES, CACHE_PARISHES_BY_DIOCESE);
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
