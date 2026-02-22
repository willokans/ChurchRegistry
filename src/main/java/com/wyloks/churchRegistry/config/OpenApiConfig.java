package com.wyloks.churchRegistry.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI churchRegistryOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Church Registry API")
                        .description("REST API for sacramental records (Baptism, First Holy Communion, Confirmation, Marriage, Holy Order). " +
                                "**Auth:** Use POST /api/auth/login with username/password to get an access token and refresh token. " +
                                "Use POST /api/auth/refresh with the refresh token to obtain a new access token. " +
                                "For protected endpoints, set header: `Authorization: Bearer <accessToken>`.")
                        .version("1.0"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Access token from login or refresh. Do not include the word 'Bearer' in the token field when using Authorize.")));
    }
}
