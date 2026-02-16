import 'dotenv/config';
import axios from 'axios';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const API_KEY = process.env.NANO_API_KEY;

if (!API_KEY) {
    console.log("Please set API key in .env");
    process.exit(1);
}

const PROMPT_CREATIVE = "Write 3 tagline ideas for Berlin tourism.";
const PROMPT_LONG = "Write a detailed 8-bullet day-trip plan for Barcelona including timings and brief tips per stop.";
const max_tokens_mid = 50;
let max_tokens_small = 80;
let max_tokens_large = 800;

async function Chat(messages, options) {
    try {
        const res = await axios.post(
            API_URL,
            {
                model: MODEL,
                messages,
                temperature: options.temperature,
                max_tokens: options.max_tokens,
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Safely check if the response structure exists
        if (res.data && res.data.choices && res.data.choices.length > 0) {
            return res.data.choices[0].message;
        } else {
            console.error("Unexpected Response Structure:", res.data);
            return { content: "Error: No response content found." };
        }
    } catch (err) {
        // Log the specific error message from the API
        console.error("❌ API Error:", err.response?.data?.error?.message || err.message);
        return { content: "Error: Failed to fetch from API." };
    }
}

async function lab02_temprature() {
    console.log("\n--- Lab 02 — Temperature Test ---");
    console.log(`Testing temperature: low=0.2 vs high=0.9`);

    const low = await Chat(
        [{ role: "user", content: PROMPT_CREATIVE }],
        { temperature: 0.2, max_tokens: max_tokens_mid }
    );

    const high = await Chat(
        [{ role: "user", content: PROMPT_CREATIVE }],
        { temperature: 0.9, max_tokens: max_tokens_mid }
    );

    console.log("\n[Low Temperature (0.2)]:", low.content);
    console.log("\n[High Temperature (0.9)]:", high.content);
}

async function lab03_token_test() {
    console.log("\n--- Lab 03 — Token size test ---");
    console.log(`Testing max_tokens small=${max_tokens_small} vs large=${max_tokens_large}`);

    const shortResponse = await Chat(
        [{ role: "user", content: PROMPT_LONG }],
        { temperature: 0.6, max_tokens: max_tokens_small }
    );

    const longResponse = await Chat(
        [{ role: "user", content: PROMPT_LONG }],
        { temperature: 0.6, max_tokens: max_tokens_large }
    );

    console.log("\n[Small Token Response]:", shortResponse.content);
    console.log("\n[Large Token Response]:", longResponse.content);
}

// Execute labs sequentially to prevent messy logs
async function runLabs() {
    await lab02_temprature();
    await lab03_token_test();
}

runLabs().catch(err => console.error("Global Error:", err));


