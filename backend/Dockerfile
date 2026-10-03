# ============================================================
# Stage 1: Build the Spring Boot application
# ============================================================

FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven project definition first so Docker can cache
# dependency resolution between source-code changes.
COPY pom.xml .

# Download project dependencies before copying source code.
RUN mvn -B dependency:go-offline

# Copy application source.
COPY src ./src

# Build the Spring Boot JAR.
RUN mvn -B clean package -DskipTests


# ============================================================
# Stage 2: Run the Spring Boot application
# ============================================================

FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the generated Spring Boot JAR from the build stage.
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Render supplies the PORT environment variable.
# 10000 is used as the local fallback.
EXPOSE 10000

# Start Spring Boot using Render's PORT value.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar --server.port=${PORT:-10000}"]