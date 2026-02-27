const express = require("express");
const db = require("./db");
const { identify } = require("./identify");

const app = express();
app.use(express.json());

app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // At least one must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "email or phoneNumber is required" });
    }

    const result = identify(db, email || null, phoneNumber ? String(phoneNumber) : null);
    return res.status(200).json({ contact: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
