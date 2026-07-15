# Deploy Wakeel on an Azure UAE VM

The whole product (Dify + n8n + Wakeel) runs on one Ubuntu VM. Wakeel runs as a
host process on `:8800`; Dify's nginx proxies `/wakeel/` to it. It's the same
stack as local — a VM is a real Docker host, so `docker compose up -d` reproduces
your machine exactly.

## 0. Prerequisites
- Azure VM: Ubuntu 22.04, **4 vCPU / 16 GB** (D4s_v5 or B4ms), 128 GB disk.
- NSG ports open: **80, 443** public; **22** restricted to your IP.
- A domain (recommended) pointed at the VM's public IP — **required for HTTPS,
  and HTTPS is required for Google login (OAuth)**.

## 1. Connect + install Docker
```bash
ssh -i wakeel-vm_key.pem azureuser@<VM-PUBLIC-IP>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && exit      # re-login so docker works without sudo
ssh -i wakeel-vm_key.pem azureuser@<VM-PUBLIC-IP>
```

## 2. Get the code (public repo — no auth needed)
```bash
sudo mkdir -p /opt && sudo chown $USER /opt
git clone https://github.com/MuhammedSirajulHudaK/wakeel-platform.git /opt/wakeel-platform
cd /opt/wakeel-platform
git checkout wakeel-storytelling-i18n
```

## 3. Configure Dify (docker/.env)
```bash
cd /opt/wakeel-platform/docker
cp .env.example .env
# then edit .env and set at minimum:
#   SECRET_KEY=<run: openssl rand -base64 42>
#   OPENAI_API_KEY=<your key>        (Wakeel also reads this for planning)
#   NGINX_SERVER_NAME=<your-domain>  (e.g. app.wakeel.ae)
nano .env
```

## 4. Bring up Dify + n8n
```bash
docker compose up -d
docker compose ps        # wait until api / web / nginx / weaviate are healthy
```
Smoke test: open `http://<VM-PUBLIC-IP>/` → Dify console should load.

## 5. Run Wakeel as a service
```bash
cd /opt/wakeel-platform/wakeel
cp deploy/wakeel.env.example wakeel.env && nano wakeel.env   # set MAGIC_ACCOUNTS + LLM
# recreate the OAuth secret file (do NOT commit it): google_oauth.json
sudo cp deploy/wakeel.service /etc/systemd/system/wakeel.service
# edit the User= line if your admin user isn't 'azureuser'
sudo systemctl daemon-reload
sudo systemctl enable --now wakeel
systemctl status wakeel --no-pager
```
Open `http://<VM-PUBLIC-IP>/wakeel/` → the Wakeel portal should load.

## 6. HTTPS (needed for Google login)
Dify ships certbot support. Point your domain at the VM first, then:
```bash
cd /opt/wakeel-platform/docker
# in .env set:
#   NGINX_HTTPS_ENABLED=true
#   CERTBOT_DOMAIN=app.wakeel.ae
#   CERTBOT_EMAIL=you@wakeel.ae
docker compose --profile certbot up -d
docker compose exec -it certbot /bin/sh /update-cert.sh
docker compose restart nginx
```
Now `https://app.wakeel.ae/wakeel/` works.

## 7. Google OAuth
In Google Cloud Console → your OAuth client → **Authorized redirect URIs**, add:
```
https://app.wakeel.ae/wakeel/api/oauth/google/callback
```
Put the client id/secret into Wakeel (Connect → setup), which writes
`wakeel/google_oauth.json`.

## Updating later
```bash
cd /opt/wakeel-platform && git pull
cd docker && docker compose up -d          # Dify/n8n
sudo systemctl restart wakeel              # Wakeel
```
