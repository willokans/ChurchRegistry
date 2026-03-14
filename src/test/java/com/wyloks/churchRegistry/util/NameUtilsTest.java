package com.wyloks.churchRegistry.util;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NameUtilsTest {

    @Nested
    class CapitalizeName {

        @Test
        void returnsNull_forNullInput() {
            assertThat(NameUtils.capitalizeName(null)).isNull();
        }

        @Test
        void returnsEmpty_forBlankInput() {
            assertThat(NameUtils.capitalizeName("")).isEqualTo("");
            assertThat(NameUtils.capitalizeName("   ")).isEqualTo("");
        }

        @Test
        void capitalizesFirstLetterOfEachWord() {
            assertThat(NameUtils.capitalizeName("john doe")).isEqualTo("John Doe");
            assertThat(NameUtils.capitalizeName("mary jane")).isEqualTo("Mary Jane");
        }

        @Test
        void treatsHyphenAsWordBoundary() {
            assertThat(NameUtils.capitalizeName("mary-anne")).isEqualTo("Mary-Anne");
        }

        @Test
        void treatsApostropheAsWordBoundary() {
            assertThat(NameUtils.capitalizeName("o'brien")).isEqualTo("O'Brien");
        }

        @Test
        void lowercasesRestOfWord() {
            assertThat(NameUtils.capitalizeName("JOHN DOE")).isEqualTo("John Doe");
        }

        @Test
        void trimsWhitespace() {
            assertThat(NameUtils.capitalizeName("  john doe  ")).isEqualTo("John Doe");
        }

        @Test
        void handlesCombinedBoundaries() {
            assertThat(NameUtils.capitalizeName("mary-anne o'brien")).isEqualTo("Mary-Anne O'Brien");
        }

        @Test
        void handlesSingleWord() {
            assertThat(NameUtils.capitalizeName("john")).isEqualTo("John");
        }
    }

    @Nested
    class CapitalizeNameOrEmpty {

        @Test
        void returnsEmpty_forNullInput() {
            assertThat(NameUtils.capitalizeNameOrEmpty(null)).isEqualTo("");
        }

        @Test
        void returnsEmpty_forBlankInput() {
            assertThat(NameUtils.capitalizeNameOrEmpty("")).isEqualTo("");
            assertThat(NameUtils.capitalizeNameOrEmpty("   ")).isEqualTo("");
        }

        @Test
        void capitalizesNonBlankInput() {
            assertThat(NameUtils.capitalizeNameOrEmpty("john doe")).isEqualTo("John Doe");
        }
    }
}
