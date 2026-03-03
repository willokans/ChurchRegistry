package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.MarriageWitnessLegacy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MarriageWitnessLegacyRepository extends JpaRepository<MarriageWitnessLegacy, Integer> {

    List<MarriageWitnessLegacy> findByMarriageIdOrderBySortOrderAsc(Integer marriageId);

    List<MarriageWitnessLegacy> findByMarriageIdInOrderByMarriageIdAscSortOrderAsc(Collection<Integer> marriageIds);
}
