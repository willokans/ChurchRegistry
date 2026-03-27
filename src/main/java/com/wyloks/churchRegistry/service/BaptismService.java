package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.BaptismRequest;
import com.wyloks.churchRegistry.dto.BaptismResponse;
import com.wyloks.churchRegistry.dto.SacramentNoteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface BaptismService {

    List<BaptismResponse> findByParishId(Long parishId);

    Page<BaptismResponse> findByParishId(Long parishId, Pageable pageable);

    Page<BaptismResponse> findByParishIdIn(Set<Long> parishIds, Pageable pageable);

    Page<BaptismResponse> searchByNameOrAddress(Long parishId, String query, Pageable pageable);

    Optional<BaptismResponse> findById(Long id);

    BaptismResponse create(Long parishId, BaptismRequest request);

    BaptismResponse updateNote(Long id, String note);

    /**
     * Sets the stored path for an external baptism certificate on the baptism and on any linked
     * First Holy Communion. Only for external baptisms (issuing parish set) when proof is not yet stored.
     */
    BaptismResponse attachExternalCertificate(Long baptismId, String storedPath);

    List<SacramentNoteResponse> getNoteHistory(Long id);
}
