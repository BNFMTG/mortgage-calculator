import { formatCurrency, formatCurrencyRounded } from '../utils.js';

export const renderScenarioTable = (state, elements) => { 
	elements.scenarioComparisonContainer.classList.remove('hidden'); 
    // Keep clear button always visible; enable/disable handled elsewhere
	elements.scenarioTableBody.innerHTML = ''; 
	
	// Check if any scenarios have financed fees to determine if we should show those rows
	const hasFinancedFees = state.savedScenarios.some(s => s.financedFee > 0);
	
    	const metrics = [ 
		{ key: 'loanType', label: 'Loan Type' }, 
		{ key: 'homePrice', label: state.transactionType === 'purchase' ? 'Home Price' : 'Home Value', format: formatCurrencyRounded }, 
		{ key: 'downPayment', label: 'Down Payment', format: (val) => val === 'N/A' ? 'N/A' : formatCurrencyRounded(val) }, 
		// Always show the base/financed/total rows
		{ key: 'loanAmount', label: 'Base Loan Amount', format: formatCurrencyRounded }, 
		{ key: 'financedFee', label: 'Financed UFMIP/Funding Fee', format: (val) => val > 0 ? formatCurrencyRounded(val) : '-', }, 
		{ key: 'totalLoanAmount', label: 'Total Loan Amount', format: formatCurrencyRounded, isBold: true }, 
		{ key: 'interestRate', label: 'Interest Rate', format: (val) => `${val.toFixed(3)}%` }, 
		{ key: 'term', label: 'Term (Years)' }, 
		{ key: 'monthlyPayment', label: 'Total Monthly', format: formatCurrencyRounded, isBold: true, isExpandable: true }, 
		// Monthly payment breakdown items (hidden by default)
		{ key: 'pAndI', label: 'P&I', format: formatCurrencyRounded, isSubItem: true, isMonthlyDetail: true }, 
		{ key: 'tax', label: 'Taxes', format: formatCurrencyRounded, isSubItem: true, isMonthlyDetail: true }, 
		{ key: 'insurance', label: 'Insurance', format: formatCurrencyRounded, isSubItem: true, isMonthlyDetail: true }, 
		{ key: 'mi', label: 'MI/Fee', format: formatCurrencyRounded, isSubItem: true, isMonthlyDetail: true }, 
		{ key: 'hoa', label: 'HOA', format: formatCurrencyRounded, isSubItem: true, isMonthlyDetail: true }, 
	]; 
	
		// Track which scenarios have closing costs to show expandable details
	const scenariosWithClosingCosts = state.savedScenarios.map((s, idx) => ({
		index: idx,
		hasBreakdown: s && s.closingCosts && s.closingCosts.breakdown && s.closingCosts.breakdown.items && s.closingCosts.breakdown.items.length > 0,
		breakdown: s?.closingCosts?.breakdown
	}));
	
	metrics.forEach(metric => { 
		if (state.transactionType === 'refinance' && metric.key === 'downPayment') return; 
		if (metric.condition && !metric.condition()) return; 
		// Skip monthly detail items initially - they'll be added later as hidden rows
		if (metric.isMonthlyDetail) return;

		let labelContent = metric.label;
		// Add expandable functionality for Total Monthly
		if (metric.isExpandable) {
			labelContent = `<button onclick="toggleMonthlyBreakdown()" class="text-white hover:text-blue-400 cursor-pointer transition-colors">
				<span id="monthly-breakdown-arrow">▼</span> ${metric.label}
			</button>`;
		}

		let rowHtml = `<tr class="hover:bg-gray-700 transition-colors ${metric.isBold ? 'font-bold text-white' : ''} ${metric.isSubItem ? 'text-gray-400' : ''}"> 
			<td class="py-3 px-2 ${metric.isSubItem ? 'pl-6' : ''}">${labelContent}</td>`; 
		for (let i = 0; i < 3; i++) { 
			const scenario = state.savedScenarios[i]; 
			let value = '-'; 
			if (scenario && (!metric.condition || metric.condition())) { 
				let rawValue = scenario[metric.key]; 
				if (metric.key === 'financedFee' && (!rawValue || rawValue <= 0)) {
					const derived = (scenario.totalLoanAmount ?? 0) - (scenario.loanAmount ?? 0);
					if (derived > 0) rawValue = derived;
				}
				value = metric.format ? metric.format(rawValue) : (rawValue ?? '-'); 
			} 
			rowHtml += `<td class="py-3 px-2 text-center">${value}</td>`; 
		} 
		rowHtml += `</tr>`; 
		elements.scenarioTableBody.innerHTML += rowHtml; 
	});

	// Add monthly payment breakdown rows (hidden by default)
	const monthlyDetailMetrics = metrics.filter(m => m.isMonthlyDetail);
	monthlyDetailMetrics.forEach(metric => {
		let rowHtml = `<tr class="monthly-detail hover:bg-gray-700 transition-colors text-gray-400 hidden"> 
			<td class="py-2 px-2 pl-6 text-sm">${metric.label}</td>`; 
		for (let i = 0; i < 3; i++) { 
			const scenario = state.savedScenarios[i]; 
			let value = '-'; 
			if (scenario) { 
				let rawValue = scenario[metric.key]; 
				value = metric.format ? metric.format(rawValue) : (rawValue ?? '-'); 
			} 
			rowHtml += `<td class="py-2 px-2 text-center text-sm">${value}</td>`; 
		} 
		rowHtml += `</tr>`; 
		elements.scenarioTableBody.innerHTML += rowHtml; 
	});

	// Add monthly breakdown toggle function
	window.toggleMonthlyBreakdown = function() {
		const detailRows = document.querySelectorAll('.monthly-detail');
		const arrow = document.getElementById('monthly-breakdown-arrow');
		const isHidden = detailRows[0]?.classList.contains('hidden');
		
		detailRows.forEach(row => {
			if (isHidden) {
				row.classList.remove('hidden');
			} else {
				row.classList.add('hidden');
			}
		});
		arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)'; // Monthly breakdown toggle
	}; 

	// Add closing costs with unified expandable breakdown organized by buckets
	const hasAnyBreakdown = scenariosWithClosingCosts.some(s => s.hasBreakdown);
	if (hasAnyBreakdown) {
		// Categorize closing cost items into buckets
		const lenderFees = ['Appraisal', 'Credit Report', 'Flood Certification', 'Upfront MIP (Paid Cash)', 'VA Funding Fee (Paid Cash)'];
		const thirdPartyFees = ['Lender\'s Title Insurance', 'Settlement/Escrow Fee', 'Recording Fees'];
		const escrowPrepaids = ['Prepaid Interest (15 days)', 'Homeowner\'s Insurance (1 year)', 'Property Tax Escrow (5 months)'];
		
		// Create a unified list of all closing cost items across all scenarios
		const allClosingCostItems = new Set();
		scenariosWithClosingCosts.forEach(scenarioInfo => {
			if (scenarioInfo.hasBreakdown) {
				scenarioInfo.breakdown.items.forEach(item => {
					allClosingCostItems.add(item.label);
				});
			}
		});
		
		// Main closing costs row with total amounts and single toggle
		let ccRowHtml = `<tr class="hover:bg-gray-700 transition-colors"> 
			<td class="py-3 px-2">
				<button onclick="toggleAllClosingCosts()" class="text-white hover:text-blue-400 cursor-pointer transition-colors">
					<span id="closing-costs-arrow">▼</span> Closing Costs
				</button>
			</td>`; 
		for (let i = 0; i < 3; i++) { 
			const scenarioInfo = scenariosWithClosingCosts[i];
			let value = '-'; 
			if (scenarioInfo && scenarioInfo.hasBreakdown) { 
				value = formatCurrencyRounded(scenarioInfo.breakdown.total);
			} 
			ccRowHtml += `<td class="py-3 px-2 text-center">${value}</td>`; 
		} 
		ccRowHtml += `</tr>`; 
		elements.scenarioTableBody.innerHTML += ccRowHtml;

		// Helper function to add bucket and its items
		const addBucket = (bucketName, bucketItems) => {
			const bucketItemsInData = Array.from(allClosingCostItems).filter(item => 
				bucketItems.some(bucketItem => item.includes(bucketItem.split(' (')[0]))
			);
			
			if (bucketItemsInData.length === 0) return;

			// Add bucket header
			let bucketRowHtml = `<tr class="closing-cost-detail hover:bg-gray-700 transition-colors text-gray-300 hidden"> 
				<td class="py-2 px-2 pl-8 text-sm font-medium">${bucketName}</td>`;
			for (let i = 0; i < 3; i++) {
				bucketRowHtml += `<td class="py-2 px-2 text-center text-sm"></td>`;
			}
			bucketRowHtml += `</tr>`;
			elements.scenarioTableBody.innerHTML += bucketRowHtml;

			// Add bucket items
			bucketItemsInData.forEach(itemLabel => {
				let itemRowHtml = `<tr class="closing-cost-detail hover:bg-gray-700 transition-colors text-gray-400 hidden"> 
					<td class="py-2 px-2 pl-12 text-sm">${itemLabel}</td>`;
				for (let i = 0; i < 3; i++) {
					const scenarioInfo = scenariosWithClosingCosts[i];
					let cellValue = '-';
					if (scenarioInfo && scenarioInfo.hasBreakdown) {
						const item = scenarioInfo.breakdown.items.find(item => item.label === itemLabel);
						if (item) {
							cellValue = formatCurrency(item.value);
						}
					}
					itemRowHtml += `<td class="py-2 px-2 text-center text-sm">${cellValue}</td>`;
				}
				itemRowHtml += `</tr>`;
				elements.scenarioTableBody.innerHTML += itemRowHtml;
			});
		};

		// Add buckets in order
		addBucket('Lender Fees', lenderFees);
		addBucket('Third-Party Fees', thirdPartyFees);
		addBucket('Escrow/Prepaids', escrowPrepaids);
		
		// Add the toggle function to the global scope
		window.toggleAllClosingCosts = function() {
			const detailRows = document.querySelectorAll('.closing-cost-detail');
			const arrow = document.getElementById('closing-costs-arrow');
			const isHidden = detailRows[0]?.classList.contains('hidden');
			
			detailRows.forEach(row => {
				if (isHidden) {
					row.classList.remove('hidden');
				} else {
					row.classList.add('hidden');
				}
			});
			arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)'; // Closing costs toggle
		};
	}

	// Put delete buttons at the very bottom
	let deleteRowHtml = `<tr class="hover:bg-gray-700 transition-colors"><td class="py-3 px-2"></td>`; 
	for (let i = 0; i < 3; i++) { 
		if (state.savedScenarios[i]) { 
			deleteRowHtml += `<td class="py-3 px-2 text-center"> 
				<button data-index="${i}" class="delete-scenario-btn text-red-500 hover:text-red-400 text-xs px-3 py-1 rounded-md hover:bg-red-500/10 transition-colors">Delete</button> 
			</td>`; 
		} else { 
			deleteRowHtml += `<td></td>`; 
		} 
	} 
	deleteRowHtml += `</tr>`; 
	elements.scenarioTableBody.innerHTML += deleteRowHtml;
}; 

export const clearAllScenarios = (state, elements) => { 
	state.savedScenarios = []; 
	elements.scenarioComparisonContainer.classList.add('hidden'); 
    // Keep buttons visible; disable clear, enable save
    elements.clearScenariosBtn.disabled = true;
    elements.clearScenariosBtn.classList.add('opacity-50', 'cursor-not-allowed');
    elements.saveScenarioBtn.disabled = false; 
    elements.saveScenarioBtn.classList.remove('opacity-50', 'cursor-not-allowed'); 
};
