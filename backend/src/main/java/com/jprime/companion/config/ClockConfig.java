package com.jprime.companion.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    public static final ZoneId CONFERENCE_ZONE = ZoneId.of("Europe/Sofia");

    @Bean
    @ConditionalOnMissingBean
    public Clock clock() {
        return Clock.system(CONFERENCE_ZONE);
    }
}
