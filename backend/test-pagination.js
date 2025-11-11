const API_BASE = 'http://localhost:5001/api';

async function makeRequest(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
  }
  return response.json();
}

async function testPaginationAndCuisines() {
  try {
    console.log('Testing Pagination and Cuisines...\n');
    
    // Test pagination with different limits
    console.log('1. Testing pagination with limit=5...');
    const page1 = await makeRequest(`${API_BASE}/recipes?page=1&limit=5`);
    console.log(`✅ Page 1: ${page1.data.length} recipes, Total: ${page1.total}, Pages: ${page1.totalPages}`);
    
    console.log('\n2. Testing pagination with limit=10...');
    const page2 = await makeRequest(`${API_BASE}/recipes?page=1&limit=10`);
    console.log(`✅ Page 1: ${page2.data.length} recipes, Total: ${page2.total}, Pages: ${page2.totalPages}`);
    
    console.log('\n3. Testing second page...');
    const page2_2 = await makeRequest(`${API_BASE}/recipes?page=2&limit=5`);
    console.log(`✅ Page 2: ${page2_2.data.length} recipes`);
    
    // Test cuisines
    console.log('\n4. Testing cuisines endpoint...');
    const cuisines = await makeRequest(`${API_BASE}/recipes/cuisines/list`);
    console.log(`✅ Retrieved ${cuisines.count} cuisines`);
    console.log(`📋 First 10 cuisines: ${cuisines.data.slice(0, 10).join(', ')}`);
    
    // Show sample recipe data
    console.log('\n5. Sample recipe data:');
    if (page1.data.length > 0) {
      const sample = page1.data[0];
      console.log(`   Title: ${sample.title}`);
      console.log(`   Cuisine: ${sample.cuisine}`);
      console.log(`   Rating: ${sample.rating}`);
    }
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPaginationAndCuisines();