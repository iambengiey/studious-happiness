# CampusConnect Africa (Internal Notes)

This repository hosts the CampusConnect Africa admin console backend and static admin entry pages.

## Database configuration
Set these environment variables in your deployment platform (GitHub Actions secrets, Render/Fly/Heroku env vars, Docker/Kubernetes secrets, etc.):

- `DATABASE_URL` (required)
- `DATABASE_SSL=true` (optional)
- `PORT` (optional, default `3000`)
- `APP_NAME` (optional, default `CampusConnect Africa`)

Example local run:

```bash
DATABASE_URL=postgres://user:pass@host:5432/campusconnect DATABASE_SSL=true npm start
```
