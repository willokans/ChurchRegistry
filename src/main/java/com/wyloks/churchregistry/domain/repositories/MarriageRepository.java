package com.wyloks.churchregistry.domain.repositories;

import com.wyloks.churchregistry.domain.models.Marriage;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MarriageRepository extends JpaRepository<Marriage, Long>, JpaSpecificationExecutor<Marriage> {

    default Marriage saveMarriageRecord(Marriage marriage) {
        if(marriage.getBaptism() != null) {
            return save(marriage);
        } else {
            throw new InvalidDataAccessApiUsageException("Baptism record for Marriage registry cannot be null");
        }
    }
}
