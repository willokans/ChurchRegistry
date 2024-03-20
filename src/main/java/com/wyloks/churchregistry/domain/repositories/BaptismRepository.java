package com.wyloks.churchregistry.domain.repositories;

import com.wyloks.churchregistry.domain.models.Baptism;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;

@Repository
public interface BaptismRepository extends JpaRepository<Baptism, Long>, JpaSpecificationExecutor<Baptism> {

    boolean existsByBaptismalNameAndSurnameAndDateOfBirth(String baptismalName, String surname, ZonedDateTime dateOfBirth);
}
