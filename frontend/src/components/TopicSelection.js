import React from 'react';
import './TopicSelection.css';

const TopicSelection = ({ onTopicSelect }) => {
  const topics = [
    { 
      id: 'os', 
      name: 'Operating Systems', 
      description: 'Questions about OS concepts, scheduling, memory management, and more',
      icon: '💻'
    },
    { 
      id: 'computerNetworks', 
      name: 'Computer Networks', 
      description: 'Questions about networking protocols, OSI model, TCP/IP, and network security',
      icon: '🌐'
    },
    { 
      id: 'dsa', 
      name: 'Data Structures & Algorithms', 
      description: 'Questions about data structures, algorithms, time complexity, and problem-solving',
      icon: '🧮'
    }
  ];

  return (
    <div className="topic-selection">
      <div className="topic-selection-header">
        <h1>Select Quiz Topic</h1>
        <p>Choose a topic from which you want to answer 10 multiple-choice questions</p>
      </div>
      
      <div className="topics-grid">
        {topics.map((topic) => (
          <div 
            key={topic.id}
            className="topic-card"
            onClick={() => onTopicSelect(topic.id)}
          >
            <div className="topic-icon">{topic.icon}</div>
            <h3>{topic.name}</h3>
            <p>{topic.description}</p>
            <button className="select-topic-btn">Select Topic</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicSelection;
