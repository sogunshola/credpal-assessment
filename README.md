# Credpal Assessment (NestJS)

## Setup Instructions

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** (for primary data store)
- **Redis** (for FX rate caching and sessions)

### Environment

1. Copy the example env file and fill in required values:

   ```bash
   cp .env.example .env
   ```

2. Required / important values in `.env`:
   - `DB_URL` — PostgreSQL connection string (e.g. `postgres://postgres:password@localhost:5432/test`)
   - `REDIS_URL` — Redis connection (e.g. `redis://localhost:6379`)
   - `JWT_SECRET` — Secret for JWT signing
   - `FX_RATES_API_KEY` — API key from [exchangerate-api.com](https://www.exchangerate-api.com/) (for live FX rates)
   - `FX_RATES_BASE_URL` — e.g. `https://v6.exchangerate-api.com/v6`
   - `FX_RATES_CACHE_TTL_SECONDS` — Cache TTL in seconds (default: 300)
   - `ENCRYPTION_KEY` / `ENCRYPTION_IV` — For sensitive data encryption
   - Optional: `MAILGUN_*` for email (e.g. OTP), `DOCS_PASSWORD` for Swagger basic auth

### Install and run

```bash
yarn install
yarn start:dev
```

API runs by default at `http://localhost:3000`. **Swagger docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

---

## Key Assumptions

- **Wallet balances** are stored **per-currency per-user** (one row per user per currency), not a single multi-currency JSON field, for indexability and atomic row-level locking.
- **Funding wallet** is done by adding to the balance of the currency of the amount being funded after using revenue cat or other payment methods.
- **FX rates** are cached in Redis for `{FX_RATES_CACHE_TTL_SECONDS}` seconds (default 300). If the external API is down, **stale cache is served** to avoid failing conversions.
- **Monetary arithmetic** uses **Decimal.js** (18 decimal places in calculation, 8 stored) to avoid floating-point drift.
- **Trades and conversions** use **pessimistic row-level locking** so concurrent requests cannot double-spend.
- **OTP** expires in **10 minutes**; **unverified users cannot access trading routes** (enforced by `EmailVerifiedGuard`). for test purposes, the OTP is hardcoded to `123456` in the `AuthService` class.
- **Email verification** uses mailgun for sending emails, but for test purposes, the emails are not sent.
- The **`reference`** field on `Transaction` is a **UUID** used as an **idempotency key** for safe retries.

---

## Architecture Decisions

- **Module structure**: Each feature (wallet, fx-rates, transactions, auth) is an isolated NestJS module.
- **FxRatesService** is a shared service imported by `WalletModule` — single source of truth for rate fetching and caching.
- **TransactionType** distinguishes `FUNDING` vs `CONVERSION` vs `TRADE` for analytics and filtering.
- **QueryRunner** wraps all balance mutations in a DB transaction — no partial state on failure.
- **EmailVerifiedGuard** is separate from **AuthGuard** so it can be applied only to routes that require a verified user (e.g. convert/trade).

---

## API Documentation

- **Reference**: [Swagger UI](http://localhost:3000/swagger)

---

## Architectural Flow Diagram

### Flow for `POST /wallet/convert`

```
User
  → AuthGuard
  → EmailVerifiedGuard
  → WalletController
  → WalletService.convertCurrency()
    → FxRatesService.getRate()   (Redis cache → external API if miss)
    → QueryRunner.startTransaction()
      → Lock fromCurrency WalletBalance (pessimistic_write)
      → Deduct balance (Decimal.js)
      → Credit toCurrency balance
      → Insert Transaction record
    → QueryRunner.commit()
  ← Return Transaction
```

Mermaid sequence diagram:

```mermaid
sequenceDiagram
  participant User
  participant AuthGuard
  participant EmailVerifiedGuard
  participant WalletController
  participant WalletService
  participant FxRatesService
  participant Redis
  participant DB

  User->>AuthGuard: POST /wallet/convert
  AuthGuard->>EmailVerifiedGuard: JWT valid
  EmailVerifiedGuard->>WalletController: Verified
  WalletController->>WalletService: convertCurrency()
  WalletService->>FxRatesService: getRate(from, to)
  FxRatesService->>Redis: get cached rate
  alt cache hit
    Redis-->>FxRatesService: rate
  else cache miss
    FxRatesService->>FxRatesService: fetch external API
    FxRatesService->>Redis: set rate (TTL)
  end
  FxRatesService-->>WalletService: rate
  WalletService->>DB: startTransaction()
  WalletService->>DB: lock fromCurrency WalletBalance
  WalletService->>DB: deduct balance (Decimal)
  WalletService->>DB: credit toCurrency balance
  WalletService->>DB: insert Transaction
  WalletService->>DB: commit()
  DB-->>WalletService: ok
  WalletService-->>User: Transaction
```

### Entity-relationship diagram

```mermaid
erDiagram
  User ||--o{ WalletBalance : has
  User ||--o{ Transaction : has

  User {
    uuid id PK
    string email
    string passwordHash
    boolean emailVerified
    timestamp createdAt
    timestamp updatedAt
  }

  WalletBalance {
    uuid id PK
    uuid userId FK
    string currency
    decimal balance
    timestamp createdAt
    timestamp updatedAt
  }

  Transaction {
    uuid id PK
    uuid userId FK
    string reference
    string type
    string fromCurrency
    string toCurrency
    decimal amount
    decimal rate
    timestamp createdAt
  }
```

---

## License

MIT (or as specified in the project).
