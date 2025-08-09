import { formatCurrency } from '../utils.js';

export const calculateExtraPayments = (state, elements) => { 
	const { amortizationData, totalInterest } = state.currentScenarioData; 
	if (!amortizationData || amortizationData.length === 0) { 
		elements.extraPaymentResultsEl.innerHTML = '<p>Calculate a loan first to see extra payment effects.</p>'; 
		return; 
	} 

	const extraMonthly = parseFloat(elements.extraMonthlyPaymentInput.value) || 0; 
	const extraYearly = parseFloat(elements.extraYearlyPaymentInput.value) || 0; 
	const oneTime = parseFloat(elements.oneTimePaymentInput.value) || 0; 

	if (extraMonthly === 0 && extraYearly === 0 && oneTime === 0) { 
		elements.extraPaymentResultsEl.innerHTML = '<p>Enter an extra payment amount to see your savings.</p>'; 
		return; 
	} 

	let newBalance = state.currentScenarioData.totalLoanAmount; 
	let newTotalInterest = 0; 
	let months = 0; 
	const monthlyInterestRate = state.currentScenarioData.interestRate / 100 / 12; 
	const originalPI = state.currentScenarioData.pAndI; 

	newBalance -= oneTime; 

	while (newBalance > 0) { 
		months++; 
		let interestForMonth = newBalance * monthlyInterestRate; 
		let paymentForMonth = originalPI + extraMonthly; 
		if (months % 12 === 0) { 
			paymentForMonth += extraYearly; 
		} 

		let principalForMonth = paymentForMonth - interestForMonth; 
		if (newBalance - principalForMonth < 0) { 
			principalForMonth = newBalance; 
		} 
		
		newBalance -= principalForMonth; 
		newTotalInterest += interestForMonth; 

		if (months > 480) break; 
	} 
	
	const interestSaved = totalInterest - newTotalInterest; 
	const yearsSaved = (amortizationData.length - months) / 12; 

	elements.extraPaymentResultsEl.innerHTML = ` 
		<div class="flex justify-around items-center"> 
			<div> 
				<p class="text-sm text-gray-400">New Payoff Time</p> 
				<p class="text-xl font-bold text-white">${Math.floor(months / 12)} yrs, ${months % 12} mos</p> 
				<p class="text-sm text-green-400">You'll save ${yearsSaved.toFixed(1)} years!</p> 
			</div> 
			<div> 
				<p class="text-sm text-gray-400">Total Interest Saved</p> 
				<p class="text-xl font-bold text-green-400">${formatCurrency(interestSaved)}</p> 
			</div> 
		</div> 
	`; 
};
