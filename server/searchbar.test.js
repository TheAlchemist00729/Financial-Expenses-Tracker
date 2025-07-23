function filterExpenses(expenses, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return expenses;
  }
  const normalizedSearchTerm = searchTerm
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return expenses.filter(expense => {
    const normalizedDescription = (expense.description || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const normalizedCategory = (expense.category || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const normalizedDate = expense.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : '';
    const descriptionMatch = normalizedDescription.includes(normalizedSearchTerm);
    const categoryMatch = normalizedCategory.includes(normalizedSearchTerm);
    const dateMatch = normalizedDate.includes(searchTerm.toLowerCase().trim());
    const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 0);
    const wordMatches = searchWords.some(word =>
      normalizedDescription.includes(word) ||
      normalizedCategory.includes(word)
    );
    return descriptionMatch || categoryMatch || dateMatch || wordMatches;
  });
}

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
  console.log("Starting Enhanced Search Bar Test Suite...\n");
  
  let passedTests = 0;
  let totalTests = 12;

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

  runTest("Test 8 - Case Insensitive Search", () => {
    const results = filterExpenses(mockExpenses, "NETFLIX");
    return results.length === 1 && results[0].description.includes("Netflix");
  });

  runTest("Test 9 - Multi-word Category Search", () => {
    const results = filterExpenses(mockExpenses, "food dining");
    return results.length === 3;
  });

  runTest("Test 10 - Punctuation Normalization", () => {
    const results = filterExpenses(mockExpenses, "coffee&breakfast");
    return results.length === 1 && results[0].description.includes("Coffee & Breakfast");
  });

  runTest("Test 11 - Word Match Across Fields", () => {
    const results = filterExpenses(mockExpenses, "entertainment netflix");
    return results.length === 1 && results[0].category === "Entertainment";
  });

  runTest("Test 12 - No Results Found", () => {
    const results = filterExpenses(mockExpenses, "nonexistent");
    return results.length === 0;
  });

  console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log("All tests passed. Search function is working correctly.");
  } else {
    console.log("Some tests failed. Please review the implementation.");
  }

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

function performanceTest() {
  console.log("\nRunning Performance Test...");
  
  const searchTerms = ["coffee", "food dining", "2024-01-16", "@walmart", "netflix subscription"];
  
  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    const searchTerm = searchTerms[i % searchTerms.length];
    filterExpenses(mockExpenses, searchTerm);
  }
  const endTime = performance.now();
  
  const totalTime = endTime - startTime;
  const avgTime = totalTime / 1000;
  
  console.log(`Performed 1000 searches in ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per search: ${avgTime.toFixed(4)}ms`);
  
  if (avgTime < 1) {
    console.log("Performance test passed");
  } else {
    console.log("Performance warning - may be slow on large datasets");
  }

  return {
    totalTime: totalTime,
    avgTime: avgTime,
    performant: avgTime < 1
  };
}

function demonstrateSearchCapabilities() {
  console.log("\nSearch Capability Demonstration:");
  console.log("=====================================");

  const demonstrations = [
    { term: "coffee", description: "Simple word search" },
    { term: "Food", description: "Case-insensitive category search" },
    { term: "2024-01-16", description: "Exact date search" },
    { term: "@walmart", description: "Special character search" },
    { term: "phone bill", description: "Multi-word search" },
    { term: "net", description: "Partial word matching" },
    { term: "food & dining", description: "Category with punctuation" },
    { term: "amazon books", description: "Cross-field word matching" }
  ];

  demonstrations.forEach(demo => {
    const results = filterExpenses(mockExpenses, demo.term);
    console.log(`\n"${demo.term}" (${demo.description}):`);
    console.log(`  Found ${results.length} result(s):`);
    results.forEach(expense => {
      console.log(`    • ${expense.description} (${expense.category}) - $${expense.amount}`);
    });
  });
}

function runAllTests() {
  const testResults = runTestSuite();
  const perfResults = performanceTest();
  demonstrateSearchCapabilities();

  console.log("\n" + "=".repeat(50));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(50));
  console.log(`Tests: ${testResults.passed}/${testResults.total} passed`);
  console.log(`Performance: ${perfResults.avgTime.toFixed(4)}ms average`);
  console.log(`Overall Status: ${testResults.success && perfResults.performant ? 'EXCELLENT' : 'NEEDS ATTENTION'}`);

  return {
    testsPassed: testResults.success,
    performanceGood: perfResults.performant,
    overallSuccess: testResults.success && perfResults.performant
  };
}

runAllTests();
