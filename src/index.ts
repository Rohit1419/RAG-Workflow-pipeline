import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Implement the required API here.

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
