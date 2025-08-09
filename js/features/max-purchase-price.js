import { UT_COSTS } from '../data.js';
import { formatCurrencyRounded, parseFloatInput } from '../utils.js';
import { getConventionalMiRate, getEstimatedInterestRate } from '../calculations.js';

export const calculateMaxPurchasePrice = (state, elements) => { 
	const income = parseFloatInput(elements.monthlyIncomeInput); 
	const debts = parseFloatInput(elements.monthlyDebtsInput); 
	const downPayment = parseFloatInput(elements.affordDownPaymentInput); 
	const dtiRatio = parseFloatInput(elements.affordDtiInput) / 100; 

	if (income === 0 || dtiRatio === 0) { 
		elements.affordableHomePriceEl.textContent = formatCurrencyRounded(0); 
		return; 
	} 
	
	const interestRate = parseFloatInput(elements.interestRateInput); 
	const loanTermYears = parseInt(elements.loanTermInput.value) || 30; 
	const monthlyInterestRate = interestRate / 100 / 12; 
	const numberOfPayments = loanTermYears * 12; 

	const maxTotalPayment = income * dtiRatio; 
	const maxPITI = maxTotalPayment - debts; 

	let affordableHomePrice = 0; 
	let min = downPayment; 
	let max = income * 10; 

	for (let i = 0; i < 30; i++) { 
		let guessPrice = (min + max) / 2; 
		if (guessPrice <= 0) continue; 

		let loanAmount = guessPrice - downPayment; 
		if (loanAmount <= 0) { 
			min = guessPrice; 
			affordableHomePrice = guessPrice; 
			continue; 
		} 
		let ltv = (loanAmount / guessPrice) * 100; 
		
		let tax = (guessPrice * UT_COSTS.propTaxAnnualPct) / 12;

		const hoiPct = state.propertyType === 'sfh'
			? UT_COSTS.hoiAnnualPct.sfh
			: (state.propertyType === 'townhome' ? UT_COSTS.hoiAnnualPct.townhome : UT_COSTS.hoiAnnualPct.condo);
		let ins = (guessPrice * hoiPct) / 12;
		const clampForGuess = resolveHoiClamp(guessPrice, state.propertyType, UT_COSTS);
		ins = Math.min(Math.max(ins, clampForGuess.min), clampForGuess.max); 
		let miRate = getConventionalMiRate(ltv, parseInt(elements.creditScoreInput.value) || 0, state.propertyType); 
		let mi = (loanAmount * (miRate / 100)) / 12; 
		
		let pi = monthlyInterestRate > 0 ? 
			loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) : 
			loanAmount / numberOfPayments; 
		
		let totalPaymentAtGuess = pi + tax + ins + mi; 

		if (totalPaymentAtGuess > maxPITI) { 
			max = guessPrice; 
		} else { 
			min = guessPrice; 
			affordableHomePrice = guessPrice; 
		} 
	} 
	
	elements.affordableHomePriceEl.textContent = formatCurrencyRounded(affordableHomePrice); 
};

// Helper function for resolveHoiClamp (duplicated from utils for this module)
const resolveHoiClamp = (price, propertyType, UT_COSTS) => {
	if (propertyType === 'sfh') {
		for (const tier of UT_COSTS.sfhClampTiers) {
			if (price <= tier.maxPrice) return { min: tier.min, max: tier.max };
		}
		return { min: 300, max: 800 };
	}
	if (propertyType === 'townhome') return UT_COSTS.hoiMonthlyClampByType.townhome;
	return UT_COSTS.hoiMonthlyClampByType.condo;
};
