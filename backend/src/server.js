
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const db = require("./database");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("QR Quiz API is running!");
});

// Get all quizzes
app.get("/api/quizzes", (req, res) => {
  try {
    const quizzes = db.prepare(
      "SELECT * FROM quizzes ORDER BY id DESC"
    ).all();

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not retrieve quizzes" });
  }
});

// Create a quiz
app.post("/api/quizzes", (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Quiz title is required" });
    }

    const result = db.prepare(`
      INSERT INTO quizzes (title, description)
      VALUES (?, ?)
    `).run(title.trim(), description || "");

    res.status(201).json({
      message: "Quiz created successfully",
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create quiz" });
  }
});

// Add a question to a quiz
app.post("/api/quizzes/:id/questions", (req, res) => {
  try {
    const quizId = Number(req.params.id);

    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer
    } = req.body;

    const quiz = db.prepare(
      "SELECT id FROM quizzes WHERE id = ?"
    ).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (
      !question_text ||
      !option_a ||
      !option_b ||
      !option_c ||
      !option_d ||
      !["A", "B", "C", "D"].includes(
        String(correct_answer).toUpperCase()
      )
    ) {
      return res.status(400).json({
        error: "Please provide the question, four options, and a correct answer"
      });
    }

    const result = db.prepare(`
      INSERT INTO questions (
        quiz_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      quizId,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      String(correct_answer).toUpperCase()
    );

    res.status(201).json({
      message: "Question added successfully",
      questionId: result.lastInsertRowid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not add question" });
  }
});

// Get a quiz for students
// Correct answers are intentionally not sent to students.
app.get("/api/student/quizzes/:id", (req, res) => {
  try {
    const quizId = Number(req.params.id);

    const quiz = db.prepare(
      "SELECT id, title, description FROM quizzes WHERE id = ?"
    ).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questions = db.prepare(`
      SELECT
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d
      FROM questions
      WHERE quiz_id = ?
      ORDER BY id ASC
    `).all(quizId);

    res.json({ quiz, questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load quiz" });
  }
});

// Submit student answers and calculate the score
app.post("/api/student/quizzes/:id/submit", (req, res) => {
  try {
    const quizId = Number(req.params.id);
    const { participant_name, answers } = req.body;

    if (!participant_name || !participant_name.trim()) {
      return res.status(400).json({
        error: "Please enter your name"
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        error: "Please answer the questions"
      });
    }

    const quiz = db.prepare(
      "SELECT id FROM quizzes WHERE id = ?"
    ).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questions = db.prepare(
      "SELECT id, correct_answer FROM questions WHERE quiz_id = ? ORDER BY id ASC"
    ).all(quizId);

    if (questions.length === 0) {
      return res.status(400).json({
        error: "This quiz has no questions"
      });
    }

    if (answers.length !== questions.length) {
      return res.status(400).json({
        error: "Please answer every question"
      });
    }

    const answerMap = new Map();

    for (const answer of answers) {
      const questionId = Number(answer.question_id);
      const selected = String(answer.selected_answer || "").toUpperCase();

      if (!["A", "B", "C", "D"].includes(selected)) {
        return res.status(400).json({
          error: "One or more answers are invalid"
        });
      }

      if (answerMap.has(questionId)) {
        return res.status(400).json({
          error: "Duplicate answers are not allowed"
        });
      }

      answerMap.set(questionId, selected);
    }

    let score = 0;

    for (const question of questions) {
      const selected = answerMap.get(question.id);

      if (!selected) {
        return res.status(400).json({
          error: "Please answer every question"
        });
      }

      if (selected === question.correct_answer) {
        score++;
      }
    }

    // Save participant and answers together
    const saveSubmission = db.transaction(() => {
      const participant = db.prepare(`
        INSERT INTO participants (quiz_id, participant_name, score)
        VALUES (?, ?, ?)
      `).run(quizId, participant_name.trim(), score);

      const participantId = participant.lastInsertRowid;

      const insertAnswer = db.prepare(`
        INSERT INTO answers (
          participant_id,
          question_id,
          selected_answer
        )
        VALUES (?, ?, ?)
      `);

      for (const question of questions) {
        insertAnswer.run(
          participantId,
          question.id,
          answerMap.get(question.id)
        );
      }

      return participantId;
    });

    const participantId = saveSubmission();

    res.json({
      message: "Quiz submitted successfully",
      participantId,
      score,
      total: questions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not submit quiz" });
  }
});

// Generate a QR code for a quiz
app.get("/api/quizzes/:id/qr", async (req, res) => {
  try {
    const quizId = Number(req.params.id);

    const quiz = db.prepare(
      "SELECT id FROM quizzes WHERE id = ?"
    ).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const quizUrl = `${frontendUrl}/quiz/${quizId}`;

    const qrCode = await QRCode.toDataURL(quizUrl);

    res.json({
      quizUrl,
      qrCode
    });
  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({
      error: "Could not generate QR code"
    });
  }
});

// Start server and allow access from other devices on the same network
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
