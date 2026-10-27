#!/bin/sh
# Container entrypoint: started as root, fix volume permissions on /data,
# then drop privileges to the unprivileged "app" user before exec'ing CMD.
# If the container is already started as a non-root user (--user), just exec.
set -e

APP_USER=app

if [ "$(id -u)" = "0" ]; then
  mkdir -p "${DATA_DIR:-/data}"
  chown -R "$APP_USER:$APP_USER" "${DATA_DIR:-/data}"
  exec su-exec "$APP_USER" "$@"
fi

exec "$@"
