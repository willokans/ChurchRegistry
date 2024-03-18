package com.wyloks.churchregistry.domain.repositories;

import com.wyloks.churchregistry.domain.models.Confirmation;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfirmationRepository extends JpaRepository<Confirmation, Long>, JpaSpecificationExecutor<Confirmation> {

    default Confirmation saveConfirmationRecord(Confirmation confirmation) {
        if (confirmation.getBaptism() != null){
            return save(confirmation);
        }else {
            throw new InvalidDataAccessApiUsageException("Baptism record for confirmation registry cannot be null");
        }
    }
}
