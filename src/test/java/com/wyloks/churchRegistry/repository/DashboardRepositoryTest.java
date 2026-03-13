package com.wyloks.churchRegistry.repository;

import com.wyloks.churchRegistry.entity.Baptism;
import com.wyloks.churchRegistry.entity.Diocese;
import com.wyloks.churchRegistry.entity.FirstHolyCommunion;
import com.wyloks.churchRegistry.entity.Parish;
import com.wyloks.churchRegistry.repository.projection.ParishActivityRow;
import com.wyloks.churchRegistry.repository.projection.ParishDashboardCounts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for {@link DashboardRepository#getParishCounts} batch query.
 * Verifies all sacrament counts are returned in a single round trip.
 */
@SpringBootTest
@Transactional
class DashboardRepositoryTest {

    @Autowired
    DashboardRepository dashboardRepository;

    @Autowired
    BaptismRepository baptismRepository;

    @Autowired
    FirstHolyCommunionRepository communionRepository;

    @Autowired
    ParishRepository parishRepository;

    @Autowired
    DioceseRepository dioceseRepository;

    private Parish parish;

    @BeforeEach
    void setUp() {
        Diocese diocese = dioceseRepository.save(Diocese.builder()
                .dioceseName("Dashboard Repo Diocese")
                .code("DRD")
                .description("Dashboard repo test")
                .build());

        parish = parishRepository.save(Parish.builder()
                .parishName("Dashboard Repo Parish")
                .diocese(diocese)
                .description("Test")
                .build());
    }

    @Test
    void getParishCounts_returnsZeroWhenParishHasNoRecords() {
        ParishDashboardCounts counts = dashboardRepository.getParishCounts(parish.getId());

        assertThat(counts).isNotNull();
        assertThat(counts.getBaptisms()).isZero();
        assertThat(counts.getCommunions()).isZero();
        assertThat(counts.getConfirmations()).isZero();
        assertThat(counts.getMarriages()).isZero();
        assertThat(counts.getHolyOrders()).isZero();
    }

    @Test
    void getParishCounts_returnsCorrectBaptismCount() {
        for (int i = 0; i < 3; i++) {
            baptismRepository.save(createBaptism(parish));
        }

        ParishDashboardCounts counts = dashboardRepository.getParishCounts(parish.getId());

        assertThat(counts.getBaptisms()).isEqualTo(3);
    }

    @Test
    void getParishCounts_returnsCorrectCommunionCount() {
        Baptism b1 = baptismRepository.save(createBaptism(parish));
        Baptism b2 = baptismRepository.save(createBaptism(parish));
        communionRepository.save(FirstHolyCommunion.builder()
                .baptism(b1)
                .communionDate(LocalDate.of(2022, 6, 1))
                .officiatingPriest("Fr. X")
                .parish("St Mary")
                .build());
        communionRepository.save(FirstHolyCommunion.builder()
                .baptism(b2)
                .communionDate(LocalDate.of(2022, 7, 1))
                .officiatingPriest("Fr. Y")
                .parish("St Mary")
                .build());

        ParishDashboardCounts counts = dashboardRepository.getParishCounts(parish.getId());

        assertThat(counts.getBaptisms()).isEqualTo(2);
        assertThat(counts.getCommunions()).isEqualTo(2);
    }

    @Test
    void getParishActivity_returnsPerParishCountsForDiocese() {
        Diocese diocese = parish.getDiocese();
        Parish otherParish = parishRepository.save(Parish.builder()
                .parishName("Other Parish in Diocese")
                .diocese(diocese)
                .description("Other")
                .build());

        baptismRepository.save(createBaptism(parish));
        baptismRepository.save(createBaptism(parish));
        baptismRepository.save(createBaptism(otherParish));

        List<ParishActivityRow> activity = dashboardRepository.getParishActivity(diocese.getId());

        assertThat(activity).hasSize(2);
        ParishActivityRow row1 = activity.stream()
                .filter(r -> "Dashboard Repo Parish".equals(r.getParishName()))
                .findFirst()
                .orElseThrow();
        ParishActivityRow row2 = activity.stream()
                .filter(r -> "Other Parish in Diocese".equals(r.getParishName()))
                .findFirst()
                .orElseThrow();
        assertThat(row1.getBaptisms()).isEqualTo(2);
        assertThat(row2.getBaptisms()).isEqualTo(1);
    }

    @Test
    void getParishCounts_isolatesParishData() {
        Diocese otherDiocese = dioceseRepository.save(Diocese.builder()
                .dioceseName("Other Diocese")
                .code("OTH")
                .description("Other")
                .build());
        Parish otherParish = parishRepository.save(Parish.builder()
                .parishName("Other Parish")
                .diocese(otherDiocese)
                .description("Other")
                .build());

        baptismRepository.save(createBaptism(parish));
        baptismRepository.save(createBaptism(otherParish));

        ParishDashboardCounts counts = dashboardRepository.getParishCounts(parish.getId());

        assertThat(counts.getBaptisms()).isEqualTo(1);
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
}
