# Repository Guide

## Structure

- `client/` is the React 19 and Vite frontend. Pages and reusable UI are in `client/src/pages/` and `client/src/components/`; API access is centralized in `client/src/services/api.js`.
- `server/` is the CommonJS Express API. Route handlers live in `server/routes/`, and Mongoose schemas live in `server/models/`. The server also uses Socket.IO for live seat updates.
- Keep frontend changes in the client package and backend changes in the server package. There is no root package manifest.

## Commands

Run commands from the repository root:

- `npm --prefix client run dev` starts the Vite development server (default `http://localhost:5173`).
- `npm --prefix client run build` builds the frontend.
- `npm --prefix client run lint` runs Oxlint.
- `npm --prefix server run dev` starts the backend with nodemon.
- `npm --prefix server start` starts the backend with Node.js.

There are currently no test scripts. Run the client lint and build after frontend changes. For backend changes, start the server against a configured MongoDB instance and exercise the affected route or socket behavior.

## Configuration

- The backend loads `server/.env` with dotenv and requires a valid `MONGO_URI` beginning with `mongodb://` or `mongodb+srv://`; `PORT` is optional and defaults to `5000`.
- Stripe checkout requires `STRIPE_SECRET_KEY` in `server/.env`; without it, the API can start but checkout endpoints return a configuration error.
- Ticket confirmation emails use Nodemailer and require `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` in `server/.env`. `SMTP_SECURE` is optional and defaults to true for port 465.
- The frontend API client uses `http://localhost:5000/api`, and the Socket.IO server allows the Vite origin `http://localhost:5173`. Keep local development ports aligned when changing either side.

## Conventions

- Preserve the existing JavaScript module styles: ES modules in the client and CommonJS in the server.
- Reuse the existing Axios instance for frontend API calls so its bearer-token interceptor remains active.
- Keep changes focused on the owning page, route, model, or component. Avoid adding dependencies or test infrastructure without a clear need.