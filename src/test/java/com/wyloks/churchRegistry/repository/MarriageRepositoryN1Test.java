package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Confirmation;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.Marriage;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.service.MarriageService;
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
 * Verifies that {@link MarriageRepository#findByBaptismParishId} uses
 * {@code @EntityGraph} to avoid N+1 queries when loading baptism, firstHolyCommunion, and confirmation.
 */
@SpringBootTest
@Transactional
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class MarriageRepositoryN1Test {

    @Autowired
    MarriageService marriageService;

    @Autowired
    EntityManagerFactory entityManagerFactory;

    @Autowired
    MarriageRepository marriageRepository;

    @Autowired
    BaptismRepository baptismRepository;

    @Autowired
    FirstHolyCommunionRepository communionRepository;

    @Autowired
    ConfirmationRepository confirmationRepository;

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
                .code("N1M")
                .description("N1 marriage test")
                .build());

        parish = parishRepository.save(Parish.builder()
                .parishName("N1 Marriage Parish")
                .diocese(diocese)
                .description("N1")
                .build());

        for (int i = 0; i < 5; i++) {
            Baptism baptism = baptismRepository.save(Baptism.builder()
                    .baptismName("Spouse" + i)
                    .surname("Surname" + i)
                    .otherNames("Other")
                    .gender("M")
                    .dateOfBirth(LocalDate.of(1990, 1, 1))
                    .fathersName("Father")
                    .mothersName("Mother")
                    .sponsorNames("Sponsor")
                    .officiatingPriest("Fr. X")
                    .parish(parish)
                    .build());

            FirstHolyCommunion communion = communionRepository.save(FirstHolyCommunion.builder()
                    .baptism(baptism)
                    .communionDate(LocalDate.of(2000, 6, 1))
                    .officiatingPriest("Fr. X")
                    .parish("St Mary")
                    .build());

            Confirmation confirmation = confirmationRepository.save(Confirmation.builder()
                    .baptism(baptism)
                    .firstHolyCommunion(communion)
                    .confirmationDate(LocalDate.of(2002, 5, 5))
                    .officiatingBishop("Bp X")
                    .parish("Parish")
                    .build());

            marriageRepository.save(Marriage.builder()
                    .baptism(baptism)
                    .firstHolyCommunion(communion)
                    .confirmation(confirmation)
                    .partnersName("Partner" + i)
                    .marriageDate(LocalDate.of(2025, 1, 20))
                    .officiatingPriest("Fr. X")
                    .parish("St Mary")
                    .build());
        }

        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        statistics = sessionFactory.getStatistics();
    }

    @Test
    void findByBaptismParishId_avoidsN1Queries() {
        statistics.clear();

        List<com.wyloks.churchRegistry.dto.MarriageResponse> results =
                marriageService.findByParishId(parish.getId());

        assertThat(results).hasSize(5);

        long queryCount = statistics.getPrepareStatementCount();
        // With @EntityGraph: 1 query for marriages (JOIN FETCH baptism, firstHolyCommunion, confirmation),
        // plus 2 for parties/witnesses batch (empty), = 3. Without EntityGraph: 1 + 5*3 + 2 = 18.
        assertThat(queryCount)
                .as("EntityGraph should batch-load baptism, firstHolyCommunion, confirmation; expect <= 5 queries, got %d", queryCount)
                .isLessThanOrEqualTo(5);
    }
}
