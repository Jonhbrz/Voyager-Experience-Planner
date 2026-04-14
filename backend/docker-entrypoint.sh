#!/bin/sh
cd /var/www

if [ ! -d "vendor" ]; then
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

exec docker-php-entrypoint "$@"
