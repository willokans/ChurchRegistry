package com.wyloks.churchRegistry.repository.projection;

/**
 * Projection for parish activity in diocese dashboard. One row per parish with
 * sacrament counts.
 */
public interface ParishActivityRow {

    Long getParishId();

    String getParishName();

    long getBaptisms();

    long getCommunions();

    long getConfirmations();

    long getMarriages();
}
