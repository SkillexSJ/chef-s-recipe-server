const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// MongoDB URI and client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5xpeiw3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Declare recipesCollection globally to use it inside route handlers
let recipesCollection;

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("recipeDB");
    recipesCollection = db.collection("recipes");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

run();

// Root test
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});

// 🔹 Get all recipes, optional email filter
app.get("/recipes", async (req, res) => {
  const userEmail = req.query.email;
  const filter = userEmail ? { userEmail } : {};

  try {
    const recipes = await recipesCollection.find(filter).toArray();
    res.send(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).send({ error: "Failed to fetch recipes" });
  }
});

// 🔹 Get recipe by ID (NOT delete!)
app.get("/recipes/:id", async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ error: "Invalid ID format" });
  }

  try {
    const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.status(404).send({ error: "Recipe not found" });
    }

    res.send(recipe);
  } catch (error) {
    console.error("Error getting recipe:", error);
    res.status(500).send({ error: "Failed to get recipe" });
  }
});

// 🔹 Add a new recipe
app.post("/recipes", async (req, res) => {
  const recipe = req.body;

  if (!recipe.userEmail) {
    return res.status(400).send({ error: "Missing user email" });
  }

  try {
    const result = await recipesCollection.insertOne(recipe);
    res.status(201).send(result);
  } catch (error) {
    console.error("Insert failed:", error);
    res.status(500).send({ error: "Failed to add recipe" });
  }
});

// 🔹 Delete a recipe
app.delete("/recipes/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await recipesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.send({ success: true, message: "Recipe deleted", deletedCount: 1 });
    } else {
      res.status(404).send({ success: false, message: "Recipe not found" });
    }
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).send({ error: "Failed to delete recipe" });
  }
});

// 🔹 Update a recipe
app.put("/recipes/:id", async (req, res) => {
  const id = req.params.id;
  const updatedRecipe = req.body;

  try {
    const result = await recipesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedRecipe }
    );

    if (result.modifiedCount > 0) {
      res.send({ success: true, message: "Recipe updated" });
    } else {
      res.status(404).send({
        success: false,
        message: "Recipe not found or already up-to-date",
      });
    }
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).send({ error: "Failed to update recipe" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
