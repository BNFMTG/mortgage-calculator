import { conventionalMiRates, vaFundingFeeRates, UT_COSTS } from './data.js';
import { parseFloatInput, parseRoundInput, resolveHoiClamp } from './utils.js';

// --- Calculation Functions --- 
export const getConventionalMiRate = (ltv, score, propType) => { 
	if (ltv <= 80) return 0; 
	const miPropTypeKey = propType === 'condo' ? 'condo' : 'sfh_townhome'; 
	const rates = conventionalMiRates[miPropTypeKey]; 
	const ltvBracket = ltv > 95 ? 97 : ltv > 90 ? 95 : ltv > 85 ? 90 : 85; 
	const scoreBracket = score >= 760 ? 760 : score >= 740 ? 740 : score >= 720 ? 720 : score >= 700 ? 700 : score >= 680 ? 680 : 660; 
	return (rates[ltvBracket]?.[scoreBracket] || 0);
}; 

export const getVaFundingFeeRate = (dpPercent, transactionType, vaUseType) => { 
	if (transactionType === 'refinance') return vaFundingFeeRates.irrrl / 100; 
	const rates = vaFundingFeeRates[vaUseType]; 
	const dpBracket = dpPercent < 5 ? 0 : dpPercent < 10 ? 5 : 10; 
	return (rates[dpBracket] || 0) / 100; 
}; 

export const getEstimatedInterestRate = (creditScore, loanType) => { 
	let newRate = 0; 
	let warningMsg = ''; 

	if (loanType === 'conventional') { 
		if (creditScore >= 740) newRate = 6.375; 
		else if (creditScore >= 720) newRate = 6.5; 
		else if (creditScore >= 680) newRate = 6.625; 
		else if (creditScore >= 660) newRate = 6.75; 
		else if (creditScore >= 620) newRate = 6.875; 
		else { 
			newRate = 6.875; 
			warningMsg = 'Credit score is low. Please consult a loan officer to confirm qualification.'; 
		} 
	} else { // FHA or VA 
		if (creditScore >= 660) newRate = 5.875; 
		else if (creditScore >= 640) newRate = 6.0; 
		else if (creditScore >= 620) newRate = 6.125; 
		else if (creditScore >= 580) newRate = 6.25; 
		else { 
			newRate = 6.25; 
			warningMsg = 'Credit score is low. Please consult a loan officer to confirm qualification.'; 
		} 
	} 
	
	return { rate: newRate, warning: warningMsg };
}; 

export const calculateAll = (state, inputs) => { 
	// 1. Get all base inputs 
	const homePrice = parseRoundInput(inputs.homePriceInput); 
	const creditScore = parseInt(inputs.creditScoreInput.value) || 0; 
	const monthlyHOA = parseFloatInput(inputs.hoaInput); 
	const loanTermYears = parseInt(inputs.loanTermInput.value) || 0; 

	// 2. Determine Down Payment / LTV and Base Loan Amount (3-way binding) 
	let downPaymentAmount = 0; 
	let baseLoanAmount = 0; 

	if (state.transactionType === 'purchase') { 
		if (state.lastFocused === inputs.loanAmountInput) { 
			baseLoanAmount = parseRoundInput(inputs.loanAmountInput); 
			downPaymentAmount = homePrice - baseLoanAmount; 
			inputs.downPaymentDollarInput.value = downPaymentAmount.toFixed(0); 
			inputs.downPaymentPercentInput.value = homePrice > 0 ? ((downPaymentAmount / homePrice) * 100).toFixed(2) : 0; 
		} else if (state.lastFocused === inputs.downPaymentDollarInput) { 
			downPaymentAmount = parseRoundInput(inputs.downPaymentDollarInput); 
			baseLoanAmount = homePrice - downPaymentAmount; 
			inputs.downPaymentPercentInput.value = homePrice > 0 ? ((downPaymentAmount / homePrice) * 100).toFixed(2) : 0; 
			inputs.loanAmountInput.value = baseLoanAmount.toFixed(0); 
		} else { // Default to percent or if percent was last touched 
			const dpPercentValue = parseFloatInput(inputs.downPaymentPercentInput); 
			downPaymentAmount = Math.round(homePrice * (dpPercentValue / 100)); 
			baseLoanAmount = homePrice - downPaymentAmount; 
			inputs.downPaymentDollarInput.value = downPaymentAmount.toFixed(0); 
			inputs.loanAmountInput.value = baseLoanAmount.toFixed(0); 
		} 
	} else { // Refinance 
		if (state.lastFocused === inputs.ltvPercentInput) { 
			const ltvValue = parseFloatInput(inputs.ltvPercentInput); 
			baseLoanAmount = Math.round(homePrice * (ltvValue / 100)); 
			inputs.loanAmountInput.value = baseLoanAmount.toFixed(0); 
		} else { 
			baseLoanAmount = parseRoundInput(inputs.loanAmountInput); 
			const newLtv = homePrice > 0 ? (baseLoanAmount / homePrice) * 100 : 0; 
			inputs.ltvPercentInput.value = newLtv.toFixed(2); 
		} 
	} 
	
	// 3. Calculate LTV and handle warnings 
	const ltv = homePrice > 0 ? (baseLoanAmount / homePrice) * 100 : 0; 
	const dpPercent = homePrice > 0 ? (downPaymentAmount / homePrice) * 100 : 0; 
	
	let dpWarningMsg = ''; 
	if (state.transactionType === 'purchase') { 
		if (state.loanType === 'conventional' && dpPercent < 3) dpWarningMsg = 'Conventional loans generally require at least 3% down.'; 
		if (state.loanType === 'fha' && dpPercent < 3.5) dpWarningMsg = 'FHA loans generally require at least 3.5% down.'; 
	} 

	let fhaSuggestionMsg = ''; 
	if (state.loanType === 'conventional' && creditScore < 740 && dpPercent < 10) { 
		fhaSuggestionMsg = 'You may save money by doing an FHA loan instead of a conventional loan.'; 
	} 
	
	const showHoaWarning = (state.propertyType === 'townhome' || state.propertyType === 'condo') && monthlyHOA <= 0; 

	// 4. Calculate Estimates for optional fields
	const estimatedInterestRate = getEstimatedInterestRate(creditScore, state.loanType);

	// Property tax: 0.50% of price per year (Utah default)
	const calculatedMonthlyTax = (homePrice * UT_COSTS.propTaxAnnualPct) / 12;

	// HOI: % by property type, then clamp by type to UT range
	const hoiAnnualPct = state.propertyType === 'sfh'
		? UT_COSTS.hoiAnnualPct.sfh
		: (state.propertyType === 'townhome' ? UT_COSTS.hoiAnnualPct.townhome : UT_COSTS.hoiAnnualPct.condo);

	const clamp = resolveHoiClamp(homePrice, state.propertyType, UT_COSTS);

	let calculatedMonthlyInsurance = (homePrice * hoiAnnualPct) / 12;
	calculatedMonthlyInsurance = Math.min(
		Math.max(calculatedMonthlyInsurance, clamp.min),
		clamp.max
	); 
	
	let calculatedMonthlyMI = 0; 
	let miRatePercent = 0; 
	let ufmip = 0; 
	let vaFundingFee = 0; 
	let vaFeeRate = 0; 
	let financedFee = 0; 
	let finalLoanAmount = baseLoanAmount; 

	switch (state.loanType) { 
		case 'conventional': 
			miRatePercent = getConventionalMiRate(ltv, creditScore, state.propertyType); 
			calculatedMonthlyMI = (baseLoanAmount * (miRatePercent / 100)) / 12; 
			break; 
		case 'fha': 
			ufmip = baseLoanAmount * 0.0175; 
			if (state.fhaFinanceUfmip) { 
				finalLoanAmount += ufmip; 
				financedFee = ufmip; 
			} 
			const fhaMiRate = ltv > 95 ? 0.55 : 0.50; // This is a percentage
			miRatePercent = fhaMiRate;
			calculatedMonthlyMI = (baseLoanAmount * (fhaMiRate / 100)) / 12; 
			break; 
		case 'va': 
			if (!state.vaExempt) { 
				vaFeeRate = getVaFundingFeeRate(dpPercent, state.transactionType, state.vaUseType); 
				vaFundingFee = baseLoanAmount * vaFeeRate; 
				if (state.vaFinanceFee) { 
					finalLoanAmount += vaFundingFee; 
					financedFee = vaFundingFee; 
				} 
			} 
			calculatedMonthlyMI = 0; // VA has no monthly MI 
			miRatePercent = 0;
			break; 
	} 

	// 5. Get final values, using user input if available, otherwise use estimates 
	const interestRate = inputs.interestRateInput.value === '' ? estimatedInterestRate.rate : parseFloatInput(inputs.interestRateInput); 
	const monthlyTax = inputs.propertyTaxMonthlyInput.value === '' ? calculatedMonthlyTax : parseFloatInput(inputs.propertyTaxMonthlyInput); 
	const monthlyInsurance = inputs.homeInsuranceMonthlyInput.value === '' ? calculatedMonthlyInsurance : parseFloatInput(inputs.homeInsuranceMonthlyInput); 
	const monthlyMI = inputs.miMonthlyInput.value === '' ? calculatedMonthlyMI : parseFloatInput(inputs.miMonthlyInput);

	// 6. Calculate P&I and Total Payment 
	const monthlyInterestRate = interestRate / 100 / 12; 
	const numberOfPayments = loanTermYears * 12; 
	
	let monthlyPI = 0; 
	if (numberOfPayments > 0 && finalLoanAmount > 0 && monthlyInterestRate >= 0) { 
		monthlyPI = monthlyInterestRate > 0 ? 
			finalLoanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) : 
			finalLoanAmount / numberOfPayments; 
	} 

	const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyMI + monthlyHOA; 

	// 7. Generate Amortization Schedule 
	let remainingBalance = finalLoanAmount; 
	let totalInterestPaid = 0; 
	const amortizationData = []; 
	if (numberOfPayments > 0 && finalLoanAmount > 0) { 
		for (let i = 1; i <= numberOfPayments && remainingBalance > 0.01; i++) { 
			const interestForMonth = remainingBalance * monthlyInterestRate; 
			const principalForMonth = monthlyPI - interestForMonth; 
			remainingBalance -= principalForMonth; 
			totalInterestPaid += interestForMonth; 
			amortizationData.push({ 
				month: i, payment: monthlyPI, principal: principalForMonth, 
				interest: interestForMonth, balance: Math.max(0, remainingBalance) 
			}); 
		} 
	} 
	
	return {
		totalMonthlyPayment, monthlyPI, monthlyTax, monthlyInsurance, monthlyMI, monthlyHOA,
		totalInterestPaid, amortizationData,
		estimatedInterestRate: estimatedInterestRate.rate, calculatedMonthlyTax, calculatedMonthlyInsurance, calculatedMonthlyMI, miRatePercent,
		ufmip, vaFundingFee, vaFeeRate, baseLoanAmount, finalLoanAmount, homePrice,
		interestRate, // pass through current rate for closing-costs
		dpWarningMsg, fhaSuggestionMsg, showHoaWarning,
		estimatedInterestRateWarning: estimatedInterestRate.warning
	};
};
