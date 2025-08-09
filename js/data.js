// --- Data Tables --- 
export const conventionalMiRates = { 
	sfh_townhome: { 
		"97": {"760":0.18,"740":0.25,"720":0.30,"700":0.45,"680":0.60,"660":0.80}, 
		"95": {"760":0.12,"740":0.18,"720":0.25,"700":0.40,"680":0.55,"660":0.75}, 
		"90": {"760":0.08,"740":0.12,"720":0.18,"700":0.28,"680":0.40,"660":0.55}, 
		"85": {"760":0.06,"740":0.09,"720":0.14,"700":0.22,"680":0.30,"660":0.41} 
	}, 
	condo: { 
		"97": {"760":0.22,"740":0.30,"720":0.36,"700":0.54,"680":0.72,"660":0.96}, 
		"95": {"760":0.15,"740":0.22,"720":0.30,"700":0.48,"680":0.66,"660":0.90}, 
		"90": {"760":0.10,"740":0.15,"720":0.22,"700":0.34,"680":0.48,"660":0.66}, 
		"85": {"760":0.08,"740":0.11,"720":0.17,"700":0.26,"680":0.36,"660":0.49} 
	} 
}; 

export const vaFundingFeeRates = { 
	first_use: {"0":2.15,"5":1.50,"10":1.25}, 
	subsequent_use: {"0":3.30,"5":1.50,"10":1.25}, 
	irrrl: 0.5 
}; 

// --- UTAH DEFAULTS (tune here) ---
export const UT_COSTS = {
	// Annual assumptions
	propTaxAnnualPct: 0.0050, // 0.50% of price per year

	// HOI % of price per year; clamp to keep UT realistic
	hoiAnnualPct: { sfh: 0.0022, townhome: 0.0026, condo: 0.0026 },
	hoiMonthlyClampByType: {
		sfh: { min: 75, max: 150 },
		townhome: { min: 30, max: 50 },
		condo: { min: 30, max: 50 }
	},
	// Tiered SFH clamp based on price
	sfhClampTiers: [
		{ maxPrice: 750000, min: 75, max: 150 },
		{ maxPrice: 1500000, min: 100, max: 250 },
		{ maxPrice: 3000000, min: 150, max: 400 },
		{ maxPrice: 5000000, min: 200, max: 600 },
		{ maxPrice: Infinity, min: 300, max: 800 }
	],

	// Third-party fees
	appraisal: 650,
	creditReport: 100,
	floodCert: 15,
	recordingDefaultTotal: 80,
	escrowSettlement: 400,

	// Lender's title policy (purchase & refi use same calc)
	lenderTitle: { pct: 0.0035, min: 300 }, // 0.35% of loan, $300 minimum

	// Prepaids/escrows
	prepaidInterestDays: 15,
	taxEscrowMonths: 5
};
