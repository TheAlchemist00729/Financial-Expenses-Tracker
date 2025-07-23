const mockExpenses = [
  { id: 1, description: "Coffee & Breakfast", category: "Food & Dining", amount: 15.50, date: "2024-01-15" },
  { id: 2, description: "Gas Station Fill-up", category: "Transportation", amount: 45.00, date: "2024-01-16" },
  { id: 3, description: "Grocery Shopping @ Walmart", category: "Food & Dining", amount: 120.75, date: "2024-01-17" },
  { id: 4, description: "Netflix Subscription", category: "Entertainment", amount: 15.99, date: "2024-01-18" },
  { id: 5, description: "Phone Bill Payment", category: "Utilities", amount: 85.00, date: "2024-01-19" },
  { id: 6, description: "Amazon Purchase - Books", category: "Shopping", amount: 29.99, date: "2024-01-20" },
  { id: 7, description: "Restaurant Dinner", category: "Food & Dining", amount: 67.50, date: "2024-01-21" }
];

function runTestSuite() {
  console.log("Starting Search Bar Test Suite...\n");
  
  let passedTests = 0;
  let totalTests = 7;

  function runTest(testName, testFunction) {
    try {
      const result = testFunction();
      if (result) {
        console.log(`${testName}: PASSED`);
        passedTests++;
      } else {
        console.log(`${testName}: FAILED`);
      }
    } catch (error) {
      console.log(`${testName}: ERROR - ${error.message}`);
    }
  }

  runTest("Test 1 - Basic Description Search", () => {
    const results = filterExpenses(mockExpenses, "coffee");
    return results.length === 1 && results[0].description.includes("Coffee");
  });

  runTest("Test 2 - Category Search", () => {
    const results = filterExpenses(mockExpenses, "FOOD");
    return results.length === 3;
  });

  runTest("Test 3 - Date Search", () => {
    const results = filterExpenses(mockExpenses, "2024-01-16");
    return results.length === 1 && results[0].description.includes("Gas Station");
  });

  runTest("Test 4 - Special Characters & Numbers", () => {
    const results = filterExpenses(mockExpenses, "@walmart");
    return results.length === 1 && results[0].description.includes("Walmart");
  });

  runTest("Test 5 - Partial Word Search", () => {
    const results = filterExpenses(mockExpenses, "net");
    return results.length === 1 && results[0].description.includes("Netflix");
  });

  runTest("Test 6 - Empty Search Term", () => {
    const results = filterExpenses(mockExpenses, "");
    return results.length === mockExpenses.length;
  });

  runTest("Test 7 - Multiple Words with Special Chars", () => {
    const results = filterExpenses(mockExpenses, "phone bill!");
    return results.length === 1 && results[0].description.includes("Phone Bill");
  });

  console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log("All tests passed. Your search function is working correctly.");
  } else {
    console.log("Some tests failed. Please review the search function implementation.");
  }

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

runTestSuite();

function performanceTest() {
  console.log("Running Performance Test...");
  
  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    filterExpenses(mockExpenses, "test search term");  
  }
  const endTime = performance.now();
  
  const avgTime = (endTime - startTime) / 1000;
  console.log(`Average time per search: ${avgTime.toFixed(4)}ms`);
  
  if (avgTime < 1) {
    console.log("Performance test passed - Search is fast enough");
  } else {
    console.log("Performance test warning - Search might be slow");
  }
}

performanceTest();
