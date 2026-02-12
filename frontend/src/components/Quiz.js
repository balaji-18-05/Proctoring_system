import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import './Quiz.css';

const Quiz = ({ questions, onQuizComplete, onBackToTopics }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // Proctoring states
  const webcamRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [isTestTerminated, setIsTestTerminated] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const eventLogRef = useRef(null);

  // Auto-scroll event log
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [events]);

  // WebSocket connection for proctoring
  useEffect(() => {
    const connectWebSocket = () => {
      console.log('Attempting to connect to WebSocket...');
      const ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onopen = () => {
        console.log('Connected to proctoring backend');
        setIsConnected(true);
        wsRef.current = ws;
        setEvents([{ 
          type: 'system', 
          message: 'Proctoring system activated. Quiz monitoring started.',
          timestamp: new Date().toISOString()
        }]);
      };
      
      ws.onmessage = (event) => {
        const newEvent = JSON.parse(event.data);
        
        // Add timestamp if not provided by backend
        if (!newEvent.timestamp) {
          newEvent.timestamp = new Date().toISOString();
        }
        
        console.log('WebSocket message received:', newEvent);
        
        if (newEvent.warning_count !== undefined) {
          console.log('Updating warning count from', warningCount, 'to', newEvent.warning_count);
          setWarningCount(newEvent.warning_count);
          
          if (newEvent.warning_count >= 3) {
            console.log('Warning count reached 3, terminating quiz');
            setIsTestTerminated(true);
            // Use a small timeout to ensure state is updated
            setTimeout(() => {
              handleQuizTermination();
            }, 100);
          }
        }

        if (newEvent.type === 'test_terminated') {
          console.log('Test terminated event received');
          setIsTestTerminated(true);
          handleQuizTermination();
        }

        // Avoid logging repetitive status updates
        if (newEvent.type === 'status_update') {
          setEvents(prev => {
            if (prev.length > 0 && prev[prev.length - 1].type === 'status_update') {
              return [...prev.slice(0, -1), newEvent];
            }
            return [...prev, newEvent];
          });
        } else {
          setEvents(prev => [...prev, newEvent]);
        }
      };
      
      ws.onclose = () => {
        console.log('Disconnected from proctoring backend');
        setIsConnected(false);
        if (!isTestTerminated) {
          setEvents(prev => [...prev, { 
            type: 'system', 
            message: 'Proctoring connection lost. Attempting to reconnect...',
            timestamp: new Date().toISOString()
          }]);
          setTimeout(connectWebSocket, 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setEvents(prev => [...prev, { 
          type: 'error', 
          message: 'Proctoring connection error. Please check if backend is running.',
          timestamp: new Date().toISOString()
        }]);
      };
    };
    
    if (isQuizActive && !isTestTerminated) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isQuizActive, isTestTerminated]);

  // Send webcam frames to backend
  useEffect(() => {
    if (isConnected && !isTestTerminated && webcamRef.current) {
      intervalRef.current = setInterval(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('Sending frame to backend...');
          fetch(imageSrc).then(res => res.blob()).then(blob => {
            console.log('Frame blob size:', blob.size, 'bytes');
            wsRef.current.send(blob);
          }).catch(err => {
            console.error('Error processing frame:', err);
          });
        }
      }, 50); // ~20 FPS
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, isTestTerminated, webcamRef, wsRef, intervalRef]);

  // Timer countdown
  useEffect(() => {
    if (isQuizActive && timeRemaining > 0 && !isTestTerminated) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isTestTerminated) {
      handleQuizComplete();
    }
  }, [timeRemaining, isQuizActive, isTestTerminated, handleQuizTermination, warningCount]);

  // Debug warning count changes
  useEffect(() => {
    console.log('Warning count state changed to:', warningCount);
  }, [warningCount]);

  const handleQuizTermination = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (wsRef.current) wsRef.current.close();
    
    // Get the most current warning count
    const currentWarningCount = warningCount;
    
    console.log('handleQuizTermination called with warning count:', currentWarningCount);
    
    setShowWarning(true);
    setTimeout(() => {
      console.log('handleQuizTermination - currentWarningCount:', currentWarningCount);
      onQuizComplete({
        answers: selectedAnswers,
        timeSpent: 600 - timeRemaining,
        terminated: true,
        warningCount: currentWarningCount,
        score: selectedAnswers.reduce((count, answer, index) => {
          return answer === questions[index].correct ? count + 1 : count;
        }, 0),
        totalQuestions: questions.length
      });
    }, 3000);
  };

  const startQuiz = () => {
    setIsQuizActive(true);
    setSelectedAnswers(new Array(questions.length).fill(null));
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuizComplete = () => {
    setIsQuizActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (wsRef.current) wsRef.current.close();
    
    const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
      return answer === questions[index].correct ? count + 1 : count;
    }, 0);

    onQuizComplete({
      answers: selectedAnswers,
      score: correctAnswers,
      totalQuestions: questions.length,
      timeSpent: 600 - timeRemaining,
      terminated: isTestTerminated,
      warningCount: warningCount
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100;
  };

  if (!isQuizActive) {
    return (
      <div className="quiz-start">
        <div className="quiz-start-content">
          <h2>Ready to Start the Quiz?</h2>
          <div className="quiz-info">
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Time Limit:</strong> 10 minutes</p>
            <p><strong>Proctoring:</strong> Enabled - Camera monitoring will be active</p>
            <p><strong>Warning System:</strong> 3 warnings will terminate the quiz</p>
          </div>
          <div className="quiz-start-buttons">
            <button onClick={startQuiz} className="start-quiz-btn">Start Quiz</button>
            <button onClick={onBackToTopics} className="back-btn">Back to Topics</button>
          </div>
        </div>
      </div>
    );
  }

  if (isTestTerminated) {
    return (
      <div className="quiz-terminated">
        <div className="terminated-content">
          <h2>Quiz Terminated</h2>
          <p>Your quiz has been terminated due to multiple proctoring warnings.</p>
          <p>Warnings received: {warningCount}/3</p>
          <div className="terminated-actions">
            <button onClick={onBackToTopics} className="back-btn">Back to Topics</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <span>Question {currentQuestion + 1} of {questions.length}</span>
        </div>
        <div className={`quiz-timer ${timeRemaining < 60 ? 'warning' : ''}`}>
          ⏱️ {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-section">
          <h3 className="question-text">
            {questions[currentQuestion].question}
          </h3>
          
          <div className="options-container">
            {questions[currentQuestion].options.map((option, index) => (
              <div
                key={index}
                className={`option ${
                  selectedAnswers[currentQuestion] === index ? 'selected' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>

          <div className="navigation-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="nav-btn prev-btn"
              style={{ 
                backgroundColor: currentQuestion === 0 ? '#bdc3c7' : '#95a5a6', 
                color: 'white',
                border: '2px solid #7f8c8d',
                fontSize: '1.1rem',
                padding: '1rem 2rem'
              }}
            >
              ⬅️ Previous
            </button>
            <div className="answer-status">
              {selectedAnswers[currentQuestion] !== null ? 
                <span className="answered">✓ Answered</span> : 
                <span className="not-answered">⚠ No answer selected</span>
              }
            </div>
            <button
              onClick={handleNext}
              className="nav-btn next-btn"
              style={{ 
                backgroundColor: '#3498db', 
                color: 'white',
                border: '2px solid #2980b9',
                fontSize: '1.1rem',
                padding: '1rem 2rem'
              }}
            >
              {currentQuestion === questions.length - 1 ? '🏁 Finish Quiz' : '➡️ Next Question'}
            </button>
          </div>
        </div>

        <div className="proctoring-section">
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam-feed"
              mirrored={true}
              style={{ width: '100%', height: 'auto', maxHeight: '240px' }}
            />
            <div className={`proctoring-status ${isConnected ? 'active' : 'inactive'}`}>
              {isConnected ? '🟢 Monitoring Active' : '🔴 Monitoring Inactive'}
            </div>
            <div className="warning-indicator">
              Warnings: {warningCount}/3
            </div>
          </div>

          <div className="event-log">
            <h4>Proctoring Log</h4>
            <div className="event-log-container" ref={eventLogRef}>
              {events.map((event, index) => (
                <div key={index} className={`event-item event-${event.type}`}>
                  <span className="event-time">
                    {event.timestamp ? 
                      new Date(event.timestamp).toLocaleTimeString() : 
                      new Date().toLocaleTimeString()
                    }
                  </span>
                  <span className="event-message">{event.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
