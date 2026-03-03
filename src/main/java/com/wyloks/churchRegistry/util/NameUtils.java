package com.wyloks.churchRegistry.util;

/**
 * Utility for normalizing name strings before persistence.
 * Capitalizes the first letter of each word (space, hyphen, apostrophe as word boundaries).
 */
public final class NameUtils {

    private NameUtils() {
    }

    /**
     * Capitalizes the first letter of each word in the given string.
     * Word boundaries: space, hyphen (-), apostrophe (').
     * Returns null for null input, empty string for blank input.
     */
    public static String capitalizeName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(trimmed.length());
        boolean capitalizeNext = true;
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == ' ' || c == '-' || c == '\'') {
                capitalizeNext = true;
                sb.append(c);
            } else if (capitalizeNext) {
                sb.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }

    /**
     * Capitalizes the given string if non-null and non-blank; otherwise returns empty string.
     * Use for fields that should never be null when persisted.
     */
    public static String capitalizeNameOrEmpty(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return capitalizeName(value);
    }
}
