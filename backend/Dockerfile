# Build stage
FROM gradle:8.10-jdk21 AS builder

# Set working directory
WORKDIR /app

# Copy Gradle wrapper and build files
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy source code
COPY src/ src/

# Make gradlew executable and build the application
RUN chmod +x gradlew
RUN ./gradlew bootJar --no-daemon

# Runtime stage
FROM openjdk:25-jdk-slim

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl

# Create a non-root user (Debian syntax)
RUN groupadd -g 1001 spring && \
    useradd -r -u 1001 -g spring spring

# Copy the JAR file from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Change ownership of the app directory
RUN chown -R spring:spring /app

# Switch to non-root user
USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]