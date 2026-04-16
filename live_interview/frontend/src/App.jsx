
import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [stage, setStage] = useState("setup");
  const [modelsLoaded, setModelsLoaded] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);

  const [faceData, setFaceData] = useState({
    frames: 0,
    happy: 0,
    neutral: 0,
    sad: 0
  });

  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState("fresher");
  const [questions, setQuestions] = useState([]);

  const videoRef = useRef(null);
  const [qIndex, setQIndex] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [volume, setVolume] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [recordings, setRecordings] = useState({});
  const [currentAudioURL, setCurrentAudioURL] = useState(null);
  const [answersText, setAnswersText] = useState({});
  const [reportData, setReportData] = useState(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState({});

  // ---------- CAMERA ----------
  useEffect(() => {
    if (stage === "interview") {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => alert("Camera access denied"));
    }
  }, [stage]);

  // ---------- FACE MODELS ----------
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models/face_expression");
        setModelsLoaded(true);
      } catch (err) {
        console.error(err);
      }
    };
    loadModels();
  }, []);

  // ---------- FACE DETECTION ----------
  useEffect(() => {
    let interval;

    if (stage === "interview" && modelsLoaded) {
      interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) return;

        const detections = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        setFaceDetected(!!detections);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [stage, modelsLoaded]);

  // ---------- DEMO FUNCTIONS ----------

  const uploadResume = async () => {
    if (!file) {
      alert("Select a resume first");
      return;
    }

    await new Promise((r) => setTimeout(r, 1000));

    setSkills(["React", "FastAPI", "AI"]);
    setExperience("fresher");

    alert("Resume uploaded!");
  };

  const generateQuestions = async () => {
    await new Promise((r) => setTimeout(r, 1000));

    setQuestions([
      "Tell me about yourself.",
      "Explain a project you worked on.",
      "What are your strengths?",
      "Why should we hire you?",
      "Describe a challenge you solved."
    ]);

    setStage("interview");
  };

  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setAudioStream(stream);
    setMicOn(true);

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const fakeResponses = [
        "I have worked on machine learning systems.",
        "I built scalable web applications.",
        "I enjoy solving complex problems.",
        "I have strong analytical skills."
      ];

      const text = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];

      setAnswersText((prev) => ({
        ...prev,
        [qIndex]: text
      }));
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    audioStream?.getTracks().forEach((t) => t.stop());
    setMicOn(false);
  };

  const evaluateInterview = async () => {
    await new Promise((r) => setTimeout(r, 1500));

    setReportData({
      score: 8,
      summary: "Good performance with clear communication.",
      suggestions: ["Be more concise", "Add examples"]
    });

    setCurrentPage("report");
  };

  // ---------- UI ----------

  return (
    <div className="App">
      {currentPage === "home" && (
        <>
          <h1>AI Interview Simulator</h1>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadResume}>Upload Resume</button>
          <button onClick={generateQuestions}>Start Interview</button>
        </>
      )}

      {stage === "interview" && (
        <>
          <video ref={videoRef} autoPlay width="300" />
          <h2>{questions[qIndex]}</h2>

          <button onClick={startMic}>Start</button>
          <button onClick={stopRecording}>Stop</button>

          <p>{answersText[qIndex]}</p>

          <button onClick={() => setQIndex(qIndex + 1)}>Next</button>
          <button onClick={evaluateInterview}>Finish</button>
        </>
      )}

      {currentPage === "report" && reportData && (
        <>
          <h2>Report</h2>
          <p>Score: {reportData.score}</p>
          <p>{reportData.summary}</p>
        </>
      )}
    </div>
  );
}

export default App;




  // -------- Test Record (5 sec) --------
  


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
                <div className="floating-card" style={{top: '10px', left: '80px'}}>
                  <span className="card-icon">📄</span>
                  <span> Upload Resume</span>
                </div>
                <div className="floating-card" style={{top: '150px', right: '90px'}}>
                  <span className="card-icon">🤖</span>
                  <span>AI Analysis</span>
                </div>
                <div className="floating-card" style={{bottom: '10px', left: '80px'}}>
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
                    <h3 style={{marginBottom: '1rem', color: '#2d3748'}}>Extracted Skills</h3>
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
                    style={{fontSize: '1.1rem', padding: '1.25rem 2rem'}}
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
                marginBottom: "1.5rem"
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
    marginBottom: "1.5rem"
  }}>
    <h2>Face Analysis</h2>

    <p>
      <b>Emotion:</b> {reportData.face_analysis.dominantEmotion}
    </p>

    <p>
      <b>Confidence Score:</b> {reportData.face_analysis.confidenceScore}%
    </p>
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
                  {reportData.detailed_analysis.map((d, i) => (
                    d.evaluation?.improvement && (
                      <li key={i}>{d.evaluation.improvement}</li>
                    )
                  ))}
                </ul>
              </div>

              {/* 🔥 JOB RECOMMENDATION */}
              <div style={{
                background: "#edf2f7",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem"
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

              {/* 🔥 BUTTON FOR DETAILS */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="primary-button"
              >
                {showDetails ? "Hide Detailed Analysis" : "View Detailed Analysis"}
              </button>

              {/* 🔥 DETAILED ANALYSIS */}
              {showDetails && (
                <div style={{ marginTop: "2rem" }}>
                  <h2>Detailed Analysis</h2>

                  {reportData.detailed_analysis.map((item, i) => (
                    <div key={i} style={{
                      border: "1px solid #ddd",
                      padding: "1rem",
                      marginBottom: "1rem",
                      borderRadius: "8px",
                      background: "#ffffff"
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
      color: "#000",   // 👈 add this
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
                <button className="finish-button"
                  onClick={evaluateInterview}
                  >
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
