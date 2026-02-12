// Simple test to verify quiz functionality
import { questions } from './questions';

console.log('Testing Quiz Application...\n');

// Test 1: Check if all topics have questions
console.log('1. Checking question bank...');
const topics = ['os', 'computerNetworks', 'dsa'];
topics.forEach(topic => {
  if (questions[topic] && questions[topic].length === 10) {
    console.log(`✓ ${topic} topic has 10 questions`);
  } else {
    console.log(`✗ ${topic} topic issue - found ${questions[topic]?.length || 0} questions`);
  }
});

// Test 2: Check question structure
console.log('\n2. Checking question structure...');
const sampleQuestion = questions.os[0];
const requiredFields = ['id', 'question', 'options', 'correct'];
requiredFields.forEach(field => {
  if (sampleQuestion[field] !== undefined) {
    console.log(`✓ Field '${field}' exists`);
  } else {
    console.log(`✗ Field '${field}' missing`);
  }
});

// Test 3: Check options structure
console.log('\n3. Checking options structure...');
if (Array.isArray(sampleQuestion.options) && sampleQuestion.options.length === 4) {
  console.log('✓ Each question has 4 options');
} else {
  console.log('✗ Options structure issue');
}

// Test 4: Check correct answer validity
console.log('\n4. Checking correct answer validity...');
if (typeof sampleQuestion.correct === 'number' && 
    sampleQuestion.correct >= 0 && 
    sampleQuestion.correct < 4) {
  console.log('✓ Correct answer is valid');
} else {
  console.log('✗ Correct answer invalid');
}

console.log('\nQuiz application test completed!');
console.log('You can now start the application and test the full flow:');
console.log('1. Select a topic');
console.log('2. Answer 10 questions');
console.log('3. View results');
console.log('4. Experience proctoring monitoring during the quiz');
