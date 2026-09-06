import { Client } from "@notionhq/client";
import "dotenv/config";

const notionApiKey = process.env.NOTION_API_KEY;
if (!notionApiKey) {
  throw new Error("Missing NOTION_API_KEY: define it in .env (see .env.example).");
}

const notion = new Client({ auth: notionApiKey });

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
if (!DATABASE_ID) {
  throw new Error("Missing NOTION_DATABASE_ID: define it in .env (see .env.example).");
}

async function test() {
  try {
    const response = await notion.databases.query({ database_id: DATABASE_ID });
    console.log("SUCCESS! Found", response.results.length, "items.");
    if (response.results.length > 0) {
      console.log("First item properties:", JSON.stringify(response.results[0].properties, null, 2));
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
