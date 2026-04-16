
import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";

// ─────────────────────────────────────────────
//  STATIC DEMO DATA  (zero network calls)
// ─────────────────────────────────────────────

const DEMO_SKILLS = [
  "Python", "Machine Learning", "Data Science", "SQL", "React",
  "JavaScript", "Deep Learning", "Git",
];

const DEMO_QUESTIONS = [
  "Can you explain the difference between supervised and unsupervised learning?",
  "What is the purpose of a virtual environment in Python, and how do you create one?",
  "Describe the steps you would take to clean a dataset before training a model.",
  "How does a RESTful API work, and can you give an example of one you have built?",
  "What are the key differences between SQL and NoSQL databases?",
];

const SAMPLE_ANSWERS = [
  "Supervised learning uses labeled data to train a model, while unsupervised learning finds hidden patterns in unlabeled data.",
  "A virtual environment isolates project dependencies. You create one using python -m venv venv and activate it with the activate script.",
  "I first check for missing values, handle outliers, encode categorical variables, and normalize numerical features before splitting the data.",
  "A RESTful API communicates over HTTP using standard methods like GET, POST, PUT, and DELETE. I built one using FastAPI that served ML predictions.",
  "SQL databases are relational and use structured schemas, while NoSQL databases like MongoDB are flexible and scale horizontally.",
  "I use cross-validation to avoid overfitting and tune hyperparameters with grid search or random search.",
  "React uses a virtual DOM to efficiently update only the changed parts of the UI, improving rendering performance.",
  "Git allows collaborative version control. I regularly use branches, pull requests, and merge strategies in team projects.",
];

const FEEDBACK_POOL = [
  { strengths: "Clear explanation with good structure", weaknesses: "Could include a concrete example", improvement: "Add a real-world use case to strengthen your answer" },
  { strengths: "Technically accurate response", weaknesses: "Answer was slightly brief", improvement: "Elaborate on edge cases or trade-offs" },
  { strengths: "Good conceptual understanding", weaknesses: "Missed some advanced details", improvement: "Study deeper internals and best practices" },
  { strengths: "Confident delivery with correct terminology", weaknesses: "Minor factual gaps", improvement: "Review documentation and practice with projects" },
  { strengths: "Practical experience evident in answer", weaknesses: "Could structure answer more clearly", improvement: "Use the STAR method: Situation, Task, Action, Result" },
];

// ─────────────────────────────────────────────
//  HELPER  – simulate async delay
// ─────────────────────────────────────────────
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function App() {
  const [currentPage, setCurrentPage] = useState("home"); // "home" | "setup" | "interview" | "contact" | "report"
  const [stage, setStage] = useState("setup"); // "setup" | "interview"
  const [modelsLoaded, setModelsLoaded] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceData, setFaceData] = useState({
    frames: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
  });

  // Setup states
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState("fresher");
  const [questions, setQuestions] = useState([]);

  // Interview states
  const videoRef = useRef(null);
  const [qIndex, setQIndex] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [volume, setVolume] = useState(0);
  const [messageSent, setMessageSent] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [recordings, setRecordings] = useState({});
  const [answersText, setAnswersText] = useState({});
  const [reportData, setReportData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState({});

  // ─── Camera: start only in interview stage ───
  useEffect(() => {
    if (stage === "interview") {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => alert("Could not access camera"));
    }
  }, [stage]);

  useEffect(() => {
    if (modelsLoaded) {
      console.log("UI should now show LOADED");
    }
  }, [modelsLoaded]);

  // ─── Load face-api models ───
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models/face_expression");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/face_landmark_68");
        console.log("✅ ALL MODELS LOADED");
        setModelsLoaded(true);
      } catch (err) {
        console.error("❌ Model loading error:", err);
      }
    };
    loadModels();
  }, []);

  // ─── Face detection loop ───
  useEffect(() => {
    let interval;

    const startDetection = () => {
      interval = setInterval(async () => {
        if (!videoRef.current) return;
        if (videoRef.current.readyState !== 4) return;

        const detections = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
        );

        console.log("Detection:", detections);

        if (detections) {
          setFaceDetected(true);
          const exp = detections.expressions;
          setFaceData((prev) => ({
            frames: prev.frames + 1,
            happy: prev.happy + (exp.happy || 0),
            neutral: prev.neutral + (exp.neutral || 0),
            sad: prev.sad + (exp.sad || 0),
          }));
        } else {
          setFaceDetected(false);
        }
      }, 800);
    };

    if (stage === "interview" && modelsLoaded) {
      videoRef.current.onloadeddata = () => {
        startDetection();
      };
    }

    return () => clearInterval(interval);
  }, [stage, modelsLoaded]);

  // ─────────────────────────────────────────────
  //  SIMULATED API CALLS  (no network requests)
  // ─────────────────────────────────────────────

  // A. Resume Upload – 1-second simulated delay, then set dummy skills + experience
  const uploadResume = async () => {
    if (!file) {
      alert("Please select a PDF resume first");
      return;
    }
    await delay(1000);
    setSkills(DEMO_SKILLS);
    setExperience("mid");
  };

  // B. Question Generation – return static list immediately
  const generateQuestions = async () => {
    await delay(600);
    setQuestions(DEMO_QUESTIONS);
  };

  // ─── TTS (Speak Question) ───
  const speakQuestion = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (stage === "interview" && questions.length > 0) {
      speakQuestion(questions[qIndex]);
      setMicOn(false);
      setVolume(0);
    }
  }, [stage, qIndex, questions]);

  // ─── Start Mic ───
  const startMic = async () => {
    try {
      recordedChunksRef.current = [];

      setAnswersText((prev) => ({
        ...prev,
        [qIndex]: "",
      }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setAudioStream(stream);
      setMicOn(true);

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      // C. Transcription – pick a random answer from the pool; no backend call
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });

        setRecordings((prev) => ({
          ...prev,
          [qIndex]: blob,
        }));

        const url = URL.createObjectURL(blob);
        // url stored but not used further – kept for feature parity
        void url;

        simulateTranscription(qIndex);
      };

      mediaRecorder.start();

      // Volume meter
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const level = Math.min(rms * 400, 255);
        setVolume(level);
        requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
    }
    setMicOn(false);
  };

  // C. Simulated transcription + D. Simulated evaluation (all local, no fetch)
  const simulateTranscription = (questionIndex) => {
    const answerText = SAMPLE_ANSWERS[questionIndex % SAMPLE_ANSWERS.length];

    // Simulated voice analysis
    const fakeVoice = {
      word_count: answerText.split(" ").length,
      filler_word_count: Math.floor(Math.random() * 2),
      fillers_used: [],
      confidence_level: ["High", "High", "Medium"][Math.floor(Math.random() * 3)],
    };

    setVoiceAnalysis((prev) => ({
      ...prev,
      [questionIndex]: fakeVoice,
    }));

    setAnswersText((prev) => ({
      ...prev,
      [questionIndex]: answerText,
    }));

    // D. Simulated evaluation stored implicitly in reportData later
  };

  // Face analysis helper (already local in original)
  const getFaceAnalysis = () => {
    const fakeConfidence = Math.floor(Math.random() * 11) + 80;
    let fakeEmotion = "Confident 😊";
    if (fakeConfidence > 88) {
      fakeEmotion = "Highly Confident 😎";
    } else if (fakeConfidence < 85) {
      fakeEmotion = "Confident 🙂";
    }
    return { dominantEmotion: fakeEmotion, confidenceScore: fakeConfidence };
  };

  // E. Final Report – build entirely from local simulated data
  const evaluateInterview = async () => {
    const faceAnalysis = getFaceAnalysis();

    await delay(3000);

    // Build per-question detailed analysis from simulated data
    const detailed = DEMO_QUESTIONS.map((q, i) => {
      const feedback = FEEDBACK_POOL[i % FEEDBACK_POOL.length];
      const score = Math.floor(Math.random() * 4) + 7; // 7–10
      return {
        question: q,
        answer: answersText[i] || "(No answer recorded)",
        voice_analysis: voiceAnalysis[i] || { confidence_level: "Medium" },
        evaluation: {
          score,
          strengths: feedback.strengths,
          weaknesses: feedback.weaknesses,
          improvement: feedback.improvement,
        },
      };
    });

    const totalScore = detailed.reduce((sum, d) => sum + d.evaluation.score, 0);
    const technicalScore = parseFloat((totalScore / detailed.length).toFixed(2));

    const confidenceCounts = detailed.map((d) => d.voice_analysis?.confidence_level);
    const overallConfidence =
      confidenceCounts.filter((c) => c === "High").length > detailed.length / 2
        ? "High"
        : confidenceCounts.filter((c) => c === "Low").length > detailed.length / 2
          ? "Low"
          : "Medium";

    const report = {
      technical_score: technicalScore,
      confidence_level: overallConfidence,
      strengths: [...new Set(detailed.map((d) => d.evaluation.strengths))],
      weaknesses: [...new Set(detailed.map((d) => d.evaluation.weaknesses))],
      detailed_analysis: detailed,
      face_analysis: faceAnalysis,
    };

    setReportData(report);
    setCurrentPage("report");
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setMessageSent(true);
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────

  // -------- HOME PAGE --------
  if (currentPage === "home") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage("home")} className="nav-link active">
                Home
              </button>
              <button onClick={() => setCurrentPage("setup")} className="nav-link">
                Interview
              </button>
              <button onClick={() => setCurrentPage("contact")} className="nav-link">
                Contact
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="page-container">
            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-content">
                <h1 className="hero-title">
                  Ace Your Next Interview with AI
                </h1>
                <p className="hero-subtitle">
                  Transform your interview preparation with our cutting-edge AI platform.
                  Upload your resume, get personalized questions, and practice with real-time
                  video and audio feedback.
                </p>
                <button
                  className="cta-button"
                  onClick={() => setCurrentPage("setup")}
                >
                  Start Interview Prep →
                </button>
              </div>

              <div className="hero-visual">
                <div className="floating-card" style={{ top: "10px", left: "80px" }}>
                  <span className="card-icon">📄</span>
                  <span> Upload Resume</span>
                </div>
                <div className="floating-card" style={{ top: "150px", right: "90px" }}>
                  <span className="card-icon">🤖</span>
                  <span>AI Analysis</span>
                </div>
                <div className="floating-card" style={{ bottom: "10px", left: "80px" }}>
                  <span className="card-icon">🎯</span>
                  <span>Get Hired</span>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
              <h2 className="section-title">How It Works</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📄</div>
                  <h3>Upload Resume</h3>
                  <p>Simply upload your PDF resume and our AI will analyze your skills, experience, and background</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🤖</div>
                  <h3>AI Question Generation</h3>
                  <p>Get personalized interview questions tailored to your profile and experience level</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎥</div>
                  <h3>Live Practice</h3>
                  <p>Practice with video and audio recording in a realistic interview environment</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Detailed Feedback</h3>
                  <p>Receive comprehensive evaluation and insights to improve your performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
        </div>
      </div>
    );
  }

  // -------- CONTACT PAGE --------
  if (currentPage === "contact") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage("home")} className="nav-link">
                Home
              </button>
              <button onClick={() => setCurrentPage("setup")} className="nav-link">
                Interview
              </button>
              <button onClick={() => setCurrentPage("contact")} className="nav-link active">
                Contact
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="contact-container">
            <h1 className="page-title">Get In Touch</h1>

            <div className="contact-content">
              <div className="contact-info">
                <h2>Contact Information</h2>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div>
                    <h3>Email</h3>
                    <p>support@aiinterviewpro.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🌐</span>
                  <div>
                    <h3>Website</h3>
                    <p>www.aiinterviewpro.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <div>
                    <h3>Location</h3>
                    <p>Serving candidates worldwide</p>
                  </div>
                </div>
              </div>

              <div className="contact-form">
                <h2>Send us a Message</h2>
                <form onSubmit={handleContactSubmit}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="form-input"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="form-input"
                  />
                  <textarea
                    rows="5"
                    placeholder="Your Message"
                    className="form-textarea"
                  ></textarea>
                  <button type="submit" className="primary-button">
                    Send Message
                  </button>
                  {messageSent && (
                    <p style={{ color: "green", fontWeight: "600", marginTop: "10px" }}>
                      ✅ Message sent successfully!
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
        </div>
      </div>
    );
  }

  // -------- SETUP PAGE --------
  if (stage === "setup") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
            <div className="nav-links">
              <button onClick={() => setCurrentPage("home")} className="nav-link">
                Home
              </button>
              <button onClick={() => setCurrentPage("setup")} className="nav-link active">
                Interview
              </button>
              <button onClick={() => setCurrentPage("contact")} className="nav-link">
                Contact
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="setup-container">
            <h1 className="page-title">Setup Your Interview</h1>

            <div className="setup-card">
              {/* Step 1: Upload Resume */}
              <div className="setup-step">
                <div className="step-header">
                  <span className="step-number">1</span>
                  <h2>Upload Your Resume</h2>
                </div>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept=".pdf"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    {file ? (
                      <>
                        <span className="file-icon">✓</span>
                        <span>{file.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="upload-icon">📄</span>
                        <span>Click to upload PDF resume</span>
                      </>
                    )}
                  </label>
                </div>
                <button
                  onClick={uploadResume}
                  className="primary-button"
                  disabled={!file}
                >
                  Analyze Resume
                </button>
              </div>

              {/* Step 2: Skills & Experience */}
              {skills.length > 0 && (
                <div className="setup-step">
                  <div className="step-header">
                    <span className="step-number">2</span>
                    <h2>Review Your Profile</h2>
                  </div>

                  <div className="skills-section">
                    <h3 style={{ marginBottom: "1rem", color: "#2d3748" }}>Extracted Skills</h3>
                    <div className="skills-container">
                      {skills.map((s, i) => (
                        <span key={i} className="skill-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="experience-selector">
                    <label>Experience Level</label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="select-input"
                    >
                      <option value="fresher">Fresher</option>
                      <option value="junior">Junior (1-2 years)</option>
                      <option value="mid">Mid-level (3-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  <button onClick={generateQuestions} className="primary-button">
                    Generate Questions
                  </button>
                </div>
              )}

              {/* Step 3: Questions Preview */}
              {questions.length > 0 && (
                <div className="setup-step">
                  <div className="step-header">
                    <span className="step-number">3</span>
                    <h2>Your Interview Questions</h2>
                  </div>

                  <div className="questions-list">
                    {questions.map((q, i) => (
                      <div key={i} className="question-item">
                        <span className="question-number">Q{i + 1}</span>
                        <p>{q}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setStage("interview")}
                    className="primary-button"
                    style={{ fontSize: "1.1rem", padding: "1.25rem 2rem" }}
                  >
                    🎤 Start Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
        </div>
      </div>
    );
  }

  // -------- REPORT PAGE --------
  if (currentPage === "report") {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-icon">🤖</span>
              AI Interview Pro
            </div>
          </div>
        </nav>

        <div className="main-content">
          <div className="page-container">
            <h1 style={{ marginBottom: "1.5rem" }}>Interview Report</h1>

            {reportData && (
              <div style={{ color: "#000" }}>

                {/* 🔥 OVERALL PERFORMANCE */}
                <div style={{
                  background: "#f7fafc",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  marginBottom: "1.5rem",
                }}>
                  <h2>Overall Performance</h2>
                  <p style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
                    <b>Technical Score:</b> {reportData.technical_score}/10
                  </p>
                  <p style={{ fontSize: "1.2rem" }}>
                    <b>Confidence Level:</b> {reportData.confidence_level}
                  </p>
                </div>

                {/* 🔥 FACE ANALYSIS */}
                {reportData.face_analysis && (
                  <div style={{
                    background: "#e6fffa",
                    padding: "1.5rem",
                    borderRadius: "10px",
                    marginBottom: "1.5rem",
                  }}>
                    <h2>Face Analysis</h2>
                    <p><b>Emotion:</b> {reportData.face_analysis.dominantEmotion}</p>
                    <p><b>Confidence Score:</b> {reportData.face_analysis.confidenceScore}%</p>
                  </div>
                )}

                {/* 🔥 STRENGTHS */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3>Strengths</h3>
                  <ul>
                    {reportData.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* 🔥 WEAKNESSES */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3>Weaknesses</h3>
                  <ul>
                    {reportData.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                {/* 🔥 IMPROVEMENTS */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3>Improvements</h3>
                  <ul>
                    {reportData.detailed_analysis.map((d, i) =>
                      d.evaluation?.improvement ? (
                        <li key={i}>{d.evaluation.improvement}</li>
                      ) : null
                    )}
                  </ul>
                </div>

                {/* 🔥 JOB RECOMMENDATION */}
                <div style={{
                  background: "#edf2f7",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}>
                  <h3>Job Recommendation</h3>
                  <p>
                    {reportData.technical_score > 7
                      ? "✅ You are ready for technical interviews!"
                      : reportData.technical_score > 4
                        ? "⚠️ You need some practice before interviews."
                        : "❌ You need strong preparation before applying."}
                  </p>
                </div>

                {/* 🔥 TOGGLE DETAILED ANALYSIS */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="primary-button"
                >
                  {showDetails ? "Hide Detailed Analysis" : "View Detailed Analysis"}
                </button>

                {showDetails && (
                  <div style={{ marginTop: "2rem" }}>
                    <h2>Detailed Analysis</h2>
                    {reportData.detailed_analysis.map((item, i) => (
                      <div key={i} style={{
                        border: "1px solid #ddd",
                        padding: "1rem",
                        marginBottom: "1rem",
                        borderRadius: "8px",
                        background: "#ffffff",
                      }}>
                        <p><b>Q{i + 1}:</b> {item.question}</p>
                        <p><b>Your Answer:</b> {item.answer}</p>
                        <p><b>Score:</b> {(item.evaluation?.score / 10 * 2).toFixed(2)}/2</p>
                        <p><b>Confidence:</b> {item.voice_analysis?.confidence_level}</p>
                        <p><b>Strength:</b> {item.evaluation?.strengths}</p>
                        <p><b>Weakness:</b> {item.evaluation?.weaknesses}</p>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* 🔥 BACK BUTTON */}
            <button
              onClick={() => setCurrentPage("home")}
              className="secondary-button"
              style={{ marginTop: "2rem" }}
            >
              ⬅ Back to Home
            </button>
          </div>
        </div>

        <div className="footer">
          <p>© 2024 AI Interview Pro</p>
        </div>
      </div>
    );
  }

  // -------- INTERVIEW SCREEN --------
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🤖</span>
            AI Interview Pro
          </div>
          <div className="nav-links">
            <span className="recording-indicator">● LIVE</span>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="interview-container">
          <div className="interview-header">
            <h1>Live Interview Session</h1>
            <p className="interview-progress">
              Question {qIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="interview-content">
            {/* Video Section */}
            <div className="video-section">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="video-feed"
              />
              <div className="status-bar">
                {modelsLoaded && "✅ Models Loaded"}
                {faceDetected && "👤 Face Detected"}
              </div>
              <div className="video-overlay">
                <span className="recording-indicator">● REC</span>
              </div>
            </div>

            {/* Interview Panel */}
            <div className="interview-panel">
              <div className="question-card">
                <h3>Current Question</h3>
                <p className="question-text">{questions[qIndex]}</p>
                {answersText[qIndex] && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      background: "#f7fafc",
                      borderRadius: "8px",
                      color: "#000",
                    }}
                  >
                    <strong>Your Answer (Text):</strong>
                    <p>{answersText[qIndex]}</p>
                  </div>
                )}
              </div>

              <div className="controls-section">
                {!micOn ? (
                  <>
                    <button onClick={startMic} className="mic-button start">
                      <span className="mic-icon">🎙️</span>
                      Start Answer
                    </button>

                    {recordings[qIndex] && (
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(recordings[qIndex]);
                          const audio = new Audio(url);
                          audio.play();
                        }}
                        className="secondary-button"
                        style={{ marginTop: "1rem" }}
                      >
                        🎧 Play Your Answer
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mic-active">
                    <div className="mic-status">
                      <span className="pulse-dot"></span>
                      <span>Recording your answer...</span>
                    </div>

                    <button onClick={stopRecording} className="secondary-button">
                      ⏹ Stop Recording
                    </button>
                  </div>
                )}
              </div>

              <div className="navigation-buttons">
                <button
                  onClick={() => {
                    stopRecording();
                    setQIndex((i) => Math.max(i - 1, 0));
                  }}
                  disabled={qIndex === 0}
                  className="nav-button"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => {
                    stopRecording();
                    setQIndex((i) => Math.min(i + 1, questions.length - 1));
                  }}
                  disabled={qIndex === questions.length - 1}
                  className="nav-button primary"
                >
                  Next →
                </button>
              </div>

              {qIndex === questions.length - 1 && (
                <button className="finish-button" onClick={evaluateInterview}>
                  Finish Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>© 2024 AI Interview Pro. Built with ❤️ for job seekers.</p>
      </div>
    </div>
  );
}

export default App;
