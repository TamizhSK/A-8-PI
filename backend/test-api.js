const API_BASE = 'http://localhost:5001/api';

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
  }

  return response.json();
}

async function testAPI() {
  console.log('Testing Recipe Management API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest('http://localhost:5001/health');
    console.log('✅ Health check:', healthResponse.message);

    // Test get recipes
    console.log('\n2. Testing get recipes...');
    const recipesResponse = await makeRequest(`${API_BASE}/recipes?page=1&limit=5`);
    console.log(`✅ Retrieved ${recipesResponse.data.length} recipes`);
    console.log(`   Total: ${recipesResponse.total}, Pages: ${recipesResponse.totalPages}`);

    if (recipesResponse.data.length > 0) {
      const firstRecipe = recipesResponse.data[0];
      
      // Test get single recipe
      console.log('\n3. Testing get single recipe...');
      const singleRecipeResponse = await makeRequest(`${API_BASE}/recipes/${firstRecipe.id}`);
      console.log(`✅ Retrieved recipe: ${singleRecipeResponse.data.title}`);

      // Test get cuisines
      console.log('\n4. Testing get cuisines...');
      const cuisinesResponse = await makeRequest(`${API_BASE}/recipes/cuisines/list`);
      console.log(`✅ Retrieved ${cuisinesResponse.count} cuisines: ${cuisinesResponse.data.slice(0, 5).join(', ')}${cuisinesResponse.data.length > 5 ? '...' : ''}`);

      // Test search recipes
      console.log('\n5. Testing search recipes...');
      const searchResponse = await makeRequest(`${API_BASE}/recipes/search?cuisine=${encodeURIComponent(firstRecipe.cuisine)}`);
      console.log(`✅ Search found ${searchResponse.count} recipes for cuisine: ${firstRecipe.cuisine}`);
    }

    // Test create recipe
    console.log('\n6. Testing create recipe...');
    const newRecipe = {
      cuisine: 'Test',
      title: 'Test Recipe ' + Date.now(),
      rating: 4.5,
      prep_time: 15,
      cook_time: 30,
      total_time: 45,
      description: 'A test recipe created by API test',
      serves: '4 people',
      nutrients: {
        calories: 250,
        carbohydrateContent: '30g',
        proteinContent: '15g'
      }
    };

    const createResponse = await makeRequest(`${API_BASE}/recipes`, {
      method: 'POST',
      body: JSON.stringify(newRecipe),
    });
    console.log(`✅ Created recipe: ${createResponse.data.title} (ID: ${createResponse.data.id})`);
    const createdRecipeId = createResponse.data.id;

    // Test update recipe
    console.log('\n7. Testing update recipe...');
    const updateData = {
      rating: 5.0,
      description: 'Updated test recipe description'
    };
    const updateResponse = await makeRequest(`${API_BASE}/recipes/${createdRecipeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    console.log(`✅ Updated recipe rating to: ${updateResponse.data.rating}`);

    // Test delete recipe
    console.log('\n8. Testing delete recipe...');
    const deleteResponse = await makeRequest(`${API_BASE}/recipes/${createdRecipeId}`, {
      method: 'DELETE',
    });
    console.log(`✅ Deleted recipe: ${deleteResponse.data.title}`);

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testAPI();