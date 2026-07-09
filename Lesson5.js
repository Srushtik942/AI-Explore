import 'dotenv/config';
import axios from 'axios';
import express from "express";
import cors from "cors";
import { parse } from 'dotenv';
import crypto from 'crypto';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const API_KEY = process.env.NANO_API_KEY;
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev_auth_secret';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------- SYSTEM PROMPT ----------------------

const SYSTEM_PROMPT = `
You are an AI assistant acting as a helpful travel agent.
Respond with JSON only. No prose, markdown or backticks.

Follow this exact schema:

{
  "destination": "string - city, country",
  "best_time": "string - month(s)/season with one sentence why",
  "duration_days": number,
  "top_attractions": ["string", "string", "string"],
  "sample_itinerary": [
    { "day": 1, "plan": "string" },
    { "day": 2, "plan": "string" },
    { "day": 3, "plan": "string" }
  ],
  "estimated_budget": { "low": number, "mid": number, "high": number },
  "local_tips": ["string", "string"]
}

Rules:
- Output valid JSON only with the same fields.
- Numbers must not be quoted.
- If unsure, use null or empty arrays.
`;

// ---------------------- Itinerary Sstem PROMPT ----------------------

const ITINERARY_SYSTEM_PROMPT = `
You are an AI assistant acting as a helpful travel agent.
Respond with JSON only. No prose, markdown or backticks.

Follow this exact schema:

{
  "origin": "string - city, country",
  "destination": "string - city, country",
  "duration_days": number,
  "summary": "string - 2-3 sentence trip overview",
  "days": [
    {
      "day": number,
      "title": "string",
      "activities": [
        { "time": "string", "activity": "string", "location": "string", "estimated_cost": number }
      ]
    }
  ],
  "estimated_total_cost": number,
  "currency": "string",
  "local_tips": ["string", "string"]
}

Rules:
- Output valid JSON only with the same fields.
- Numbers must not be quoted.
- The itinerary must fit within the given budget range.
- The number of "days" entries must equal duration_days.
- If unsure about a detail, use null or an empty array.
`;


// ---------------------- JSON PARSER ----------------------

function tryParseModelJSON(content) {
  try {
    return { ok: true, value: JSON.parse(content) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ---------------------- HEALTH ROUTE ----------------------

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ---------------------- SIMPLE AUTH HELPERS ----------------------

const USERS = new Map(); // in-memory user store: username -> { passwordHash }
const TOKENS = new Map(); // token -> { username, expires }

function hashPassword(password) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(password).digest('hex');
}

function generateToken(username) {
  const token = crypto.randomBytes(24).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  TOKENS.set(token, { username, expires });
  return token;
}

function authenticateToken(token) {
  if (!token) return null;
  const data = TOKENS.get(token);
  if (!data) return null;
  if (data.expires < Date.now()) {
    TOKENS.delete(token);
    return null;
  }
  return data.username;
}

// ---------------------- AUTH ROUTES ----------------------

app.post('/api/signup', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (USERS.has(username)) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = hashPassword(password);
    USERS.set(username, { passwordHash });

    return res.json({ ok: true, message: 'User created' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = USERS.get(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordHash = hashPassword(password);
    if (passwordHash !== user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(username);
    return res.json({ ok: true, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Example protected route
app.get('/api/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || req.query.token;
    const username = authenticateToken(token);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    return res.json({ ok: true, user: { username } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// creating tag line


app.get("/api/taglines",async(req,res)=>{
  try{

      const country = req.query.country;

      if (!country) {
      return res.status(400).json({ error: "Country required" });
    }

        const creativePrompt = `
Create 3 catchy tourism taglines for ${country}.
Respond ONLY in JSON format:

{
  "taglines": ["string", "string", "string"]
}
`;

    const response = await axios.post(
      API_URL,
      {
       model: MODEL,
      messages:[
        {
          role: "system",
          content: "You are a creative tourism copywriter. Respond with JSON only: { \"taglines\": [\"string\",\"string\",\"string\"] }"
        },
        {
          role:"user",
          content: creativePrompt
        }
      ]
      },
        {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )

    const content = response.data?.choices?.[0]?.message?.content || "";
     const parsed = tryParseModelJSON(content);

     if(parsed.ok){
      res.json(parsed.value);
     }else{
      res.json({
        error: "Invalid JSON format",
        raw: content
      })
     }

  }catch(error){
    res.status(500).json({message:"Internal Server error",error: error.message})
  }
})


// TRAVEL PLAN ROUTE

app.get("/api/travel-plan", async (req, res) => {
  try {
     const country = req.query.country ;

         if (!country) {
      return res.status(400).json({ error: "Country required" });
    }

const userPrompt = `
Country: ${country}

Generate a travel itinerary ONLY for this country.
Do NOT choose another country.
Follow the required JSON schema exactly.
`;

    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || "";
    console.log("Raw model response:", content);

    const parsed = tryParseModelJSON(content);

    if (parsed.ok) {
      return res.json(parsed.value);
    } else {
      return res.json({
        error: "Model did not return valid JSON",
        raw: content,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// API for generating detailed itinerary



app.post("/api/trips/search",async(req,res)=>{
  try{
    const { origin, destination,dates, travellers, budget, preference, contact } = req.body;

    if(!destination || !dates || !travellers || !budget){
      return res.status(400).json({error:"Destination, dates and travelers not selected"});
    }

    if (new Date(dates.endDate) <= new Date(dates.startDate)) {
      return res.status(400).json({ error: "endDate must be after startDate" });
    }

     const userPrompt = `
Destination: ${destination.city}, ${destination.country}
Duration: ${dates.durationDays} days (${dates.startDate} to ${dates.endDate})
Travelers: ${travellers.adults} adults, ${travellers.children || 0} children
Budget: ${budget.min}-${budget.max} ${budget.currency}
Accommodation preference: ${preference.accommodation}
Generate a day-by-day itinerary ONLY for this destination.
Follow the required JSON schema exactly.
`;

const response = await axios.post(
  API_URL,
  {
    model:MODEL,
    messages:[
      {role:"system", content: ITINERARY_SYSTEM_PROMPT},
      {role:"user", content: userPrompt},
    ],
  },
  {
    headers:{
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    }
  }
)

const content = response.data?.choices?.[0]?.message?.content || "";
const parsed = tryParseModelJSON(content);


console.log("Raw model response",content);

 if (parsed.ok) {
      return res.json(parsed.value);
    } else {
      return res.json({ error: "Model did not return valid JSON", raw: content });
    }

  }catch(error){
    console.error(error);
    res.status(500).json({message:"Internal Server Error", error:error.message});
  }
})




// ---------------------- START SERVER ----------------------

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
