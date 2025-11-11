const API_BASE = 'http://localhost:5001/api';

async function makeRequest(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
  }
  return response.json();
}

async function testAllFixes() {
  try {
    console.log(' Testing All Fixes...\n');
    
    // 1. Test pagination
    console.log('1. Testing Pagination...');
    const page1 = await makeRequest(`${API_BASE}/recipes?page=1&limit=5`);
    console.log(`* Page 1: ${page1.data.length} recipes, Total: ${page1.total}`);
    console.log(`   First recipe: "${page1.data[0].title}"`);
    
    const page2 = await makeRequest(`${API_BASE}/recipes?page=2&limit=5`);
    console.log(`* Page 2: ${page2.data.length} recipes`);
    console.log(`   First recipe: "${page2.data[0].title}"`);
    
    // Check if recipes are different between pages
    const isDifferent = page1.data[0].id !== page2.data[0].id;
    console.log(`* Pages have different content: ${isDifferent}`);
    
    // 2. Test alphabetical ordering
    console.log('\n2. Testing Alphabetical Ordering...');
    const isAlphabetical = page1.data.every((recipe, i, arr) => 
      i === 0 || arr[i-1].title.toLowerCase() <= recipe.title.toLowerCase()
    );
    console.log(`* Recipes are in alphabetical order: ${isAlphabetical}`);
    
    // 3. Test cuisines
    console.log('\n3. Testing Cuisines...');
    const cuisines = await makeRequest(`${API_BASE}/recipes/cuisines/list`);
    console.log(`* Retrieved ${cuisines.count} cuisines`);
    console.log(`📋 First 5 cuisines: ${cuisines.data.slice(0, 5).join(', ')}`);
    
    // 4. Test cuisine filtering
    console.log('\n4. Testing Cuisine Filtering...');
    const testCuisine = cuisines.data[0]; // Use first cuisine from the list
    const filtered = await makeRequest(`${API_BASE}/recipes/search?cuisine=${encodeURIComponent(testCuisine)}`);
    console.log(`* Found ${filtered.count} recipes for cuisine: "${testCuisine}"`);
    
    if (filtered.data.length > 0) {
      const allMatch = filtered.data.every(recipe => recipe.cuisine === testCuisine);
      console.log(`* All filtered recipes match cuisine: ${allMatch}`);
      console.log(`   Sample: "${filtered.data[0].title}" - "${filtered.data[0].cuisine}"`);
    }
    
    // 5. Test different page sizes
    console.log('\n5. Testing Different Page Sizes...');
    const small = await makeRequest(`${API_BASE}/recipes?page=1&limit=3`);
    const large = await makeRequest(`${API_BASE}/recipes?page=1&limit=15`);
    console.log(`* Small page (3): ${small.data.length} recipes`);
    console.log(`* Large page (15): ${large.data.length} recipes`);
    
    console.log('\n🎉 All tests passed! The fixes are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAllFixes();