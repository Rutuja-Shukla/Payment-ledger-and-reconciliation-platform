#!/usr/bin/env bash
# ==============================================================================
# Payment Ledger & Reconciliation Platform - Docker Deployment Script
# ==============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${CYAN} Payment Ledger & Reconciliation Platform - Docker Deployment Manager${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# Detect Docker CLI & Compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}[ERROR] Neither 'docker compose' nor 'docker-compose' found.${NC}"
    echo -e "Please install Docker Desktop or Docker Engine before running this script."
    echo -e "Download: https://docs.docker.com/get-docker/"
    exit 1
fi

ACTION="${1:-up}"

case "$ACTION" in
    up|start)
        echo -e "\n${YELLOW}[1/4] Checking environment prerequisites...${NC}"
        chmod +x infra/init-databases.sh 2>/dev/null || true

        echo -e "${YELLOW}[2/4] Building and launching containers in detached mode...${NC}"
        $DOCKER_COMPOSE up --build -d

        echo -e "\n${YELLOW}[3/4] Waiting for services to initialize...${NC}"
        sleep 5

        echo -e "\n${GREEN}[4/4] Deployment Status & Service Endpoints:${NC}"
        $DOCKER_COMPOSE ps

        echo -e "\n${CYAN}----------------------------------------------------------------------${NC}"
        echo -e "${GREEN}✓ Frontend Operations Console:${NC} http://localhost:3000"
        echo -e "${GREEN}✓ Payment API Service:         ${NC} http://localhost:8080/actuator/health"
        echo -e "${GREEN}✓ Ledger Service:              ${NC} http://localhost:8081/actuator/health"
        echo -e "${GREEN}✓ Reconciliation Service:      ${NC} http://localhost:8082/actuator/health"
        echo -e "${GREEN}✓ Prometheus Observability:    ${NC} http://localhost:9090"
        echo -e "${GREEN}✓ Grafana Dashboards:          ${NC} http://localhost:3001 (admin / admin)"
        echo -e "${GREEN}✓ PostgreSQL 16:               ${NC} localhost:5432 (postgres / postgres)"
        echo -e "${GREEN}✓ Apache Kafka (KRaft):        ${NC} localhost:9092"
        echo -e "${GREEN}✓ Redis Cache:                 ${NC} localhost:6379"
        echo -e "${CYAN}----------------------------------------------------------------------${NC}"
        echo -e "To tail logs, run: ${YELLOW}./deploy-docker.sh logs${NC}"
        ;;

    down|stop)
        echo -e "${YELLOW}Stopping all containers...${NC}"
        $DOCKER_COMPOSE down
        echo -e "${GREEN}✓ All services stopped gracefully.${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Restarting services...${NC}"
        $DOCKER_COMPOSE restart
        echo -e "${GREEN}✓ Services restarted.${NC}"
        ;;

    status|ps)
        $DOCKER_COMPOSE ps
        ;;

    logs)
        SERVICE="${2:-}"
        if [ -n "$SERVICE" ]; then
            $DOCKER_COMPOSE logs -f "$SERVICE"
        else
            $DOCKER_COMPOSE logs -f --tail=100
        fi
        ;;

    clean)
        echo -e "${RED}WARNING: This will destroy all containers, networks, and persistent data volumes (PostgreSQL, Kafka, Redis, Grafana)!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $DOCKER_COMPOSE down -v --remove-orphans
            echo -e "${GREEN}✓ Cleaned up all containers, networks, and volumes.${NC}"
        else
            echo "Clean operation cancelled."
        fi
        ;;

    smoke-test)
        echo -e "${YELLOW}Running automated health smoke tests against deployed containers...${NC}"
        curl -s -f http://localhost:3000/healthz > /dev/null && echo -e "  [PASS] Frontend Nginx (3000)" || echo -e "  [FAIL] Frontend (3000)"
        curl -s -f http://localhost:8080/actuator/health > /dev/null && echo -e "  [PASS] Payment API (8080)" || echo -e "  [FAIL] Payment API (8080)"
        curl -s -f http://localhost:8081/actuator/health > /dev/null && echo -e "  [PASS] Ledger Service (8081)" || echo -e "  [FAIL] Ledger Service (8081)"
        curl -s -f http://localhost:8082/actuator/health > /dev/null && echo -e "  [PASS] Recon Service (8082)" || echo -e "  [FAIL] Recon Service (8082)"
        curl -s -f http://localhost:9090/-/healthy > /dev/null && echo -e "  [PASS] Prometheus (9090)" || echo -e "  [FAIL] Prometheus (9090)"
        ;;

    *)
        echo "Usage: ./deploy-docker.sh [up|down|restart|status|logs|clean|smoke-test]"
        exit 1
        ;;
esac
