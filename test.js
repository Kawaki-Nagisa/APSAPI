async function testCalculator() {
  try {
    const response = await fetch('http://localhost:3001/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        annualConsumption: 20000,
        solarGeneration: 15000,
        batteryCapacity: 10,
        ampService: 200
      })
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text(); // Read error response as text
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    // Parse response as JSON
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCalculator();
