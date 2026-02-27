# Bitespeed Identity Reconciliation

A web service that identifies and consolidates customer contact information across multiple purchases.

## Live Endpoint
> Update this after deploying: `https://your-app.onrender.com/identify`

---

## Setup & Run Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

The server runs on **http://localhost:3000**

---

## API

### `POST /identify`

**Request body** (at least one field required):
```json
{
  "email": "user@example.com",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## How It Works

1. **No match** → Creates a new `primary` contact
2. **Match with no new info** → Returns the consolidated contact group
3. **Match with new email/phone** → Creates a new `secondary` contact linked to the primary
4. **Two separate primaries linked** → Older one stays primary, newer one becomes secondary

---

## Deploy to Render (Free)

1. Push this project to a GitHub repository
2. Go to [render.com](https://render.com) and create a free account
3. Click **New → Web Service** and connect your GitHub repo
4. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment:** Node
5. Click **Deploy**
6. Copy the live URL and update the README above

---

## Project Structure

```
├── index.js      # Express server & route
├── db.js         # SQLite setup & schema
├── identify.js   # Core reconciliation logic
├── package.json
└── README.md
```
# bitespeed-backend-task-assignment
