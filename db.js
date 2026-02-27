const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "contacts.db"));

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS Contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence TEXT NOT NULL CHECK(linkPrecedence IN ('primary', 'secondary')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME,
    FOREIGN KEY (linkedId) REFERENCES Contact(id)
  )
`);

module.exports = db;
