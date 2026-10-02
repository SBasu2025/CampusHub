# ============================================================
# Stage 1: Build the Spring Boot application
# ============================================================

FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven project definition first so Docker can cache
# dependency resolution between source-code changes.
COPY pom.xml .

# Download dependencies before copying the source.
RUN mvn -B dependency:go-offline

# Copy application source.
COPY src ./src

# Build the executable Spring Boot JAR.
RUN mvn -B clean package -DskipTests


# ============================================================
# Stage 2: Run the Spring Boot application
# ============================================================

FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy only the built application from the build stage.
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Render web services expect the application to listen on
# the PORT environment variable. Render commonly supplies
# 10000 for the public web-service port.
EXPOSE 10000

# Use Render's PORT when available.
# Fall back to 10000 when running the container locally.
ENTRYPOINT [
    "sh",
    "-c",
    "java $JAVA_OPTS -jar app.jar --server.port=${PORT:-10000}"
]