# QR Quiz Application

A web-based quiz application that allows creators to create quizzes and share them with students through QR codes. Students can scan a QR code, access a quiz, answer questions, and submit their responses.

## Features

### Quiz Creator
- Create quizzes.
- Add questions and answer options.
- Generate a QR code for each quiz.
- Share quizzes using a student-access link.
- View quiz submissions and results.

### Students
- Access quizzes through a QR code or shared link.
- Enter their name and answer quiz questions.
- Submit answers online.
- View their score and percentage after submission.

## Technologies Used

### Frontend
- React.js
- Vite
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- SQLite

### Other Tools
- QR Code generation
- REST API
- Git and GitHub

## Project Structure

```text
quiz/
│
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

Replace `YOUR_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Navigate to the Project

```bash
cd quiz
```

### 3. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory and add the environment variables required by your backend.

Start the backend:

```bash
node src/server.js
```

### 4. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## How to Use

1. Start the backend and frontend servers.
2. Open the creator dashboard.
3. Create a quiz and add questions.
4. Generate the quiz QR code.
5. Share the QR code or student link.
6. Students scan the QR code and complete the quiz.
7. Students submit their answers and view their results.

## Future Improvements

- Creator authentication and user accounts.
- Quiz time limits.
- More question types.
- Quiz result analytics.
- Export quiz results.
- Online deployment.
- Improved mobile responsiveness.

## Purpose

This project demonstrates how frontend and backend technologies can work together to build an interactive quiz platform. It also explores QR code integration, database management, API communication, and online assessment workflows.

---

**Project:** QR Quiz Application  
**Status:** Under Development
