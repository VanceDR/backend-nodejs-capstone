/*jshint esversion: 8 */
const express = require("express");
const router = express.Router();
const connectToDatabase = require("../models/db");
const pino = require("pino");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const logger = pino(); // Create a Pino logger instance

//Create JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  logger.info("/register POST called");
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase();
    // Task 2: Access MongoDB `users` collection
    const collection = db.collection("users");
    // Task 3: Check if user credentials already exists in the database and throw an error if they do
    const existingUser = await collection.findOne({ email: req.body.email });
    if (existingUser) {
      logger.error("Email id already exists");
      return res.status(400).json({ error: "Email id already exists" });
    }
    // Task 4: Create a hash to encrypt the password so that it is not readable in the database
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    // Task 5: Insert the user into the database
    const email = req.body.email;
    const newUser = await collection.insertOne({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
      createdAt: new Date(),
    });
    // Task 6: Create JWT authentication if passwords match with user._id as payload
    const payload = {
      user: {
        id: newUser.insertedId,
      },
    };

    const authtoken = jwt.sign(payload, JWT_SECRET);
    // Task 7: Log the successful registration using the logger
    logger.info("User registered successfully");
    // Task 8: Return the user email and the token as a JSON
    res.json({ authtoken, email });
  } catch (e) {
    return res.status(500).send("Internal server error");
  }
});

router.post("/login", async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase();
    // Task 2: Access MongoDB `users` collection
    const collection = db.collection("users");
    // Task 3: Check for user credentials in database
    const { email, password } = req.body;

    const existingUser = await collection.findOne({ email: email });
    // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
    if (!existingUser) {
      logger.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const result = await bcryptjs.compare(password, existingUser.password);
    if (!result) {
      logger.error("Passwords do not match");
      return res.status(404).json({ error: "Passwords do not match" });
    }
    // Task 5: Fetch user details from a database
    const userName = existingUser.firstName;
    const userEmail = existingUser.email;

    // Task 6: Create JWT authentication if passwords match with user._id as payload
    let payload = {
      user: {
        id: theUser._id.toString(),
      },
    };
    const authtoken = jwt.sign(payload, JWT_SECRET);
    res.json({ authtoken, userName, userEmail });
    // Task 7: Send appropriate message if the user is not found
  } catch (e) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
