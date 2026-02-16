import 'dotenv/config';
import axios from 'axios';



 const baseURL='https://openrouter.ai/api/v1/chat/completions';
const apiKey =  process.env.NANO_API_KEY;
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';


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


    if(!process.env.NANO_API_KEY){
        console.error("Set openrouter api key");
        process.exit(1);
    }

    const res = await axios.post(
        baseURL,
        {
            model: MODEL,
            messages:[
                {role: 'system', content: SYSTEM_PROMPT},
                {role: 'user', content: USER_PROMPT}
            ]
        },
        {
            headers:{
                Authorization : `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );
    console.log(res);
    console.log(res.data?.choices?.[0]?.message?.content || '');

}

main().catch((e)=>{
    console.error(e?.response?.data|| e.reponse || e );
    process.exit(1);
})