package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.repository.projection.ParishActivityRow;
import com.wyloks.churchRegistry.repository.projection.ParishDashboardCounts;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository for dashboard-specific queries. Batches count queries into a single
 * round trip to reduce database load.
 */
public interface DashboardRepository extends Repository<Baptism, Long> {

    /**
     * Returns all sacrament counts for a parish in one query.
     */
    @Query(value = """
        SELECT
            (SELECT COUNT(*) FROM baptism WHERE parish_id = :parishId) AS baptisms,
            (SELECT COUNT(*) FROM first_holy_communion f
             JOIN baptism b ON f.baptism_id = b.id WHERE b.parish_id = :parishId) AS communions,
            (SELECT COUNT(*) FROM confirmation c
             JOIN baptism b ON c.baptism_id = b.id WHERE b.parish_id = :parishId) AS confirmations,
            (SELECT COUNT(*) FROM marriage m
             JOIN baptism b ON m.baptism_id = b.id WHERE b.parish_id = :parishId) AS marriages,
            (SELECT COUNT(*) FROM holy_order h
             JOIN baptism b ON h.baptism_id = b.id WHERE b.parish_id = :parishId) AS holy_orders
        """, nativeQuery = true)
    ParishDashboardCounts getParishCounts(@Param("parishId") Long parishId);

    /**
     * Returns per-parish sacrament counts for all parishes in a diocese.
     */
    @Query(value = """
        SELECT
            p.id AS parishId,
            p.parish_name AS parishName,
            (SELECT COUNT(*) FROM baptism WHERE parish_id = p.id) AS baptisms,
            (SELECT COUNT(*) FROM first_holy_communion f
             JOIN baptism b ON f.baptism_id = b.id WHERE b.parish_id = p.id) AS communions,
            (SELECT COUNT(*) FROM confirmation c
             JOIN baptism b ON c.baptism_id = b.id WHERE b.parish_id = p.id) AS confirmations,
            (SELECT COUNT(*) FROM marriage m
             JOIN baptism b ON m.baptism_id = b.id WHERE b.parish_id = p.id) AS marriages
        FROM parish p
        WHERE p.diocese_id = :dioceseId
        ORDER BY p.parish_name
        """, nativeQuery = true)
    List<ParishActivityRow> getParishActivity(@Param("dioceseId") Long dioceseId);
}
