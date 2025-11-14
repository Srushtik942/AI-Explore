import 'dotenv/config';
import axios from 'axios';


const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const API_KEY = process.env.NANO_API_KEY;

if(!API_KEY){
    console.log("Please set api key in .env");
    process.exit(1);
}

const SYSTEM_PROMPT = `
You are an AI assistant acting as a helpfu; travel agent.
Respond with JSON only. No prose, markdown or backticks.

Use exactly this schema and field names:

{
  "destination": "string -  city, country",
  "best_time" : "string - month(s)/ season with one sentence why",
  "duration_days": number,
  "top_attractions" : ["string", "string", "string"],
  "sample_itinerary":[
   {"day"1, "plan": "string"},
   {"day"2, "plan": "string"},
   {"day"3, "plan": "string"},
  ],
  "estimated_budget : {"low":number, "mid":number, "high":number},
  "local_tips": ["string","string"]
}

Rules:
- Output valid JSON only, nothing else.
- Keep numbers unquoted.
- If unsure, use null or [] but keep the schema.

`;

const USER_PROMPT =  'Create a short travel plan for Paris,France for a first-time visitor. ';


async function main() {
    const res = await axios.post(
        API_URL,
        {
            model: MODEL,
            messages:[
                {role: 'system', content: SYSTEM_PROMPT},
                {role: 'user', content: USER_PROMPT}
            ]
        },
        {
            headers:{
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    console.log(res.data?.choices?.[0]?.message?.content || '');

}

main().catch((e)=>{
    console.error(e?.response?.data|| e.reponse || e );
    process.exit(1);
})