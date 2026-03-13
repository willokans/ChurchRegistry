package com.wyloks.churchRegistry.dto;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DioceseDashboardResponseTest {

    @Nested
    class MainResponse {

        @Test
        void builder_setsAllFields() {
            var parishActivity = List.of(
                    DioceseDashboardResponse.ParishActivityItem.builder()
                            .parishId(1L)
                            .parishName("St. Joseph")
                            .baptisms(10L)
                            .communions(5L)
                            .confirmations(3L)
                            .marriages(2L)
                            .build()
            );
            var recentSacraments = DioceseDashboardResponse.RecentSacraments.builder()
                    .baptisms(List.of(new BaptismResponse()))
                    .communions(List.of())
                    .confirmations(List.of())
                    .marriages(List.of())
                    .build();
            var monthly = DioceseDashboardResponse.MonthlyData.builder()
                    .baptisms(List.of(0L, 1L, 2L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                    .communions(List.of(0L, 0L, 1L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                    .confirmations(List.of(0L, 0L, 0L, 1L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                    .marriages(List.of(0L, 0L, 0L, 0L, 1L, 0L, 0L, 0L, 0L, 0L, 0L, 0L))
                    .build();
            var counts = Map.<String, Long>of(
                    "parishes", 3L,
                    "baptisms", 50L,
                    "communions", 25L,
                    "confirmations", 15L,
                    "marriages", 8L,
                    "holyOrders", 2L
            );

            var response = DioceseDashboardResponse.builder()
                    .counts(counts)
                    .parishActivity(parishActivity)
                    .recentSacraments(recentSacraments)
                    .monthly(monthly)
                    .build();

            assertThat(response.getCounts()).isEqualTo(counts);
            assertThat(response.getParishActivity()).hasSize(1);
            assertThat(response.getParishActivity().get(0).getParishName()).isEqualTo("St. Joseph");
            assertThat(response.getParishActivity().get(0).getBaptisms()).isEqualTo(10L);
            assertThat(response.getRecentSacraments().getBaptisms()).hasSize(1);
            assertThat(response.getRecentSacraments().getCommunions()).isEmpty();
            assertThat(response.getMonthly().getBaptisms()).hasSize(12);
            assertThat(response.getMonthly().getBaptisms().get(2)).isEqualTo(2L);
        }

        @Test
        void noArgsConstructor_createsEmptyInstance() {
            var response = new DioceseDashboardResponse();

            assertThat(response.getCounts()).isNull();
            assertThat(response.getParishActivity()).isNull();
            assertThat(response.getRecentSacraments()).isNull();
            assertThat(response.getMonthly()).isNull();
        }

        @Test
        void setters_populateFields() {
            var response = new DioceseDashboardResponse();
            var counts = Map.<String, Long>of("baptisms", 10L);

            response.setCounts(counts);
            response.setParishActivity(List.of());
            response.setRecentSacraments(new DioceseDashboardResponse.RecentSacraments());
            response.setMonthly(new DioceseDashboardResponse.MonthlyData());

            assertThat(response.getCounts()).isEqualTo(counts);
            assertThat(response.getParishActivity()).isEmpty();
            assertThat(response.getRecentSacraments()).isNotNull();
            assertThat(response.getMonthly()).isNotNull();
        }
    }

    @Nested
    class ParishActivityItem {

        @Test
        void builder_setsAllFields() {
            var item = DioceseDashboardResponse.ParishActivityItem.builder()
                    .parishId(2L)
                    .parishName("Holy Trinity")
                    .baptisms(20L)
                    .communions(10L)
                    .confirmations(6L)
                    .marriages(4L)
                    .build();

            assertThat(item.getParishId()).isEqualTo(2L);
            assertThat(item.getParishName()).isEqualTo("Holy Trinity");
            assertThat(item.getBaptisms()).isEqualTo(20L);
            assertThat(item.getCommunions()).isEqualTo(10L);
            assertThat(item.getConfirmations()).isEqualTo(6L);
            assertThat(item.getMarriages()).isEqualTo(4L);
        }

        @Test
        void noArgsConstructor_createsEmptyInstance() {
            var item = new DioceseDashboardResponse.ParishActivityItem();

            assertThat(item.getParishId()).isNull();
            assertThat(item.getParishName()).isNull();
        }
    }

    @Nested
    class RecentSacraments {

        @Test
        void builder_setsAllLists() {
            var baptism = BaptismResponse.builder().id(1L).baptismName("John").build();
            var communion = new FirstHolyCommunionResponse();

            var recent = DioceseDashboardResponse.RecentSacraments.builder()
                    .baptisms(List.of(baptism))
                    .communions(List.of(communion))
                    .confirmations(List.of())
                    .marriages(List.of())
                    .build();

            assertThat(recent.getBaptisms()).containsExactly(baptism);
            assertThat(recent.getCommunions()).containsExactly(communion);
            assertThat(recent.getConfirmations()).isEmpty();
            assertThat(recent.getMarriages()).isEmpty();
        }
    }

    @Nested
    class MonthlyData {

        @Test
        void builder_setsTwelveElementsPerSacrament() {
            var baptisms = List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L, 11L, 12L);

            var monthly = DioceseDashboardResponse.MonthlyData.builder()
                    .baptisms(baptisms)
                    .communions(baptisms)
                    .confirmations(baptisms)
                    .marriages(baptisms)
                    .build();

            assertThat(monthly.getBaptisms()).hasSize(12);
            assertThat(monthly.getCommunions()).hasSize(12);
            assertThat(monthly.getConfirmations()).hasSize(12);
            assertThat(monthly.getMarriages()).hasSize(12);
            assertThat(monthly.getBaptisms().get(0)).isEqualTo(1L);
            assertThat(monthly.getBaptisms().get(11)).isEqualTo(12L);
        }
    }
}
