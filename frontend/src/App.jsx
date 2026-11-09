
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./App.css";

const API_URL = `http://${window.location.hostname}:5000`;

function StudentQuiz() {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/student/quizzes/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load quiz");
        }

        setQuiz(data.quiz);
        setQuestions(data.questions);
      } catch (err) {
        setError(err.message || "Could not connect to the server");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [id]);

  function handleAnswerChange(questionId, selectedAnswer) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswer
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (questions.length === 0) {
      setError("This quiz does not have any questions yet.");
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    const formattedAnswers = questions.map((question) => ({
      question_id: question.id,
      selected_answer: answers[question.id]
    }));

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/student/quizzes/${id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            participant_name: name,
            answers: formattedAnswers
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not submit quiz");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Could not submit your answers");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-background">
        <div className="quiz-container">
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="page-background">
        <div className="quiz-container">
          <h2>Unable to load quiz</h2>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page-background">
        <div className="quiz-container">
          <h2>Quiz not found</h2>
        </div>
      </div>
    );
  }

  // Calculate the percentage for the circular score display
  if (result) {
    const percentage =
      result.total > 0
        ? Math.round((result.score / result.total) * 100)
        : 0;

    return (
      <div className="page-background">
        <div className="quiz-container result-page">
          <span className="heading-label">QUIZ COMPLETED</span>

          <h1>Well Done, {name}!</h1>

          <p className="result-subtitle">
            You have successfully submitted your answers.
          </p>

          <div
            className="score-circle"
            style={{
              "--score-progress": `${percentage}%`
            }}
            role="img"
            aria-label={`Your score is ${result.score} out of ${result.total}`}
          >
            <div className="score-circle-inner">
              <strong>{result.score}/{result.total}</strong>
              <span>Your Score</span>
            </div>
          </div>

          <h2 className="percentage-score">{percentage}%</h2>

          <p className="result-detail">
            You answered {result.score} out of {result.total} questions correctly.
          </p>

          <div className="result-note">
            Your result has been recorded successfully.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-background">
      <div className="quiz-container">
        <div className="quiz-header">
          <span className="heading-label">STUDENT QUIZ</span>
          <h1>{quiz.title}</h1>
          <p>{quiz.description}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="name-card">
            <label htmlFor="student-name">Your Name</label>

            <input
              id="student-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          {questions.map((question, index) => {
            const options = [
              { key: "A", value: question.option_a },
              { key: "B", value: question.option_b },
              { key: "C", value: question.option_c },
              { key: "D", value: question.option_d }
            ];

            return (
              <div className="question-card" key={question.id}>
                <h3>
                  {index + 1}. {question.question_text}
                </h3>

                <div className="options-list">
                  {options.map((option) => (
                    <label className="option" key={option.key}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.key}
                        checked={answers[question.id] === option.key}
                        onChange={() =>
                          handleAnswerChange(question.id, option.key)
                        }
                      />

                      <span>
                        {option.key}. {option.value}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentQuiz;
