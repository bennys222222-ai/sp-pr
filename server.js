import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.SPORTS_API_KEY;

// 🗓 Upcoming Events (Scores API)
app.get("/api/ufc/schedule", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearsToQuery = [currentYear, currentYear + 1];
    const payloads = await Promise.all(
      yearsToQuery.map(async (year) => {
        const response = await fetch(
          `https://api.sportsdata.io/v3/mma/scores/json/Schedule/UFC/${year}?key=${API_KEY}`
        );
        if (!response.ok) {
          console.warn(`Schedule request for ${year} responded with ${response.status}`);
          return [];
        }
        return response.json();
      })
    );

    const combined = payloads.flat().filter(Boolean);

    // Nur kommende Events (Status = Scheduled)
    const upcoming = combined
      .filter((event) => event?.Status === "Scheduled")
      .map((event) => ({
        EventId: event.EventId,
        Name: event.Name,
        Date: event.Day || event.DateTime || event.Updated,
      }));

    res.json(upcoming);
  } catch (err) {
    console.error("Error fetching schedule:", err);
    res.status(500).json({ error: "Failed to load schedule" });
  }
});

// 🥊 Event Details
app.get("/api/ufc/event/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://api.sportsdata.io/v3/mma/scores/json/Event/${id}?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "Failed to load event details" });
  }
});

// 🧍‍♂️ Fighter-Daten inkl. Medien & Stats
app.get("/api/ufc/fighters", async (req, res) => {
  try {
    const url = `https://api.sportsdata.io/v3/mma/scores/json/Fighters?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();

    const ufcOnly = (Array.isArray(data) ? data : []).filter((fighter) =>
      fighter?.Organization?.includes("UFC")
    );

    res.json(ufcOnly);
  } catch (err) {
    console.error("Error fetching fighters:", err);
    res.status(500).json({ error: "Failed to load fighter data" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ UFC Proxy running on port ${PORT}`)
);