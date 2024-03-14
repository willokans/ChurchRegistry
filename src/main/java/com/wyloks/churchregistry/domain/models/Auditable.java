package com.wyloks.churchregistry.domain.models;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.ZonedDateTime;

@Getter
@Setter
public abstract class Auditable {

    @CreatedBy
    protected String createdBy;

    @LastModifiedBy
    protected String lastModifiedBy;

    @LastModifiedDate
    private ZonedDateTime lastModifiedDate;

    @CreationTimestamp
    private ZonedDateTime createdDate;
}
