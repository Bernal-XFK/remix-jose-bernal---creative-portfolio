import { Client } from "@notionhq/client";
import "dotenv/config";

const notionApiKey = process.env.NOTION_API_KEY;
if (!notionApiKey) {
  throw new Error("Missing NOTION_API_KEY: define it in .env (see .env.example).");
}

const notion = new Client({ auth: notionApiKey });

async function searchDatabases() {
  try {
    const response = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      }
    });
    console.log("Found", response.results.length, "databases shared with this integration.");
    response.results.forEach((db: any) => {
      console.log(`- Title: ${db.title?.[0]?.plain_text || 'Untitled'}`);
      console.log(`  ID: ${db.id}`);
      console.log(`  URL: ${db.url}`);
    });
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
searchDatabases();
