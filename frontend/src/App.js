import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import TopicSelection from './components/TopicSelection';
import Quiz from './components/Quiz';
import QuizResults from './components/QuizResults';
import { questions } from './questions';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('topic-selection');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  
  // Original proctoring states (for standalone proctoring mode)
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

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onopen = () => {
        console.log('Connected to backend');
        setIsConnected(true);
        wsRef.current = ws;
        setEvents([{ type: 'system', message: 'Connection established. Proctoring has started.' }]);
      };
      
      ws.onmessage = (event) => {
        const newEvent = JSON.parse(event.data);
        
        if (newEvent.warning_count !== undefined) {
          setWarningCount(newEvent.warning_count);
        }

        if (newEvent.type === 'test_terminated') {
          setIsTestTerminated(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (wsRef.current) wsRef.current.close();
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
        console.log('Disconnected from backend');
        setIsConnected(false);
        if (!isTestTerminated) {
          setEvents(prev => [...prev, { type: 'system', message: 'Connection lost. Attempting to reconnect...' }]);
          setTimeout(connectWebSocket, 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };
    
    if (currentView === 'proctoring') {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentView, isTestTerminated]);

  useEffect(() => {
    if (isConnected && !isTestTerminated && webcamRef.current && currentView === 'proctoring') {
      intervalRef.current = setInterval(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Send raw binary data
          fetch(imageSrc).then(res => res.blob()).then(blob => {
            wsRef.current.send(blob);
          });
        }
      }, 50); // ~20 FPS
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, isTestTerminated, currentView]);

  const resetTest = async () => {
    try {
      await fetch('http://localhost:8000/reset_proctoring', { method: 'POST' });
      setEvents([]);
      setIsTestTerminated(false);
      setWarningCount(0);
      console.log('Proctoring state has been reset.');
    } catch (error) {
      console.error('Error resetting test:', error);
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId);
    setCurrentView('quiz');
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setCurrentView('results');
  };

  const handleRetakeQuiz = () => {
    setQuizResults(null);
    setCurrentView('quiz');
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setQuizResults(null);
    setCurrentView('topic-selection');
  };

  const switchToProctoring = () => {
    setCurrentView('proctoring');
  };

  const switchToQuiz = () => {
    setCurrentView('topic-selection');
  };

  const renderEvent = (event, index) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    return (
        <div key={index} className={`event-item event-${event.type}`}>
            <span className="event-time">{time}</span>
            <span className="event-message">{event.message}</span>
        </div>
    );
  };

  // Navigation component
  const Navigation = () => (
    <nav className="app-navigation">
      <button 
        onClick={switchToQuiz} 
        className={`nav-btn ${currentView !== 'proctoring' ? 'active' : ''}`}
      >
        📝 Quiz Application
      </button>
      <button 
        onClick={switchToProctoring} 
        className={`nav-btn ${currentView === 'proctoring' ? 'active' : ''}`}
      >
        👁️ Standalone Proctoring
      </button>
    </nav>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Proctoring & Quiz System</h1>
        <Navigation />
      </header>
      
      <main className={`main-content ${currentView === 'proctoring' ? 'proctoring-view' : 'quiz-view'}`}>
        {currentView === 'topic-selection' && (
          <TopicSelection onTopicSelect={handleTopicSelect} />
        )}
        
        {currentView === 'quiz' && selectedTopic && (
          <Quiz 
            questions={questions[selectedTopic]} 
            onQuizComplete={handleQuizComplete}
            onBackToTopics={handleBackToTopics}
          />
        )}
        
        {currentView === 'results' && quizResults && (
          <QuizResults 
            results={quizResults}
            onRetakeQuiz={handleRetakeQuiz}
            onBackToTopics={handleBackToTopics}
          />
        )}

        {currentView === 'proctoring' && (
          <>
            <div className="stats-bar">
              <span>Warnings: {warningCount} / 3</span>
            </div>
            <div className="webcam-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={640}
                height={480}
                className="webcam-feed"
                mirrored={true}
              />
              {isTestTerminated && (
                <div className="test-terminated-overlay">
                  <h2>Test Terminated</h2>
                  <p>This session has been ended due to repeated violations.</p>
                  <button onClick={resetTest} className="reset-button">Start New Session</button>
                </div>
              )}
            </div>
            
            <div className="control-panel">
                <h2>Event Log</h2>
                <div className="event-log-container" ref={eventLogRef}>
                    {events.map(renderEvent)}
                </div>
                <div className="controls">
                    <button onClick={resetTest} className="reset-button" disabled={!isConnected && !isTestTerminated}>
                        Reset Session
                    </button>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '● Connected' : '○ Disconnected'}
                    </div>
                </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
