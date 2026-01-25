// Simple test script to verify analysis functionality
// Run with: node test-analysis.js

const testMessages = [
  {
    text: "Welcome, Ka-TM! Para magamit ang call, text at data ng iyong bagong SIM card, i-register muna ito sa TM SIM registration portal for free, alinsunod sa SIM Registration Act. Meron ka pang LIBRENG up to 20GB pagka-register. I-text ang FREEEZ50 to 8080 para makuha ang 2GB pang-internet, 3GB (1GB araw-araw) para sa FunAliw apps, at unli texts to ALL NETWORKS for 3 days. Para sa iba pang detalye tungkol sa inyong SIM, pumunta sa TM Tambayan website.",
    expected: "safe",
    description: "Legitimate TM telco message"
  },
  {
    text: "09675715673 received PHP 200.00 from 09*****7653! New balance: PHP 1,200.00. Claim your bonus https://bit.ly/4jSRL6w",
    expected: "scam",
    description: "Fake money transfer with suspicious link"
  },
  {
    text: "Hello, how are you today?",
    expected: "safe",
    description: "Normal conversation"
  },
  {
    text: "Congratulations! You won 1 million pesos! Click this link now: http://fake-bank.com/claim",
    expected: "scam",
    description: "Classic prize scam"
  },
  {
    text: "Please send your OTP code to verify your account",
    expected: "scam",
    description: "OTP phishing attempt"
  }
];

// Enhanced pattern-based analysis for testing
function enhancedAnalysis(text) {
  const hasLink = /https?:\/\/|www\.|\.com|\.org|\.net|bit\.ly|tinyurl|click here|click this/i.test(text);
  const hasOTP = /otp|pin|mpin|password|passcode|verification code|verify/i.test(text);
  const hasUrgency = /urgent|asap|now|limited|expire|act fast|immediately|suspended|expire|deadline/i.test(text);
  const hasPrize = /won|winner|prize|free|congratulations|nanalo|million|pesos|dollars|claim|reward|bonus/i.test(text);
  const hasBankTerms = /bank|account|suspended|verify|confirm|update|security|balance|received.*php|new balance/i.test(text);
  const hasPhishing = /click|download|install|update|confirm|verify|login|sign in/i.test(text);
  const hasFakeTransfer = /received.*php.*from.*new balance.*claim/i.test(text.toLowerCase());
  
  // More sophisticated scoring
  let riskScore = 0;
  if (hasLink) riskScore += 0.3;
  if (hasOTP) riskScore += 0.4;
  if (hasUrgency) riskScore += 0.2;
  if (hasPrize) riskScore += 0.3;
  if (hasBankTerms) riskScore += 0.2;
  if (hasPhishing) riskScore += 0.2;
  if (hasFakeTransfer) riskScore += 0.6; // High risk for fake transfer messages
  
  // Combinations are more dangerous
  if (hasLink && hasUrgency) riskScore += 0.3;
  if (hasOTP && hasBankTerms) riskScore += 0.4;
  if (hasPrize && hasLink) riskScore += 0.4;
  if (hasFakeTransfer && hasLink) riskScore += 0.5; // Very high risk
  
  const isScam = riskScore >= 0.5;
  const confidence = Math.min(0.95, Math.max(0.1, riskScore));
  
  return {
    isScam,
    confidence,
    riskScore,
    suspiciousIndicators: {
      hasLink,
      hasOTP,
      hasUrgency,
      hasPrize,
      hasBankTerms,
      hasPhishing,
      hasFakeTransfer
    }
  };
}

console.log('🧪 Testing Enhanced Analysis Logic...\n');

testMessages.forEach((test, index) => {
  const result = enhancedAnalysis(test.text);
  const isCorrect = (result.isScam && test.expected === "scam") || (!result.isScam && test.expected === "safe");
  
  console.log(`Test ${index + 1}: ${isCorrect ? '✅' : '❌'} - ${test.description}`);
  console.log(`Text: "${test.text.substring(0, 100)}${test.text.length > 100 ? '...' : ''}"`);
  console.log(`Expected: ${test.expected}, Got: ${result.isScam ? 'scam' : 'safe'}`);
  console.log(`Confidence: ${result.confidence.toFixed(2)}, Risk Score: ${result.riskScore.toFixed(2)}`);
  console.log(`Indicators:`, result.suspiciousIndicators);
  console.log('---\n');
});

console.log('✅ Enhanced analysis logic test completed!');