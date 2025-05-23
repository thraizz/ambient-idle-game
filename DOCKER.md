# Docker Setup for Idle Game Backend

This document explains how to run the idle game backend using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Quick Start

1. **Start the entire stack (database + backend):**

   ```bash
   docker-compose up -d
   ```

2. **View logs:**

   ```bash
   # All services
   docker-compose logs -f

   # Backend only
   docker-compose logs -f backend

   # Database only
   docker-compose logs -f database
   ```

3. **Stop the stack:**

   ```bash
   docker-compose down
   ```

4. **Stop and remove volumes (WARNING: This will delete all data):**
   ```bash
   docker-compose down -v
   ```

## Services

### Backend

- **Container:** `idle-game-backend`
- **Port:** 8080
- **Health check:** http://localhost:8080/actuator/health
- **API docs:** http://localhost:8080/swagger-ui.html
- **OpenAPI spec:** http://localhost:8080/api-docs

### Database (PostgreSQL)

- **Container:** `idle-game-db`
- **Port:** 5432
- **Database:** `idlegame`
- **Username:** `gameuser`
- **Password:** `gamepass123`

## Development Commands

### Build only the backend image:

```bash
docker build -t idle-game-backend ./backend
```

### Run backend with external database:

```bash
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://your-db:5432/idlegame \
  idle-game-backend
```

### Connect to the database:

```bash
# Using psql
docker exec -it idle-game-db psql -U gameuser -d idlegame

# Using docker-compose
docker-compose exec database psql -U gameuser -d idlegame
```

## Configuration

### Environment Variables

The backend accepts these environment variables:

- `SPRING_PROFILES_ACTIVE`: Active Spring profile (default: `docker`)
- `SPRING_DATASOURCE_URL`: Database URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: Hibernate DDL mode (create, update, validate, etc.)

### Profiles

- **default**: Uses H2 in-memory database (for local development)
- **docker**: Uses PostgreSQL database (for containerized deployment)

## Troubleshooting

### Backend fails to start

1. Check if the database is healthy:

   ```bash
   docker-compose ps
   ```

2. Check database logs:

   ```bash
   docker-compose logs database
   ```

3. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

### Database connection issues

1. Ensure the database container is running and healthy
2. Check network connectivity between containers
3. Verify database credentials and connection string

### Build failures

1. Clear Docker build cache:

   ```bash
   docker builder prune
   ```

2. Rebuild without cache:
   ```bash
   docker-compose build --no-cache
   ```

## Production Considerations

For production deployment, consider:

1. **Security:**

   - Change default database credentials
   - Use Docker secrets for sensitive data
   - Enable SSL/TLS for database connections
   - Run containers with restricted privileges

2. **Performance:**

   - Tune JVM parameters for the backend
   - Configure PostgreSQL settings for your workload
   - Use appropriate resource limits

3. **Monitoring:**

   - Set up log aggregation
   - Monitor container health and metrics
   - Configure alerts for service failures

4. **Backup:**
   - Implement regular database backups
   - Test backup and restore procedures
