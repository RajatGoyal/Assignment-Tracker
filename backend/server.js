require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ---------------- CORS CONFIG ---------------- */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS not allowed"), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

/* ---------------- MIDDLEWARE ---------------- */

app.use(express.json());

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/me", require("./routes/me"));
app.use("/api/classes", require("./routes/classes"));
app.use("/api/assignments", require("./routes/assignments"));

/* ---------------- ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);

  res.status(500).json({
    message: "Internal server error"
  });
});

/* ---------------- DATABASE CONNECTION ---------------- */

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
.then(() => {
  console.log("MongoDB connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

})
.catch((err) => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});