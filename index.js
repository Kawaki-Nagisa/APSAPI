// server.js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const PEAK_SOLAR_FACTORS = {
  January: 0.0443,
  February: 0.0679,
  March: 0.0988,
  April: 0.1315,
  May: 0.3555,
  June: 0.3636,
  July: 0.3654,
  August: 0.3609,
  September: 0.3311,
  October: 0.2982,
  November: 0.0656,
  December: 0.0511
};

const SEASONS = {
  WINTER: ['January', 'February', 'March', 'April', 'November', 'December'],
  SUMMER: ['May', 'June', 'July', 'August', 'September', 'October'],
};

const RATES = {
  WINTER: {
    onPeak: 0.09932,   // 4pm-7pm
    offPeak: 0.05938
  },
  SUMMER: {
    onPeak: 0.14227,   // 4pm-7pm
    offPeak: 0.05943
  },
};

const SOLAR_CREDIT_RATE = 0.06857;

const DEMAND_CHARGES = {
  WINTER: [
    { limit: Infinity, rate: 13.747 }
  ],
  SUMMER: [
    { limit: Infinity, rate: 19.585 }
  ]
};

const DEMANDMATRIX = {
  SUMMER: [
    { yearly: 15000, noBattery: 6, values: [3, 1, 0, 0, 0, 0, 0, 0, 0] },
    { yearly: 18000, noBattery: 7, values: [4, 2, 1, 0, 0, 0, 0, 0, 0] },
    { yearly: 21000, noBattery: 8, values: [5, 3, 2, 1, 0, 0, 0, 0, 0] },
    { yearly: 24000, noBattery: 9, values: [6, 4, 2, 1, 0, 0, 0, 0, 0] },
    { yearly: 27000, noBattery: 10, values: [7, 5, 3, 2, 1, 0, 0, 0, 0] },
    { yearly: 30000, noBattery: 11, values: [8, 6, 4, 3, 2, 1, 0, 0, 0] },
    { yearly: 33000, noBattery: 12, values: [9, 7, 5, 4, 3, 2, 1, 0, 0] },
    { yearly: 36000, noBattery: 13, values: [10, 8, 6, 5, 4, 3, 2, 1, 0] },
    { yearly: 39000, noBattery: 14, values: [11, 9, 7, 6, 5, 4, 3, 2, 1] },
    { yearly: 42000, noBattery: 15, values: [12, 10, 8, 7, 6, 5, 4, 3, 2] },
    { yearly: 45000, noBattery: 16, values: [13, 11, 9, 8, 7, 6, 5, 4, 3] },
    { yearly: 48000, noBattery: 17, values: [14, 12, 10, 9, 8, 7, 6, 5, 4] },
    { yearly: 51000, noBattery: 18, values: [15, 13, 11, 10, 9, 8, 7, 6, 5] }
  ],
  WINTER: [
    { yearly: 15000, noBattery: 3, values: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
    { yearly: 18000, noBattery: 4, values: [2, 1, 0, 0, 0, 0, 0, 0, 0] },
    { yearly: 21000, noBattery: 5, values: [3, 1, 0, 0, 0, 0, 0, 0, 0] },
    { yearly: 24000, noBattery: 6, values: [4, 2, 1, 0, 0, 0, 0, 0, 0] },
    { yearly: 27000, noBattery: 7, values: [5, 3, 1, 0, 0, 0, 0, 0, 0] },
    { yearly: 30000, noBattery: 8, values: [6, 4, 2, 1, 0, 0, 0, 0, 0] },
    { yearly: 33000, noBattery: 9, values: [7, 5, 3, 2, 1, 0, 0, 0, 0] },
    { yearly: 36000, noBattery: 11, values: [8, 6, 4, 3, 2, 1, 0, 0, 0] },
    { yearly: 39000, noBattery: 12, values: [9, 7, 5, 4, 3, 2, 1, 0, 0] },
    { yearly: 42000, noBattery: 13, values: [10, 8, 6, 5, 4, 3, 2, 1, 0] },
    { yearly: 45000, noBattery: 14, values: [11, 9, 7, 6, 5, 4, 3, 2, 1] },
    { yearly: 48000, noBattery: 16, values: [12, 10, 8, 7, 6, 5, 4, 3, 2] },
    { yearly: 51000, noBattery: 16, values: [13, 11, 9, 8, 7, 6, 5, 4, 3] }
  ]
};

function getDemandValue(totalConsumption, batteryCapacity, season) {
  // Map battery capacities to their column index
  const batteryCapacityMapping = [5, 10, 15, 20, 25, 30, 35, 40, 45];
  const batteryIndex = batteryCapacityMapping.indexOf(batteryCapacity);

  if (batteryIndex === -1) {
    throw new Error("Invalid battery capacity. Choose from: 5, 10, 15, 20, 25, 30, 35, 40, 45.");
  }

  // Sort rows by yearly values to ensure proper comparison
  const sortedRows = DEMANDMATRIX[season].sort((a, b) => a.yearly - b.yearly);

  // Find the row with the nearest upper yearly value
  const demandRow = sortedRows.find(row => row.yearly >= totalConsumption);

  if (!demandRow) {
    throw new Error(`No data found for total consumption of ${totalConsumption} in ${season} season.`);
  }

  // Return the value at the specific battery index
  return demandRow.values[batteryIndex];
}

const SERVICE_CHARGES = {
  200: 32.44,  // ≤ 200 Amp
  201: 45.44   // > 200 Amp
};

const ON_PEAK_PERCENT_WINTER = 0.2;
const OFF_PEAK_PERCENT_WINTER = 0.8;

function getSeasonForMonth(month) {
  if (SEASONS.WINTER.includes(month)) return 'WINTER';
  if (SEASONS.SUMMER.includes(month)) return 'SUMMER';
  return 'WINTER'; // fallback
}

// Determine which demand charge rate to use
function calculateDemandCharge(season, demandKw) {
  const tiers = DEMAND_CHARGES[season];
  //console.log(tiers);
  let charge = 0;
  let remaining = demandKw;
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const limit = tier.limit;
    if (limit === Infinity || remaining <= limit) {
      charge += remaining * tier.rate;
      break;
    } else {
      charge += limit * tier.rate;
      remaining -= limit;
    }
  }
  return charge;
}

function getServiceCharge(ampService) {
  return ampService > 200 ? SERVICE_CHARGES[201] : SERVICE_CHARGES[200];
}

app.post('/api/calculate', (req, res) => {
  const { batteryCapacity, ampService,monthlyConsumption,monthlySolarGeneration,totalConsumption,totalSolarGeneration } = req.body;

  // Assume 22 days per month for battery calculation as per the example
  const DAYS_PER_MONTH = 22;
  const batteryMonthly = batteryCapacity * DAYS_PER_MONTH;

  let results = [];
  let totalServiceCharge = 0;
  let totalOnPeak = 0;
  let totalOffPeak = 0;
  let totalDemand = 0;
  let totalCredits = 0;
  let annualConsumption = 0;
  let solarGeneration = 0;

  
  for (const month of MONTHS) {

    const monthConsumption = monthlyConsumption[month];
    const monthSolar = monthlySolarGeneration[month];
    annualConsumption += monthConsumption;
    solarGeneration += monthlySolarGeneration[month]; 


    const season = getSeasonForMonth(month);
    const demandKw = getDemandValue(totalConsumption, batteryCapacity, season);
    const rateObj = RATES[season];

    let onPeakPercent;
    let offPeakPercent;

    // The example calculation is explicitly winter-based for on/off peak splits:
    if (season === 'WINTER') {
      onPeakPercent = ON_PEAK_PERCENT_WINTER;
      offPeakPercent = OFF_PEAK_PERCENT_WINTER;
    } else {
      // For simplicity, assume onPeak=30%, offPeak=70% outside winter.
      onPeakPercent = 0.25;
      offPeakPercent = 0.75;
    }

    const onPeakConsumption = monthConsumption * onPeakPercent;
    const onPeakSolar = monthSolar * PEAK_SOLAR_FACTORS[month];
    const onPeakNet = Math.max(0, onPeakConsumption - onPeakSolar - batteryMonthly);
    const onPeakCost = onPeakNet > 0 ? onPeakNet * rateObj.onPeak : 0;
    const onPeakCredit = onPeakNet < 0 ? Math.abs(onPeakNet) * rateObj.onPeak : 0;

    const offPeakConsumption = monthConsumption * offPeakPercent;
    const offPeakSolar = monthSolar - onPeakSolar;
    const offPeakNet = offPeakConsumption - offPeakSolar + batteryMonthly;
    const offPeakCost = offPeakNet > 0 ? offPeakNet * rateObj.offPeak : 0;
    const offPeakCredit = offPeakNet < 0 ? Math.abs(offPeakNet) * rateObj.offPeak : 0;

    const demandCharge = calculateDemandCharge(season, demandKw);
    const serviceCharge = getServiceCharge(ampService);

    const totalCreditThisMonth = onPeakCredit + offPeakCredit;
    const netAmount = (monthConsumption-monthSolar);
    const netAmountPostBattery = (monthConsumption-monthSolar-batteryMonthly);
    const solarCreds = netAmountPostBattery * SOLAR_CREDIT_RATE;
    totalServiceCharge += serviceCharge;
    totalOnPeak += onPeakCost;
    totalOffPeak += offPeakCost;
    totalDemand += demandCharge;
    totalCredits += totalCreditThisMonth;
    
    results.push({
      month,
      season,
      monthConsumption,
      monthSolar,
      onPeakConsumption,
      onPeakSolar,
      offPeakConsumption,
      offPeakSolar,
      batteryUsed: batteryMonthly,
      onPeakNet,
      offPeakNet,
      onPeakRate: rateObj.onPeak,
      offPeakRate: rateObj.offPeak,
      onPeakCost,
      offPeakCost,
      demandCharge,
      serviceCharge,
      solarCredits: solarCreds,
      finalMonthCost: serviceCharge + onPeakCost + offPeakCost + demandCharge - solarCreds
    });
  }

  const summary = {
    annualConsumption,
    solarGeneration,
    batteryCapacity,
    ampService,
    totalServiceCharge,
    totalOnPeakCost: totalOnPeak,
    totalOffPeakCost: totalOffPeak,
    totalDemandCost: totalDemand,
    totalSolarCredits: totalCredits,
    grandTotal: (totalServiceCharge + totalOnPeak + totalOffPeak + totalDemand - totalCredits),
    grandTotalMonthly: (totalServiceCharge + totalOnPeak + totalOffPeak + totalDemand - totalCredits)/12
  };

  res.json({ breakdown: results, summary });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
