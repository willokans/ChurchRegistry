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

        String trimmed = pathOrUrl.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            validateCertificatePath(trimmed);
        }
        URI uri = resolveUri(trimmed);
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

    /**
     * Validates certificate object path to prevent path traversal and invalid paths.
     * Expected format: bucket/path or flat path (e.g. baptism-certificates/123-foo.pdf).
     * Rejects: '..', null bytes, and non-safe characters.
     */
    private void validateCertificatePath(String path) {
        if (path.contains("..") || path.contains("\0")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate path");
        }
        String normalized = path.startsWith("/") ? path.substring(1) : path;
        if (!normalized.matches("^[a-zA-Z0-9._/-]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate path");
        }
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

    /**
     * Uploads a file to Supabase Storage. Returns the object path (e.g. "123-foo.pdf") for storing in DB.
     * Path format in DB can be "bucket/path" or just "path" depending on download expectations.
     */
    public String upload(String bucket, String objectPath, byte[] bytes, String contentType) {
        String base = resolveStorageBase();
        if (base.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Storage base URL is not configured for certificate upload"
            );
        }
        String safePath = objectPath != null ? objectPath.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
        String authKey = sanitizeHeaderValue(!serviceRoleKey.isBlank() ? serviceRoleKey : anonKey);
        if (authKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Supabase API key is not configured for certificate upload"
            );
        }
        String uploadUrl = trimTrailingSlash(base) + "/" + bucket + "/" + safePath;
        try {
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder(URI.create(uploadUrl))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes != null ? bytes : new byte[0]))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + authKey)
                    .header("apikey", authKey)
                    .header("Content-Type", contentType != null && !contentType.isBlank() ? contentType : "application/octet-stream")
                    .header("x-upsert", "true");
            HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int code = response.statusCode();
            if (code == 401 || code == 403) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage upload access denied");
            }
            if (code < 200 || code >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to upload certificate: " + response.body());
            }
            return safePath;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to upload certificate", ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to upload certificate", ex);
        }
    }

    private String resolveStorageBase() {
        if (!storageBaseUrl.isBlank()) {
            return trimTrailingSlash(storageBaseUrl);
        }
        if (!supabaseUrl.isBlank()) {
            return trimTrailingSlash(supabaseUrl) + "/storage/v1/object";
        }
        if (!nextPublicSupabaseUrl.isBlank()) {
            return trimTrailingSlash(nextPublicSupabaseUrl) + "/storage/v1/object";
        }
        String inferred = inferSupabaseUrlFromDatasourceUsername();
        if (inferred != null) {
            return trimTrailingSlash(inferred) + "/storage/v1/object";
        }
        return "";
    }

    public record RemoteFile(byte[] bytes, String contentType) {}
}
