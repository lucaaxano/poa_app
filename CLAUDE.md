# POA App — Project Rules

## Critical Architecture Rules

### Web service must NEVER depend on the API service in Docker
- `docker-compose.yml`: The `web` service must NEVER have `depends_on: api`
- The Next.js frontend is a client-side app — it does not need the API to start or serve pages
- The API is only used for client-side data requests after the page has loaded in the browser
- Adding this dependency has caused repeated 504 Gateway Timeout production outages
- If you are ever tempted to add `depends_on: api` to the web service, STOP — this is wrong

### Deployment
- Hosted on Coolify v4 (auto-deploys from `main` branch)
- Traefik handles reverse proxy and TLS automatically
- Changes to `docker-compose.yml` take effect on next Coolify deployment
