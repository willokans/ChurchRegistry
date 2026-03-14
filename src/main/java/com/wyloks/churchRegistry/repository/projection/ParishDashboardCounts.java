package com.wyloks.churchRegistry.repository.projection;

/**
 * Projection for parish dashboard counts. Used by a single batch query to avoid
 * 5 separate count round trips.
 */
public interface ParishDashboardCounts {

    long getBaptisms();

    long getCommunions();

    long getConfirmations();

    long getMarriages();

    long getHolyOrders();
}
