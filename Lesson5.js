import 'dotenv/config';
import axios from 'axios';
import express from "express";
import cors from "cors";
import { parse } from 'dotenv';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const API_KEY = process.env.NANO_API_KEY;

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

// ---------------------- Creative PROMPT ----------------------



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

// ---------------------- START SERVER ----------------------

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
