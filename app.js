// Import core packages
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// Create Express app instance
const app = express();
const PORT = 5001;

// Middleware setup
app.use(cors());
app.use(express.json());

// Configure Multer to store uploaded files in memory
const memoryStorage = multer.memoryStorage();
const uploadHandler = multer({ storage: memoryStorage });

// MongoDB setup
const mongoUri = `mongodb+srv://test:test@cluster0.pcu6w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const mongoClient = new MongoClient(mongoUri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// Main backend logic
async function initializeServer() {
    try {
        const db = mongoClient.db("Antopolis-restaurant");
        const foodCollection = db.collection("Foods");
        const categoryCollection = db.collection("FoodCategories");

        /**
         * GET /foods
         * Fetch all food items.
         */
        app.get("/foods", async (req, res) => {
            try {
                const allFoods = await foodCollection.find({}).toArray();
                res.json(allFoods);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        /**
         * POST /foods
         * Add a new food item with optional image.
         */
        app.post("/foods", uploadHandler.single("image"), async (req, res) => {
            try {
                const { name, category, price } = req.body;

                if (!name || !category || !price) {
                    return res.status(400).json({
                        error: "Name, category and price are required",
                    });
                }

                let encodedImage = "";
                if (req.file) {
                    encodedImage = req.file.buffer.toString("base64");
                }

                const newFood = {
                    name,
                    category,
                    price: parseFloat(price),
                    image: encodedImage,
                };

                const result = await foodCollection.insertOne(newFood);

                res.status(201).json({
                    success: true,
                    insertedId: result.insertedId,
                });
            } catch (error) {
                console.error("Error inserting food:", error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /categories
         * Fetch all food categories.
         */
        app.get("/categories", async (req, res) => {
            try {
                const allCategories = await categoryCollection
                    .find({})
                    .toArray();
                res.json(allCategories);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        /**
         * POST /categories
         * Add a new food category.
         */
        app.post("/categories", async (req, res) => {
            try {
                const { name } = req.body;

                if (!name) {
                    return res.status(400).json({
                        error: "Category name is required",
                    });
                }

                const result = await categoryCollection.insertOne({ name });

                res.status(201).json({
                    success: true,
                    insertedId: result.insertedId,
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    } catch (error) {
        console.error("Server initialization failed:", error);
    }
}

// Initialize backend logic
initializeServer().catch(console.dir);

// Default root endpoint
app.get("/", (req, res) => {
    res.send("Welcome to Antopolis server.");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Antopolis server running at http://localhost:${PORT}`);
});
