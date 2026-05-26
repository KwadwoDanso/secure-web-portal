# Innovate Inc. Secure Web Portal

 Secure Web Portal with local auth, GitHub OAuth, and private bookmarks.

## Description
A secure Express API for Innovate Inc. that supports user registration, local login with hashed passwords, GitHub OAuth login via Passport.js, and a private bookmarks collection. Each user can only access their own bookmarks through ownership-based authorization.

This project is the culmination of the Authentication and Authorization module — combining Lab 1 (local auth), Lab 2 (ownership authorization), and Lesson 4 (OAuth) into a single production-style application.

## Technologies
- Node.js
- Express
- MongoDB Atlas / Mongoose
- bcrypt
- jsonwebtoken (JWT)
- Passport.js
- passport-github2
- dotenv


## Setup
1. Clone the repo
2. `npm install`
3. Create `.env` at project root (see `.env.example`)
4. Register a GitHub OAuth App:
   - Go to `github.com` → Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: `Innovate Portal`
   - Homepage URL: `http://localhost:3001`
   - Callback URL: `http://localhost:3001/api/users/auth/github/callback`
5. Add GitHub Client ID and Secret to `.env`
6. `node server.js`

## Environment Variables
See `.env.example`:
- `MONGO_URI` — MongoDB connection string
- `PORT` — server port (default 3001)
- `JWT_SECRET` — random string for signing tokens
- `GITHUB_CLIENT_ID` — from GitHub OAuth App
- `GITHUB_CLIENT_SECRET` — from GitHub OAuth App
- `GITHUB_CALLBACK_URL` — `http://localhost:3001/api/users/auth/github/callback`

## API Endpoints

### Local Authentication
| Method | Route | Description |
|---|---|---|
| POST | `/api/users/register` | Register with username, email, password |
| POST | `/api/users/login` | Login with email + password, returns JWT |

### GitHub OAuth
| Method | Route | Description |
|---|---|---|
| GET | `/api/users/auth/github` | Start GitHub OAuth flow (browser only) |
| GET | `/api/users/auth/github/callback` | GitHub redirects here, returns JWT in URL |

### Bookmarks (JWT required in `Authorization: Bearer <token>`)
| Method | Route | Description |
|---|---|---|
| POST | `/api/bookmarks` | Create bookmark (auto-assigned to user) |
| GET | `/api/bookmarks` | Get all bookmarks (own only) |
| GET | `/api/bookmarks/:id` | Get one bookmark (owner only, else 403) |
| PUT | `/api/bookmarks/:id` | Update bookmark (owner only, else 403) |
| DELETE | `/api/bookmarks/:id` | Delete bookmark (owner only, else 403) |

## Security Features
- Passwords hashed with bcrypt (10 salt rounds) via Mongoose pre-save hook
- Passwords never returned in API responses
- Generic login error messages prevent user enumeration
- JWTs signed with secret from `.env`, expire after 2 hours
- All bookmark routes require valid JWT (authentication)
- Ownership checked before every read/update/delete (authorization)
- `.env` is git-ignored — secrets never committed
- User model supports both local and GitHub auth without requiring both

## How Authentication Works

### Local Flow
1. User sends `POST /api/users/register` with username, email, password
2. Password is hashed by bcrypt pre-save hook before storing
3. User sends `POST /api/users/login` with email, password
4. Server uses `bcrypt.compare()` to check password against stored hash
5. On success, server signs a JWT with `jsonwebtoken` and returns it
6. Client includes `Authorization: Bearer <token>` on all future requests

### GitHub OAuth Flow
1. User visits `GET /api/users/auth/github` in their browser
2. Passport redirects user to GitHub's authorization page
3. User clicks "Authorize" on GitHub
4. GitHub redirects back to `/api/users/auth/github/callback` with an authorization code
5. Passport exchanges the code for an access token (server-to-server, hidden from browser)
6. Passport's verify callback receives the user's GitHub profile
7. The callback checks: existing user by githubId? existing user by email? or create new?
8. Server signs a JWT for the authenticated user and redirects with it in the URL

### Authorization (Ownership)
- Every bookmark has a `user` field storing the creator's ObjectId
- `POST` stamps `req.user._id` onto new bookmarks
- `GET /api/bookmarks` filters with `Bookmark.find({ user: req.user._id })`
- `GET/:id`, `PUT/:id`, `DELETE/:id` first find the bookmark, then compare `bookmark.user.toString()` to `req.user._id.toString()` — returns 403 Forbidden if they don't match

## User Model Design
The User model accommodates both authentication methods:
- Local users have `username`, `email`, `password` (no `githubId`)
- GitHub users have `username`, `email`, `githubId` (no `password`)
- If a GitHub user's email matches an existing local account, the accounts are linked automatically
- The `password` field is NOT required — GitHub-only users don't have one
- The pre-save hook checks `if (this.password)` before hashing to avoid errors on GitHub users

## Reflections

### 1. Authentication vs. Authorization — what's the difference?
Authentication verifies WHO you are (login with credentials or GitHub). Authorization determines WHAT you can do once identified (can you access this specific bookmark?). This project implements both: JWT auth middleware handles authentication, ownership checks in the bookmark routes handle authorization. They are separate concerns applied as separate middleware/logic layers.

### 2. Why use bcrypt instead of just hashing with SHA-256?
bcrypt is intentionally slow. The salt rounds parameter (10) makes each hash take ~100ms of CPU time. SHA-256 is fast — millions of hashes per second — which makes it vulnerable to brute-force attacks. bcrypt's slowness is a feature, not a bug. It also automatically generates a unique salt per password, so two users with the same password get different hashes.

### 3. Why is the JWT payload not encrypted?
The JWT payload is Base64-encoded, not encrypted. Anyone with the token can read the payload. That's why we never put passwords, credit cards, or other sensitive data in it — only `_id`, `username`, and `email`. The signature (third part of the JWT) ensures the payload hasn't been tampered with, but it doesn't hide it. The secret key signs the token, it doesn't encrypt it.

### 4. Why does the GitHub OAuth callback redirect with a token in the URL?
Because OAuth is a browser-based flow. The user leaves our server, authenticates on GitHub's website, and comes back. We can't send a JSON response to a redirect — the browser expects a URL. So we append the JWT as a query parameter (`?token=...`). In a production app with a frontend, the frontend would extract this token from the URL and store it in localStorage.

### 5. Why use `.toString()` for ObjectId comparison?
Mongoose ObjectIds are objects, not strings. `bookmark.user` is an ObjectId object. `req.user._id` is a string (decoded from the JWT). Comparing them with `===` always returns `false` even when they represent the same ID. `.toString()` converts both to strings so the comparison works correctly.

### 6. What is the DRY principle and how was it applied?
DRY = Don't Repeat Yourself. This project reuses patterns from Lab 1 (register/login routes, bcrypt pre-save hook, signToken utility), Lab 2 (ownership checks with findById + toString comparison), and Lesson 4 (Passport GitHub strategy). The `utils/auth.js` file is used by both the bookmark routes and the user routes — one middleware, many routes.

## Additional Resources

### Authentication & Password Security
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt on npm](https://www.npmjs.com/package/bcrypt)
- [How To Safely Store A Password](https://codahale.com/how-to-safely-store-a-password/)

### JSON Web Tokens
- [jwt.io](https://jwt.io/) — decode and inspect JWTs
- [jsonwebtoken on npm](https://www.npmjs.com/package/jsonwebtoken)
- [RFC 7519: JSON Web Token](https://tools.ietf.org/html/rfc7519)

### OAuth & Passport.js
- [OAuth 2.0 Official Spec](https://oauth.net/2/)
- [Passport.js Official Website](http://www.passportjs.org/)
- [passport-github2 on npm](https://www.npmjs.com/package/passport-github2)
- [GitHub Docs: Authorizing OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

### Express & Mongoose
- [Express.js Middleware Documentation](https://expressjs.com/en/guide/using-middleware.html)
- [Mongoose Middleware (pre/post hooks)](https://mongoosejs.com/docs/middleware.html)
- [Express.js Routing Guide](https://expressjs.com/en/guide/routing.html)


## Author
- Kwadwo

## Acknowledgement
- Per Scholas learning modules
- AI