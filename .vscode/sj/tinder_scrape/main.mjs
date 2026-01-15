// main.mjs
import { v4 as uuidv4 } from 'uuid';
import random from 'random';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { DatabaseHandler } from '../sql_d.mjs';
import { generate_real_address_with_coords } from '../gen_rand_location.mjs';
import { get_tinder_recommendations } from './http_data.js';

// __dirname __FILE_NAME
const __FILE_NAME = fileURLToPath(import.meta.url);
const ___DIR_NAME = path.dirname(__FILE_NAME);
// Configuration
const CONFIG = {
    SQL_IMG_PATH: '/static/img/peoples1',
    get IMAGE_SAVE_PATH() {
        return path.join('D:', 'datingapp', this.SQL_IMG_PATH);
    },
    SKIPPED_IDS_FILE: path.join(___DIR_NAME, '_skip_data_id.json'),
};

//DB SQL
const DB_SQL = new DatabaseHandler();

// DOB from time stamp
function getDobAge(timestampStr) {
    if (!timestampStr) return [null, null];
    try {
        const date = new Date(timestampStr);
        const formatted = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

        const now = new Date();
        let age = now.getFullYear() - date.getFullYear();
        if (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate()))
            age -= 1;

        return [formatted, age];
    } catch {
        return [null, null];
    }
}

//SKIPPED ID HANDLER
const SkippedId = {
    readAll: async () => {
        try {
            const data = await fs.readFile(CONFIG.SKIPPED_IDS_FILE, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    },
    saveAll: async (ids) => {
        await fs.writeFile(CONFIG.SKIPPED_IDS_FILE, JSON.stringify(ids, null, 2), 'utf8');
    }

}

// IMAGE DOWNLOADER
async function downloadImage(imageUrl, leadingId = 0) {
    try {
        await fs.mkdir(CONFIG.IMAGE_SAVE_PATH, { recursive: true });
        const filename = `${leadingId}-${Math.floor(Math.random() * 1e13)}-${uuidv4().slice(0, random.int(10, 20))}.jpeg`;
        const savePath = path.join(CONFIG.IMAGE_SAVE_PATH, filename);

        const res = await fetch(imageUrl, { timeout: 10000 });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        const data = Buffer.from(buffer);

        const image = sharp(data);
        const metadata = await image.metadata();
        await fs.writeFile(savePath, data);

        return {
            p: `${CONFIG.SQL_IMG_PATH}/${filename}`,
            w: metadata.width,
            h: metadata.height,
        };
    } catch (err) {
        console.error(`Failed to download image: ${err.message}`);
        return null;
    }
}


// === SQL Query Builder ===
async function generateSqlQuery(userData) {
    const leadingIdx = random.int(999, 9999999);
    const sqlImg = [];

    for (const photo of (userData.photos || []).slice(0, 6)) {
        if (photo.url) {
            const imgData = await downloadImage(photo.url, leadingIdx);
            if (imgData) sqlImg.push(imgData);
        }
    }

    const genUserId = `00000${uuidv4().slice(0, random.int(10, 20))}${random.int(0, 99999)}`;
    const genderassign = 1;
    const [dob] = getDobAge(userData.birth_date);

    const sqlParams = {
        user_id: genUserId,
        user_email: `${random.int(54123332, 99241414141422237)}@example.com`,
        user_phonenumber: String(random.int(9999999, 99999999999999)),
        user_fullname: userData.name || '',
        user_image: JSON.stringify(sqlImg),
        user_active: random.choice(['1', '1', '1', '0', '1', '1', '1']),
        user_verified: random.choice(['0', '1']),
        user_bio_gender: genderassign,
        user_preference_gender: 1 - genderassign,
        user_bio_about: userData.bio || '',
        user_bio_dob: dob,
        user_bio_relationshipgoal: random.int(0, 5),
        user_preference_relationshipgoal: random.int(0, 5),
        user_bio_smoking: random.choice(['0', '1', '2']),
        user_preference_smoking: random.choice(['0', '1', '2', '-99']),
        user_bio_drinking: random.choice(['0', '1', '2']),
        user_preference_drinking: random.choice(['0', '1', '2', '-99']),
        user_bio_children: random.choice(['0', '1']),
        user_preference_children: random.choice(['0', '1', '-99']),
        user_bio_haspet: random.choice(['0', '1']),
        user_preference_pet: random.choice(['0', '1', '-99']),
        user_location: await generate_real_address_with_coords(),
    };

    const keys = Object.keys(sqlParams);
    const vals = Object.values(sqlParams);

    const query = `
        INSERT IGNORE INTO users 
        (${keys.join(', ')})
            VALUES
        (${vals.map(() => '?').join(', ')})
    `;

    return [query, vals, genUserId];
}

// === Main Flow ===
async function main(iteration) {
    if (!iteration) { console.log('❌❌ how many times do you want to iteration...'); }
 
    for (let i = 1; i <= iteration; i++) {
        console.log(
            "\n=======================================",
            "\n=======================================",
            "\n  🔵 Iteration:", i, '/', iteration, "  ",
            "\n=======================================",
            "\n=======================================",
        );
        const skippedIds = await SkippedId.readAll();
        const Tinder_Data_extracted = await get_tinder_recommendations();

        if (!Tinder_Data_extracted?.data?.results) {
            console.log('\n❌ No valid data received from API');
            return;
        }

        let insertedCount = 0;
        for (const rec of Tinder_Data_extracted.data.results) {
            const user = rec.user || {};
            const userId = user._id;
            if (!userId || skippedIds.includes(userId)) {
                console.log(`⚪ Skipping user ${userId}`);
                continue;
            }

            try {
                const [query, params, genUserId] = await generateSqlQuery(user);
                const result = await DB_SQL.executeQuery(query, params);
                console.log(`Inserted user ${userId} as ${genUserId}:`, result);
                skippedIds.push(userId);
                insertedCount++;
            } catch (err) {
                console.log(`❌ Failed to insert user ${userId}: ${err.message}`);
            }
        }
        console.log('\nInserted', insertedCount, "/", (Tinder_Data_extracted.data.results).length);
        await SkippedId.saveAll(skippedIds);
    }

    await DB_SQL.close();
    console.log('\n🔵⚪ End...\n\n');
}



main(10)