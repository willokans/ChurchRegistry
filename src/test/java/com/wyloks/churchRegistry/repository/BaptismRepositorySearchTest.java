package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.Parish;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for {@link BaptismRepository#searchByNameOrAddress}:
 * - Parish-scoped search (no cross-tenant results)
 * - Pagination/limit (no unbounded LIKE scans)
 * - Search by baptism name, surname, and address fields
 */
@SpringBootTest
@Transactional
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class BaptismRepositorySearchTest {

    @Autowired
    BaptismRepository baptismRepository;

    @Autowired
    ParishRepository parishRepository;

    @Autowired
    DioceseRepository dioceseRepository;

    private Parish parishA;
    private Parish parishB;

    @BeforeEach
    void setUp() {
        Diocese diocese = dioceseRepository.save(Diocese.builder()
                .dioceseName("Search Test Diocese")
                .code("SRCH")
                .description("Search test")
                .build());

        parishA = parishRepository.save(Parish.builder()
                .parishName("Parish A")
                .diocese(diocese)
                .description("A")
                .build());

        parishB = parishRepository.save(Parish.builder()
                .parishName("Parish B")
                .diocese(diocese)
                .description("B")
                .build());

        baptismRepository.save(Baptism.builder()
                .baptismName("Alice")
                .surname("Smith")
                .otherNames("")
                .gender("F")
                .dateOfBirth(LocalDate.of(2015, 3, 15))
                .fathersName("John")
                .mothersName("Jane")
                .sponsorNames("Sponsor")
                .officiatingPriest("Fr. X")
                .parish(parishA)
                .address("123 Main Street")
                .parishAddress("")
                .parentAddress("")
                .build());

        baptismRepository.save(Baptism.builder()
                .baptismName("Bob")
                .surname("Smith")
                .otherNames("")
                .gender("M")
                .dateOfBirth(LocalDate.of(2016, 5, 20))
                .fathersName("John")
                .mothersName("Jane")
                .sponsorNames("Sponsor")
                .officiatingPriest("Fr. X")
                .parish(parishA)
                .address("456 Oak Avenue")
                .parishAddress("")
                .parentAddress("")
                .build());

        baptismRepository.save(Baptism.builder()
                .baptismName("Carol")
                .surname("Jones")
                .otherNames("")
                .gender("F")
                .dateOfBirth(LocalDate.of(2017, 7, 10))
                .fathersName("Father")
                .mothersName("Mother")
                .sponsorNames("Sponsor")
                .officiatingPriest("Fr. X")
                .parish(parishA)
                .address("123 Main Street")
                .parishAddress("")
                .parentAddress("789 Parent Lane")
                .build());

        baptismRepository.save(Baptism.builder()
                .baptismName("David")
                .surname("Smith")
                .otherNames("")
                .gender("M")
                .dateOfBirth(LocalDate.of(2018, 1, 1))
                .fathersName("Father")
                .mothersName("Mother")
                .sponsorNames("Sponsor")
                .officiatingPriest("Fr. X")
                .parish(parishB)
                .address("")
                .parishAddress("")
                .parentAddress("")
                .build());
    }

    @Test
    void searchByNameOrAddress_findsByBaptismName() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "Alice", PageRequest.of(0, 50));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getBaptismName()).isEqualTo("Alice");
        assertThat(page.getContent().get(0).getParish().getId()).isEqualTo(parishA.getId());
    }

    @Test
    void searchByNameOrAddress_findsBySurname() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "Smith", PageRequest.of(0, 50));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getContent().stream().map(Baptism::getBaptismName))
                .containsExactlyInAnyOrder("Alice", "Bob");
    }

    @Test
    void searchByNameOrAddress_findsByAddress() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "Main Street", PageRequest.of(0, 50));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getContent().stream().map(Baptism::getBaptismName))
                .containsExactlyInAnyOrder("Alice", "Carol");
    }

    @Test
    void searchByNameOrAddress_findsByParentAddress() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "Parent Lane", PageRequest.of(0, 50));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getBaptismName()).isEqualTo("Carol");
    }

    @Test
    void searchByNameOrAddress_filtersByParish() {
        Page<Baptism> pageA = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "Smith", PageRequest.of(0, 50));
        Page<Baptism> pageB = baptismRepository.searchByNameOrAddress(
                parishB.getId(), "Smith", PageRequest.of(0, 50));

        assertThat(pageA.getContent()).hasSize(2);
        assertThat(pageB.getContent()).hasSize(1);
        assertThat(pageB.getContent().get(0).getBaptismName()).isEqualTo("David");
        assertThat(pageB.getContent().get(0).getParish().getId()).isEqualTo(parishB.getId());
    }

    @Test
    void searchByNameOrAddress_respectsPageSize() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "a", PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(2);
        assertThat(page.getTotalPages()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void searchByNameOrAddress_emptyQueryReturnsNoMatches() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "xyznonexistent", PageRequest.of(0, 50));

        assertThat(page.getContent()).isEmpty();
    }

    @Test
    void searchByNameOrAddress_isCaseInsensitive() {
        Page<Baptism> page = baptismRepository.searchByNameOrAddress(
                parishA.getId(), "ALICE", PageRequest.of(0, 50));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getBaptismName()).isEqualTo("Alice");
    }
}
