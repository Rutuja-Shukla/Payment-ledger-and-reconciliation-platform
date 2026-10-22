# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Production Multi-Stage Dockerfile for Ledger Service Microservice
# ------------------------------------------------------------------------------

# Stage 1: Build Application
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /workspace

# Copy parent and module pom.xml files for dependency caching
COPY pom.xml ./
COPY common/pom.xml ./common/
COPY payment-api/pom.xml ./payment-api/
COPY ledger-service/pom.xml ./ledger-service/
COPY recon-service/pom.xml ./recon-service/

# Download dependencies
RUN mvn dependency:go-offline -B -pl common,ledger-service -am || true

# Copy source trees for common and ledger-service
COPY common/src ./common/src
COPY ledger-service/src ./ledger-service/src

# Compile and package executable fat JAR
RUN mvn clean package -pl common,ledger-service -am -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Lightweight Container Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Security: Non-root application user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk add --no-cache curl wget

# Copy executable artifact from build stage
COPY --from=builder /workspace/ledger-service/target/*.jar /app/app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8081

# Production container JVM tuning
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8081/actuator/health | grep -q "UP" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
