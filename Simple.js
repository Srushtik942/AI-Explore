import 'dotenv/config';
import axios from 'axios';
import { json } from 'express';

const API_URL="https://openrouter.ai/api/v1/chat/completions";
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const API_KEY = process.env.NANO_API_KEY;
const PROMPT = "Write hello world in 3 programming language";


if(!API_KEY){
    console.error("please set open router api key in .env");
    process.exit(1);
}

async function main(){
    const res = await axios.post(
        API_URL,
        {
            model: MODEL,
            messages:[{role:'user', content: PROMPT}]
        },
        {
            headers:{
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    console.log("Raw response", JSON.stringify(res.data,null,2));
    console.log(res.data?.choices?.[0]?.message?.content || '');

}

main().catch((e)=>{
    console.error(e?.response?.data|| e.reponse || e );
    process.exit(1);
})

