package com.wyloks.churchRegistry.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class RemoteFileService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${SUPABASE_STORAGE_BASE_URL:}")
    private String storageBaseUrl;

    @Value("${SUPABASE_URL:}")
    private String supabaseUrl;

    @Value("${NEXT_PUBLIC_SUPABASE_URL:}")
    private String nextPublicSupabaseUrl;

    @Value("${SUPABASE_SERVICE_ROLE_KEY:}")
    private String serviceRoleKey;

    @Value("${SUPABASE_ANON_KEY:}")
    private String anonKey;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    public RemoteFile download(String pathOrUrl) {
        if (pathOrUrl == null || pathOrUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate file not found");
        }

        URI uri = resolveUri(pathOrUrl.trim());
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .GET()
                .timeout(Duration.ofSeconds(30));

        String authKey = sanitizeHeaderValue(!serviceRoleKey.isBlank() ? serviceRoleKey : anonKey);
        if (!authKey.isBlank()) {
            builder.header("Authorization", "Bearer " + authKey);
            builder.header("apikey", authKey);
        }

        try {
            HttpResponse<byte[]> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            int code = response.statusCode();
            if (code == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate file not found");
            }
            if (code == 401 || code == 403) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage access denied");
            }
            if (code < 200 || code >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch certificate file");
            }
            String contentType = response.headers().firstValue("content-type").orElse("application/octet-stream");
            return new RemoteFile(response.body(), contentType);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch certificate file", ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch certificate file", ex);
        }
    }

    private URI resolveUri(String rawPath) {
        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            return URI.create(rawPath);
        }

        String normalizedPath = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
        String base = !storageBaseUrl.isBlank() ? storageBaseUrl : "";
        if (base.isBlank() && !supabaseUrl.isBlank()) {
            base = trimTrailingSlash(supabaseUrl) + "/storage/v1/object";
        }
        if (base.isBlank() && !nextPublicSupabaseUrl.isBlank()) {
            base = trimTrailingSlash(nextPublicSupabaseUrl) + "/storage/v1/object";
        }
        if (base.isBlank()) {
            String inferred = inferSupabaseUrlFromDatasourceUsername();
            if (inferred != null) {
                base = trimTrailingSlash(inferred) + "/storage/v1/object";
            }
        }
        if (base.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Storage base URL is not configured for certificate file lookup"
            );
        }

        // Preserve slash hierarchy while URL-encoding each segment.
        String[] segments = normalizedPath.split("/");
        StringBuilder encoded = new StringBuilder();
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) encoded.append('/');
            encoded.append(URLEncoder.encode(segments[i], StandardCharsets.UTF_8));
        }
        return URI.create(trimTrailingSlash(base) + "/" + encoded);
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String sanitizeHeaderValue(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\r", "").replace("\n", "").trim();
    }

    private String inferSupabaseUrlFromDatasourceUsername() {
        if (datasourceUsername == null || datasourceUsername.isBlank()) {
            return null;
        }
        String username = datasourceUsername.trim();
        if (!username.startsWith("postgres.")) {
            return null;
        }
        String projectRef = username.substring("postgres.".length());
        if (projectRef.isBlank()) {
            return null;
        }
        return "https://" + projectRef + ".supabase.co";
    }

    public record RemoteFile(byte[] bytes, String contentType) {}
}
