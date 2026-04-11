#!/bin/sh
set -e
cd /var/www

# Bind mount sin vendor (p. ej. clon nuevo): instalar una vez con scripts + .env en runtime
if [ ! -d vendor ]; then
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

exec docker-php-entrypoint "$@"
