import express from "express";
import documentsRouter from "./routes/documents";
import searchRouter from "./routes/search";
import answerRouter from "./routes/answers";
import conversationsRouter from "./routes/conversations";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentsRouter);
app.use("/api/search", searchRouter);
app.use("/api/answers", answerRouter);
app.use("/api/conversations", conversationsRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
