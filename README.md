# Birch (React front end)

React + Vite front end for a SACCO savings app: sign-in and registration with
roles, monthly and voluntary contributions, payments, loan applications with
guarantors, and loan approval by officers. Built to plug into a backend you write.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # static files in dist/

By default it runs on a mock backend (`src/api/mock.js`, saved in localStorage)
so you can try every role. Demo logins, password `password`:
- jane@birch.test (member), mary@birch.test (loans officer), admin@birch.test (admin), super@birch.test (super admin)

## Connect your backend
1. Copy `.env.example` to `.env.local`, set `VITE_USE_MOCK=false` and `VITE_API_URL`.
2. Implement the endpoints below. All calls are in `src/api/index.js`.
3. Send `Authorization: Bearer <token>` is attached automatically after login.
   A `401` signs the user out.

Errors: respond with a non-2xx status and `{ "message": "text shown to the user" }`.

## Roles
Everyone is a member. Staff roles add extra powers on top.

| Role | Can do |
|------|--------|
| member | contribute, apply for loans, guarantee others, see own data, see the finance dashboard |
| officer (loans officer) | everything a member can, plus see all loans and approve or reject loans in review |
| admin | everything a member can, plus approve new members and publish news, events and carousel images |
| super_admin | sees and does everything: loans, posts, members, change roles, suspend, see member finances |

Conflict rule: a loan approver (officer or super admin) cannot approve a loan they applied for or
guarantee. The UI disables the buttons, and your server must reject it too.

Visibility: the public page (news, events, image carousel) shows no finances and needs no sign-in.
The finance dashboard (`/stats`) needs a signed-in user. Change `GET /stats` on your server if you want
it limited to staff only.

Registration creates a `member` with status `pending`. Only `active` users can sign in.


## API contract
| Method and path | Who | Body | Returns |
|---|---|---|---|
| GET /public/posts | public, no token | | `[post]` newest first |
| GET /stats | signed in | | `{ members, totalContributions, monthlyContributions, voluntaryContributions, loansDisbursed: { count, amount }, applicationsInProgress, byMonth: [{ period, monthly, voluntary }] }` (last 6 months) |
| POST /posts | admin, super_admin | multipart: `title, body, category, eventDate?, featured, image?` | post |
| PATCH /posts/:id | admin, super_admin | `{ featured }` | post |
| DELETE /posts/:id | admin, super_admin | | 204 |
| POST /auth/register | public | `{ name, email, phone, salary, password }` | `{ message }` |
| POST /auth/login | public | `{ email, password }` | `{ token, user }` |
| GET /auth/me | any | | `user` |
| GET /members | signed in | | `[{ id, name, savings, guaranteed }]` all active users except the caller (guarantor list, officers and admins included) |
| GET /contributions | signed in | | caller's `[contribution]` |
| POST /payments | signed in | `{ type: "monthly"\|"voluntary", amount, method, phone }` | `{ id, status }` (start M-Pesa STK Push) |
| GET /payments/:id | signed in | | `{ status: "pending"\|"success"\|"failed", message? }` |
| GET /loans | any | | members: own loans and ones they guarantee. officer/admin: all loans |
| POST /loans | signed in | `{ amount, months, purpose, guarantorIds: [id, id] }` | loan |
| POST /loans/:id/guarantee | signed in | `{ accept: boolean }` | loan |
| POST /loans/:id/decision | officer, super_admin | `{ approve: boolean }` | loan |
| GET /admin/users | admin, super_admin | | `[user]` (+ `savings` for super_admin only) |
| PATCH /admin/users/:id | admin: approve pending only. super_admin: anything | `{ role?, status? }` | user |

Shapes:
- `user`: `{ id, name, email, phone, salary, role: "member"|"officer"|"admin"|"super_admin", status: "pending"|"active"|"suspended" }`
- `contribution`: `{ id, period: "2026-11", date: "2026-11-05", type: "monthly"|"voluntary", amount, method, ref }`
- `post`: `{ id, title, body, category: "News"|"Event"|"Notice", eventDate?, imageUrl?, featured, createdAt, author }`
- `loan`: `{ id, applicantId, applicantName, applicantSalary, applicantSavings, amount, months, purpose, createdAt, status: "pending"|"review"|"approved"|"rejected"|"declined", guarantors: [{ userId, name, status: "waiting"|"accepted"|"declined" }] }`

Loan status flow: `pending` (waiting for guarantors) -> `review` (both accepted) -> `approved` or `rejected`.
A guarantor declining sets `declined`. A contribution is created by your server when the payment succeeds (M-Pesa callback).

## Business rules (change to suit your SACCO)
Front-end constants are in `src/lib.js`; the mock in `src/api/mock.js` shows the checks to copy:
monthly contribution 10% of pay, loan limit 3x contributions, 1% a month flat interest,
each guarantor covers half the loan and must have that much free contribution.

## Before going live
- Hash passwords (argon2 or bcrypt), use short-lived tokens, and add rate limiting on login.
- Prefer an httpOnly cookie over localStorage for the token if your backend and site share a domain.
- Verify M-Pesa callbacks on the server; never trust the browser to say a payment succeeded.

## Docker
    docker build -t birch .
    docker run --rm -p 8080:8080 birch      # http://localhost:8080

Build-time options (public values only, baked into the site):
    docker build --build-arg VITE_USE_MOCK=false --build-arg VITE_API_URL=https://api.example.com/api -t birch .

The image is nginx (non-root) serving the built files, with single-page-app routing, caching and a `/healthz` check.
Edit `nginx.conf` to proxy `/api` to your backend if you want one origin.

## CI/CD (GitHub Actions)
- `ci.yml`: on pull requests and branches other than `main`, builds the site and checks the Docker image builds.
- `deploy.yml`: on every push to `main`, builds the image, pushes it to GitHub Container Registry (ghcr.io),
  then SSHes into your server, pulls it and restarts the container. If the new container is not healthy
  it rolls back to the previous image and fails the run.
- `dependabot.yml`: weekly update pull requests.

### One-time setup
**Server:** install Docker, create a user for deployments in the `docker` group, open the app port.
Put a reverse proxy with HTTPS (Caddy, nginx or Traefik) in front, pointing at `127.0.0.1:8080`.

**Deploy key:** on your computer run `ssh-keygen -t ed25519 -f deploy_key -N ""`, add `deploy_key.pub`
to `~/.ssh/authorized_keys` of the deploy user on the server.

**GitHub:** Settings > Environments > create `production` (you can require a reviewer there). Then add:
| Where | Name | Value |
|---|---|---|
| Secret | `SSH_HOST` | server IP or hostname |
| Secret | `SSH_USER` | the deploy user |
| Secret | `SSH_KEY` | contents of the private file `deploy_key` |
| Secret | `SSH_KNOWN_HOSTS` | output of `ssh-keyscan -p 22 your.server.ip` (checked from a network you trust) |
| Variable | `VITE_USE_MOCK` | `false` once your backend is live (default `true`, demo data) |
| Variable | `VITE_API_URL` | e.g. `https://api.example.com/api` (default `/api`) |
| Variable | `APP_PORT`, `SSH_PORT` | optional, default `8080` and `22` |

Notes:
- Run `npm install` once locally and commit `package-lock.json`; the Dockerfile then uses `npm ci` automatically.
- The demo mock has no real security. Do not put real member data or money behind `VITE_USE_MOCK=true`.
- Never put secrets in `VITE_*` variables: they are public in the built site. Secrets belong on your backend.
# birchfrontend
