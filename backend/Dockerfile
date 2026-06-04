FROM eclipse-temurin:25-jdk AS build

WORKDIR /workspace

COPY gradlew settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle ./gradle

RUN chmod +x gradlew
RUN ./gradlew --no-daemon dependencies > /tmp/gradle-dependencies.log \
    || (cat /tmp/gradle-dependencies.log && false)

COPY src ./src

RUN ./gradlew --no-daemon bootJar \
    && cp build/libs/jprime-companion-backend-*.jar app.jar

FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=build /workspace/app.jar app.jar

EXPOSE 8080

ENV JAVA_TOOL_OPTIONS="-Dnet.bytebuddy.experimental=true"

RUN useradd --create-home --uid 10001 appuser
USER appuser

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
