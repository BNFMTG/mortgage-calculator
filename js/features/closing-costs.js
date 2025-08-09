import { UT_COSTS } from '../data.js';
import { formatCurrency, parseFloatInput } from '../utils.js';

export const calculateClosingCosts = (data, state, elements) => {
	if (!data || !data.homePrice) {
		elements.closingCostsContentEl.innerHTML = '<p>Enter loan details to estimate closing costs.</p>';
		return;
	}

	const { baseLoanAmount, loanType, interestRate } = data;

	// Lender title policy: purchase & refi use the same %/min structure
	const lenderTitleCost = Math.max(baseLoanAmount * UT_COSTS.lenderTitle.pct, UT_COSTS.lenderTitle.min);

	const costs = {
		"Appraisal": UT_COSTS.appraisal,
		"Credit Report": UT_COSTS.creditReport,
		"Flood Certification": UT_COSTS.floodCert,
		"Lender's Title Insurance": lenderTitleCost,
		"Settlement/Escrow Fee": UT_COSTS.escrowSettlement,
		"Recording Fees": UT_COSTS.recordingDefaultTotal,
		["Prepaid Interest (" + UT_COSTS.prepaidInterestDays + " days)"]: (baseLoanAmount * (interestRate / 100) / 365) * UT_COSTS.prepaidInterestDays,
		"Homeowner's Insurance (1 year)": parseFloatInput(elements.homeInsuranceMonthlyInput) * 12,
		["Property Tax Escrow (" + UT_COSTS.taxEscrowMonths + " months)"]: parseFloatInput(elements.propertyTaxMonthlyInput) * UT_COSTS.taxEscrowMonths
	};

	// Program conditionals (cash-paid fees)
	if (loanType === 'fha' && !state.fhaFinanceUfmip) {
		costs["Upfront MIP (Paid Cash)"] = data.ufmip;
	}
	if (loanType === 'va' && !state.vaExempt && !state.vaFinanceFee) {
		costs["VA Funding Fee (Paid Cash)"] = data.vaFundingFee;
	}

	let totalCosts = Object.values(costs).reduce((sum, v) => sum + v, 0);

	let html = `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">`;
	for (const [label, value] of Object.entries(costs)) {
		html += `
			<div class="flex justify-between border-b border-gray-700 py-1.5">
				<span class="text-gray-400">${label}</span>
				<span class="font-medium text-gray-200">${formatCurrency(value)}</span>
			</div>`;
	}
	html += `</div>
		<div class="flex justify-between text-lg font-bold border-t-2 border-blue-500 mt-4 pt-2">
			<span>Total Estimated Costs</span>
			<span>${formatCurrency(totalCosts)}</span>
		</div>
		<p class="text-xs text-gray-500 mt-2">Note: Utah defaults. Title/escrow vary by company and file.</p>`;

	elements.closingCostsContentEl.innerHTML = html;
};
