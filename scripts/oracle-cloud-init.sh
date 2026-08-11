#!/bin/bash
set -e

echo "=== Oracle Cloud Initial Setup ==="

# 1. Install Docker Compose v2
echo "Installing Docker Compose v2..."
sudo apt-get update -qq
sudo apt-get install -y -qq docker-compose-v2 2>/dev/null || echo "docker-compose-v2 already installed or not in repo"

# 2. Add 1GB swap
echo "Adding swap..."
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
  echo "Swap added"
fi

# 3. Create directories
echo "Creating directories..."
sudo mkdir -p /opt/nairi/deploy /workspaces
sudo chown ubuntu:ubuntu /opt/nairi/deploy /workspaces

# 4. DuckDNS cron
echo "Setting up DuckDNS..."
cat > /opt/nairi/duckdns-update.sh << 'DUCKEOF'
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=nairi-api&token=31d3152b-493c-9538-7826-42c8dbd93068&ip=" > /dev/null
DUCKEOF
chmod +x /opt/nairi/duckdns-update.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/nairi/duckdns-update.sh") | crontab -

echo "=== Setup Complete ==="
echo "Next: run scripts/oracle-deploy.sh"
