# Project Rules

## Git Push Behavior (Dual Remotes)
This project uses two different Git remotes for its deployments:
1. `nexus` (`Deepakkumarrds/NEXUS.git`) is used for the **Backend** deployment on Render.
2. `origin` (`ktgowtham7/RDS-DB.git`) is used for the **Frontend** deployment on Vercel.

When committing and pushing code:
- If you are updating frontend code (inside the `frontend/` directory), you MUST explicitly push to `origin` (e.g., `git push origin main`) so Vercel picks up the changes.
- If you are updating backend code (inside the `backend/` directory), you MUST explicitly push to `nexus` (e.g., `git push nexus main`) so Render picks up the changes.
- If updating both, push to both remotes.
