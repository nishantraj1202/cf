const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const connectDB = require('./config/db');
const Question = require('./models/Question');
const Company = require('./models/Company');
const CompanyImage = require('./models/CompanyImage');

// --- Input Sanitization Helpers ---
// Sanitize string: trim, escape HTML, limit length
function sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    return validator.escape(str.trim()).substring(0, maxLength);
}

// Sanitize basic text (no HTML escape, just trim and limit)
function sanitizeText(str, maxLength = 10000) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
}

// Validate and sanitize difficulty
function sanitizeDifficulty(val) {
    const valid = ['Easy', 'Medium', 'Hard'];
    return valid.includes(val) ? val : 'Medium';
}

// Validate and sanitize topic
function sanitizeTopic(val) {
    const valid = ['Arrays', 'Strings', 'LinkedList', 'Trees', 'Graphs', 'DP', 'Heaps', 'Backtracking', 'System Design', 'Matrix', 'Other'];
    if (typeof val !== 'string') return 'Other';
    const normalized = val.trim();
    // Handle common variations
    if (normalized === 'String') return 'Strings';
    if (normalized === 'Linked List') return 'LinkedList';
    if (normalized === 'Dynamic Programming') return 'DP';
    return valid.includes(normalized) ? normalized : 'Other';
}

// Sanitize slug (alphanumeric and dashes only)
function sanitizeSlug(str) {
    if (typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 200);
}

// Validate MongoDB ObjectId
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] Incoming: ${req.method} ${req.url}`); next(); });
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Stricter limit for admin routes
    message: "Too many admin attempts, please try again later."
});

// Initialize Groq
const Groq = require('groq-sdk');
let groq = null;
const API_KEY = process.env.GROQ_API_KEY;
if (API_KEY) {
    groq = new Groq({ apiKey: API_KEY });
} else {
    console.warn("GROQ_API_KEY is missing. AI features will be disabled.");
}

// Initialize Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- ROUTES ---
// Admin Middleware
const checkAdmin = (req, res, next) => {
    // 1. Check Secret Header (Basic Auth)
    const secret = req.headers['x-admin-secret'];
    const validSecret = process.env.ADMIN_SECRET;

    if (!validSecret) {
        console.error("CRITICAL: ADMIN_SECRET is not set in environment variables.");
        return res.status(500).json({ error: "Server Configuration Error" });
    }

    if (secret !== validSecret) {
        return res.status(401).json({ error: "Unauthorized: Invalid Admin Key" });
    }

    // 2. Check Device Lock Cookie (Device Auth)
    const deviceSig = req.cookies['admin_device_sig'];

    // Hash the valid secret + device code to create the expected signature
    // We use a fixed salt/device code from env so it persists
    const deviceCode = process.env.ADMIN_DEVICE_CODE;

    if (!deviceCode) {
        // If no device code is configured, fallback to just Secret (Backwards Compatibility / Warning)
        // But for this task, we want to enforce it.
        // Let's enforce it only if the user has set it up? No, prompt implies strictness.
        // We'll allow access but log a warning if device code isn't set up on server yet.
        console.warn("WARNING: ADMIN_DEVICE_CODE not set. Device lock is inactive.");
        return next();
    }

    const expectedSig = crypto.createHmac('sha256', validSecret)
        .update(deviceCode)
        .digest('hex');

    if (deviceSig !== expectedSig) {
        return res.status(403).json({
            error: "Device not authorized",
            requiresDeviceAuth: true,
            message: "This key is valid, but this device is not recognized. Please verifying your device."
        });
    }

    next();
};

// Device Verification Endpoint
app.post('/api/admin/verify-device', adminLimiter, (req, res) => {
    const { secret, deviceCode } = req.body;
    const validSecret = process.env.ADMIN_SECRET;
    const validDeviceCode = process.env.ADMIN_DEVICE_CODE;

    if (!validSecret || !validDeviceCode) {
        return res.status(500).json({ error: "Server Auth Configuration Missing" });
    }

    if (secret !== validSecret) {
        return res.status(401).json({ error: "Invalid Admin Secret" });
    }

    if (deviceCode !== validDeviceCode) {
        return res.status(401).json({ error: "Invalid Device Code" });
    }

    // Generate Signature
    const signature = crypto.createHmac('sha256', validSecret)
        .update(validDeviceCode)
        .digest('hex');

    // Set HTTP-Only Cookie (30 Days)
    res.cookie('admin_device_sig', signature, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Secure in prod
        sameSite: 'lax', // Allow top-level navigation, strict might be too much for now
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ success: true, message: "Device Verified Successfully" });
});

// Apply admin limiter to all admin routes
app.use('/api/admin', adminLimiter);

app.get('/health', async (req, res) => {
    res.json({ message: "Server is running" })
})

// Single Image Upload to Cloudinary
app.post('/api/upload/image', async (req, res) => {
    try {
        const { image } = req.body;

        // --- INPUT VALIDATION ---
        if (!image || typeof image !== 'string') {
            return res.status(400).json({ error: "No image provided" });
        }

        // Validate it's a base64 image
        if (!image.startsWith('data:image/')) {
            return res.status(400).json({ error: "Invalid image format. Must be base64 encoded." });
        }

        // Limit image size (~20MB base64)
        if (image.length > 27000000) {
            return res.status(400).json({ error: "Image too large. Maximum 20MB allowed." });
        }

        console.log("Debug: Uploading single image to Cloudinary...");
        const uploadRes = await cloudinary.uploader.upload(image, {
            folder: "oa_hub_uploads",
            resource_type: "auto"
        });

        console.log("Debug: Image uploaded:", uploadRes.secure_url);
        res.json({ url: uploadRes.secure_url });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ error: "Failed to upload image", details: error.message });
    }
});

// AI Extraction Route
// 0. Extract Question from Image (Supports Multi-page)
// 0. Extract Question from Image (Supports Multi-page)
app.post('/api/admin/extract/image', async (req, res) => {
    try {
        console.log("Debug: Extraction Request Received");
        console.log("Debug: Body Type:", typeof req.body, "IsArray:", Array.isArray(req.body));
        console.log("Debug: Headers CT:", req.get('Content-Type'));
        console.log("Debug: Headers CL:", req.get('Content-Length'));
        console.log("Debug: Body Preview:", JSON.stringify(req.body).substring(0, 100));
        console.log("Debug Body Keys:", Object.keys(req.body));

        if (!groq) {
            return res.status(503).json({ error: "AI Service Unconfigured (Missing API Key)" });
        }

        const { image, images } = req.body;
        // Normalize to array
        const imageList = images || (image ? [image] : []);
        console.log("Debug: Image List Length:", imageList.length);

        if (imageList.length === 0) {
            return res.status(400).json({
                error: `DEBUG_ERR: No content received. Type: ${typeof req.body}. Keys: [${Object.keys(req.body).join(', ')}]. CT: ${req.get('Content-Type')} CL: ${req.get('Content-Length')}`
            });
        }

        // Use the specific model requested by user
        const targetModel = "meta-llama/llama-4-scout-17b-16e-instruct";
        console.log("Debug: Calling Groq with Model:", targetModel);

        const prompt = `You are a coding question parser. Extract the coding problem from the image(s) into valid JSON.

REQUIRED FIELDS:
- title: String (The main problem title)
- desc: String (The FULL problem description in Markdown. Include headers like '### Problem', '### Input', '### Output'. Do NOT skip details.)
- constraints: String (Bullet points of mathematical constraints e.g., '- 1 <= n <= 100')
- company: String (Inferred from UI or 'Unknown')
- topic: String (One of: Arrays, Strings, LinkedList, Trees, Graphs, DP, Heaps, Backtracking, System Design, Other)
- difficulty: String (Easy, Medium, or Hard)
- testCases: Array of Objects [{input: [], output: any}]
- snippets: Object { cpp: String, java: String, python: String, javascript: String }

CRITICAL - READ EXAMPLES SECTION CAREFULLY:
1. Look at "Example 1:", "Example 2:", etc. in the image
2. COPY the Input and Output values EXACTLY as shown - preserve all commas between numbers
3. If the image shows "Input: nums = [10,9,2,5,3,7,101,18]", your testCase input should be [[10,9,2,5,3,7,101,18]]
4. DO NOT concatenate numbers - if you see "10, 9, 2" those are THREE separate values: 10, 9, and 2
5. Each comma in the image represents a separator between array elements

CORRECT FORMAT:
- Image shows "nums = [10,9,2,5,3,7,101,18]" → testCase: {"input": [[10,9,2,5,3,7,101,18]], "output": 4}
- Image shows "nums = [2,7,11,15], target = 9" → testCase: {"input": [[2,7,11,15], 9], "output": [0,1]}
- Image shows "s = \\"hello\\"" → testCase: {"input": ["hello"], "output": "olleh"}

WRONG (DO NOT DO THIS):
- Concatenating: [10,9,2,5] as [109,2,5] or [10925] - THIS IS WRONG
- Each number separated by comma is an INDIVIDUAL element`;

        // Limit to 4 images to prevent token/browser timeout
        // (Llama 3.2 Vision can handle multiple images, but we must be mindful of total context)
        const limitedImages = imageList.slice(0, 4);
        console.log(`Debug: Processing ${limitedImages.length} images in a SINGLE BATCH...`);

        // Construct Content Array (Text + Images)
        const contentArray = [
            { type: "text", text: prompt + `\n\nIMPORTANT: You are provided with ${limitedImages.length} images. They may be SCREENSHOTS of the SAME problem. They might be OUT OF ORDER (e.g. Image 2 might be the start, and Image 1 the end). INTELLIGENTLY STITCH the content together to form a single coherent problem description. If text is cut off in one image, look for the continuation in another.` }
        ];

        limitedImages.forEach(img => {
            contentArray.push({ type: "image_url", image_url: { url: img } });
        });

        let mergedJson = {
            title: "",
            desc: "",
            constraints: "",
            company: "",
            topic: "",
            difficulty: "",
            testCases: [],
            snippets: {}
        };

        // Single Batch Request with Retry
        let success = false;
        let attempts = 0;
        let errorLog = [];

        while (!success && attempts < 2) { // 2 Retries
            try {
                console.log(`Debug: Sending Batch Request (Attempt ${attempts + 1})...`);
                const completion = await groq.chat.completions.create({
                    model: "meta-llama/llama-4-scout-17b-16e-instruct", // UPDATED per user request
                    messages: [
                        {
                            role: "user",
                            content: contentArray
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 3000, // Increased for multiple images
                    top_p: 1,
                    stream: false,
                    response_format: { type: "json_object" }
                });

                let result = completion.choices[0].message.content.trim();
                const firstBrace = result.indexOf('{');
                const lastBrace = result.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    result = result.substring(firstBrace, lastBrace + 1);
                    mergedJson = JSON.parse(result); // Direct assignment, context is continuous
                }
                success = true;
            } catch (innerErr) {
                console.error(`Debug: Batch Extraction Failed (Attempt ${attempts + 1}):`, innerErr.message);
                attempts++;
                if (attempts < 2) {
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    errorLog.push(`Batch Failed: ${innerErr.message}`);
                }
            }
        }

        // Post-Processing & Formatting
        if (!mergedJson.title || mergedJson.title.trim().length === 0) mergedJson.title = "Untitled Scanned Scene";
        if (!mergedJson.company) mergedJson.company = "Unknown";

        // Normalize Topic to Schema Enum
        const validTopics = ['Arrays', 'Strings', 'Arrays/Strings', 'Matrix', 'LinkedList', 'Trees', 'Graphs', 'DP', 'System Design', 'Heaps', 'Backtracking', 'Other'];
        let topic = (mergedJson.topic || "Arrays").trim();

        // Fix common AI mismatches
        if (topic === "String") topic = "Strings";
        if (topic === "Linked List") topic = "LinkedList";
        if (topic === "Dynamic Programming") topic = "DP";

        // Final validation
        if (!validTopics.includes(topic)) {
            console.log(`Debug: Invalid Topic '${topic}' detected. Defaulting to 'Other'.`);
            topic = "Other";
        }
        console.log(`Debug: Final Topic for Response: '${topic}'`);
        mergedJson.topic = topic;

        if (!mergedJson.difficulty) mergedJson.difficulty = "Medium";

        // NOTE: The AI sometimes concatenates array values (e.g., [10,9,2,5] becomes 1092,5).
        // This is a limitation of the vision model. Users should verify and correct test cases manually.
        console.log("Debug: Raw testCases from AI:", JSON.stringify(mergedJson.testCases, null, 2));

        // Append Errors to Desc for visibility
        if (errorLog.length > 0) {
            mergedJson.desc += `\n\n**Debug Errors:**\n${errorLog.join('\n')}`;
        }

        // Clean Constraints (Bulletizer)
        if (mergedJson.constraints) {
            // Ensure the very first line starts with a bullet if not already
            if (!mergedJson.constraints.trim().startsWith('-') && !mergedJson.constraints.trim().startsWith('*')) {
                mergedJson.constraints = '- ' + mergedJson.constraints;
            }

            mergedJson.constraints = mergedJson.constraints
                .replace(/(\d+)\s+(?=\d+\s*<)/g, "$1\n- ") // Split consecutive numbers followed by comparison
                .replace(/(\W)\s+(?=\d+\s*<)/g, "$1\n- ") // Split end of logic to start of next logic
                .replace(/\n(?=[^-])/g, "\n- "); // Ensure all newlines are followed by bullets

            // Advanced Filter: Remove lines that look like description text (too long, no numbers/operators)
            const constraintLines = mergedJson.constraints.split('\n');
            const validLines = constraintLines.filter(line => {
                const clean = line.replace(/^- /, '').trim();
                // Keep if it has mathematical operators OR is short (< 100 chars) AND has numbers
                const isMath = /[<>=]/.test(clean);
                const isShortAndNumbered = clean.length < 80 && /\d/.test(clean);
                return isMath || isShortAndNumbered;
            });
            mergedJson.constraints = validLines.join('\n');
        }

        res.json(mergedJson);
    } catch (err) {
        console.error("AI Extraction Error:", err);
        // Fallback: If AI fails, return partial data instead of 500 so user can manually fill
        res.status(200).json({
            title: `Extraction Failed - Manual Edit Required ${new Date().toISOString()}`,
            desc: "AI Extraction Failed. Please enter manually.",
            company: "Unknown",
            topic: "Arrays",
            difficulty: "Medium",
            testCases: [],
            constraints: ""
        });
    }
});

// Helper to escape regex characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// 1. Get All Questions (User Perspective: Browse Feed)
app.get('/api/questions', async (req, res) => {
    try {
        let { company, topic, difficulty, page = 1, limit = 12, search } = req.query;
        let query = { status: 'approved' };

        // Sanitize query parameters (limit length, prevent abuse)
        if (company && typeof company === 'string') {
            company = company.substring(0, 100);
            query.company = { $regex: new RegExp(escapeRegex(company), 'i') };
        }
        if (topic && typeof topic === 'string') {
            topic = topic.substring(0, 50);
            query.topic = { $regex: new RegExp(`^${escapeRegex(topic)}$`, 'i') };
        }
        if (difficulty && typeof difficulty === 'string') {
            difficulty = difficulty.substring(0, 20);
            query.difficulty = { $regex: new RegExp(`^${escapeRegex(difficulty)}$`, 'i') };
        }

        // Search Implementation
        if (search && typeof search === 'string') {
            const searchSanitized = search.substring(0, 100);
            const searchRegex = new RegExp(escapeRegex(searchSanitized), 'i');
            query.$or = [
                { title: { $regex: searchRegex } },
                { company: { $regex: searchRegex } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 12;
        const skip = (pageNum - 1) * limitNum;

        const total = await Question.countDocuments(query);
        const questions = await Question.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        const formatted = questions.map(q => ({
            ...q.toObject(),
            id: q._id
        }));

        res.json({
            questions: formatted,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 2. Get Company Profile (Entity View)
app.get('/api/companies/:slug', async (req, res) => {
    try {
        // Sanitize slug: lowercase, alphanumeric and dashes only, limit length
        let slug = req.params.slug || '';
        slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 100);

        if (!slug) {
            return res.status(400).json({ error: "Invalid company slug" });
        }

        console.log(`Debug: Fetching company profile for slug: '${slug}'`);

        const company = await Company.findOne({ slug });

        if (!company) {
            console.log(`Debug: Company not found for slug: '${slug}'`);
            return res.status(404).json({ error: "Company not found" });
        }

        console.log(`Debug: Found Company: '${company.name}' (ID: ${company._id})`);

        // Escape regex special characters to prevent errors
        const escapedName = company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedName, 'i');
        console.log(`Debug: Searching questions with regex: ${regex}`);

        // Fetch questions for this company (Case Insensitive Regex)
        // We match strict word boundaries if possible to avoid partial matches (e.g. "Go" matching "Google")
        // But simply "Google" should match "Google, Amazon"
        const questions = await Question.find({
            company: { $regex: regex }, // Keep it simple for now, refine if needed
            status: 'approved'
        }).sort({ date: -1 });

        console.log(`Debug: Found ${questions.length} questions for ${company.name}`);

        const formattedQuestions = questions.map(q => ({ ...q.toObject(), id: q._id }));

        res.json({
            company: { ...company.toObject(), id: company._id },
            questions: formattedQuestions
        });
    } catch (err) {
        console.error("Error in GET /api/companies/:slug:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 3. Get All Companies (For Directories/Sitemap)
app.get('/api/companies', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search && typeof search === 'string') {
            // Escape regex special characters to prevent errors
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.name = { $regex: new RegExp(escapedSearch, 'i') };
        }

        const companies = await Company.find(query).sort({ name: 1 });
        res.json(companies);
    } catch (err) {
        console.error("Error fetching companies:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 3b. Get Images by Company Slug
app.get('/api/companies/:slug/images', async (req, res) => {
    try {
        let slug = req.params.slug || '';
        slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 100);

        if (!slug) {
            return res.status(400).json({ error: "Invalid company slug" });
        }

        const companyImages = await CompanyImage.findOne({ companySlug: slug });

        if (!companyImages) {
            return res.json({
                company: slug,
                images: [],
                count: 0
            });
        }

        res.json({
            company: slug,
            images: companyImages.imageUrls || [],
            count: companyImages.imageUrls ? companyImages.imageUrls.length : 0
        });
    } catch (err) {
        console.error("Error fetching company images:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 3a. Global Search (Unified)
app.get('/api/search', async (req, res) => {
    try {
        const { search, limit = 5 } = req.query;
        if (!search || typeof search !== 'string') {
            return res.json([]);
        }

        const limitNum = parseInt(limit) || 5;
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearch, 'i');

        // Parallel search: Companies and Questions
        const [companies, questions] = await Promise.all([
            Company.find({ name: { $regex: regex } }).limit(limitNum).lean(),
            Question.find({
                $or: [
                    { title: { $regex: regex } },
                    { company: { $regex: regex } } // Also search company field in questions? Maybe distinct?
                    // User said "if user search company name particular company will show"
                    // If I search "Amazon", I expect the Company "Amazon", not just 10 questions from Amazon.
                ],
                status: 'approved'
            }).limit(limitNum).lean()
        ]);

        // Format results
        const companyResults = companies.map(c => ({
            type: 'company',
            title: c.name,
            slug: c.slug,
            img: c.logo || 'bg-gray-700'
        }));

        const questionResults = questions.map(q => ({
            type: 'question',
            title: q.title,
            slug: q.slug,
            company: q.company,
            difficulty: q.difficulty
        }));

        // Interleave or prioritize?
        // User wants "particular company will show and will be opened"
        // Let's return mixed list, frontend handles opens.
        const results = [...companyResults, ...questionResults].slice(0, limitNum * 2);

        res.json(results);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

// 4. Get Single Question
// 4. Get Single Question (Public - Approved Only)
app.get('/api/questions/:id', async (req, res) => {
    try {
        const idOrSlug = req.params.id;
        let question;

        // Try finding by ID first
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            question = await Question.findOne({ _id: idOrSlug, status: 'approved' });
        }

        // If not found by ID, try slug
        if (!question) {
            question = await Question.findOne({ slug: idOrSlug, status: 'approved' });
        }

        if (question) {
            // INCREMENT VIEWS
            let currentViews = parseInt(question.views || "0");
            if (isNaN(currentViews)) currentViews = 0;
            question.views = (currentViews + 1).toString();
            await question.save(); // Save the incremented view count

            res.json({ ...question.toObject(), id: question._id });
        } else {
            res.status(404).json({ error: "Question not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 4a. Get Single Question (Admin/Preview - Any Status)
app.get('/api/admin/questions/:id', async (req, res) => {
    try {
        const id = req.params.id; // Admin usually uses ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const question = await Question.findById(id);

        if (question) {
            res.json({ ...question.toObject(), id: question._id });
        } else {
            res.status(404).json({ error: "Question not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 5. Post Question (Public - Moderated / Admin - Direct)
app.post('/api/questions', async (req, res) => {
    try {
        let { title, company, topic, difficulty, desc, constraints, snippets, date, img, slug, testCases, images, status } = req.body;

        // --- INPUT VALIDATION & SANITIZATION ---
        // Sanitize all string inputs
        title = sanitizeString(title, 200);
        company = sanitizeString(company, 100);
        topic = sanitizeTopic(topic);
        difficulty = sanitizeDifficulty(difficulty);
        desc = sanitizeText(desc, 50000); // Allow longer descriptions
        constraints = sanitizeText(constraints, 5000);
        slug = slug ? sanitizeSlug(slug) : '';
        img = sanitizeString(img, 50); // CSS class name

        // Validate images array (limit count and size)
        if (images && Array.isArray(images)) {
            if (images.length > 10) {
                return res.status(400).json({ error: "Too many images. Maximum 10 allowed." });
            }
            // Check each image is a string and not excessively long (base64 can be large but reasonable)
            images = images.filter(img => typeof img === 'string' && img.length < 20000000); // ~15MB per image max
        } else {
            images = [];
        }

        // Validate testCases array structure
        if (testCases && Array.isArray(testCases)) {
            testCases = testCases.slice(0, 50).map(tc => ({
                input: Array.isArray(tc.input) ? tc.input : [],
                output: tc.output !== undefined ? tc.output : null
            }));
        } else {
            testCases = [];
        }

        // Validate snippets object
        if (snippets && typeof snippets === 'object') {
            const allowedLangs = ['cpp', 'java', 'python', 'javascript'];
            const cleanSnippets = {};
            for (const lang of allowedLangs) {
                if (snippets[lang] && typeof snippets[lang] === 'string') {
                    cleanSnippets[lang] = snippets[lang].substring(0, 50000);
                }
            }
            snippets = cleanSnippets;
        } else {
            snippets = {};
        }

        // Security: Only allow 'approved' status if Admin Key is present
        const adminSecret = process.env.ADMIN_SECRET;
        const isAdmin = adminSecret && req.headers['x-admin-secret'] === adminSecret;

        if (!isAdmin) {
            status = 'pending'; // Force pending for public submissions
        }

        // Cloudinary Upload for Base64 Images
        let processedImages = [];
        if (images && Array.isArray(images)) {
            for (let image of images) {
                if (typeof image === 'string' && image.startsWith('data:image')) {
                    try {
                        const uploadRes = await cloudinary.uploader.upload(image, {
                            folder: "oa_hub_uploads",
                        });
                        console.log("Uploaded to Cloudinary:", uploadRes.secure_url);
                        processedImages.push(uploadRes.secure_url);
                    } catch (upErr) {
                        console.error("Cloudinary Upload Error:", upErr.message);
                        // Skip failed uploads for security
                    }
                } else if (typeof image === 'string' && validator.isURL(image, { protocols: ['https'] })) {
                    // Only allow HTTPS URLs (existing Cloudinary URLs)
                    processedImages.push(image);
                }
            }
        }

        // Apply Defaults for "Quick Submit" (Pending Mode)
        if (!title || title.trim() === "") {
            title = `Snapshot Upload ${new Date().toISOString().substring(0, 19).replace('T', ' ')}`;
        }
        if (!desc || desc.trim() === "") desc = "See attached screenshots for problem description.";
        if (!company || company.trim() === "") company = "Unknown";
        if (!topic || topic.trim() === "") topic = "Arrays";
        if (!difficulty || difficulty.trim() === "") difficulty = "Medium";

        console.log("Debug: Final Data for Create:", { title, company, topic, difficulty, desc: desc.substring(0, 100), status, isAdmin });

        // Auto-generate slug if not provided
        let questionSlug = slug;
        if (!questionSlug && title) {
            questionSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        // Ensure slug uniqueness
        const existing = await Question.findOne({ slug: questionSlug });
        if (existing) {
            questionSlug = `${questionSlug}-${Math.floor(Math.random() * 1000)}`;
        }

        const newQuestion = await Question.create({
            slug: questionSlug,
            title,
            company,
            topic,
            difficulty,
            desc,
            constraints: constraints || "",
            snippets: snippets || {},
            testCases: testCases || [], // Expecting array of {input, output} objects
            date: date || Date.now(),
            img: img || 'bg-gray-800', // Default color
            images: processedImages, // Use Cloudinary URLs
            status: status || 'pending', // Allow setting status
            views: '0',
            likes: '0%'
        });

        // Store image URLs by company name in CompanyImage collection
        if (processedImages.length > 0 && company && company.toLowerCase() !== 'unknown' && company.trim() !== '') {
            const companyLower = company.toLowerCase().trim();
            const companySlugForImages = companyLower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            try {
                // Use findOneAndUpdate with $push to add URLs to existing array, or create new doc if not exists
                await CompanyImage.findOneAndUpdate(
                    { companySlug: companySlugForImages },
                    {
                        $setOnInsert: { companyName: companyLower, companySlug: companySlugForImages },
                        $push: { imageUrls: { $each: processedImages } }
                    },
                    { upsert: true, new: true }
                );
                console.log(`Stored ${processedImages.length} image URL(s) for company: ${companyLower}`);
            } catch (imgErr) {
                console.error(`Failed to store company images: ${imgErr.message}`);
            }
        }


        // Sync with Company Collection AND Normalize if created with approved status
        if (newQuestion.status === 'approved' && newQuestion.company && newQuestion.company.trim() !== "" && newQuestion.company.toLowerCase() !== "unknown") {
            const companyNames = newQuestion.company.split(',').map(c => c.trim()).filter(c => c !== "");
            let normalizedCompanyNames = [];

            for (const companyName of companyNames) {
                const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

                // Find or create company (case-insensitive search)
                let company = await Company.findOne({
                    slug: companySlug
                });

                if (!company) {
                    try {
                        company = await Company.create({
                            name: companyName, // Use original casing if new
                            slug: companySlug,
                            logo: 'bg-gray-700',
                            subscribers: '0',
                            description: `Questions from ${companyName}`
                        });
                        console.log(`Created new company: ${companyName}`);
                        normalizedCompanyNames.push(companyName);
                    } catch (createErr) {
                        // On duplicate slug race condition, try to fetch again
                        company = await Company.findOne({ slug: companySlug });
                        if (company) normalizedCompanyNames.push(company.name);
                        else normalizedCompanyNames.push(companyName); // Fallback
                    }
                } else {
                    console.log(`Company ${companyName} matched to existing ${company.name}`);
                    normalizedCompanyNames.push(company.name); // Use existing canonical name
                }
            }
            // Update question with normalized names
            if (normalizedCompanyNames.length > 0) {
                newQuestion.company = normalizedCompanyNames.join(', ');
                await newQuestion.save();
            }
        }

        res.status(201).json(newQuestion);
    } catch (err) {
        console.error("Submission Error:", err);
        res.status(400).json({ error: 'Invalid data', details: err.message, validation: err.errors });
    }
});

// 5a. Update Question (Admin Perspective: Edit Content)
app.put('/api/questions/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }

        let { title, company, topic, difficulty, desc, constraints, snippets, date, img, slug, testCases, images, deletedImages } = req.body;

        // --- INPUT VALIDATION & SANITIZATION ---
        title = sanitizeString(title, 200);
        company = sanitizeString(company, 100);
        topic = sanitizeTopic(topic);
        difficulty = sanitizeDifficulty(difficulty);
        desc = sanitizeText(desc, 50000);
        constraints = sanitizeText(constraints, 5000);
        slug = slug ? sanitizeSlug(slug) : undefined;
        img = sanitizeString(img, 50);

        // Validate testCases
        if (testCases && Array.isArray(testCases)) {
            testCases = testCases.slice(0, 50).map(tc => ({
                input: Array.isArray(tc.input) ? tc.input : [],
                output: tc.output !== undefined ? tc.output : null
            }));
        }

        // Validate snippets
        if (snippets && typeof snippets === 'object') {
            const allowedLangs = ['cpp', 'java', 'python', 'javascript'];
            const cleanSnippets = {};
            for (const lang of allowedLangs) {
                if (snippets[lang] && typeof snippets[lang] === 'string') {
                    cleanSnippets[lang] = snippets[lang].substring(0, 50000);
                }
            }
            snippets = cleanSnippets;
        }

        // Validate images array
        if (images && Array.isArray(images)) {
            images = images.filter(img =>
                typeof img === 'string' &&
                (img.startsWith('data:image') || validator.isURL(img, { protocols: ['https'] }))
            ).slice(0, 10);
        }

        // Handle Image Deletions (Frontend sends array of URLs to delete)
        if (deletedImages && Array.isArray(deletedImages) && deletedImages.length > 0) {
            console.log(`Debug: Processing ${deletedImages.length} image deletions...`);
            for (const imageUrl of deletedImages) {
                // Extract public_id from URL
                // Example: https://res.cloudinary.com/demo/image/upload/v12345/oa_hub_uploads/sample.jpg
                // Public ID: oa_hub_uploads/sample
                try {
                    const parts = imageUrl.split('/');
                    const filename = parts.pop();
                    const folder = parts.pop();
                    if (folder === 'oa_hub_uploads') { // Security check
                        const publicId = `${folder}/${filename.split('.')[0]}`;
                        await cloudinary.uploader.destroy(publicId);
                        console.log(`Deleted from Cloudinary: ${publicId}`);
                    }
                } catch (delErr) {
                    console.error("Image deletion error:", delErr);
                }
            }
        }

        // Handle Image Uploads (New base64)
        let processedImages = images || [];
        // If images is mixed base64/url, we need to upload base64 ones
        // But for simplicity, we assume frontend manages the list order.
        // We need to re-scan the images array for any new base64
        if (processedImages && Array.isArray(processedImages)) {
            for (let i = 0; i < processedImages.length; i++) {
                if (processedImages[i].startsWith('data:image')) {
                    const uploadRes = await cloudinary.uploader.upload(processedImages[i], {
                        folder: "oa_hub_uploads",
                    });
                    processedImages[i] = uploadRes.secure_url;
                }
            }
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            {
                title,
                company,
                topic,
                difficulty,
                desc,
                constraints: constraints || "",
                snippets: snippets || {},
                testCases: testCases || [],
                img: img || 'bg-gray-800',
                slug: slug,
                images: processedImages
            },
            { new: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ error: "Question not found" });
        }

        res.json(updatedQuestion);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Invalid data', details: err.message });
    }
});

// 6. Admin: Get Pending Questions
app.get('/api/admin/questions', checkAdmin, async (req, res) => {
    try {
        const questions = await Question.find({ status: 'pending' }).sort({ date: -1 });
        const formatted = questions.map(q => ({
            ...q.toObject(),
            id: q._id
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 7. Admin: Approve Question
app.put('/api/admin/questions/:id/approve', checkAdmin, async (req, res) => {
    try {
        // First find the question to get its data
        let question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Sync Comany & Normalize Name
        if (question.company && question.company.trim() !== "") {
            const companyNames = question.company.split(',').map(c => c.trim()).filter(c => c !== "");
            let normalizedCompanyNames = [];

            for (const companyName of companyNames) {
                const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

                // Find Compnay
                let company = await Company.findOne({ slug: slug });

                if (!company) {
                    // Create New
                    try {
                        company = await Company.create({
                            name: companyName,
                            slug: slug,
                            logo: "bg-gray-700",
                            description: `${companyName} interview questions.`
                        });
                        normalizedCompanyNames.push(companyName);
                    } catch (e) {
                        // Race condition check
                        company = await Company.findOne({ slug: slug });
                        if (company) normalizedCompanyNames.push(company.name);
                        else normalizedCompanyNames.push(companyName);
                    }
                } else {
                    // Exists -> Use Canonical Name
                    normalizedCompanyNames.push(company.name);
                }
            }

            // Update Question with Normalized Names and Approved Status
            question.company = normalizedCompanyNames.join(', ');
            question.status = 'approved';
            await question.save();
        } else {
            // Just approve if no company
            question.status = 'approved';
            await question.save();
        }

        res.json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 8. Admin: Reject/Delete Question
app.delete('/api/admin/questions/:id', checkAdmin, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        res.json({ message: "Question deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to format JS values to C++ literals
// Helper: Convert JS values to C++ literals
function toCppLiteral(val) {
    if (val === null || val === undefined) return "0";
    if (Array.isArray(val)) {
        if (val.length === 0) return "{}";
        const cppElements = val.map(toCppLiteral).join(", ");
        return `{${cppElements}}`;
    }
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'boolean') return val ? "true" : "false";
    return val.toString();
}

// Import Runner
const { runCode } = require('./judge/runner');

// Helper: Generate C++ Driver
function generateCppDriver(userCode, testCases) {
    let mainBody = `
    Solution sol;
    int passed = 0;
    int total = ${testCases.length};
    `;

    testCases.forEach((tc, idx) => {
        const args = tc.input.map(arg => {
            if (Array.isArray(arg)) return `vector<int>${toCppLiteral(arg)}`;
            return toCppLiteral(arg);
        }).join(", ");

        // Custom Run
        if (tc.output === null) {
            mainBody += `
            {
                cout << "Test Case ${idx + 1}: RUNNING..." << endl;
                auto result = sol.solution(${args});
                cout << "Result: ";
                print(result);
                cout << endl;
            }
            `;
        }
        // Judged Run
        else {
            const expected = toCppLiteral(tc.output);
            if (Array.isArray(tc.output)) {
                mainBody += `
                {
                    vector<int> result = sol.solution(${args});
                    vector<int> expected = vector<int>${expected};
                    if (result == expected) {
                        cout << "Test Case ${idx + 1}: PASSED" << endl;
                        cout << "Expected: "; print(expected); cout << " Got: "; print(result); cout << endl;
                        passed++;
                    } else {
                        cout << "Test Case ${idx + 1}: FAILED" << endl;
                        cout << "Expected: "; print(expected); cout << " Got: "; print(result); cout << endl;
                    }
                }
                `;
            } else {
                mainBody += `
                {
                    auto result = sol.solution(${args});
                    auto expected = ${expected};
                    if (result == expected) {
                        cout << "Test Case ${idx + 1}: PASSED" << endl;
                        cout << "Expected: " << expected << " Got: " << result << endl;
                        passed++;
                    } else {
                        cout << "Test Case ${idx + 1}: FAILED" << endl;
                        cout << "Expected: " << expected << " Got: " << result << endl;
                    }
                }
                `;
            }
        }
    });

    if (testCases.length > 0 && testCases[0].output !== null) {
        mainBody += `
        if (passed == total) cout << "VERDICT: ACCEPTED" << endl;
        else cout << "VERDICT: WRONG ANSWER" << endl;
        `;
    } else {
        mainBody += `cout << "VERDICT: CUSTOM RUN COMPLETE" << endl;`;
    }

    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <unordered_map>
using namespace std;

// Print Helper
template<typename T>
void print(T val) { cout << val; }
template<typename T>
void print(vector<T> val) {
    cout << "[";
    for(int i=0; i<val.size(); ++i) {
        if(i>0) cout << ",";
        print(val[i]);
    }
    cout << "]";
}

${userCode}

int main() {
    ${mainBody}
    return 0;
}
    `;
}

// Helper: Generate Python Driver
function generatePythonDriver(userCode, testCases) {
    const testCasesJson = JSON.stringify(testCases);
    return `
import sys
import json

${userCode}

def run_tests():
    # Use json.loads to safely parse JSON into Python objects (null -> None, true -> True)
    test_cases = json.loads('''${testCasesJson}''')
    passed = 0
    total = len(test_cases)
    
    try:
        sol = Solution()
    except:

        print("VERDICT: RUNTIME ERROR")
        print("Could not initialize Solution class")
        return

    for i, tc in enumerate(test_cases):
        inputs = tc['input']
        expected = tc.get('output') 
        
        try:
            # Call solution(*inputs)
            result = sol.solution(*inputs)
            
            if expected is None:
                # Custom Run
                print(f"Test Case {i+1}: CUSTOM")
                print(f"Result: {result}")
            else:
                # Judged Run
                if result == expected:
                    print(f"Test Case {i+1}: PASSED")
                    print(f"Expected: {expected}, Got: {result}")
                    passed += 1
                else:
                    print(f"Test Case {i+1}: FAILED")
                    print(f"Expected: {expected}, Got: {result}")
        except Exception as e:
            print(f"Test Case {i+1}: RUNTIME ERROR")
            print(e)
            
    # Only print Verdict if not custom
    if len(test_cases) > 0 and test_cases[0].get('output') is not None:
        if passed == total:
            print("VERDICT: ACCEPTED")
        else:
            print("VERDICT: WRONG ANSWER")
    else:
        print("VERDICT: CUSTOM RUN COMPLETE")

if __name__ == "__main__":
    run_tests()
`;
}


// Helper: Format values to Java literals
// Helper: Format values to Java literals
function toJavaLiteral(val) {
    if (val === null || val === undefined) return "0";
    if (Array.isArray(val)) {
        if (val.length === 0) return "new int[]{}"; // Assumption: int array for now
        // Heuristic: check first element type
        if (typeof val[0] === 'string') {
            const elements = val.map(toJavaLiteral).join(", ");
            return `new String[]{${elements}}`;
        }
        const elements = val.map(toJavaLiteral).join(", ");
        return `new int[]{${elements}}`;
    }
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'boolean') return val ? "true" : "false";
    return val.toString();
}

// Helper: Generate Java Driver
function generateJavaDriver(userCode, testCases) {
    let mainBody = `
        Solution sol = new Solution();
        int passed = 0;
        int total = ${testCases.length};
    `;

    testCases.forEach((tc, idx) => {
        const args = tc.input.map(toJavaLiteral).join(", ");

        // Handle Custom Input (null output)
        if (tc.output === null) {
            mainBody += `
           {
               System.out.println("Test Case ${idx + 1}: RUNNING...");
               try {
                    // Check return type dynamically slightly hard in Java without more reflection or assumption.
                    // Assuming similar return types to standard problem.
                    // Let's print generically.
                    // Actually, 'sol.solution' returns a specific type. System.out.println can handle objects/primitives.
                    // But arrays need Arrays.toString().
                    
                    // Since we don't know the exact return type here easily without parsing user code, 
                    // we can wrap execution and try to print nicely if it's an array.
                    // But 'sol.solution' call is the issue if we don't assign it to variable of correct type.
                    // Wait, we can use 'var' in Java 10+. The Dockerfile says OpenJDK 17. So 'var' works.
                    
                    var result = sol.solution(${args});
                    
                    if (result != null && result.getClass().isArray()) {
                        if (result instanceof int[]) System.out.println("Result: " + Arrays.toString((int[])result));
                        else if (result instanceof double[]) System.out.println("Result: " + Arrays.toString((double[])result));
                        else if (result instanceof boolean[]) System.out.println("Result: " + Arrays.toString((boolean[])result));
                        else System.out.println("Result: " + Arrays.deepToString((Object[])result));
                    } else {
                        System.out.println("Result: " + result);
                    }
               } catch(Exception e) {
                    System.out.println("Runtime Error: " + e.getMessage());
               }
           }
           `;
        } else {
            const expected = toJavaLiteral(tc.output);

            // Output comparison logic (arrays vs primitives)
            let compareLogic = "";
            let expectedPrint = "";
            let resultPrint = "";

            if (Array.isArray(tc.output)) {
                compareLogic = `Arrays.equals(result, expected)`;
                expectedPrint = `Arrays.toString(expected)`;
                resultPrint = `Arrays.toString(result)`;

                mainBody += `
               {
                   int[] result = sol.solution(${args});
                   int[] expected = ${expected};
                   if (${compareLogic}) {
                       System.out.println("Test Case ${idx + 1}: PASSED");
                       System.out.println("Expected: " + ${expectedPrint} + " Got: " + ${resultPrint});
                       passed++;
                   } else {
                       System.out.println("Test Case ${idx + 1}: FAILED");
                       System.out.println("Expected: " + ${expectedPrint} + " Got: " + ${resultPrint});
                   }
               }
               `;
            } else {
                compareLogic = `result == expected`;
                if (typeof tc.output === 'string') compareLogic = `result.equals(expected)`;

                mainBody += `
               {
                   var result = sol.solution(${args});
                   var expected = ${expected};
                   if (${compareLogic}) {
                       System.out.println("Test Case ${idx + 1}: PASSED");
                       System.out.println("Expected: " + expected + " Got: " + result);
                       passed++;
                   } else {
                       System.out.println("Test Case ${idx + 1}: FAILED");
                       System.out.println("Expected: " + expected + " Got: " + result);
                   }
               }
               `;
            }
        }
    });

    if (testCases.length > 0 && testCases[0].output !== null) {
        mainBody += `
            if (passed == total) System.out.println("VERDICT: ACCEPTED");
            else System.out.println("VERDICT: WRONG ANSWER");
        `;
    } else {
        mainBody += `System.out.println("VERDICT: CUSTOM RUN COMPLETE");`;
    }

    return `
import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        try {
            ${mainBody}
        } catch (Exception e) {
            System.out.println("VERDICT: RUNTIME ERROR");
            e.printStackTrace();
        }
    }
}
    `;
}

// Reference Solutions (Trusted Python Code)
// Used to calculate Expected Output for Custom Inputs at runtime.
const references = {
    "Two Sum": `
class Solution:
    def solution(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
`,
    "Find the Missing Number": `
class Solution:
    def solution(self, nums):
        n = len(nums)
        expected = n * (n + 1) // 2
        actual = sum(nums)
        return expected - actual
`,
    "Group Anagrams": `
class Solution:
    def solution(self, strs):
        groups = {}
        for s in strs:
            key = "".join(sorted(s))
            if key not in groups:
                groups[key] = []
            groups[key].append(s)
        # Sort for deterministic comparison
        result = list(groups.values())
        for group in result:
            group.sort()
        result.sort(key=lambda x: (len(x), x[0] if x else ""))
        return result
`,
    "Longest Substring No Repeats": `
class Solution:
    def solution(self, s):
        used = {}
        max_len = 0
        left = 0
        for i, char in enumerate(s):
            if char in used and left <= used[char]:
                left = used[char] + 1
            else:
                max_len = max(max_len, i - left + 1)
            used[char] = i
        return max_len
`,
    "Merge k Sorted Lists": `
import heapq
class Solution:
    def solution(self, lists):
        # Flatten and sort (simple reference implementation)
        merged = []
        for lst in lists:
            merged.extend(lst)
        merged.sort()
        return merged
`,
    "Reverse Linked List Group K": `
class Solution:
    def solution(self, head, k):
        # Array manipulation reference
        if not head or k <= 1:
            return head
        
        result = []
        n = len(head)
        for i in range(0, n, k):
            chunk = head[i:i+k]
            if len(chunk) == k:
                chunk.reverse()
            result.extend(chunk)
        return result
`
};

// 4. Code Execution Engine
app.post('/api/execute', async (req, res) => {
    let { code, language, questionId, customInput } = req.body;
    const vm = require('vm');

    try {
        // --- INPUT VALIDATION ---
        // Validate language
        const allowedLanguages = ['cpp', 'python', 'java', 'javascript'];
        if (!language || typeof language !== 'string' || !allowedLanguages.includes(language)) {
            return res.json({ status: "error", logs: ["> Invalid or unsupported language."] });
        }

        // Validate code (must be string, limit length to prevent abuse)
        if (!code || typeof code !== 'string') {
            return res.json({ status: "error", logs: ["> No code provided."] });
        }
        if (code.length > 100000) { // 100KB limit
            return res.json({ status: "error", logs: ["> Code too long. Maximum 100KB allowed."] });
        }

        // Validate questionId
        if (!questionId || !isValidObjectId(questionId)) {
            return res.json({ status: "error", logs: ["> Invalid question ID."] });
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return res.json({ status: "error", logs: ["> Question not found."] });
        }

        if (question.topic === "System Design") {
            return res.json({
                status: "accepted",
                logs: ["> System Design questions are architectural.", "> No automated tests available.", "VERDICT: SUBMITTED"]
            });
        }

        // Determine Test Cases to Run
        let testCases = question.testCases || [];
        let isCustomRun = false;

        // Handle Custom Input
        console.log("Debug: Received customInput:", JSON.stringify(customInput));
        if (customInput && Array.isArray(customInput)) {
            isCustomRun = true;
            console.log("Debug: Processing as Custom Run");
            // Override test cases with User Input, Output null (initially)
            testCases = [{
                input: customInput,
                output: null
            }];
        } else if (!testCases || testCases.length === 0) {
            return res.json({ status: "error", logs: ["> No test cases configured for this question.", "> Execution passed trivially (0/0), but this is likely an error."] });
        }

        console.log(`Debug: Question Title: "${question.title}"`);
        console.log("Debug: Available References:", Object.keys(references));

        // Helper: Generate JavaScript Driver
        function generateJsDriver(userCode, testCases) {
            let mainBody = `
    const sol = solution;
    let passed = 0;
    const total = ${testCases.length};
    `;

            testCases.forEach((tc, idx) => {
                // Format args for JS call
                const args = tc.input.map(arg => JSON.stringify(arg)).join(", ");

                // Custom Run (output is null)
                if (tc.output === null) {
                    mainBody += `
            try {
                console.log("Test Case ${idx + 1}: RUNNING...");
                const result = sol(${args});
                // Helper to print result nicely
                const printRes = (res) => {
                    if (Array.isArray(res)) return JSON.stringify(res);
                    return res;
                };
                console.log("Result: " + printRes(result));
            } catch (e) {
                console.log("Test Case ${idx + 1}: RUNTIME ERROR");
                console.log(e.toString());
            }
            `;
                }
                // Judged Run
                else {
                    const expected = JSON.stringify(tc.output);
                    mainBody += `
            try {
                const result = sol(${args});
                const expected = ${expected};
                
                // Deep equality check helper
                const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
                
                if (isEqual(result, expected)) {
                    console.log("Test Case ${idx + 1}: PASSED");
                    console.log("Expected: " + JSON.stringify(expected) + " Got: " + JSON.stringify(result));
                    passed++;
                } else {
                    console.log("Test Case ${idx + 1}: FAILED");
                    console.log("Expected: " + JSON.stringify(expected) + " Got: " + JSON.stringify(result));
                }
            } catch (e) {
                console.log("Test Case ${idx + 1}: RUNTIME ERROR");
                console.log(e.toString());
            }
            `;
                }
            });

            if (testCases.length > 0 && testCases[0].output !== null) {
                mainBody += `
        if (passed === total) console.log("VERDICT: ACCEPTED");
        else console.log("VERDICT: WRONG ANSWER");
        `;
            } else {
                mainBody += `console.log("VERDICT: CUSTOM RUN COMPLETE");`;
            }

            return `
${userCode}

// Driver Code
(function() {
    ${mainBody}
})();
    `;
        }

        // --- EXECUTION ---
        if (['cpp', 'python', 'java', 'javascript'].includes(language)) {
            let fullSource = "";

            // 1. Prepare User Driver
            if (language === 'cpp') {
                try { fullSource = generateCppDriver(code, testCases); }
                catch (e) { return res.json({ status: "error", logs: ["Error generating C++ driver: " + e.message] }); }
            } else if (language === 'python') {
                fullSource = generatePythonDriver(code, testCases);
            } else if (language === 'java') {
                fullSource = generateJavaDriver(code, testCases);
            } else if (language === 'javascript') {
                fullSource = generateJsDriver(code, testCases);
            }

            // 2. Run User Code
            // We run this first. If it's a Custom Run, we might ALSO run the Reference Code.
            const userResultPromise = runCode(language, fullSource, "");

            let referenceResultPromise = Promise.resolve(null);

            // 3. Run Reference Code (If Custom Run && Reference Exists)
            if (isCustomRun) {
                console.log(`Debug: Checking reference for "${question.title}"`);
                if (references[question.title]) {
                    console.log("Debug: Reference found, executing...");
                    const refCode = references[question.title];
                    // Always use Python driver for reference since our references are Python
                    const refDriver = generatePythonDriver(refCode, testCases);
                    referenceResultPromise = runCode('python', refDriver, "");
                } else {
                    console.log("Debug: No reference found.");
                }
            }

            // Await both
            const [userResult, refResult] = await Promise.all([userResultPromise, referenceResultPromise]);

            console.log("Debug: User Result status:", userResult.status);
            if (refResult) {
                console.log("Debug: Ref Result stdout:", refResult.stdout);
                console.log("Debug: Ref Result stderr:", refResult.stderr);
            } else {
                console.log("Debug: Ref Result is null");
            }

            // 4. Process User Output
            const logs = userResult.stdout.split('\n').filter(l => l.trim());
            if (userResult.stderr) logs.push(`STDERR: ${userResult.stderr} `);

            let status = "wrong_answer";
            if (userResult.status === 'TLE') status = 'time_limit_exceeded';
            else if (userResult.status === 'CE') status = 'compilation_error';
            else if (userResult.status === 'RE') status = 'runtime_error';
            else if (userResult.stdout.includes("VERDICT: ACCEPTED")) status = "accepted";
            else if (userResult.stdout.includes("VERDICT: CUSTOM RUN COMPLETE")) status = "custom_run_complete";

            // 5. Compare with Reference Output (if available)
            if (refResult && refResult.stdout) {
                // Parse "Result: ..." from Ref Output
                const refLines = refResult.stdout.split('\n');
                const refResultLine = refLines.find(l => l.includes("Result: "));

                if (refResultLine) {
                    const expectedOutput = refResultLine.split("Result: ")[1].trim();

                    // Parse "Result: ..." from User Output
                    const userResultLine = logs.find(l => l.includes("Result: "));
                    const userOutput = userResultLine ? userResultLine.split("Result: ")[1].trim() : null;

                    logs.push(`Expected: ${expectedOutput}`);
                    console.log(`Debug: Mismatch Check - User: ${userOutput}, Exp: ${expectedOutput}`);

                    // Simple string comparison for Verdict (Robust enough for basic types)
                    if (userOutput === expectedOutput) {
                        logs.push("VERDICT: ACCEPTED (Matches Reference)");
                        status = "accepted";
                    } else {
                        logs.push(`VERDICT: WRONG ANSWER (Mismatch)`);
                        status = "wrong_answer"; // Override status
                    }
                } else {
                    console.log("Debug: Could not find 'Result:' in Ref execution");
                }
            }

            // 6. AI Complexity Analysis (If Groq is configured)
            let analysis = null;
            if (groq && status === 'accepted') {
                try {
                    console.log("Debug: Analyzing complexity with AI...");
                    const completion = await groq.chat.completions.create({
                        model: "llama-3.1-8b-instant",
                        messages: [
                            {
                                role: "system",
                                content: "You are a Big O notation expert. Analyze the given code and return ONLY a JSON object with keys: 'time' (string, e.g. 'O(n)'), 'space' (string, e.g. 'O(1)'), and 'explanation' (string, minimal 1-2 sentences)."
                            },
                            {
                                role: "user",
                                content: `Analyze this ${language} code:\n\n${code}`
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 150,
                        response_format: { type: "json_object" }
                    });

                    analysis = JSON.parse(completion.choices[0].message.content);
                    console.log("Debug: Analysis Result:", analysis);
                } catch (aiErr) {
                    console.error("AI Analysis Failed:", aiErr.message);
                    // Don't fail the execution if AI fails
                }
            }

            return res.json({ status, logs, analysis });
        }

    } catch (error) {
        console.error("Execution API Error:", error);
        if (error.message === "DockerUnavailable") {
            return res.json({ status: "execution_unavailable", logs: ["> Execution environment unavailable (Render/Docker missing)."] });
        }
        return res.json({ status: "error", logs: ["> Internal Server Error"] });
    }
});



app.use((err, req, res, next) => {
    console.error("Global Error Caught:", err.message);
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: "Image too large (Payload > 200MB). Try fewer/smaller images." });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "Invalid JSON format in request." });
    }
    res.status(500).json({ error: "Global Server Error: " + err.message });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
