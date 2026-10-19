# ShowTime 🎬

A movie ticket booking web application that allows users to browse shows, select seats, book tickets, and complete payments online.

## 📌 Project Overview

ShowTime is a full-stack movie ticket booking platform built with React, Node.js, Express, MySQL, Redis, and Razorpay.

### Key Features

- User registration and authentication using JWT.
- Movie show and seat selection.
- Temporary seat locking to reduce booking conflicts.
- Booking management and booking status tracking.
- Razorpay payment integration.
- MySQL database for persistent application data.
- Redis for temporary seat locks.
- QR-based digital tickets and email delivery — under development.
- Booking check-in and ticket validation — planned.

## 🛠️ Technology Stack

| Component            | Technology                 |
| -------------------- | -------------------------- |
| Frontend             | React, Vite, JavaScript    |
| Backend              | Node.js, Express.js        |
| Database             | MySQL                      |
| Temporary seat locks | Redis                      |
| Authentication       | JWT, bcrypt                |
| Payment gateway      | Razorpay                   |
| Email                | Nodemailer with Gmail SMTP |
| QR code generation   | qrcode                     |
| API communication    | HTTP/REST                  |

## 📁 Project Structure

```text
ShowTime/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── test/
│   │   └── server.js
│   ├── package.json
│   └── .env
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

The exact folders and files may evolve as development continues.

## ⚙️ Prerequisites

Install the following before running the project:

- **Git** — to clone the repository.
- **Node.js and npm** — Node.js 24 LTS-compatible environment recommended for this project.
- **MySQL 8.0 or compatible version** — for persistent application data.
- **Redis** — for temporary seat locks.
- **Docker Desktop** — optional, useful for running Redis.
- **Razorpay account** — use test credentials for local development.

A Gmail account with 2-Step Verification and an App Password is needed when testing the email feature.

## 🚀 Getting Started

### 1. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/yashvid876/ShowTime.git
cd ShowTime
```

If the latest development work is on a different branch, switch to that branch:

```bash
git branch -a
git switch <branch-name>
```

Replace `<branch-name>` with the appropriate branch name.

### 2. Install backend dependencies

From the project root:

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

Open another terminal at the project root:

```bash
cd frontend
npm install
```

Dependencies are installed separately because the frontend and backend have their own `package.json` files.

## 🗄️ Database Setup

### 1. Create the database

Open MySQL Workbench or a MySQL terminal and create the database:

```sql
CREATE DATABASE showtime;
```

If your local database uses a different name, configure the same name in your backend environment variables.

### 2. Import the schema

The repository should contain the exported database schema at:

```text
database/schema.sql
```

You can import it through MySQL Workbench:

1. Select **Server → Data Import**.
2. Choose **Import from Self-Contained File**.
3. Select `database/schema.sql`.
4. Choose the `showtime` target schema, or create it if necessary.
5. Start the import.

Alternatively, from a terminal:

```bash
mysql -u your_mysql_user -p showtime < database/schema.sql
```

Replace `your_mysql_user` with your local MySQL username.

**Important:** Import the schema into a new or empty development database. Do not import it over an existing database containing data you need to preserve.

### 3. Verify the database

After importing, confirm that the required tables exist:

```sql
USE showtime;
SHOW TABLES;
```

The database should include the tables required by the current application, such as users, movies, theatres, screens, shows, seats, show seats, bookings, and booking seats.

The latest schema should also contain the booking seat reuse and ticket-email tables if they were included in the exported schema.

### 4. Seed data

The schema defines the database structure, but it does not necessarily populate movies, theatres, shows, seats, or demo accounts.

If a seed SQL file is added to the repository, import it after the schema. Otherwise, create the required records through your existing application or database tools before testing the booking flow.

## 🔴 Redis Setup

ShowTime uses Redis for temporary seat locks.

### Option A: Run Redis with Docker

Install and start Docker Desktop, then run:

```bash
docker run -d --name showtime-redis -p 6379:6379 redis
```

Verify that the container is running:

```bash
docker ps
```

If the container already exists but is stopped, start it:

```bash
docker start showtime-redis
```

### Option B: Use an existing Redis instance

If Redis is already running, configure the backend to connect to that instance using the environment variables expected by `backend/src/config/redis.js`.

For a local Redis instance, the connection URL is commonly:

```text
redis://localhost:6379
```

Use the configuration variable actually referenced by your Redis configuration file.

## 🔐 Environment Configuration

Environment variables are not included in Git. Every developer must create their own local `.env` files.

### Backend configuration

Create:

```text
backend/.env
```

Use the following as a template. Check the existing configuration files to ensure the names match the variables the backend actually reads.

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=showtime

JWT_SECRET_KEY=replace_with_your_own_secret
JWT_EXPIRES_IN=1d

REDIS_URL=redis://localhost:6379

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Additional variables may be needed as more features are integrated.

#### JWT secret

Generate a strong, unique secret for your local development environment. Do not reuse production credentials or commit the secret to Git.

#### Razorpay configuration

Obtain test API credentials from your Razorpay account. Keep the key secret private and use test mode while developing locally.

If webhook testing is required, configure the webhook secret separately. A webhook secret is not necessarily the same as the Razorpay API key secret.

### Frontend configuration

Check the frontend source for the API base URL and any `import.meta.env` variables it uses.

If the frontend expects a Vite environment variable, create the appropriate file, commonly:

```text
frontend/.env
```

For example, if the code uses `VITE_API_BASE_URL`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The variable name must match the frontend implementation. Vite exposes variables prefixed with `VITE_` to browser code, so **never put passwords, API secrets, JWT signing keys, or other private credentials in frontend environment variables**.

### Gmail configuration

For the ticket-email feature, create a Gmail App Password after enabling 2-Step Verification on your Google account.

Add these variables to `backend/.env`:

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

TICKET_ENCRYPTION_KEY=your_generated_64_character_hex_key
```

Generate a ticket encryption key locally using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the generated value as `TICKET_ENCRYPTION_KEY`. Do not share or commit the value.

These settings should be configured when the email and ticket functionality is enabled in the backend.

## ▶️ Running the Application

Start the backend and frontend in separate terminals.

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

The backend development script uses Node.js watch mode and starts the server from `src/server.js`.

The backend normally listens on port `5000`, unless overridden by the environment configuration.

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Vite will print the local frontend URL in the terminal, commonly:

```text
http://localhost:5173
```

Open that URL in your browser.

If Vite selects a different port because the default is occupied, use the URL printed in the terminal.

## 💳 Payment Testing

ShowTime integrates Razorpay for payment processing.

For local testing:

1. Configure Razorpay test credentials in `backend/.env`.
2. Ensure the backend is running and can reach the Razorpay API.
3. Create a booking and initiate checkout.
4. Complete a test payment using Razorpay's current test-mode instructions.
5. Confirm that the backend verifies the payment and updates the booking status.
6. If webhook-based confirmation is being tested, configure the webhook endpoint and secret using Razorpay's supported development workflow.

Never use real customer payments or expose live credentials during local development.

## 🧪 Testing and Troubleshooting

### Backend fails to start

- Check that dependencies were installed inside `backend/`.
- Verify the `.env` file exists and has the required variables.
- Confirm that port `5000` is not already occupied.
- Inspect the terminal error for missing modules or invalid configuration.

### Frontend cannot reach the backend

- Ensure both servers are running.
- Check the configured API base URL.
- Confirm that the frontend is calling the correct backend port.
- Check the browser console and network requests for CORS or API errors.

### MySQL connection fails

- Ensure the MySQL server is running.
- Verify the database exists.
- Check the database username, password, port, and database name.
- Confirm that the schema import completed successfully.

### Redis connection fails

- Run `docker ps` to verify the Redis container is active.
- Check the Redis URL or connection settings.
- Confirm that port `6379` is available and mapped correctly.

### Razorpay verification fails

- Confirm that the order ID matches the booking.
- Ensure test credentials are configured consistently.
- Check payment status, amount, currency, and signature verification.
- Verify that the server is using the correct API secret.

### Gmail email delivery fails

- Confirm that Gmail 2-Step Verification is enabled.
- Use a Gmail App Password rather than the regular account password.
- Verify that the email environment variables are present.
- Check backend logs for SMTP authentication or connection errors.

## 🔒 Security Guidelines

- Never commit `.env` files.
- Never share JWT secrets, Razorpay secrets, Gmail App Passwords, or ticket encryption keys.
- Use test credentials during development.
- Do not commit `node_modules`.
- Do not store real customer data or payment credentials in seed files.
- Keep all payment verification and ticket validation on the backend.
- Use parameterized SQL queries for database operations.

## 👥 Team Development Workflow

Before starting work:

```bash
git pull
```

After making changes:

```bash
git add .
git commit -m "Describe your changes"
git push
```

Coordinate branch names and pull requests with the team. Before committing, inspect staged files and confirm that no `.env` files or secrets are included.

## 📌 Current Development Status

The project includes the core full-stack booking architecture, MySQL persistence, Redis seat locking, authentication, and Razorpay payment integration.

QR ticket generation, encrypted ticket-token storage, Gmail email delivery, and reliable email retries are being developed incrementally. Do not assume every ticketing or check-in workflow is fully integrated until it has been implemented and tested.

## 📄 License

Add the project's chosen license here if and when one is selected.
