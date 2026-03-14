package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.SacramentNoteHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SacramentNoteHistoryRepository extends JpaRepository<SacramentNoteHistory, Long> {

    List<SacramentNoteHistory> findBySacramentTypeAndRecordIdOrderByCreatedAtDesc(String sacramentType, Long recordId);
}
