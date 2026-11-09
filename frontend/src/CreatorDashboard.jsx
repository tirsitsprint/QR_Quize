
import { useState } from "react";
import "./App.css";

const API_URL = `http://${window.location.hostname}:5000`;

function createEmptyQuestion() {
  return {
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A"
  };
}

function CreatorDashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([createEmptyQuestion()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrModal, setQrModal] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  function updateQuestion(index, field, value) {
    setQuestions((previous) =>
      previous.map((question, i) =>
        i === index ? { ...question, [field]: value } : question
      )
    );
  }

  function addQuestion() {
    setQuestions((previous) => [...previous, createEmptyQuestion()]);
  }

  function removeQuestion(index) {
    setQuestions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  async function handleCreateQuiz(event) {
    event.preventDefault();
    setError("");
    setCopyMessage("");
    setQrModal(null);

    if (!title.trim()) {
      setError("Please enter a quiz title.");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (
        !q.question_text.trim() ||
        !q.option_a.trim() ||
        !q.option_b.trim() ||
        !q.option_c.trim() ||
        !q.option_d.trim()
      ) {
        setError(`Please complete all fields in question ${i + 1}.`);
        return;
      }
    }

    try {
      setLoading(true);

      // 1. Create the quiz
      const quizResponse = await fetch(`${API_URL}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
      });

      const quizData = await quizResponse.json();

      if (!quizResponse.ok) {
        throw new Error(quizData.error || "Could not create quiz");
      }

      const quizId = quizData.id;

      // 2. Save each question
      for (let i = 0; i < questions.length; i++) {
        const response = await fetch(
          `${API_URL}/api/quizzes/${quizId}/questions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questions[i])
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `Question ${i + 1} could not be saved: ${data.error || "Unknown error"}. Quiz ID: ${quizId}`
          );
        }
      }

      // 3. Generate the QR code
      const qrResponse = await fetch(
        `${API_URL}/api/quizzes/${quizId}/qr`
      );

      const qrData = await qrResponse.json();

      if (!qrResponse.ok) {
        throw new Error(qrData.error || "Could not generate QR code");
      }

      // 4. Show the QR code in a popup on this page
      setQrModal({
        id: quizId,
        title,
        qrCode: qrData.qrCode,
        quizUrl: qrData.quizUrl
      });

    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyQuizLink() {
    if (!qrModal) return;

    try {
      await navigator.clipboard.writeText(qrModal.quizUrl);
      setCopyMessage("Link copied successfully!");
    } catch {
      setCopyMessage("Copy was unavailable. Please select and copy the link above.");
    }
  }

  function closeModal() {
    setQrModal(null);
    setCopyMessage("");
  }

  return (
    <div className="page-background">
      <div className="quiz-container creator-container">

        <div className="page-heading">
          <span className="heading-label">QUIZ MANAGEMENT</span>
          <h1>Create a New Quiz</h1>
          <p>Prepare your questions and share your quiz with students.</p>
        </div>

        <form onSubmit={handleCreateQuiz}>
          <div className="form-section">
            <h2>Quiz Information</h2>

            <label>Quiz Title</label>
            <input
              type="text"
              placeholder="Example: Python Fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Description</label>
            <textarea
              placeholder="Describe what this quiz is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          <div className="questions-heading">
            <div>
              <h2>Quiz Questions</h2>
              <p>Add your questions and select the correct answers.</p>
            </div>
            <span className="question-count">
              {questions.length} Questions
            </span>
          </div>

          {questions.map((question, index) => (
            <div className="question-card" key={index}>
              <div className="question-card-heading">
                <h3>Question {index + 1}</h3>

                {questions.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeQuestion(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label>Question</label>
              <input
                type="text"
                placeholder="Write your question here"
                value={question.question_text}
                onChange={(e) =>
                  updateQuestion(index, "question_text", e.target.value)
                }
                required
              />

              <div className="options-grid">
                {["a", "b", "c", "d"].map((option) => (
                  <div key={option}>
                    <label>Option {option.toUpperCase()}</label>
                    <input
                      type="text"
                      placeholder={`Enter option ${option.toUpperCase()}`}
                      value={question[`option_${option}`]}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          `option_${option}`,
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                ))}
              </div>

              <label>Correct Answer</label>
              <select
                value={question.correct_answer}
                onChange={(e) =>
                  updateQuestion(index, "correct_answer", e.target.value)
                }
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
          ))}

          <button
            type="button"
            className="add-question-button"
            onClick={addQuestion}
          >
            + Add Another Question
          </button>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving Quiz..." : "Save Quiz and Generate QR"}
          </button>
        </form>
      </div>

      {/* QR code popup */}
      {qrModal && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="Close popup"
            >
              ×
            </button>

            <div className="success-icon">✓</div>

            <span className="heading-label">QUIZ SAVED</span>
            <h2 id="qr-modal-title">Your Quiz Is Ready!</h2>
            <p className="qr-description">
              {qrModal.title} has been created successfully.
              Students can scan this QR code to start.
            </p>

            <div className="qr-code-container">
              <img src={qrModal.qrCode} alt="Quiz QR Code" />
            </div>

            <label className="modal-link-label">Student quiz link</label>
            <input
              className="modal-link-input"
              value={qrModal.quizUrl}
              readOnly
              onFocus={(event) => event.target.select()}
            />

            <div className="modal-actions">
              <button type="button" onClick={copyQuizLink}>
                Copy Link
              </button>

              <a
                href={qrModal.qrCode}
                download={`quiz-${qrModal.id}-qr.png`}
                className="download-link"
              >
                Download QR
              </a>

              <button
                type="button"
                className="close-modal-button"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            {copyMessage && (
              <p className="copy-message">{copyMessage}</p>
            )}

            <p className="quiz-id-label">Quiz ID: {qrModal.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorDashboard;
