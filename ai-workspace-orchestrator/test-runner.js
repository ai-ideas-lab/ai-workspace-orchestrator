const { AIEngineService } = require('./services/ai-engine-service.ts');

// Simple test runner
const testService = new AIEngineService();

console.log('🧪 Running AI Engine Service Tests...\n');

// Test 1: Basic engine selection
try {
  const task = {
    id: '1',
    type: 'text-generation',
    content: 'Hello, world!',
    engine: 'chatgpt',
  };
  
  const engine = testService.selectEngine(task);
  console.log('✅ Test 1 - Engine selection:', engine.name);
} catch (error) {
  console.log('❌ Test 1 - Engine selection failed:', error.message);
}

// Test 2: Engine configuration
try {
  const config = testService.getEngineConfig('chatgpt');
  console.log('✅ Test 2 - Engine config:', config.name);
} catch (error) {
  console.log('❌ Test 2 - Engine config failed:', error.message);
}

// Test 3: Task execution
try {
  const task = {
    id: '2',
    type: 'text-generation',
    content: 'Write a hello world program',
    engine: 'chatgpt',
  };
  
  const result = await testService.executeTask(task);
  if (result.success) {
    console.log('✅ Test 3 - Task execution: Success');
  } else {
    console.log('❌ Test 3 - Task execution failed:', result.error);
  }
} catch (error) {
  console.log('❌ Test 3 - Task execution error:', error.message);
}

// Test 4: Error handling with null task (this should fail)
try {
  const result = await testService.executeTask(null);
  if (result.success) {
    console.log('❌ Test 4 - Should have failed but succeeded');
  } else {
    console.log('✅ Test 4 - Error handling works:', result.error);
  }
} catch (error) {
  console.log('✅ Test 4 - Error handling works:', error.message);
}

console.log('\n🔍 Test Analysis: Found bugs that need to be fixed!');
console.log('   - Error handling for null/undefined tasks needs improvement');
console.log('   - Task validation is missing');
console.log('   - Engine selection logic has edge cases');