# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Production Multi-Stage Dockerfile for Payment API Microservice
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
RUN mvn dependency:go-offline -B -pl common,payment-api -am || true

# Copy source trees for common and payment-api
COPY common/src ./common/src
COPY payment-api/src ./payment-api/src

# Compile and package executable fat JAR
RUN mvn clean package -pl common,payment-api -am -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Lightweight Container Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Security: Non-root application user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk add --no-cache curl wget

# Copy executable artifact from build stage
COPY --from=builder /workspace/payment-api/target/*.jar /app/app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

# Production container JVM tuning
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q "UP" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
