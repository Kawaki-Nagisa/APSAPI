async function testCalculator() {
  try {
    const response = await fetch('http://localhost:3001/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      //annualConsumption: 20000,
      //solarGeneration: 15000,
      batteryCapacity: 10,
      ampService: 200,
      monthlyConsumption: {
        January: 1426.00,
        February: 1238.00,
        March: 1070.00,
        April: 1096.00,
        May: 1430.00,
        June: 2018.00,
        July: 2826.00,
        August: 2834.00,
        September: 2324.00,
        October: 1686.00,
        November: 948.00,
        December: 1104.00
      },
      monthlySolarGeneration: {
        January: 849.87,
        February: 1267.25,
        March: 1421.87,
        April: 1536.97,
        May: 1589.29,
        June: 1770.70,
        July: 1756.53,
        August: 1645.52,
        September: 1255.18,
        October: 805.84,
        November: 582.11,
        December: 518.87
      }
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
