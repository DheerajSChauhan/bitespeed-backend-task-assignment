/**
 * Core identity reconciliation logic.
 *
 * Rules:
 * 1. No match found → create new primary contact
 * 2. Match found, no new info → return consolidated contact
 * 3. Match found, new info → create secondary contact
 * 4. Two separate primaries linked by request → older becomes primary, newer becomes secondary
 */

function identify(db, email, phoneNumber) {
  // Step 1: Find all contacts matching this email OR phoneNumber
  const matchingContacts = findMatchingContacts(db, email, phoneNumber);

  // Case: No existing contacts → create new primary
  if (matchingContacts.length === 0) {
    const newId = createContact(db, email, phoneNumber, null, "primary");
    return buildResponse(db, newId);
  }

  // Step 2: Collect all primaries involved
  const primaryIds = new Set();
  for (const contact of matchingContacts) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else {
      primaryIds.add(contact.linkedId);
    }
  }

  // Step 3: If two separate primaries found, merge them — older wins
  if (primaryIds.size > 1) {
    const primaries = [...primaryIds].map((id) =>
      db.prepare("SELECT * FROM Contact WHERE id = ?").get(id)
    );
    primaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const oldestPrimary = primaries[0];
    const otherPrimaries = primaries.slice(1);

    // Turn all newer primaries (and their secondaries) into secondaries of the oldest
    for (const p of otherPrimaries) {
      // Update the primary itself to become secondary
      db.prepare(`
        UPDATE Contact
        SET linkPrecedence = 'secondary', linkedId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(oldestPrimary.id, p.id);

      // Update all existing secondaries that point to this demoted primary
      db.prepare(`
        UPDATE Contact
        SET linkedId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE linkedId = ?
      `).run(oldestPrimary.id, p.id);
    }

    return buildResponse(db, oldestPrimary.id);
  }

  // Step 4: Only one primary — check if the incoming request has new info
  const primaryId = [...primaryIds][0];
  const allRelated = getAllContacts(db, primaryId);

  const existingEmails = new Set(allRelated.map((c) => c.email).filter(Boolean));
  const existingPhones = new Set(allRelated.map((c) => c.phoneNumber).filter(Boolean));

  const hasNewEmail = email && !existingEmails.has(email);
  const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  if (hasNewEmail || hasNewPhone) {
    // Create a new secondary contact with the new info
    createContact(db, email, phoneNumber, primaryId, "secondary");
  }

  return buildResponse(db, primaryId);
}

// Find contacts matching email or phoneNumber (ignoring deleted)
function findMatchingContacts(db, email, phoneNumber) {
  if (email && phoneNumber) {
    return db
      .prepare(
        `SELECT * FROM Contact WHERE deletedAt IS NULL AND (email = ? OR phoneNumber = ?)`
      )
      .all(email, phoneNumber);
  } else if (email) {
    return db
      .prepare(`SELECT * FROM Contact WHERE deletedAt IS NULL AND email = ?`)
      .all(email);
  } else {
    return db
      .prepare(`SELECT * FROM Contact WHERE deletedAt IS NULL AND phoneNumber = ?`)
      .all(phoneNumber);
  }
}

// Get all contacts under a primary (the primary + all its secondaries)
function getAllContacts(db, primaryId) {
  return db
    .prepare(
      `SELECT * FROM Contact WHERE deletedAt IS NULL AND (id = ? OR linkedId = ?)`
    )
    .all(primaryId, primaryId);
}

// Insert a new contact row and return its id
function createContact(db, email, phoneNumber, linkedId, linkPrecedence) {
  const result = db
    .prepare(
      `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .run(email, phoneNumber, linkedId, linkPrecedence);
  return result.lastInsertRowid;
}

// Build the final response object from a primary contact id
function buildResponse(db, primaryId) {
  const allContacts = getAllContacts(db, primaryId);
  const primary = allContacts.find((c) => c.id === primaryId);
  const secondaries = allContacts.filter((c) => c.id !== primaryId);

  // Emails: primary first, then secondaries (no duplicates)
  const emails = [];
  if (primary.email) emails.push(primary.email);
  for (const s of secondaries) {
    if (s.email && !emails.includes(s.email)) emails.push(s.email);
  }

  // Phone numbers: primary first, then secondaries (no duplicates)
  const phoneNumbers = [];
  if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);
  for (const s of secondaries) {
    if (s.phoneNumber && !phoneNumbers.includes(s.phoneNumber))
      phoneNumbers.push(s.phoneNumber);
  }

  return {
    primaryContatctId: primaryId, // keeping the typo from the spec!
    emails,
    phoneNumbers,
    secondaryContactIds: secondaries.map((s) => s.id),
  };
}

module.exports = { identify };
