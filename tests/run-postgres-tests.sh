#!/usr/bin/env bash
set -euo pipefail

image=postgres:18
docker image inspect "$image" >/dev/null

container_name="inventory-app-test-${$}-${RANDOM}"
container_started=0

cleanup() {
  if [[ "$container_started" == 1 ]]; then
    if docker rm -f "$container_name" >/dev/null 2>&1; then
      echo "Removed disposable PostgreSQL container: $container_name"
    else
      echo "Failed to remove disposable PostgreSQL container: $container_name" >&2
    fi
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

docker run --detach \
  --name "$container_name" \
  --publish 127.0.0.1::5432 \
  --tmpfs /var/lib/postgresql:rw,size=1g \
  --env POSTGRES_USER=inventory_test \
  --env POSTGRES_PASSWORD=inventory_test_only \
  --env POSTGRES_DB=postgres \
  "$image" >/dev/null
container_started=1
echo "Started disposable PostgreSQL container: $container_name"

mount_types="$(docker inspect --format '{{range .Mounts}}{{println .Type}}{{end}}' "$container_name")"
tmpfs_config="$(docker inspect --format '{{json .HostConfig.Tmpfs}}' "$container_name")"
if grep -Eq '^(volume|bind)$' <<<"$mount_types" || ! grep -q '/var/lib/postgresql' <<<"$tmpfs_config"; then
  echo "Disposable test container must have no Docker volume/bind mount and must use tmpfs storage." >&2
  exit 1
fi

host_port=""
database_ready=0
for ((attempt = 0; attempt < 150; attempt += 1)); do
  host_port="$(docker inspect --format '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}' "$container_name" 2>/dev/null || true)"
  if [[ -n "$host_port" ]] && docker exec "$container_name" pg_isready -U inventory_test -d postgres >/dev/null 2>&1; then
    database_ready=1
    break
  fi
  sleep 0.2
done
if [[ -z "$host_port" || "$database_ready" != 1 ]]; then
  docker inspect --format 'state={{.State.Status}} ports={{json .NetworkSettings.Ports}}' "$container_name" >&2 || true
  echo "Disposable PostgreSQL container did not become ready (host port: ${host_port:-missing})." >&2
  docker logs "$container_name" >&2 || true
  exit 1
fi

suffix="${$}_${RANDOM}"
export TEST_DATABASE_URL="postgresql://inventory_test:inventory_test_only@127.0.0.1:${host_port}/inventory_contract_test_${suffix}?schema=public"
unset DATABASE_URL
export DATABASE_URL="$TEST_DATABASE_URL"
node --conditions=react-server --experimental-strip-types \
  --import ./tests/register-ts-runtime-loader.mjs \
  --test tests/warehouse-schema.test.mjs tests/warehouse-locks.test.mjs
