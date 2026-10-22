# Payment Ledger & Reconciliation Platform Makefile
.PHONY: help up down restart logs status build clean smoke-test

help:
	@echo "Available commands:"
	@echo "  make up          - Build and start all Docker containers in background"
	@echo "  make down        - Stop and tear down all Docker containers"
	@echo "  make restart     - Restart all containerized services"
	@echo "  make logs        - Tail live logs across all containers"
	@echo "  make status      - Check container status and healthchecks"
	@echo "  make build       - Rebuild all Docker images without starting"
	@echo "  make clean       - Stop containers and remove persistent volumes"
	@echo "  make smoke-test  - Run automated endpoint connectivity checks"

up:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f --tail=100

status:
	docker compose ps

build:
	docker compose build

clean:
	docker compose down -v --remove-orphans

smoke-test:
	./deploy-docker.sh smoke-test
