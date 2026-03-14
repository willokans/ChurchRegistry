package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.MarriagePartyLegacy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MarriagePartyLegacyRepository extends JpaRepository<MarriagePartyLegacy, Integer> {

    List<MarriagePartyLegacy> findByMarriageId(Integer marriageId);

    List<MarriagePartyLegacy> findByMarriageIdIn(Collection<Integer> marriageIds);
}
