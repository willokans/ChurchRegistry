package com.wyloks.churchregistry.domain.services;

import com.wyloks.churchregistry.application.dtos.BaptismDTO;
import com.wyloks.churchregistry.domain.models.Baptism;
import com.wyloks.churchregistry.domain.repositories.BaptismRepository;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BaptismServiceV1 {
    private static final Logger logger = LoggerFactory.getLogger(BaptismServiceV1.class);

    private final BaptismRepository baptismRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public BaptismServiceV1(BaptismRepository baptismRepository, ModelMapper modelMapper) {
        this.baptismRepository = baptismRepository;
        this.modelMapper = modelMapper;
    }

    public List<BaptismDTO.GetResponse> getAllBaptismRecord(BaptismDTO.GetRequest request, Pageable pageable) {
        Page<Baptism> baptisms = baptismRepository.findAll(pageable);
        logger.info("{} baptism record fetched from database ", baptisms.getSize());
        return baptisms.stream().map(baptism -> modelMapper.map(baptism, BaptismDTO.GetResponse.class))
                .collect(Collectors.toList());
    }
}
