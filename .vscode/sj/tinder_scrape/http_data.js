import axios from "axios";
import fs from "fs"; 
import path from "path";

const pkgPath = path.join(process.cwd(), '.vscode/sj/tinder_scrape/var.json');
const env = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const headers = {
  "App-Session-Id": env.tinder_tool.app_session_id,
  "X-Auth-Token": env.tinder_tool.X_Auth_Token,
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en,en-US",
  "Platform": "web",
  "Origin": "https://tinder.com",
  "Referer": "https://tinder.com/",
};


/*
  * Fetch Tinder recommendations with error handling
*/
export const get_tinder_recommendations = async () => {
  console.log("\n🟡 Fetching Tinder recommendations...");
  try {
    const response = await axios.get(env.tinder_tool.baseUrl, {
      headers: headers,
      timeout: 30000,
    });

    console.log("\n✅ Tinder recommendations fetched successfully.");
    return response.data;
    //response.data
  } catch (error) {
    console.log(`\n❌ API request failed: ${error.message}`);
    return null;
  }
}


(async () => {
  // console.log((await getTinderRecommendations()).data.data.results);
})();