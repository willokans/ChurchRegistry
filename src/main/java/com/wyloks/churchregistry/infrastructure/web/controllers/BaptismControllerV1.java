package com.wyloks.churchregistry.infrastructure.web.controllers;

import com.wyloks.churchregistry.application.dtos.BaptismDTO;
import com.wyloks.churchregistry.domain.services.BaptismServiceV1;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/church-registry")
public class BaptismControllerV1 {

    private final BaptismServiceV1 service;

    public BaptismControllerV1(BaptismServiceV1 service) {
        this.service = service;
    }


    @GetMapping
    @ResponseBody
    public List<BaptismDTO.GetResponse> getBaptisms(
            @RequestParam(name = "Id", required = false) List<Long> Ids,
            @RequestParam(name = "baptismName", required = false) List<String> baptismalNames,
            @RequestParam(name = "surname", required = false) List<String> surnames,
            @RequestParam(name = "dateOfBirth", required = false) List<Long> dateOfBirths,
            @RequestParam(name = "fatherFullName", required = false) List<String> fatherFullNames,
            @RequestParam(name = "motherFullName", required = false) List<String> motherFullNames,
            @RequestParam(name = "fatherFullAddress", required = false) List<String> fatherFullAddresses,
            @RequestParam(name = "motherFullAddress", required = false) List<String> motherFullAddresses,
            @RequestParam(name = "sponsor1FullName", required = false) List<String> sponsor1FullNames,
            @RequestParam(name = "sponsor2FullName", required = false) List<String> sponsor2FullNames,
            @RequestParam(name = "church", required = false) List<String> churches,
            @RequestParam(name = "officiatingPriests", required = false) List<String> officiatingPriest,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "5") int size

    ) {
        BaptismDTO.GetRequest request = BaptismDTO.GetRequest
                .builder()
                .ids(Ids)
                .baptismalNames(baptismalNames)
                .dateOfBirths(dateOfBirths)
                .fatherFullNames(fatherFullNames)
                .motherFullNames(motherFullNames)
                .fatherFullAddresses(fatherFullAddresses)
                .motherFullAddresses(motherFullAddresses)
                .sponsor1FullNames(sponsor1FullNames)
                .sponsor2FullNames(sponsor2FullNames)
                .churches(churches)
                .officiatingPriests(officiatingPriest)
                .build();
        Pageable pageable = PageRequest.of(page, size);
        return service.getAllBaptismRecord(request, pageable);
    }
}
