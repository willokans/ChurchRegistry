package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.HolyOrder;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.service.HolyOrderService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that {@link HolyOrderRepository#findByBaptismParishId} uses
 * {@code @EntityGraph} to avoid N+1 queries when loading baptism, firstHolyCommunion,
 * confirmation, and parish.
 */
@SpringBootTest
@Transactional
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class HolyOrderRepositoryN1Test {

    @Autowired
    HolyOrderService holyOrderService;

    @Autowired
    EntityManagerFactory entityManagerFactory;

    @Autowired
    HolyOrderRepository holyOrderRepository;

    @Autowired
    ConfirmationRepository confirmationRepository;

    @Autowired
    BaptismRepository baptismRepository;

    @Autowired
    FirstHolyCommunionRepository communionRepository;

    @Autowired
    ParishRepository parishRepository;

    @Autowired
    DioceseRepository dioceseRepository;

    private Parish parish;
    private Statistics statistics;

    @BeforeEach
    void setUp() {
        Diocese diocese = dioceseRepository.save(Diocese.builder()
                .dioceseName("N1 Test Diocese")
                .code("N1")
                .description("N1 test")
                .build());

        parish = parishRepository.save(Parish.builder()
                .parishName("N1 Parish")
                .diocese(diocese)
                .description("N1")
                .build());

        for (int i = 0; i < 5; i++) {
            Baptism baptism = baptismRepository.save(Baptism.builder()
                    .baptismName("Child" + i)
                    .surname("Surname" + i)
                    .otherNames("Other")
                    .gender("M")
                    .dateOfBirth(LocalDate.of(2015, 1, 1))
                    .fathersName("Father")
                    .mothersName("Mother")
                    .sponsorNames("Sponsor")
                    .officiatingPriest("Fr. X")
                    .parish(parish)
                    .build());

            FirstHolyCommunion communion = communionRepository.save(FirstHolyCommunion.builder()
                    .baptism(baptism)
                    .communionDate(LocalDate.of(2022, 6, 1))
                    .officiatingPriest("Fr. X")
                    .parish("St Mary")
                    .build());

            Confirmation confirmation = confirmationRepository.save(Confirmation.builder()
                    .baptism(baptism)
                    .firstHolyCommunion(communion)
                    .confirmationDate(LocalDate.of(2024, 5, 5))
                    .officiatingBishop("Bp X")
                    .parish("Parish")
                    .build());

            holyOrderRepository.save(HolyOrder.builder()
                    .baptism(baptism)
                    .firstHolyCommunion(communion)
                    .confirmation(confirmation)
                    .ordinationDate(LocalDate.of(2025, 6, 1))
                    .orderType("Deacon")
                    .officiatingBishop("Bp X")
                    .parish(null)
                    .build());
        }

        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        statistics = sessionFactory.getStatistics();
    }

    @Test
    void findByBaptismParishId_avoidsN1Queries() {
        statistics.clear();

        List<com.wyloks.churchRegistry.dto.HolyOrderResponse> results =
                holyOrderService.findByParishId(parish.getId());

        assertThat(results).hasSize(5);

        long queryCount = statistics.getPrepareStatementCount();
        // With @EntityGraph: 1 query (JOIN FETCH baptism, firstHolyCommunion, confirmation, parish).
        // Without: 1 + 5*4 = 21 queries.
        assertThat(queryCount)
                .as("EntityGraph should batch-load baptism, firstHolyCommunion, confirmation, parish; expect <= 2 queries, got %d", queryCount)
                .isLessThanOrEqualTo(2);
    }
}
