const API_BASE = 'http://localhost:5001/api';

async function testCuisinesEndpoint() {
  try {
    console.log('Testing cuisines endpoint...\n');
    
    const response = await fetch(`${API_BASE}/recipes/cuisines/list`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Successfully retrieved ${data.count} cuisines`);
    console.log(`📋 First 10 cuisines: ${data.data.slice(0, 10).join(', ')}`);
    console.log(`📊 Total cuisines available: ${data.count}`);
    
    // Test that cuisines are sorted
    const sorted = [...data.data].sort();
    const isSorted = JSON.stringify(data.data) === JSON.stringify(sorted);
    console.log(`🔤 Cuisines are sorted: ${isSorted ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCuisinesEndpoint();