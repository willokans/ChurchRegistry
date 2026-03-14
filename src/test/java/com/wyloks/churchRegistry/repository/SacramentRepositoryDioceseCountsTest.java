package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.HolyOrder;
import com.wyloks.churchRegistry.entity.Marriage;
import com.wyloks.churchRegistry.entity.Parish;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for diocese-scoped and batch parish count methods added to sacrament repositories:
 * - countByParish_Diocese_Id / countByBaptismParish_Diocese_Id
 * - countByParishIdIn / countByBaptismParishIdIn
 */
@SpringBootTest
@Transactional
class SacramentRepositoryDioceseCountsTest {

    @Autowired
    BaptismRepository baptismRepository;

    @Autowired
    FirstHolyCommunionRepository communionRepository;

    @Autowired
    ConfirmationRepository confirmationRepository;

    @Autowired
    MarriageRepository marriageRepository;

    @Autowired
    HolyOrderRepository holyOrderRepository;

    @Autowired
    ParishRepository parishRepository;

    @Autowired
    DioceseRepository dioceseRepository;

    private Diocese dioceseA;
    private Diocese dioceseB;
    private Parish parishA1;
    private Parish parishA2;
    private Parish parishB1;

    @BeforeEach
    void setUp() {
        dioceseA = dioceseRepository.save(Diocese.builder()
                .dioceseName("Diocese A")
                .code("DA")
                .description("Test diocese A")
                .build());

        dioceseB = dioceseRepository.save(Diocese.builder()
                .dioceseName("Diocese B")
                .code("DB")
                .description("Test diocese B")
                .build());

        parishA1 = parishRepository.save(Parish.builder()
                .parishName("Parish A1")
                .diocese(dioceseA)
                .description("A1")
                .build());

        parishA2 = parishRepository.save(Parish.builder()
                .parishName("Parish A2")
                .diocese(dioceseA)
                .description("A2")
                .build());

        parishB1 = parishRepository.save(Parish.builder()
                .parishName("Parish B1")
                .diocese(dioceseB)
                .description("B1")
                .build());
    }

    @Nested
    class BaptismRepositoryTests {

        @Test
        void countByParish_Diocese_Id_returnsZeroWhenDioceseHasNoRecords() {
            assertThat(baptismRepository.countByParish_Diocese_Id(dioceseA.getId())).isZero();
        }

        @Test
        void countByParish_Diocese_Id_aggregatesAcrossParishesInDiocese() {
            baptismRepository.save(createBaptism(parishA1));
            baptismRepository.save(createBaptism(parishA1));
            baptismRepository.save(createBaptism(parishA2));

            assertThat(baptismRepository.countByParish_Diocese_Id(dioceseA.getId())).isEqualTo(3);
        }

        @Test
        void countByParish_Diocese_Id_isolatesDioceseData() {
            baptismRepository.save(createBaptism(parishA1));
            baptismRepository.save(createBaptism(parishB1));

            assertThat(baptismRepository.countByParish_Diocese_Id(dioceseA.getId())).isEqualTo(1);
            assertThat(baptismRepository.countByParish_Diocese_Id(dioceseB.getId())).isEqualTo(1);
        }

        @Test
        void countByParishIdIn_returnsZeroForEmptySet() {
            assertThat(baptismRepository.countByParishIdIn(Set.of())).isZero();
        }

        @Test
        void countByParishIdIn_aggregatesAcrossGivenParishes() {
            baptismRepository.save(createBaptism(parishA1));
            baptismRepository.save(createBaptism(parishA1));
            baptismRepository.save(createBaptism(parishA2));

            long count = baptismRepository.countByParishIdIn(Set.of(parishA1.getId(), parishA2.getId()));
            assertThat(count).isEqualTo(3);
        }

        @Test
        void countByParishIdIn_excludesParishesNotInSet() {
            baptismRepository.save(createBaptism(parishA1));
            baptismRepository.save(createBaptism(parishA2));
            baptismRepository.save(createBaptism(parishB1));

            long count = baptismRepository.countByParishIdIn(Set.of(parishA1.getId()));
            assertThat(count).isEqualTo(1);
        }
    }

    @Nested
    class FirstHolyCommunionRepositoryTests {

        @Test
        void countByBaptismParish_Diocese_Id_returnsZeroWhenDioceseHasNoRecords() {
            assertThat(communionRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isZero();
        }

        @Test
        void countByBaptismParish_Diocese_Id_aggregatesAcrossParishesInDiocese() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            communionRepository.save(createCommunion(b1));
            communionRepository.save(createCommunion(b2));

            assertThat(communionRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isEqualTo(2);
        }

        @Test
        void countByBaptismParish_Diocese_Id_isolatesDioceseData() {
            Baptism bA = baptismRepository.save(createBaptism(parishA1));
            Baptism bB = baptismRepository.save(createBaptism(parishB1));
            communionRepository.save(createCommunion(bA));
            communionRepository.save(createCommunion(bB));

            assertThat(communionRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isEqualTo(1);
        }

        @Test
        void countByBaptismParishIdIn_aggregatesAcrossGivenParishes() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            communionRepository.save(createCommunion(b1));
            communionRepository.save(createCommunion(b2));

            long count = communionRepository.countByBaptismParishIdIn(Set.of(parishA1.getId(), parishA2.getId()));
            assertThat(count).isEqualTo(2);
        }
    }

    @Nested
    class ConfirmationRepositoryTests {

        @Test
        void countByBaptismParish_Diocese_Id_returnsZeroWhenDioceseHasNoRecords() {
            assertThat(confirmationRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isZero();
        }

        @Test
        void countByBaptismParish_Diocese_Id_aggregatesAcrossParishesInDiocese() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            FirstHolyCommunion c1 = communionRepository.save(createCommunion(b1));
            FirstHolyCommunion c2 = communionRepository.save(createCommunion(b2));
            confirmationRepository.save(createConfirmation(b1, c1));
            confirmationRepository.save(createConfirmation(b2, c2));

            assertThat(confirmationRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isEqualTo(2);
        }

        @Test
        void countByBaptismParishIdIn_aggregatesAcrossGivenParishes() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            FirstHolyCommunion c1 = communionRepository.save(createCommunion(b1));
            FirstHolyCommunion c2 = communionRepository.save(createCommunion(b2));
            confirmationRepository.save(createConfirmation(b1, c1));
            confirmationRepository.save(createConfirmation(b2, c2));

            long count = confirmationRepository.countByBaptismParishIdIn(Set.of(parishA1.getId(), parishA2.getId()));
            assertThat(count).isEqualTo(2);
        }
    }

    @Nested
    class MarriageRepositoryTests {

        @Test
        void countByBaptismParish_Diocese_Id_returnsZeroWhenDioceseHasNoRecords() {
            assertThat(marriageRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isZero();
        }

        @Test
        void countByBaptismParish_Diocese_Id_aggregatesAcrossParishesInDiocese() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            FirstHolyCommunion c1 = communionRepository.save(createCommunion(b1));
            FirstHolyCommunion c2 = communionRepository.save(createCommunion(b2));
            Confirmation cf1 = confirmationRepository.save(createConfirmation(b1, c1));
            Confirmation cf2 = confirmationRepository.save(createConfirmation(b2, c2));
            marriageRepository.save(createMarriage(b1, c1, cf1));
            marriageRepository.save(createMarriage(b2, c2, cf2));

            assertThat(marriageRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isEqualTo(2);
        }

        @Test
        void countByBaptismParishIdIn_aggregatesAcrossGivenParishes() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            FirstHolyCommunion c1 = communionRepository.save(createCommunion(b1));
            FirstHolyCommunion c2 = communionRepository.save(createCommunion(b2));
            Confirmation cf1 = confirmationRepository.save(createConfirmation(b1, c1));
            Confirmation cf2 = confirmationRepository.save(createConfirmation(b2, c2));
            marriageRepository.save(createMarriage(b1, c1, cf1));
            marriageRepository.save(createMarriage(b2, c2, cf2));

            long count = marriageRepository.countByBaptismParishIdIn(Set.of(parishA1.getId(), parishA2.getId()));
            assertThat(count).isEqualTo(2);
        }
    }

    @Nested
    class HolyOrderRepositoryTests {

        @Test
        void countByBaptismParish_Diocese_Id_returnsZeroWhenDioceseHasNoRecords() {
            assertThat(holyOrderRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isZero();
        }

        @Test
        void countByBaptismParish_Diocese_Id_aggregatesAcrossParishesInDiocese() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            FirstHolyCommunion c1 = communionRepository.save(createCommunion(b1));
            FirstHolyCommunion c2 = communionRepository.save(createCommunion(b2));
            Confirmation cf1 = confirmationRepository.save(createConfirmation(b1, c1));
            Confirmation cf2 = confirmationRepository.save(createConfirmation(b2, c2));
            holyOrderRepository.save(createHolyOrder(b1, c1, cf1));
            holyOrderRepository.save(createHolyOrder(b2, c2, cf2));

            assertThat(holyOrderRepository.countByBaptismParish_Diocese_Id(dioceseA.getId())).isEqualTo(2);
        }

        @Test
        void countByBaptismParishIdIn_aggregatesAcrossGivenParishes() {
            Baptism b1 = baptismRepository.save(createBaptism(parishA1));
            Baptism b2 = baptismRepository.save(createBaptism(parishA2));
            FirstHolyCommunion c1 = communionRepository.save(createCommunion(b1));
            FirstHolyCommunion c2 = communionRepository.save(createCommunion(b2));
            Confirmation cf1 = confirmationRepository.save(createConfirmation(b1, c1));
            Confirmation cf2 = confirmationRepository.save(createConfirmation(b2, c2));
            holyOrderRepository.save(createHolyOrder(b1, c1, cf1));
            holyOrderRepository.save(createHolyOrder(b2, c2, cf2));

            long count = holyOrderRepository.countByBaptismParishIdIn(Set.of(parishA1.getId(), parishA2.getId()));
            assertThat(count).isEqualTo(2);
        }
    }

    private static Baptism createBaptism(Parish p) {
        return Baptism.builder()
                .baptismName("Test")
                .surname("User")
                .otherNames("")
                .gender("M")
                .dateOfBirth(LocalDate.of(2015, 1, 1))
                .fathersName("Father")
                .mothersName("Mother")
                .sponsorNames("Sponsor")
                .officiatingPriest("Fr. X")
                .parish(p)
                .address("")
                .parishAddress("")
                .parentAddress("")
                .build();
    }

    private static FirstHolyCommunion createCommunion(Baptism baptism) {
        return FirstHolyCommunion.builder()
                .baptism(baptism)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. X")
                .parish("St Mary")
                .build();
    }

    private static Confirmation createConfirmation(Baptism baptism, FirstHolyCommunion communion) {
        return Confirmation.builder()
                .baptism(baptism)
                .firstHolyCommunion(communion)
                .confirmationDate(LocalDate.of(2023, 5, 5))
                .officiatingBishop("Bp X")
                .parish("Parish")
                .build();
    }

    private static Marriage createMarriage(Baptism baptism, FirstHolyCommunion communion, Confirmation confirmation) {
        return Marriage.builder()
                .baptism(baptism)
                .firstHolyCommunion(communion)
                .confirmation(confirmation)
                .partnersName("Partner")
                .marriageDate(LocalDate.of(2025, 1, 20))
                .officiatingPriest("Fr. X")
                .parish("St Mary")
                .build();
    }

    private static HolyOrder createHolyOrder(Baptism baptism, FirstHolyCommunion communion, Confirmation confirmation) {
        return HolyOrder.builder()
                .baptism(baptism)
                .firstHolyCommunion(communion)
                .confirmation(confirmation)
                .ordinationDate(LocalDate.of(2025, 6, 1))
                .orderType("Deacon")
                .officiatingBishop("Bp X")
                .parish(null)
                .build();
    }
}
