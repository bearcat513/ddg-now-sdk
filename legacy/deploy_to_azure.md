# Deploying to an Azure VM

This deploys the project **as it is** — the same two containers `bun run docker:up` starts
locally — onto a single Ubuntu VM, with the PocketBase data on an attached managed disk that
survives rebuilds, resizes and reimages.

Nothing in the repo needs to change. The one file you add lives on the VM: a Compose override
that points the `pb_data` volume at the mounted disk and publishes the app on loopback for a
reverse proxy.

| Piece | What it is |
| --- | --- |
| `app` | The Bun server — UI and API, port 3000 inside the container |
| `pocketbase` | The database, port 8080 inside the container, never published to the world |
| `pb_data` volume | Every configuration, dataset, script template, API key and account |
| Caddy (host) | TLS termination, `:443` → `127.0.0.1:3000` |
| Managed data disk | Where `pb_data` actually lives |

---

## Before you start

**Sign-up is open and enum choice scripts run server-side.** An account on this instance can
attach a JavaScript snippet to an enum field, and that snippet runs in a `node:vm` context on the
server with `fetch` available — `src/server/script.ts` says so in its own header: *a guard against
mistakes, not against malice*. Secrets are kept out of its reach (only `DDG_SCRIPT_*` variables
are visible to it), but outbound network access is not.

So the instance should not be open to the internet at large. Decide now which of these you want,
and apply it in the NSG rules in step 2:

- **Internal tool (recommended)** — restrict `:443` to your office or VPN egress IP range.
- **Public** — accept that anyone who registers can run code on this VM, and treat the VM as
  disposable: no other workloads, no credentials on it, an NSG that permits no outbound traffic
  you care about.

You will need: the `az` CLI signed in (`az login`), a subscription, an SSH key pair, and
optionally a DNS name (the free `*.cloudapp.azure.com` label in step 1 is enough for real TLS).

---

## 1. Create the VM and the data disk

```bash
RG=ddg-rg
LOC=eastus
VM=ddg-vm
DNS=ddg-$RANDOM          # becomes ddg-NNNN.eastus.cloudapp.azure.com

az group create --name "$RG" --location "$LOC"

az vm create \
  --resource-group "$RG" --name "$VM" --location "$LOC" \
  --image Ubuntu2404 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --public-ip-address-dns-name "$DNS" \
  --os-disk-size-gb 32
```

**Size.** `Standard_B2s` (2 vCPU, 4 GiB) is the smallest size that builds the app image
comfortably — `bun install` plus the Tailwind bundle will OOM on a 1 GiB `B1s`. Both Dockerfiles
pass `TARGETARCH` through, so an Arm size (`Standard_D2ps_v5`) builds natively too if you want the
cost saving.

Then attach a **separate managed disk** for the database — not a folder on the OS disk:

```bash
az vm disk attach \
  --resource-group "$RG" --vm-name "$VM" \
  --name ddg-data --new --size-gb 64 \
  --sku Premium_LRS --caching None
```

Why a separate disk at all:

- The OS disk gets replaced by a reimage and is easy to lose to a `vm delete`. A data disk can be
  detached and re-attached to a new VM in minutes, which is the whole recovery story.
- Snapshots of a data disk are small, fast and independent of the OS.
- `--caching None` matters: PocketBase is SQLite, and a host write-cache in front of a database
  that relies on write ordering is a corruption risk on an unclean shutdown. Read caching buys
  nothing here either — the working set is already in the VM's page cache.

Size it for datasets, not for the app: rows are stored whole as JSON, with a 64 MB cap per
dataset. 64 GB is generous for an internal tool; the disk can be grown later while attached.

---

## 2. Network rules

```bash
MYIP=$(curl -s https://api.ipify.org)

# SSH from your address only.
az vm open-port --resource-group "$RG" --name "$VM" --port 22 --priority 100
az network nsg rule update --resource-group "$RG" \
  --nsg-name "${VM}NSG" --name open-port-22 --source-address-prefixes "$MYIP/32"

# HTTP + HTTPS. Caddy needs :80 to answer the ACME challenge.
az vm open-port --resource-group "$RG" --name "$VM" --port 80,443 --priority 110
```

`az vm open-port` names the rules it creates after the ports (`open-port-22`,
`open-port-80_443`). Confirm with `az network nsg rule list -g "$RG" --nsg-name "${VM}NSG" -o
table` before running an update against a name.

For an internal deployment, narrow 443 the same way 22 was narrowed:

```bash
az network nsg rule update --resource-group "$RG" \
  --nsg-name "${VM}NSG" --name open-port-80_443 \
  --source-address-prefixes "203.0.113.0/24"   # your office range
```

**Never open 3000 or 8090.** The app is reached through Caddy, and PocketBase's dashboard is
reached through an SSH tunnel (step 8). The base `docker-compose.yml` publishes nothing at all —
that is deliberate, and the override in step 6 only ever binds to `127.0.0.1`.

---

## 3. Prepare and mount the data disk

SSH in:

```bash
ssh azureuser@$DNS.$LOC.cloudapp.azure.com
```

### Do not use `/mnt`

`/mnt` on an Azure Linux VM is the **ephemeral resource disk**. It is local SSD attached to the
host your VM currently runs on, and everything on it is gone after a stop/deallocate, a resize, or
a host migration Azure performs without asking. Countless "our database vanished overnight" posts
start here. This guide mounts at `/datadrive`.

### Find the disk

Azure exposes attached data disks at a stable path keyed by LUN, which is what you want — `sdc`
can move between boots:

```bash
lsblk
ls -l /dev/disk/azure/scsi1/
```

The disk from step 1 is `/dev/disk/azure/scsi1/lun0`. Confirm it is the empty 64 GiB one before
you write to it.

### Partition, format, mount

```bash
DISK=/dev/disk/azure/scsi1/lun0

sudo parted "$DISK" --script mklabel gpt mkpart primary ext4 0% 100%
sudo partprobe "$DISK"
sudo mkfs.ext4 -L ddgdata "${DISK}-part1"

sudo mkdir -p /datadrive
sudo mount "${DISK}-part1" /datadrive
```

### Make it survive a reboot

Mount by **UUID**, never by `/dev/sdX`:

```bash
UUID=$(sudo blkid -s UUID -o value "${DISK}-part1")
echo "UUID=$UUID  /datadrive  ext4  defaults,nofail  0  2" | sudo tee -a /etc/fstab

sudo systemctl daemon-reload
sudo mount -a
findmnt /datadrive          # must print the mount; no output means it did not mount
```

`nofail` keeps the VM bootable if the disk is ever missing, rather than dropping it into
emergency mode where you cannot SSH in to fix anything.

### Make Docker wait for the mount

`nofail` trades a boot failure for a subtler one: Docker could start before `/datadrive` is
mounted. Tell systemd not to let that happen:

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/datadrive.conf >/dev/null <<'EOF'
[Unit]
RequiresMountsFor=/datadrive
EOF
sudo systemctl daemon-reload
```

### Create the data directory — only after mounting

```bash
findmnt /datadrive || { echo "NOT MOUNTED — stop here"; }
sudo mkdir -p /datadrive/ddg/pb_data
```

The order matters more than it looks. The bind mount in step 6 names
`/datadrive/ddg/pb_data` as its device, and Docker refuses to start a container whose bind source
does not exist. So if the disk ever fails to mount, that directory is absent and **the stack
fails loudly** instead of quietly writing a second, divergent database onto the OS disk. Creating
those directories on the root filesystem first is what destroys that property — a later `mount`
hides them, and you are left with data in two places and no sign of it.

---

## 4. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker azureuser
newgrp docker            # or log out and back in

docker compose version   # v2, bundled — `docker-compose` v1 is not used here
sudo systemctl enable --now docker
```

`docker.service` being enabled plus `restart: unless-stopped` on both services (set in
`docker-compose.yml`) is what brings the stack back after a reboot or an Azure host event. There
is no systemd unit to write.

---

## 5. Clone the repo and write `.env`

```bash
sudo mkdir -p /opt/ddg && sudo chown azureuser:azureuser /opt/ddg
git clone https://github.com/bearcat513/ddg-pocketbase.git /opt/ddg
cd /opt/ddg

cp .env.example .env
chmod 600 .env
```

Edit `.env`. Compose fails fast on the required ones — a missing `PB_VERSION`,
`PB_ADMIN_EMAIL` or `PB_ADMIN_PASSWORD` stops the command rather than building half of it.

| Variable | Set it to |
| --- | --- |
| `PB_VERSION` | Leave at the pinned release; bumping it rebuilds the image |
| `BUN_VERSION` | Leave as-is |
| `PB_ADMIN_EMAIL` | A real address you control |
| `PB_ADMIN_PASSWORD` | `openssl rand -base64 24` — 8 char minimum, and **change it from the example** |
| `API_PORT` / `PB_PORT` | Ignored here. They belong to `docker-compose.override.yml`, which a `-f` deploy never loads |
| `POCKETBASE_URL` | Leave commented out. Compose sets `http://pocketbase:8080` for the container |
| `TELEGRAM_BOT_TOKEN` | Optional — one shared bot for every account on the instance |
| `DDG_SCRIPT_*` | Only these reach enum choice scripts. Nothing else in this file does |

The superuser credentials create the PocketBase dashboard account on first boot
(`docker/pb_hooks/setup/superuser.js`) and are never used again — the app itself holds no
database credentials and signs in as each user. Compose explicitly blanks both variables inside
the `app` container.

---

## 6. Point the volume at the disk

This is the file that makes the deployment durable. Create it **on the VM** — its paths are
specific to this machine:

```bash
cat > /opt/ddg/docker-compose.prod.yml <<'EOF'
# Azure VM deployment. Used with -f, so docker-compose.override.yml (local host
# ports) is never loaded.
services:
  app:
    # Loopback only: Caddy on the host proxies to it. Binding to 127.0.0.1
    # rather than 0.0.0.0 also keeps Docker's iptables rules from stepping
    # around the host firewall.
    ports:
      - "127.0.0.1:3000:3000"

  pocketbase:
    # Loopback only, for the SSH tunnel to the dashboard. Comment it out if you
    # would rather reach the dashboard with `docker compose exec` alone.
    ports:
      - "127.0.0.1:8090:8080"

volumes:
  # Same volume name the base file uses, redefined as a bind onto the managed
  # data disk. The service definition is untouched, so nothing else changes.
  pb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /datadrive/ddg/pb_data
EOF
```

**If `pb_data` already exists** with the default options — because you ran `docker compose up`
once before adding this file — Docker refuses to reconfigure it, with a message about the volume
being declared differently. Remove it and start over (this deletes whatever is in it):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm dummy-data-generator_pb_data
```

The `dummy-data-generator_` prefix comes from `name:` at the top of `docker-compose.yml`.

Note also that `pb_hooks` and `pb_migrations` are **baked into the PocketBase image**, not
mounted. Only `docker-compose.override.yml` mounts them, for local editing. On the VM a change to
a hook or a migration means a rebuild — see step 9.

---

## 7. Start it

```bash
cd /opt/ddg
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Make that pair of `-f` flags a shell function, since every later command needs both:

```bash
echo 'ddg() { (cd /opt/ddg && docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"); }' >> ~/.bashrc
source ~/.bashrc
```

Watch the first boot — PocketBase applies every migration in `docker/pb_migrations/` before the
app's first request, and the app waits on PocketBase's healthcheck to make sure of it:

```bash
ddg logs -f
ddg ps          # both services should read (healthy)
curl -s localhost:3000/api/health
```

### Verify the data is actually on the disk

Do this now, while there is nothing to lose if it is wrong:

```bash
sudo ls -la /datadrive/ddg/pb_data     # data.db, data.db-wal, auxiliary.db, storage/
df -h /datadrive                       # usage should be non-zero and growing
docker volume inspect dummy-data-generator_pb_data \
  --format '{{ .Options.device }}'     # /datadrive/ddg/pb_data
```

If `/datadrive/ddg/pb_data` is empty while the app works, the containers are writing somewhere
else — stop, and recheck step 6.

---

## 8. TLS and the reverse proxy

Caddy on the host, because it gets and renews a certificate with no configuration and sets
`X-Forwarded-Proto` by default. That header is load-bearing: `src/server/session.ts` decides
whether to put `Secure` on the session cookie by reading it, so a proxy that drops it leaves
sessions on a plaintext-eligible cookie.

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

```bash
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
ddg-NNNN.eastus.cloudapp.azure.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000

    # Generated exports of any size, and dataset uploads.
    request_body {
        max_size 100MB
    }
}
EOF

sudo systemctl reload caddy
sudo journalctl -u caddy -f      # watch the certificate get issued
```

Use your own domain if you have one (point an A record at the VM's public IP first), or the
`*.cloudapp.azure.com` label from step 1 — each label is its own registrable domain as far as
Let's Encrypt is concerned, so a certificate issues normally.

Open `https://your-host/` and register. Sign-up is the front door, and **the first account to
register inherits any records that have no owner** — relevant only if you imported data from a
pre-accounts version. Register yourself before you share the URL.

### Reaching the PocketBase dashboard

It is not on the internet, and should not be. Tunnel to the loopback port published in step 6:

```bash
# From your laptop:
ssh -L 8091:127.0.0.1:8090 azureuser@ddg-NNNN.eastus.cloudapp.azure.com
# Then open http://localhost:8091/_/ and sign in as PB_ADMIN_EMAIL.
```

If the dashboard rejects the password, `ddg --profile init run --rm pocketbase-init` resets it to
the `.env` values. It is an idempotent upsert and is the way back in when the app starts
answering 401s.

---

## 9. Updating

```bash
cd /opt/ddg
git pull
ddg up -d --build
```

Both images rebuild, PocketBase applies any new migrations on boot before the app is allowed
traffic, and the volume is untouched. A change to `docker/pb_hooks/` or `docker/pb_migrations/`
needs this same rebuild — on the VM they are image contents, not mounts.

To move to a newer PocketBase, bump `PB_VERSION` in `.env` and rerun. The image is tagged by
version, so the build actually happens instead of silently reusing the old one. **Snapshot the
disk first** (below) — a major PocketBase upgrade migrates the database in place.

---

## 10. Backups

The disk is redundant storage, not a backup: it does not protect you from `down -v`, from a bad
migration, or from someone deleting the wrong configuration. Use two of these.

**Azure snapshots** — the cheapest insurance, and the one to take before every upgrade:

```bash
DISK_ID=$(az vm show -g "$RG" -n "$VM" --query "storageProfile.dataDisks[0].managedDisk.id" -o tsv)
az snapshot create -g "$RG" -n "ddg-data-$(date +%Y%m%d)" --source "$DISK_ID"
```

**PocketBase's own backups** — dashboard → Settings → Backups, including a schedule. They land in
`pb_data/backups`, so they ride along on the same disk and in every snapshot, and PocketBase takes
them consistently while running.

**A file-level copy** — consistent only with the database stopped, because a live SQLite file plus
its WAL copied separately is not a database:

```bash
ddg stop
sudo tar czf /datadrive/ddg-backup-$(date +%F).tgz -C /datadrive/ddg/pb_data .
ddg start
```

### Restoring, or moving data from your laptop

Pack the local named volume, copy it up, unpack it onto the disk:

```bash
# On your laptop, with the stack stopped:
docker run --rm -v dummy-data-generator_pb_data:/from -v "$PWD":/to alpine \
  tar czf /to/pb_data.tgz -C /from .
scp pb_data.tgz azureuser@ddg-NNNN.eastus.cloudapp.azure.com:/tmp/

# On the VM:
ddg down
sudo rm -rf /datadrive/ddg/pb_data/*
sudo tar xzf /tmp/pb_data.tgz -C /datadrive/ddg/pb_data
ddg up -d
```

Accounts, sessions and API keys come across with it — the superuser included, which will be the
one from the source machine rather than the `.env` here until you run the init profile.

---

## 11. Rebuilding the VM

This is why the data lives on its own disk. To replace a VM, or to move to a larger size:

```bash
az vm delete -g "$RG" -n "$VM" --yes          # the data disk is NOT deleted by this
# create the new VM as in step 1, without --new on the disk attach:
az vm disk attach -g "$RG" --vm-name ddg-vm2 --name ddg-data --caching None
```

Then steps 3 (mount only — no `parted`, no `mkfs`; the filesystem is already there), 4, 5, 6 and
7. Everything comes back.

A plain resize (`az vm resize`) keeps the data disk attached and needs none of this — but it does
deallocate the VM, which is another reminder that nothing may be stored in `/mnt`.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `set PB_VERSION in .env` and the command stops | No `.env`, or the variable is missing. Compose interpolates before anything builds |
| `volume ... already exists but was configured differently` | A `pb_data` from before step 6. `docker volume rm dummy-data-generator_pb_data`, then up again |
| Container won't start, `bind source path does not exist` | `/datadrive` is not mounted, or the directory was never created. Exactly the loud failure step 3 is designed for — `findmnt /datadrive` |
| App is up, `/datadrive/ddg/pb_data` is empty | The override was not passed. Both `-f` flags, every time |
| Data was there yesterday and is gone | Something is under `/mnt`, the ephemeral disk. Check `findmnt` and the device path in `docker volume inspect` |
| Sign-in appears to succeed but every next request is anonymous | The proxy is not sending `X-Forwarded-Proto: https`, so the cookie's `Secure` flag is wrong for the scheme. Caddy sets it; a hand-rolled nginx config must be told to |
| App logs `ECONNREFUSED pocketbase:8080` | PocketBase failed its healthcheck. `ddg logs pocketbase` — usually a migration error |
| App answers 401 on everything | Superuser credentials drifted. `ddg --profile init run --rm pocketbase-init` |
| Dashboard unreachable at `localhost:8091` | The tunnel, or the `pocketbase` ports block in the override. It is intentionally not public |
| `bun install` killed during build | Out of memory on a 1 GiB VM. Use `Standard_B2s` or add swap |
| New hook or migration has no effect | They are baked into the image on a `-f` deploy. `ddg up -d --build` |

---

## What this guide does not do

Single VM, single instance, no orchestration — which suits the tool. If you outgrow it:

- **The app scales out, PocketBase does not.** It is SQLite on a local disk; a second `app`
  replica against the same PocketBase is fine, a second PocketBase is not.
- **Azure Container Apps / App Service** would replace step 1–7 but need a durable filesystem
  mount for `pb_data` (Azure Files), and SQLite over SMB is a known source of locking trouble.
  The VM plus a managed disk is the boring, correct answer for this shape of app.
- **Monitoring** is whatever you add. Both containers have healthchecks (`GET /api/health` for
  the app, PocketBase's own for the database) and JSON logging capped at 3 × 10 MB per service,
  so the Azure Monitor agent has something to scrape.
