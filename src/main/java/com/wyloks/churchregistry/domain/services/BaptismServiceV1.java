package com.wyloks.churchregistry.domain.services;

import com.wyloks.churchregistry.application.dtos.BaptismDTO;
import com.wyloks.churchregistry.domain.models.Baptism;
import com.wyloks.churchregistry.domain.repositories.BaptismRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BaptismServiceV1 {
    private static final Logger logger = LoggerFactory.getLogger(BaptismServiceV1.class);

    private final BaptismRepository baptismRepository;
    private final ModelMapper modelMapper;
    private final Validator validator;

    @Autowired
    public BaptismServiceV1(BaptismRepository baptismRepository, ModelMapper modelMapper, Validator validator) {
        this.baptismRepository = baptismRepository;
        this.modelMapper = modelMapper;
        this.validator = validator;
    }

    public List<BaptismDTO.GetResponse> getAllBaptismRecord(BaptismDTO.GetRequest request, Pageable pageable) {
        Page<Baptism> baptisms = baptismRepository.findAll(pageable);
        logger.info("{} baptism record fetched from database", baptisms.getSize());
        return baptisms.stream()
                .map(baptism -> modelMapper.map(baptism, BaptismDTO.GetResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public BaptismDTO.PostResponse createSingleBaptismRecord(BaptismDTO.PostRequest postRequest) {
        BaptismDTO.PostResponse response = new BaptismDTO.PostResponse();

        if (isDuplicateBaptismRecord(postRequest)) {
            response.setError("A duplicate record for " + postRequest.getBaptismalName() + " " +
                    postRequest.getSurname() + " already exists.");
            return response;
        }

        Baptism baptism = modelMapper.map(postRequest, Baptism.class);

        Set<ConstraintViolation<Baptism>> violations = validator.validate(baptism);
        if (!violations.isEmpty()) {
            StringBuilder errorMessage = new StringBuilder("Validation failed for Baptism record:");
            for (ConstraintViolation<Baptism> violation : violations) {
                errorMessage.append(" ").append(violation.getMessage());
            }
            response.setError(errorMessage.toString());
            return response;
        }

        try {
            Baptism savedBaptism = baptismRepository.save(baptism);
            return modelMapper.map(savedBaptism, BaptismDTO.PostResponse.class);
        } catch (Exception e) {
            response.setError("Failed to save Baptism record: " + e.getMessage());
            return response;
        }
    }

    public List<BaptismDTO.PostResponse> createBatchBaptismRecords(List<BaptismDTO.PostRequest> postRequests) {
        List<BaptismDTO.PostResponse> responses = new ArrayList<>();

        for (BaptismDTO.PostRequest postRequest : postRequests) {
            BaptismDTO.PostResponse response = new BaptismDTO.PostResponse();

            if (isDuplicateBaptismRecord(postRequest)) {
                response.setError("A duplicate record for " + postRequest.getBaptismalName() + " " +
                        postRequest.getSurname() + " already exists.");
                responses.add(response);
                continue;
            }

            Baptism baptism = modelMapper.map(postRequest, Baptism.class);

            Set<ConstraintViolation<Baptism>> violations = validator.validate(baptism);
            if (!violations.isEmpty()) {
                StringBuilder errorMessage = new StringBuilder("Validation failed for Baptism record:");
                for (ConstraintViolation<Baptism> violation : violations) {
                    errorMessage.append(" ").append(violation.getMessage());
                }
                response.setError(errorMessage.toString());
                responses.add(response);
                continue;
            }

            try {
                Baptism savedBaptism = baptismRepository.save(baptism);
                responses.add(modelMapper.map(savedBaptism, BaptismDTO.PostResponse.class));
            } catch (Exception e) {
                response.setError("Failed to save Baptism record: " + e.getMessage());
                responses.add(response);
            }
        }
        return responses;
    }

    private boolean isDuplicateBaptismRecord(BaptismDTO.PostRequest postRequest) {
        return baptismRepository.existsByBaptismalNameAndSurnameAndDateOfBirth(
                postRequest.getBaptismalName(),
                postRequest.getSurname(),
                postRequest.getDateOfBirth()
        );
    }
}

