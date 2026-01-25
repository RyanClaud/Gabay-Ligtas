// Simple test script to verify analysis functionality
// Run with: node test-analysis.js

const testMessages = [
  {
    text: "Hello, how are you today?",
    expected: "safe"
  },
  {
    text: "Congratulations! You won 1 million pesos! Click this link now: http://fake-bank.com/claim",
    expected: "scam"
  },
  {
    text: "Please send your OTP code to verify your account",
    expected: "scam"
  },
  {
    text: "Kumusta ka? Kamusta ang pamilya?",
    expected: "safe"
  },
  {
    text: "URGENT: Your bank account will be suspended. Click here immediately!",
    expected: "scam"
  }
];

// Simple pattern-based analysis for testing
function simpleAnalysis(text) {
  const hasLink = /https?:\/\/|www\.|\.com|\.org|\.net/i.test(text);
  const hasOTP = /otp|pin|mpin|password|passcode/i.test(text);
  const hasUrgency = /urgent|asap|now|limited|expire|act fast|immediately/i.test(text);
  const hasPrize = /won|winner|prize|free|congratulations|nanalo|million/i.test(text);
  
  const suspiciousCount = [hasLink, hasOTP, hasUrgency, hasPrize].filter(Boolean).length;
  
  return {
    isScam: suspiciousCount >= 2,
    confidence: suspiciousCount >= 2 ? 0.8 : 0.2,
    suspiciousIndicators: {
      hasLink,
      hasOTP,
      hasUrgency,
      hasPrize,
      count: suspiciousCount
    }
  };
}

console.log('🧪 Testing Analysis Logic...\n');

testMessages.forEach((test, index) => {
  const result = simpleAnalysis(test.text);
  const isCorrect = (result.isScam && test.expected === "scam") || (!result.isScam && test.expected === "safe");
  
  console.log(`Test ${index + 1}: ${isCorrect ? '✅' : '❌'}`);
  console.log(`Text: "${test.text}"`);
  console.log(`Expected: ${test.expected}, Got: ${result.isScam ? 'scam' : 'safe'}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Indicators:`, result.suspiciousIndicators);
  console.log('---\n');
});

console.log('✅ Analysis logic test completed!');