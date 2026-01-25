// Simple test script to verify analysis functionality
// Run with: node test-analysis.js

const testMessages = [
  // LEGITIMATE MESSAGES (should be SAFE)
  {
    text: "Welcome, Ka-TM! Para magamit ang call, text at data ng iyong bagong SIM card, i-register muna ito sa TM SIM registration portal for free, alinsunod sa SIM Registration Act. Meron ka pang LIBRENG up to 20GB pagka-register. I-text ang FREEEZ50 to 8080 para makuha ang 2GB pang-internet, 3GB (1GB araw-araw) para sa FunAliw apps, at unli texts to ALL NETWORKS for 3 days. Para sa iba pang detalye tungkol sa inyong SIM, pumunta sa TM Tambayan website.",
    expected: "safe",
    description: "Legitimate TM telco SIM registration message"
  },
  {
    text: "Hello, how are you today? Hope you're doing well!",
    expected: "safe",
    description: "Normal friendly conversation"
  },
  {
    text: "Your order #12345 has been shipped. Tracking number: ABC123. Expected delivery: Tomorrow.",
    expected: "safe",
    description: "Legitimate business delivery notification"
  },
  
  // PHILIPPINE SCAM PATTERNS (should be DANGEROUS)
  {
    text: "09675715673 received PHP 200.00 from 09*****7653! New balance: PHP 1,200.00. Claim your bonus https://bit.ly/4jSRL6w",
    expected: "scam",
    description: "Fake money transfer scam with suspicious link"
  },
  {
    text: "CONGRATULATIONS! Nanalo ka ng PHP 500,000 sa GCash raffle! I-click ang link para ma-claim: www.gcash-promo.com",
    expected: "scam",
    description: "Prize/lottery scam impersonating GCash"
  },
  {
    text: "URGENT: Your BPI account will be suspended. Verify now by clicking: https://bpi-verify.com and enter your MPIN",
    expected: "scam",
    description: "Banking phishing scam targeting BPI customers"
  },
  {
    text: "Hi Lola, ako si Maria, anak ni Tita Rosa. Emergency po, nasa hospital si Mama. Need ko po ng 10,000 para sa operation. Paki-send sa GCash ko: 09123456789",
    expected: "scam",
    description: "Family impersonation emergency scam"
  },
  {
    text: "INVESTMENT OPPORTUNITY! Guaranteed 50% return sa crypto trading. Limited slots lang! Mag-invest na ng minimum 5,000 pesos. Contact: 09876543210",
    expected: "scam",
    description: "Investment/cryptocurrency scam"
  },
  {
    text: "Please send your OTP code to verify your account. Urgent na po ito!",
    expected: "scam",
    description: "OTP phishing with urgency"
  },
  {
    text: "Selling verified GCash accounts and registered SIM cards. Cheap price! Contact me for details.",
    expected: "scam",
    description: "Illegal SIM/e-wallet account selling (AFASA violation)"
  },
  {
    text: "Hi love, I'm stuck at the airport. Need money for emergency flight home. Can you send 15,000 pesos? I'll pay you back tomorrow.",
    expected: "scam",
    description: "Romance scam with travel emergency"
  }
];

// Enhanced pattern-based analysis for testing Philippine cybercrime scams
function enhancedAnalysis(text) {
  // Philippine-specific scam indicators
  const hasLink = /https?:\/\/|www\.|\.com|\.org|\.net|bit\.ly|tinyurl|click here|click this|i-click|pindutin/i.test(text);
  const hasOTP = /otp|pin|mpin|password|passcode|verification code|verify|i-verify|mag-verify/i.test(text);
  const hasUrgency = /urgent|asap|now|limited|expire|act fast|immediately|suspended|expire|deadline|mabilis|agad|ngayon/i.test(text);
  const hasPrize = /won|winner|prize|free|congratulations|nanalo|million|pesos|dollars|claim|reward|bonus|libreng|premyo/i.test(text);
  const hasBankTerms = /bank|account|suspended|verify|confirm|update|security|balance|received.*php|new balance|gcash|maya|paymaya|bpi|bdo|metrobank/i.test(text);
  const hasPhishing = /click|download|install|update|confirm|verify|login|sign in|mag-login|i-download|i-install/i.test(text);
  const hasFakeTransfer = /received.*php.*from.*new balance.*claim|natanggap.*piso.*mula|bagong balance/i.test(text.toLowerCase());
  const hasInvestment = /investment|invest|crypto|bitcoin|trading|high return|guaranteed|profit|kita|tubo|negosyo|pera/i.test(text);
  const hasRomanceScam = /emergency|travel|hospital|accident|help me|tulong|emergency|aksidente|ospital/i.test(text);
  const hasImpersonation = /family|emergency|urgent help|tulong|pamilya|kapatid|anak|nanay|tatay/i.test(text);
  const hasSIMScam = /sim|registration|register|i-register|sim card|prepaid|postpaid/i.test(text);
  const hasIllegalSales = /selling.*sim|selling.*gcash|selling.*account|verified.*account|registered.*sim/i.test(text);
  
  // Check for legitimate telco patterns (these reduce scam score)
  const isLegitTelco = /welcome.*ka-tm|globe|smart.*prepaid|sim registration.*free|tm tambayan|official.*telco/i.test(text);
  const isLegitBusiness = /receipt|invoice|order|delivery|shipping|resibo|order number/i.test(text);
  
  // More sophisticated Philippine scam scoring
  let riskScore = 0;
  
  // High-risk indicators
  if (hasFakeTransfer) riskScore += 0.8; // Very high risk for fake transfer messages
  if (hasOTP && hasBankTerms) riskScore += 0.7; // Banking phishing
  if (hasInvestment && hasUrgency) riskScore += 0.6; // Investment scams
  if (hasLink && hasUrgency) riskScore += 0.5; // Urgent phishing
  if (hasPrize && hasLink) riskScore += 0.5; // Prize scams
  
  // Medium-risk indicators
  if (hasLink) riskScore += 0.3;
  if (hasOTP) riskScore += 0.4;
  if (hasUrgency) riskScore += 0.2;
  if (hasPrize) riskScore += 0.3;
  if (hasBankTerms) riskScore += 0.2;
  if (hasPhishing) riskScore += 0.2;
  if (hasRomanceScam) riskScore += 0.3;
  if (hasImpersonation) riskScore += 0.3;
  if (hasIllegalSales) riskScore += 0.6; // High risk for illegal account/SIM sales
  
  // Reduce score for legitimate patterns
  if (isLegitTelco) riskScore -= 0.4;
  if (isLegitBusiness) riskScore -= 0.3;
  if (hasSIMScam && isLegitTelco) riskScore -= 0.5; // Legitimate SIM registration
  
  // Ensure score stays within bounds
  riskScore = Math.max(0, Math.min(2.0, riskScore));
  
  const isScam = riskScore >= 0.5;
  const confidence = Math.min(0.95, Math.max(0.1, riskScore / 2.0));
  
  return {
    isScam,
    confidence,
    riskScore,
    suspiciousIndicators: {
      hasLink, hasOTP, hasUrgency, hasPrize, hasBankTerms, hasPhishing,
      hasFakeTransfer, hasInvestment, hasRomanceScam, hasImpersonation,
      hasSIMScam, hasIllegalSales, isLegitTelco, isLegitBusiness
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