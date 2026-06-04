# Infisical Secrets

This repo uses Infisical as the intended source of truth for deployed secrets.
Application code still reads `process.env`; Infisical only delivers the values.

## Infisical Project Layout

Use one Infisical Cloud project with slug `true-rdp-58y0`.

Environments:

- `dev`
- `staging`
- `prod`

Secrets live at the project root (`/`). This keeps Infisical as the single
place to edit deployed configuration without maintaining app-specific folders
or generated env files by hand.

Keep `NEXT_PUBLIC_*` values in Infisical for consistency, but remember they are
public frontend config after a Next.js build.

## Vercel Syncs

Create one Vercel App Connection in Infisical, then create one Secret Sync per
Vercel project from the root path (`/`).

Recommended sync options while migrating:

- Auto-sync enabled.
- Disable secret deletion enabled.
- Import existing Vercel values first, then manually re-enter sensitive values
  that Vercel cannot reveal.

After each app has been verified, decide whether Infisical should delete
destination variables that are no longer present in Infisical.

## DigitalOcean Backend

Install the Infisical CLI on the DigitalOcean host because the agent is a CLI
subcommand. Keep the machine identity credential outside the repo:

```bash
install -d -m 700 /etc/infisical/truerdp
printf '%s' '<client-id>' > /etc/infisical/truerdp/client-id
printf '%s' '<client-secret>' > /etc/infisical/truerdp/client-secret
chmod 600 /etc/infisical/truerdp/client-id /etc/infisical/truerdp/client-secret
```

The production workflow creates the ignored runtime agent config from the
checked-in example automatically. If you need to customize paths or the project
slug on a host, create it manually before running the deploy command:

```bash
mkdir -p deploy/infisical/runtime
cp deploy/infisical/backend-agent.yaml.example \
  deploy/infisical/runtime/backend-agent.yaml
```

Render the backend env file:

```bash
pnpm run infisical:render:backend
```

Start production with the Infisical-rendered env file:

```bash
pnpm run prod:backend
```

For secret-only changes, render again and restart the backend:

```bash
pnpm run prod:backend:refresh
```

Do not commit generated env files or machine identity credentials.
