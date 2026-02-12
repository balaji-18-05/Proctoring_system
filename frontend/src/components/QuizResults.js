import React from 'react';
import './QuizResults.css';

const QuizResults = ({ results, onRetakeQuiz, onBackToTopics }) => {
  const {
    score,
    totalQuestions,
    timeSpent,
    terminated,
    warningCount = 0,
  } = results;

  const percentage = Math.round((score / totalQuestions) * 100);
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A', color: '#27ae60', message: 'Excellent!' };
    if (percentage >= 80) return { grade: 'B', color: '#3498db', message: 'Good job!' };
    if (percentage >= 70) return { grade: 'C', color: '#f39c12', message: 'Fair performance' };
    if (percentage >= 60) return { grade: 'D', color: '#e67e22', message: 'Needs improvement' };
    return { grade: 'F', color: '#e74c3c', message: 'Please retake the quiz' };
  };

  const gradeInfo = getGrade();

  // Debug logging
  console.log('QuizResults - warningCount:', warningCount);
  console.log('QuizResults - terminated:', terminated);
  console.log('QuizResults - full results:', results);

  return (
    <div className="quiz-results">
      <div className="results-container">
        <div className="results-header">
          <h2>Quiz Results</h2>
          {terminated && (
            <div className="termination-notice">
              ⚠️ Quiz was terminated due to proctoring violations
            </div>
          )}
        </div>

        <div className="score-section">
          <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
            <div className="score-content">
              <div className="score-percentage" style={{ color: gradeInfo.color }}>
                {percentage}%
              </div>
              <div className="score-grade" style={{ color: gradeInfo.color }}>
                {gradeInfo.grade}
              </div>
            </div>
          </div>
          <div className="grade-message" style={{ color: gradeInfo.color }}>
            {gradeInfo.message}
          </div>
        </div>

        <div className="results-stats">
          <div className="stat-item">
            <div className="stat-label">Correct Answers</div>
            <div className="stat-value">{score} / {totalQuestions}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Time Taken</div>
            <div className="stat-value">{formatTime(timeSpent)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Proctoring Warnings</div>
            <div className="stat-value warning-count">{warningCount} / 3</div>
          </div>
        </div>

        <div className="performance-analysis">
          <h3>Performance Analysis</h3>
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-icon">📊</div>
              <div className="analysis-text">
                <strong>Accuracy:</strong> {percentage}%
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-icon">⏱️</div>
              <div className="analysis-text">
                <strong>Average Time per Question:</strong> {Math.round(timeSpent / totalQuestions)}s
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-icon">👁️</div>
              <div className="analysis-text">
                <strong>Proctoring Status:</strong> {terminated ? 'Failed' : 'Passed'}
              </div>
            </div>
          </div>
        </div>

        {!terminated && (
          <div className="recommendations">
            <h3>Recommendations</h3>
            {percentage >= 80 && (
              <p>🎉 Excellent work! You have a strong understanding of the topic.</p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p>📚 Good effort! Consider reviewing the topics where you struggled to improve your score.</p>
            )}
            {percentage < 60 && (
              <p>📖 You need more practice. We recommend studying the material thoroughly before retaking the quiz.</p>
            )}
            {warningCount > 0 && (
              <p>⚠️ You received {warningCount} proctoring warning(s). Please ensure you maintain proper exam conduct in future attempts.</p>
            )}
          </div>
        )}

        <div className="results-actions">
          <button onClick={onRetakeQuiz} className="retake-btn">
            🔄 Retake Quiz
          </button>
          <button onClick={onBackToTopics} className="back-to-topics-btn">
            📚 Back to Topics
          </button>
        </div>

        {terminated && (
          <div className="termination-details">
            <h3>Termination Details</h3>
            <p>Your quiz was automatically terminated because you exceeded the maximum allowed warnings (3).</p>
            <p>Warnings received: {warningCount}</p>
            <p>Please review the proctoring guidelines and maintain proper exam conduct during future attempts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;
