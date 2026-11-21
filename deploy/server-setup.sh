#!/usr/bin/env bash
# One-time setup of nginx + free HTTPS for Birch on Ubuntu/Debian.
# Before running: the DNS A record for the domain must point to this server, and ports 80 and 443 must be open.
#   sudo bash deploy/server-setup.sh you@example.com
# Safe to run again to update the nginx config.
set -euo pipefail

DOMAIN="${DOMAIN:-birch.denniskenda.com}"
EMAIL="${1:?Usage: sudo bash deploy/server-setup.sh you@example.com}"
HERE="$(cd "$(dirname "$0")" && pwd)"
CONF=/etc/nginx/sites-available/birch

[ "$(id -u)" = 0 ] || { echo "Run as root (use sudo)."; exit 1; }

apt-get update -y
apt-get install -y nginx certbot
mkdir -p /var/www/certbot

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full'
fi

# First time only: serve a plain HTTP page so Let's Encrypt can verify the domain.
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  cat > "$CONF" <<TMP
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 404; }
}
TMP
  ln -sf "$CONF" /etc/nginx/sites-enabled/birch
  nginx -t
  systemctl enable --now nginx
  systemctl reload nginx
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" -m "$EMAIL" \
    --agree-tos --no-eff-email --non-interactive --deploy-hook "systemctl reload nginx"
fi

# Install the real config.
sed "s/birch\.denniskenda\.com/$DOMAIN/g" "$HERE/nginx/birch.conf" > "$CONF"
ln -sf "$CONF" /etc/nginx/sites-enabled/birch
nginx -t
systemctl reload nginx

echo "Done. Check: curl -I https://$DOMAIN"
echo "Certificates renew automatically (certbot.timer). Test with: certbot renew --dry-run"
