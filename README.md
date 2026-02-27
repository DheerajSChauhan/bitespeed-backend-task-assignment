# Bitespeed Identity Reconciliation

A web service that identifies and consolidates customer contact information across multiple purchases — built for the Bitespeed Backend Task.

## 🌐 Live Endpoint

```
https://bitespeed-backend-task-assignment.onrender.com/identify
```

---

## 📬 API Reference

### `POST /identify`

Identifies and reconciles a customer's contact information.

**URL:** `https://bitespeed-backend-task-assignment.onrender.com/identify`  
**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Body
At least one field is required.

```json
{
  "email": "user@example.com",
  "phoneNumber": "123456"
}
```

#### Response

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

## 🧪 Example Requests

### 1. New customer
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```
**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

### 2. Same phone, new email → creates secondary
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```
**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

### 3. Two primaries get merged
Send these in order:
```json
{ "email": "george@hillvalley.edu", "phoneNumber": "919191" }
{ "email": "biffsucks@hillvalley.edu", "phoneNumber": "717171" }
{ "email": "george@hillvalley.edu", "phoneNumber": "717171" }
```
The third request links the two separate contacts — older one stays primary, newer becomes secondary.

---

## ⚙️ How It Works

| Scenario | Behaviour |
|---|---|
| No match found | Creates a new `primary` contact |
| Match found, no new info | Returns the consolidated contact group |
| Match found, new email/phone | Creates a new `secondary` contact |
| Two separate primaries linked | Older stays primary, newer becomes secondary |

---

## 🗄️ Database Schema

```
Contact {
  id               Int
  phoneNumber      String?
  email            String?
  linkedId         Int?         // ID of the primary contact
  linkPrecedence   String       // "primary" or "secondary"
  createdAt        DateTime
  updatedAt        DateTime
  deletedAt        DateTime?
}
```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (via better-sqlite3)
- **Hosting:** Render.com

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/bitespeed.git
cd bitespeed

# Install dependencies
npm install

# Start the server
npm start
# → Server running on http://localhost:3000
```
