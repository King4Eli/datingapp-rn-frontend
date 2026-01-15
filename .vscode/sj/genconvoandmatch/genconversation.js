 
// generate-conversations.js - REAL-TIME DATABASE INSERTION
const mysql = require('mysql2/promise');
const axios = require('axios');
const { customAlphabet } = require('nanoid');

class ConversationGenerator {
    constructor() {
        this.connection = null;
        this.idGenerator = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 24);
        
        this.config = {
            mysql: {
                host: '127.0.0.1',
                user: 'root',
                password: '',
                database: 'concona'
            },
            ollama: {
                baseUrl: 'http://localhost:11434',
                model: 'llama3.2:3b',
                temperature: 0.8,
                maxTokens: 100,
                timeout: 10000,
                maxRetries: 1
            },
            simulation: {
                delayBetweenCalls: 200,
                skipOnOllamaError: true,
                batchSize: 10 // Smaller batch size for real-time insertion
            }
        };
        
        this.ollamaAvailable = false;
        this.ollamaErrorCount = 0;
        this.maxOllamaErrors = 5;
    }

    async initialize() {
        try {
            this.connection = await mysql.createConnection(this.config.mysql);
            console.log('✅ Connected to MySQL database');

            // Test Ollama connection
            await this.testOllamaConnection();

        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async testOllamaConnection() {
        try {
            const response = await axios.get(`${this.config.ollama.baseUrl}/api/tags`, {
                timeout: 3000
            });
            
            console.log('✅ Connected to Ollama API');
            
            const models = response.data.models?.map(m => m.name) || [];
            console.log('📦 Available models:', models.length > 0 ? models.join(', ') : 'None');
            
            if (models.includes(this.config.ollama.model)) {
                this.ollamaAvailable = true;
            } else {
                console.warn(`⚠️  Model ${this.config.ollama.model} not found`);
                
                const alternativeModels = [
                    'phi3:mini', 'llama3', 'deepseek-coder:6.7b', 
                    'gpt-oss:20b', 'llama3.2:3b'
                ];
                
                for (const model of alternativeModels) {
                    if (models.includes(model)) {
                        this.config.ollama.model = model;
                        this.ollamaAvailable = true;
                        console.log(`   Using alternative model: ${model}`);
                        break;
                    }
                }
                
                if (!this.ollamaAvailable) {
                    console.warn('❌ No compatible model found. Using fallback only.');
                }
            }

        } catch (error) {
            console.warn('⚠️  Ollama not available, using fallback messages only');
            console.warn(`   Error: ${error.message}`);
            this.ollamaAvailable = false;
        }
    }

    // UPDATED: Generate conversations and insert as we go
    async generateConversationsForMatches(matches, conversationStarters) {
        let ollamaSuccess = 0;
        let fallbackUsed = 0;
        let ollamaSkipped = 0;
        let totalMessagesInserted = 0;
        
        console.log(`\n💬 Generating conversations for ${matches.length} matches...`);
        console.log(`   Ollama available: ${this.ollamaAvailable ? 'Yes' : 'No'}`);
        console.log(`   Skip on error: ${this.config.simulation.skipOnOllamaError ? 'Yes' : 'No'}`);
        
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            
            if (Math.random() * 100 <= this.config.simulation.conversationChance) {
                console.log(`\n--- Match ${i+1}/${matches.length}: ${match.user1.user_fullname} ↔ ${match.user2.user_fullname} ---`);
                
                // Skip Ollama if too many errors
                if (this.ollamaErrorCount >= this.maxOllamaErrors) {
                    console.log(`   ⚠️  Ollama disabled due to ${this.ollamaErrorCount} errors`);
                    this.ollamaAvailable = false;
                }
                
                // Generate conversation
                const conversationResult = await this.generateAndInsertSingleConversation(
                    match, 
                    conversationStarters,
                    i + 1
                );
                
                // Update stats
                if (conversationResult.generatedWith === 'ollama') {
                    ollamaSuccess++;
                } else if (conversationResult.generatedWith === 'fallback') {
                    fallbackUsed++;
                } else if (conversationResult.generatedWith === 'skipped') {
                    ollamaSkipped++;
                }
                
                totalMessagesInserted += conversationResult.messagesInserted;
                
                // Add delay between conversations
                await this.sleep(this.config.simulation.delayBetweenCalls);
                
                // Show progress
                this.showProgress(i + 1, matches.length, totalMessagesInserted);
            }
        }
        
        console.log(`\n📊 Generation Stats:`);
        console.log(`   ✅ Ollama successful: ${ollamaSuccess}`);
        console.log(`   ⚠️  Fallback used: ${fallbackUsed}`);
        if (ollamaSkipped > 0) {
            console.log(`   ⏭️  Ollama skipped: ${ollamaSkipped}`);
        }
        console.log(`   💬 Total messages inserted: ${totalMessagesInserted}`);
        
        return {
            conversationsCreated: matches.length,
            messagesCreated: totalMessagesInserted,
            ollamaSuccess,
            fallbackUsed,
            ollamaSkipped
        };
    }

    // NEW: Generate and insert conversation in one go
    async generateAndInsertSingleConversation(match, conversationStarters, matchNumber) {
        const { matchId, user1, user2 } = match;
        const numMessages = Math.floor(Math.random() * 6) + 3; // 3-8 messages
        
        // Try Ollama first if available
        if (this.ollamaAvailable) {
            try {
                const messages = await this.tryOllamaGeneration(user1, user2, numMessages, matchNumber);
                if (messages && messages.length >= 3) {
                    console.log(`   ✅ Ollama generated ${messages.length} messages`);
                    const messagesInserted = await this.insertMessagesImmediately(matchId, messages);
                    return {
                        generatedWith: 'ollama',
                        messagesInserted: messagesInserted
                    };
                }
            } catch (error) {
                console.log(`   ⚠️  Ollama failed: ${error.message}`);
                this.ollamaErrorCount++;
                
                if (this.ollamaErrorCount >= this.maxOllamaErrors) {
                    console.log(`   ⚠️  Too many Ollama errors (${this.ollamaErrorCount}), disabling for rest of session`);
                    this.ollamaAvailable = false;
                }
            }
        }
        
        // If Ollama not available or failed, check if we should use fallback
        if (!this.config.simulation.skipOnOllamaError) {
            // Use fallback
            console.log(`   ⚠️  Using fallback messages`);
            const messages = this.generateFallbackMessages(matchId, numMessages, conversationStarters);
            const messagesInserted = await this.insertMessagesImmediately(matchId, messages);
            return {
                generatedWith: 'fallback',
                messagesInserted: messagesInserted
            };
        } else {
            // Skip this conversation entirely if Ollama fails
            console.log(`   ⏭️  Skipping conversation (Ollama failed and skip enabled)`);
            return {
                generatedWith: 'skipped',
                messagesInserted: 0
            };
        }
    }

    // NEW: Insert messages immediately after generation
    async insertMessagesImmediately(matchId, messages) {
        if (!messages || messages.length === 0) {
            return 0;
        }
        
        const values = messages.map((message, index) => [
            this.idGenerator(18),
            matchId,
            JSON.stringify({ t: "text", str: message }),
            (index % 2 === 0) ? '1' : '0',
            '0'
        ]);
        
        try {
            const sql = `
                INSERT INTO conversations 
                (convo_id, convo_match_id, convo_message, convo_by_initiator, convo_status) 
                VALUES ?
            `;
            
            await this.connection.query(sql, [values]);
            console.log(`   📥 Inserted ${messages.length} messages`);
            return messages.length;
            
        } catch (error) {
            console.error(`   ❌ Error inserting messages: ${error.message}`);
            
            // Fallback to individual inserts
            return await this.insertMessagesIndividually(matchId, messages);
        }
    }

    // Fallback to individual inserts if batch fails
    async insertMessagesIndividually(matchId, messages) {
        let successCount = 0;
        
        for (let i = 0; i < messages.length; i++) {
            try {
                const convoId = this.idGenerator(18);
                await this.connection.execute(
                    `INSERT INTO conversations (convo_id, convo_match_id, convo_message, convo_by_initiator, convo_status) 
                     VALUES (?, ?, ?, ?, '0')`,
                    [
                        convoId,
                        matchId,
                        JSON.stringify({ t: "text", str: messages[i] }),
                        (i % 2 === 0) ? '1' : '0'
                    ]
                );
                successCount++;
            } catch (err) {
                console.error(`   ❌ Failed to insert individual message: ${err.message}`);
            }
        }
        
        if (successCount > 0) {
            console.log(`   ✅ Inserted ${successCount} individual messages`);
        }
        
        return successCount;
    }

    // UPDATED: Generate fallback messages (returns array, not DB format)
    generateFallbackMessages(matchId, numMessages, conversationStarters) {
        const messages = [];
        const fallbackMessages = this.getGenericResponses();
        
        // Create a more natural flow
        messages.push(
            conversationStarters[Math.floor(Math.random() * conversationStarters.length)]
        );
        
        for (let i = 1; i < numMessages; i++) {
            if (i === 1) {
                messages.push(
                    fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
                );
            } else if (i === 2) {
                messages.push(
                    this.getRandomQuestion()
                );
            } else {
                messages.push(
                    i % 2 === 0 
                        ? fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
                        : this.getRandomResponse()
                );
            }
        }
        
        // Ensure we don't exceed requested number
        return messages.slice(0, numMessages).map(msg => this.cleanMessage(msg));
    }

    // IMPROVED: Try Ollama generation
    async tryOllamaGeneration(user1, user2, numMessages, matchNumber) {
        const user1Profile = this.formatUserProfile(user1);
        const user2Profile = this.formatUserProfile(user2);
        const commonInterests = this.findCommonInterests(user1, user2);
        
        const prompt = `Create a dating app conversation between ${user1Profile.name} and ${user2Profile.name}.

${user1Profile.name} (${user1Profile.age} years old, ${user1Profile.gender}): ${user1Profile.about}
${user2Profile.name} (${user2Profile.age} years old, ${user2Profile.gender}): ${user2Profile.about}
${commonInterests.length > 0 ? `They both like: ${commonInterests.join(', ')}` : ''}

Generate exactly ${numMessages} short messages that alternate between them.
Start with ${user1Profile.name} sending the first message.
Keep messages casual and natural like real people chatting.

Example format:
${user1Profile.name}: Hey! How's your day going?
${user2Profile.name}: It's good! Just finished work. You?
${user1Profile.name}: Same here, ready for the weekend!
...`;

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Ollama timeout')), this.config.ollama.timeout);
            });

            const ollamaPromise = axios.post(
                `${this.config.ollama.baseUrl}/api/generate`,
                {
                    model: this.config.ollama.model,
                    prompt: prompt,
                    options: {
                        temperature: 0.8,
                        num_predict: 150,
                        top_p: 0.9,
                        repeat_penalty: 1.1
                    },
                    stream: false
                },
                { 
                    timeout: this.config.ollama.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            const response = await Promise.race([ollamaPromise, timeoutPromise]);
            const responseText = response.data?.response || '';
            
            if (!responseText.trim()) {
                throw new Error('Empty response from Ollama');
            }
            
            const messages = this.parseOllamaResponse(responseText, user1Profile.name, user2Profile.name);
            
            if (messages.length >= 3) {
                return messages.slice(0, numMessages);
            }
            
            throw new Error(`Only got ${messages.length} valid messages (needed at least 3)`);
            
        } catch (error) {
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
    }

    // Parse Ollama response
    parseOllamaResponse(text, userName1, userName2) {
        const lines = text.split('\n').filter(line => line.trim());
        const messages = [];
        
        for (const line of lines) {
            let cleanLine = line
                .replace(/^\*\*/, '')
                .replace(/\*\*$/, '')
                .replace(/^["']|["']$/g, '')
                .trim();
            
            const patterns = [
                new RegExp(`^${userName1}:\\s*(.+)$`, 'i'),
                new RegExp(`^${userName2}:\\s*(.+)$`, 'i'),
                /^[\w\s]+:\s*(.+)$/i,
                /^([^:]+)$/
            ];
            
            for (const pattern of patterns) {
                const match = cleanLine.match(pattern);
                if (match) {
                    const message = match[1] || match[0];
                    if (message.length > 3 && message.length < 200) {
                        messages.push(this.cleanMessage(message));
                        break;
                    }
                }
            }
            
            if (messages.length >= 8) break;
        }
        
        return messages;
    }

    // Show progress indicator
    showProgress(current, total, messagesInserted) {
        const percent = Math.round((current / total) * 100);
        const progressBar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
        console.log(`   📊 Progress: [${progressBar}] ${percent}% | ${current}/${total} matches | ${messagesInserted} messages`);
    }

    // MAIN METHODS (unchanged interface)
    async generateOnlyMessages(numMatches = 3000, conversationChance = 80) {
        try {
            console.log('\n🔍 Getting active matches...');
            const activeMatches = await this.getActiveMatches(numMatches);
            console.log(`   Found ${activeMatches.length} active matches`);

            if (activeMatches.length === 0) {
                console.log('⚠️  No active matches found');
                return { conversations: 0, messages: 0 };
            }

            const conversationStarters = await this.getConversationStarters();
            this.config.simulation.conversationChance = conversationChance;

            console.log(`\n💬 Creating conversations (chance: ${conversationChance}%)...`);
            const result = await this.generateConversationsForMatches(activeMatches, conversationStarters);

            return {
                conversations: activeMatches.length,
                messages: result.messagesCreated,
                ollamaSuccess: result.ollamaSuccess,
                fallbackUsed: result.fallbackUsed,
                ollamaSkipped: result.ollamaSkipped
            };

        } catch (error) {
            console.error('Error generating messages:', error);
            throw error;
        }
    }

    async generateConversations(method = 'opposite', numMatches = 10, conversationChance = 70) {
        try {
            console.log('\n🔍 Getting active users...');
            const users = await this.getActiveUsersWithPreferences();
            console.log(`   Found ${users.length} active users`);

            if (users.length < 2) {
                console.log('⚠️  Not enough active users');
                return { matches: 0, conversations: 0, messages: 0 };
            }

            // Create matches
            console.log(`\n🤝 Creating matches (method: ${method})...`);
            let matches;
            if (method === 'opposite') {
                matches = await this.createMatchesOppositeGender(users, numMatches);
            } else {
                matches = await this.createRandomMatches(users, numMatches);
            }
            console.log(`   Created ${matches.length} matches`);

            const conversationStarters = await this.getConversationStarters();
            this.config.simulation.conversationChance = conversationChance;

            const activeMatches = matches.filter(m => m.status === '1');
            console.log(`\n💬 Creating conversations for ${activeMatches.length} active matches...`);
            
            const conversationResult = await this.generateConversationsForMatches(activeMatches, conversationStarters);

            return {
                matches: matches.length,
                conversations: activeMatches.length,
                messages: conversationResult.messagesCreated,
                ollamaSuccess: conversationResult.ollamaSuccess,
                fallbackUsed: conversationResult.fallbackUsed,
                ollamaSkipped: conversationResult.ollamaSkipped
            };

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async generateOnlyMatches(method = 'opposite', numMatches = 10) {
        try {
            console.log('\n🔍 Getting active users...');
            const users = await this.getActiveUsersWithPreferences();
            console.log(`   Found ${users.length} active users`);

            if (users.length < 2) {
                console.log('⚠️  Not enough active users');
                return { matches: 0 };
            }

            console.log(`\n🤝 Creating matches (method: ${method})...`);
            let matches;
            if (method === 'opposite') {
                matches = await this.createMatchesOppositeGender(users, numMatches);
            } else {
                matches = await this.createRandomMatches(users, numMatches);
            }

            return {
                matches: matches.length
            };

        } catch (error) {
            console.error('Error generating matches:', error);
            throw error;
        }
    }

    // HELPER METHODS (keep existing implementations)
    async createMatchesOppositeGender(users, numMatches) {
        const matchesCreated = [];
        const maxAttempts = numMatches * 5;
        let attempts = 0;

        const usersByGender = { 0: [], 1: [] };
        users.forEach(user => {
            const gender = user.user_bio_gender;
            if (gender === 0 || gender === 1) {
                usersByGender[gender].push(user);
            }
        });

        if (usersByGender[0].length === 0 || usersByGender[1].length === 0) {
            console.log('⚠️  Not enough users of both genders');
            return matchesCreated;
        }

        while (matchesCreated.length < numMatches && attempts < maxAttempts) {
            attempts++;
            
            const fromGender = Math.random() > 0.5 ? 0 : 1;
            const toGender = fromGender === 0 ? 1 : 0;
            
            const fromUsers = usersByGender[fromGender];
            const toUsers = usersByGender[toGender];
            
            if (fromUsers.length === 0 || toUsers.length === 0) continue;
            
            const user1 = fromUsers[Math.floor(Math.random() * fromUsers.length)];
            const user2 = toUsers[Math.floor(Math.random() * toUsers.length)];
            
            if (user1.user_id === user2.user_id) continue;
            
            if (!this.checkGenderPreferences(user1, user2)) continue;
            if (!this.checkAgePreferences(user1, user2)) continue;
            
            const exists = await this.checkExistingMatch(user1.user_id, user2.user_id);
            if (exists) continue;
            
            const matchId = this.idGenerator(24);
            const r = Math.random();
            const status = r > 0.66 ? '1' : r > 0.33 ? '0' : '5';
            
            try {
                await this.connection.execute(
                    `INSERT INTO matches (match_id, match_user_id_from, match_user_id_to, match_status) 
                     VALUES (?, ?, ?, ?)`,
                    [matchId, user1.user_id, user2.user_id, status]
                );
                
                matchesCreated.push({
                    matchId,
                    user1,
                    user2,
                    status
                });
                
                console.log(`   ${matchesCreated.length}/${numMatches}: ${user1.user_fullname} → ${user2.user_fullname} (${status === '1' ? 'active' : status === '5' ? 'super' : 'pending'})`);
                
            } catch (error) {
                console.error('Error creating match:', error.message);
            }
        }
        
        return matchesCreated;
    }

    async createRandomMatches(users, numMatches) {
        const matchesCreated = [];
        const maxAttempts = numMatches * 5;
        let attempts = 0;

        while (matchesCreated.length < numMatches && attempts < maxAttempts) {
            attempts++;
            
            const user1 = users[Math.floor(Math.random() * users.length)];
            const user2 = users[Math.floor(Math.random() * users.length)];
            
            if (user1.user_id === user2.user_id) continue;
            
            if (!this.checkGenderPreferences(user1, user2)) continue;
            if (!this.checkAgePreferences(user1, user2)) continue;
            
            const exists = await this.checkExistingMatch(user1.user_id, user2.user_id);
            if (exists) continue;
            
            const matchId = this.idGenerator(24);
            const status = Math.random() > 0.5 ? '1' : '0';
            
            try {
                await this.connection.execute(
                    `INSERT INTO matches (match_id, match_user_id_from, match_user_id_to, match_status) 
                     VALUES (?, ?, ?, ?)`,
                    [matchId, user1.user_id, user2.user_id, status]
                );
                
                matchesCreated.push({
                    matchId,
                    user1,
                    user2,
                    status
                });
                
                console.log(`   ${matchesCreated.length}/${numMatches}: ${user1.user_fullname} ↔ ${user2.user_fullname} (${status === '1' ? 'active' : 'pending'})`);
                
            } catch (error) {
                console.error('Error creating match:', error.message);
            }
        }
        
        return matchesCreated;
    }

    formatUserProfile(user) {
        const age = this.calculateAge(user.user_bio_dob);
        const gender = user.user_bio_gender === 0 ? 'man' : 'woman';
        const interests = this.extractInterests(user);
        
        return {
            name: user.user_fullname,
            age: age,
            gender: gender,
            about: user.user_bio_about || 'No bio provided',
            interests: interests
        };
    }

    cleanMessage(message) {
        let cleaned = String(message)
            .replace(/["']/g, '')
            .replace(/^\*\*/, '')
            .replace(/\*\*$/, '')
            .replace(/^-\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .trim();
        
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        
        if (!/[.!?]$/.test(cleaned)) {
            cleaned += '.';
        }
        
        if (cleaned.length > 200) {
            cleaned = cleaned.substring(0, 197) + '...';
        }
        
        return cleaned;
    }

    getGenericResponses() {
        return [
            "Hey there! How's your day going?",
            "I like your profile!",
            "What brings you to this app?",
            "How was your day?",
            "Any fun plans for the weekend?",
            "What do you like to do for fun?",
            "I noticed we have similar interests!",
            "Would love to get to know you better",
            "Coffee sometime? ☕",
            "You seem really interesting!"
        ];
    }

    getRandomQuestion() {
        const questions = [
            "What about you?",
            "How was your week?",
            "Any fun plans coming up?",
            "What do you like to do for fun?",
            "Have you been to any good restaurants lately?",
            "What kind of music are you into?",
            "Do you watch any shows right now?",
            "What's your favorite way to relax?"
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }

    getRandomResponse() {
        const responses = [
            "That sounds great!",
            "I'd love to try that sometime",
            "We have similar tastes!",
            "That's really interesting",
            "I feel the same way",
            "Tell me more about that",
            "That's awesome!",
            "I completely agree"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async getConversationStarters() {
        try {
            const [rows] = await this.connection.execute(
                `SELECT control_payload FROM control WHERE control_type = 'convo_starter' LIMIT 1`
            );
            
            if (rows.length > 0) {
                const payload = JSON.parse(rows[0].control_payload);
                if (Array.isArray(payload)) {
                    return payload;
                }
            }
        } catch (error) {
            console.error('Error getting conversation starters:', error.message);
        }
        
        return this.getGenericResponses();
    }

    async getActiveUsersWithPreferences() {
        const [rows] = await this.connection.execute(`
            SELECT user_id, user_fullname, user_bio_about, user_bio_gender, 
                   user_preference_gender, user_bio_interests, user_bio_dob,
                   user_preference_minimum_age, user_preference_maximum_age
            FROM users 
            WHERE user_active = '1'
            AND user_bio_about IS NOT NULL 
            AND user_bio_about != ''
            ORDER BY RAND()
            LIMIT 1500
        `);
        return rows;
    }

    async getActiveMatches(limit = 3000) {
        const [rows] = await this.connection.execute(`
            SELECT m.match_id, m.match_status,
                   u1.user_id as user1_id, u1.user_fullname as user1_name,
                   u1.user_bio_about as user1_bio, u1.user_bio_gender as user1_gender,
                   u1.user_bio_interests as user1_interests, u1.user_bio_dob as user1_dob,
                   u2.user_id as user2_id, u2.user_fullname as user2_name,
                   u2.user_bio_about as user2_bio, u2.user_bio_gender as user2_gender,
                   u2.user_bio_interests as user2_interests, u2.user_bio_dob as user2_dob
            FROM matches m
            JOIN users u1 ON m.match_user_id_from = u1.user_id
            JOIN users u2 ON m.match_user_id_to = u2.user_id
            WHERE m.match_status = '1'
            ORDER BY RAND()
            LIMIT ?
        `, [limit]);
        
        return rows.map(row => ({
            matchId: row.match_id,
            status: row.match_status,
            user1: {
                user_id: row.user1_id,
                user_fullname: row.user1_name,
                user_bio_about: row.user1_bio,
                user_bio_gender: row.user1_gender,
                user_bio_interests: row.user1_interests,
                user_bio_dob: row.user1_dob
            },
            user2: {
                user_id: row.user2_id,
                user_fullname: row.user2_name,
                user_bio_about: row.user2_bio,
                user_bio_gender: row.user2_gender,
                user_bio_interests: row.user2_interests,
                user_bio_dob: row.user2_dob
            }
        }));
    }

    calculateAge(dob) {
        if (!dob || dob.length !== 8) return 25;
        const year = parseInt(dob.substring(0, 4));
        const month = parseInt(dob.substring(4, 6)) - 1;
        const day = parseInt(dob.substring(6, 8));
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    }

    checkAgePreferences(user1, user2) {
        const user1Age = this.calculateAge(user1.user_bio_dob);
        const user2Age = this.calculateAge(user2.user_bio_dob);
        if (user1.user_preference_minimum_age && user2Age < user1.user_preference_minimum_age) return false;
        if (user1.user_preference_maximum_age && user2Age > user1.user_preference_maximum_age) return false;
        if (user2.user_preference_minimum_age && user1Age < user2.user_preference_minimum_age) return false;
        if (user2.user_preference_maximum_age && user1Age > user2.user_preference_maximum_age) return false;
        return true;
    }

    checkGenderPreferences(user1, user2) {
        if (user1.user_preference_gender !== -99 && user1.user_preference_gender !== user2.user_bio_gender) return false;
        if (user2.user_preference_gender !== -99 && user2.user_preference_gender !== user1.user_bio_gender) return false;
        return true;
    }

    async checkExistingMatch(user1Id, user2Id) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT match_id FROM matches 
                 WHERE (match_user_id_from = ? AND match_user_id_to = ?)
                    OR (match_user_id_from = ? AND match_user_id_to = ?)
                 LIMIT 1`,
                [user1Id, user2Id, user2Id, user1Id]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error checking existing match:', error.message);
            return false;
        }
    }

    findCommonInterests(user1, user2) {
        try {
            const interests1 = user1.user_bio_interests ? 
                (Array.isArray(user1.user_bio_interests) ? 
                    user1.user_bio_interests : 
                    JSON.parse(user1.user_bio_interests)) : 
                [];
            const interests2 = user2.user_bio_interests ? 
                (Array.isArray(user2.user_bio_interests) ? 
                    user2.user_bio_interests : 
                    JSON.parse(user2.user_bio_interests)) : 
                [];
            if (Array.isArray(interests1) && Array.isArray(interests2)) {
                return interests1.filter(interest => interests2.includes(interest));
            }
        } catch (error) {
            console.log(`   Could not parse interests: ${error.message}`);
        }
        return [];
    }

    extractInterests(user) {
        try {
            if (user.user_bio_interests) {
                const interests = Array.isArray(user.user_bio_interests) ?
                    user.user_bio_interests :
                    JSON.parse(user.user_bio_interests);
                if (Array.isArray(interests) && interests.length > 0) {
                    return interests.filter(i => i && i.trim().length > 0);
                }
            }
        } catch (error) {
            // Could not parse interests
        }
        return ['music', 'movies', 'travel', 'food', 'sports'];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetOllamaErrors() {
        this.ollamaErrorCount = 0;
        this.ollamaAvailable = true;
    }

    setSkipOnOllamaError(skip) {
        this.config.simulation.skipOnOllamaError = skip;
    }

    async cleanup() {
        if (this.connection) {
            await this.connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

module.exports = ConversationGenerator; 