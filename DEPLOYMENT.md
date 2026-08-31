# EC2 Deployment Runbook — Instant Mechanic Backend

**Assumption:** AWS EC2 t2.micro running Amazon Linux 2023 or Ubuntu 22.04.
The frontend is deployed to Vercel (zero config). This runbook is for the backend only.

---

## 1. Provision the EC2 Instance

```
AMI:      Amazon Linux 2023 (or Ubuntu 22.04 LTS)
Type:     t2.micro (free tier)
Storage:  20 GB gp3
SG rules: 22 (SSH), 80 (HTTP), 443 (HTTPS), 4000 (optional — for direct API access)
```

Create an Elastic IP and attach it. Point your domain's A record at this IP.

---

## 2. SSH + Install Docker

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Amazon Linux 2023
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

Log out and log back in for the docker group to take effect.

---

## 3. Clone the repo & configure env

```bash
git clone https://github.com/Yashtyagi2406/instant-mechanic-dashboard.git
cd instant-mechanic-dashboard/backend

cp .env.example .env
nano .env   # Fill in JWT_SECRET and CORS_ORIGIN (your Vercel URL)
```

---

## 4. Build & start with Docker Compose

```bash
# From the repo root:
cd ..
docker compose up -d --build

# Run DB migration + seed
docker compose exec backend npx prisma@5 migrate deploy
docker compose exec backend npm run seed
```

Check logs: `docker compose logs -f backend`

---

## 5. nginx Reverse Proxy (HTTPS)

```bash
sudo yum install -y nginx certbot python3-certbot-nginx   # Amazon Linux
# OR: sudo apt install -y nginx certbot python3-certbot-nginx  # Ubuntu

sudo nano /etc/nginx/conf.d/instantmechanic.conf
```

Paste:
```nginx
server {
    listen 80;
    server_name api.YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";   # Required for Socket.io WS
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl enable nginx && sudo systemctl start nginx
sudo certbot --nginx -d api.YOUR_DOMAIN.com
```

---

## 6. Update Vercel env vars

In your Vercel project settings, set:
```
NEXT_PUBLIC_API_URL   = https://api.YOUR_DOMAIN.com/api
NEXT_PUBLIC_SOCKET_URL = https://api.YOUR_DOMAIN.com
```

Trigger a redeploy.

---

## 7. Verify

```bash
curl https://api.YOUR_DOMAIN.com/health
# → {"status":"ok","timestamp":"..."}
```

Navigate to your Vercel URL → login → confirm dashboard loads with real data.

---

## Maintenance

```bash
# Restart backend after code changes
docker compose up -d --build backend

# View logs
docker compose logs -f

# Run a new migration
docker compose exec backend npx prisma@5 migrate deploy
```
