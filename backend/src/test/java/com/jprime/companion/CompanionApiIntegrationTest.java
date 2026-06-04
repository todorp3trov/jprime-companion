package com.jprime.companion;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jprime.companion.config.ClockConfig;
import java.time.Clock;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Boots the full application against the local Docker Compose Postgres (jdbc:postgresql://localhost:5432/jprime).
 * Run `docker compose up -d` first. Each test runs in a transaction that is rolled back, so no data leaks.
 *
 * <p>Testcontainers was the original intent, but the Docker Engine on this machine (v29) is newer than the
 * docker-java client Testcontainers ships can negotiate with, so the compose database is used directly.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CompanionApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    private static final String DEVICE = "junit-device";

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-06-04T08:20:00Z"), ClockConfig.CONFERENCE_ZONE);
        }
    }

    @Test
    void seedsAllSessionsDaysAndSpeakers() throws Exception {
        mvc.perform(get("/api/sessions")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(50)));
        mvc.perform(get("/api/days")).andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[1].calendarDate", is("2026-06-04")));
        mvc.perform(get("/api/speakers")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(29)));
        mvc.perform(get("/api/sessions").param("day", "1")).andExpect(jsonPath("$", hasSize(25)));
        mvc.perform(get("/api/sessions").param("day", "2")).andExpect(jsonPath("$", hasSize(25)));
    }

    @Test
    void sessionExposesFrontendShape() throws Exception {
        mvc.perform(get("/api/sessions/270"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title", is("Building Agents with Spring AI")))
            .andExpect(jsonPath("$.time", is("11:05")))
            .andExpect(jsonPath("$.end", is("11:55")))
            .andExpect(jsonPath("$.startsAt", is("2026-06-04T11:05:00+03:00")))
            .andExpect(jsonPath("$.endsAt", is("2026-06-04T11:55:00+03:00")))
            .andExpect(jsonPath("$.room", is("Hall A")))
            .andExpect(jsonPath("$.kind", is("lecture")))
            .andExpect(jsonPath("$.speakers", hasSize(1)))
            .andExpect(jsonPath("$.speakers[0]", is("Sergi Almar")))
            .andExpect(jsonPath("$.saved", is(false)));
    }

    @Test
    void notificationsIncludeVenkatRoomChange() throws Exception {
        mvc.perform(get("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id", is("n-venkat-move")))
            .andExpect(jsonPath("$[0].kind", is("alert")))
            .andExpect(jsonPath("$[0].title", is("Room change")))
            .andExpect(jsonPath("$[0].body", is(
                "Day 2 update: Know Your Java? with Venkat Subramaniam has moved from Hall B to Hall A.")))
            .andExpect(jsonPath("$[0].time", is("now")))
            .andExpect(jsonPath("$[0].unread", is(true)));
    }

    @Test
    void statusIsComputedFromConferenceClock() throws Exception {
        mvc.perform(get("/api/sessions/268")).andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("done")));
        mvc.perform(get("/api/sessions/270")).andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("live")));
        mvc.perform(get("/api/sessions/273")).andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("upcoming")));
    }

    @Test
    void savedRequiresDeviceIdHeader() throws Exception {
        mvc.perform(put("/api/sessions/270/saved")).andExpect(status().isBadRequest());
    }

    @Test
    void saveAndUnsaveRoundTrip() throws Exception {
        mvc.perform(put("/api/sessions/270/saved").header("X-Device-Id", DEVICE))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.saved", is(true)));
        mvc.perform(get("/api/sessions/270").header("X-Device-Id", DEVICE))
            .andExpect(jsonPath("$.saved", is(true)));
        mvc.perform(delete("/api/sessions/270/saved").header("X-Device-Id", DEVICE))
            .andExpect(jsonPath("$.saved", is(false)));
        mvc.perform(get("/api/sessions/270").header("X-Device-Id", DEVICE))
            .andExpect(jsonPath("$.saved", is(false)));
    }

    @Test
    void noteRatingAndAttachmentPersist() throws Exception {
        mvc.perform(put("/api/sessions/253/note")
                .header("X-Device-Id", DEVICE)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"body\":\"useful\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.body", is("useful")));

        mvc.perform(put("/api/sessions/253/rating")
                .header("X-Device-Id", DEVICE)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"feedback\":\"ok\",\"scores\":{\"1\":5,\"2\":4}}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.submitted", is(true)))
            .andExpect(jsonPath("$.scores.1", is(5)));

        byte[] png = {(byte) 0x89, 'P', 'N', 'G'};
        MockMultipartFile file = new MockMultipartFile("file", "p.png", "image/png", png);
        String body = mvc.perform(multipart("/api/sessions/253/note/attachments")
                .file(file)
                .param("kind", "slide")
                .param("label", "Slide 1")
                .header("X-Device-Id", DEVICE))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.label", is("Slide 1")))
            .andReturn().getResponse().getContentAsString();

        long id = com.fasterxml.jackson.databind.json.JsonMapper.builder().build().readTree(body).get("id").asLong();
        mvc.perform(get("/api/attachments/" + id).header("X-Device-Id", DEVICE))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.IMAGE_PNG));
        // A different device cannot read it.
        mvc.perform(get("/api/attachments/" + id).header("X-Device-Id", "stranger"))
            .andExpect(status().isNotFound());
    }
}
