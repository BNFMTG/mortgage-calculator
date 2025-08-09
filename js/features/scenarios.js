import { formatCurrencyRounded } from '../utils.js';

export const renderScenarioTable = (state, elements) => { 
	elements.scenarioComparisonContainer.classList.remove('hidden'); 
	elements.clearScenariosBtn.classList.remove('hidden'); 
	elements.scenarioTableBody.innerHTML = ''; 
	const metrics = [ 
		{ key: 'loanType', label: 'Loan Type' }, 
		{ key: 'homePrice', label: state.transactionType === 'purchase' ? 'Home Price' : 'Home Value', format: formatCurrencyRounded }, 
		{ key: 'downPayment', label: 'Down Payment', format: (val) => val === 'N/A' ? 'N/A' : formatCurrencyRounded(val) }, 
		{ key: 'loanAmount', label: 'Base Loan Amount', format: formatCurrencyRounded }, 
		{ key: 'financedFee', label: 'Financed UFMIP/Fee', format: formatCurrencyRounded, condition: (s) => s.financedFee > 0 }, 
		{ key: 'totalLoanAmount', label: 'Total Loan Amount', format: formatCurrencyRounded, isBold: true, condition: (s) => s.financedFee > 0 }, 
		{ key: 'interestRate', label: 'Interest Rate', format: (val) => `${val.toFixed(3)}%` }, 
		{ key: 'term', label: 'Term (Years)' }, 
		{ key: 'monthlyPayment', label: 'Total Monthly', format: formatCurrencyRounded, isBold: true }, 
		{ key: 'pAndI', label: 'P&I', format: formatCurrencyRounded, isSubItem: true }, 
		{ key: 'tax', label: 'Taxes', format: formatCurrencyRounded, isSubItem: true }, 
		{ key: 'insurance', label: 'Insurance', format: formatCurrencyRounded, isSubItem: true }, 
		{ key: 'mi', label: 'MI/Fee', format: formatCurrencyRounded, isSubItem: true }, 
		{ key: 'hoa', label: 'HOA', format: formatCurrencyRounded, isSubItem: true }, 
	]; 
	metrics.forEach(metric => { 
		if (state.transactionType === 'refinance' && metric.key === 'downPayment') return; 
		if (metric.condition && !state.savedScenarios.some(metric.condition)) return; 

		let rowHtml = `<tr class="hover:bg-gray-700 transition-colors ${metric.isBold ? 'font-bold text-white' : ''} ${metric.isSubItem ? 'text-gray-400' : ''}"> 
			<td class="py-3 px-2 ${metric.isSubItem ? 'pl-6' : ''}">${metric.label}</td>`; 
		for (let i = 0; i < 3; i++) { 
			const scenario = state.savedScenarios[i]; 
			let value = '-'; 
			if (scenario && (!metric.condition || metric.condition(scenario))) { 
				const rawValue = scenario[metric.key]; 
				value = metric.format ? metric.format(rawValue) : rawValue; 
			} 
			rowHtml += `<td class="py-3 px-2 text-center">${value}</td>`; 
		} 
		rowHtml += `</tr>`; 
		elements.scenarioTableBody.innerHTML += rowHtml; 
	}); 
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
	elements.clearScenariosBtn.classList.add('hidden'); 
	elements.saveScenarioBtn.disabled = false; 
	elements.saveScenarioBtn.classList.remove('opacity-50', 'cursor-not-allowed'); 
};
