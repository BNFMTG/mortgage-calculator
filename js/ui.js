import { formatCurrency, formatCurrencyRounded } from './utils.js';

export const updateUI = (data, state, elements) => { 
	elements.monthlyPaymentEl.textContent = formatCurrencyRounded(data.totalMonthlyPayment); 
	elements.totalInterestDisplay.textContent = `Total interest paid: ${formatCurrency(data.totalInterestPaid)}`; 
	
	// Update estimate displays 
	elements.interestRateEstimateEl.textContent = `Est: ${data.estimatedInterestRate.toFixed(3)}%`; 
	elements.propertyTaxEstimateEl.textContent = `Est: ${formatCurrency(data.calculatedMonthlyTax)}`; 
	elements.homeInsuranceEstimateEl.textContent = `Est: ${formatCurrency(data.calculatedMonthlyInsurance)}`; 
	elements.miEstimateEl.textContent = `Est: ${formatCurrency(data.calculatedMonthlyMI)} (${data.miRatePercent.toFixed(2)}%)`; 

	// Update inputs if user has not overridden them
	if (!state.editingInterestRate) {
		if (elements.interestRateInput.value === '' || parseFloat(elements.interestRateInput.value) === state.lastCalculatedInterest) {
			elements.interestRateInput.value = data.estimatedInterestRate.toFixed(3);
		}
	}
	if (!state.overrides.propertyTax && !state.editingPropertyTax) {
		elements.propertyTaxMonthlyInput.value = data.calculatedMonthlyTax.toFixed(2);
		elements.propertyTaxYearlyInput.value = (data.calculatedMonthlyTax * 12).toFixed(2);
	}
	if (!state.overrides.homeInsurance && !state.editingHomeInsurance) {
		elements.homeInsuranceMonthlyInput.value = data.calculatedMonthlyInsurance.toFixed(2);
		elements.homeInsuranceYearlyInput.value = (data.calculatedMonthlyInsurance * 12).toFixed(2);
	}
	if (!state.overrides.mi && !state.editingMI) {
		elements.miMonthlyInput.value = data.calculatedMonthlyMI.toFixed(2);
		elements.miPercentInput.value = data.miRatePercent.toFixed(2);
	}
	
	// Store the latest calculated values for comparison next time 
	state.lastCalculatedInterest = parseFloat(data.estimatedInterestRate.toFixed(3)); 
	state.lastCalculatedTax = parseFloat(data.calculatedMonthlyTax.toFixed(2)); 
	state.lastCalculatedInsurance = parseFloat(data.calculatedMonthlyInsurance.toFixed(2)); 
	state.lastCalculatedMI = parseFloat(data.calculatedMonthlyMI.toFixed(2)); 
	state.lastCalculatedMIRatePercent = parseFloat(data.miRatePercent.toFixed(2));

	// Loan Breakdown Display 
	if (state.loanType === 'fha' && data.ufmip > 0) { 
		const ufmipText = state.fhaFinanceUfmip ? `+ UFMIP: ${formatCurrency(data.ufmip)} = <strong>Total: ${formatCurrency(data.finalLoanAmount)}</strong>` : `(UFMIP: ${formatCurrency(data.ufmip)} paid cash)`; 
		elements.loanBreakdownDisplay.innerHTML = `Base: ${formatCurrency(data.baseLoanAmount)} ${ufmipText}`; 
		elements.loanBreakdownDisplay.classList.remove('hidden'); 
	} else if (state.loanType === 'va' && data.vaFundingFee > 0 && !state.vaExempt) { 
		const vaFeeText = state.vaFinanceFee ? `+ Fee: ${formatCurrency(data.vaFundingFee)} = <strong>Total: ${formatCurrency(data.finalLoanAmount)}</strong>` : `(Fee: ${formatCurrency(data.vaFundingFee)} paid cash)`; 
		elements.loanBreakdownDisplay.innerHTML = `Base: ${formatCurrency(data.baseLoanAmount)} ${vaFeeText}`; 
		elements.loanBreakdownDisplay.classList.remove('hidden'); 
	} else { 
		elements.loanBreakdownDisplay.classList.add('hidden'); 
	} 

	// Update chart with final values (respects user overrides) - these should be current after property type changes
	updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	
	// Update warnings
	if (elements.downPaymentWarningEl) {
		elements.downPaymentWarningEl.textContent = data.dpWarningMsg;
		elements.downPaymentWarningEl.classList.toggle('hidden', !data.dpWarningMsg);
	}
	if (elements.fhaSuggestionWarningEl) {
		elements.fhaSuggestionWarningEl.textContent = data.fhaSuggestionMsg;
		elements.fhaSuggestionWarningEl.classList.toggle('hidden', !data.fhaSuggestionMsg);
	}
	if (elements.hoaWarningEl) {
		elements.hoaWarningEl.textContent = `A ${state.propertyType === 'condo' ? 'condo' : 'townhome'} most likely has an HOA fee.`;
		elements.hoaWarningEl.classList.toggle('hidden', !data.showHoaWarning);
	}
	if (elements.creditScoreWarningEl) {
		elements.creditScoreWarningEl.textContent = data.estimatedInterestRateWarning;
		elements.creditScoreWarningEl.classList.toggle('hidden', !data.estimatedInterestRateWarning);
	} 
	
	elements.amortizationTableBody.innerHTML = data.amortizationData.map(row => ` 
		<tr> 
			<td class="px-4 py-3 text-sm text-gray-400">${row.month}</td> 
			<td class="px-4 py-3 text-sm text-gray-400">${formatCurrency(row.payment)}</td> 
			<td class="px-4 py-3 text-sm text-gray-400">${formatCurrency(row.principal)}</td> 
			<td class="px-4 py-3 text-sm text-gray-400">${formatCurrency(row.interest)}</td> 
			<td class="px-4 py-3 text-sm font-medium text-gray-100">${formatCurrency(row.balance)}</td> 
		</tr> 
	`).join(''); 
}; 

export const updateDynamicSections = (state, elements) => { 
	const isPurchase = state.transactionType === 'purchase'; 
	const isVA = state.loanType === 'va'; 
	const isFHA = state.loanType === 'fha'; 

	elements.homePriceLabel.textContent = isPurchase ? 'Home Price' : 'Home Value'; 
	elements.downPaymentContainer.style.display = isPurchase ? 'block' : 'none'; 
	elements.ltvContainer.style.display = isPurchase ? 'none' : 'block'; 
	
	elements.fhaOptionsContainer.classList.toggle('open', isFHA); 
	elements.vaContainer.classList.toggle('open', isVA); 
	elements.vaOptionsContainer.classList.toggle('open', !state.vaExempt); 
	
	elements.miMonthlyInput.disabled = isVA; 
	elements.miPercentInput.disabled = isVA;
	elements.miMonthlyInput.classList.toggle('cursor-not-allowed', isVA); 
	elements.miMonthlyInput.classList.toggle('bg-gray-600', isVA); 
	elements.miPercentInput.classList.toggle('cursor-not-allowed', isVA); 
	elements.miPercentInput.classList.toggle('bg-gray-600', isVA); 
	if (isVA) { 
		elements.miMonthlyInput.value = ''; 
		elements.miPercentInput.value = '';
		elements.miEstimateEl.textContent = 'N/A for VA Loans'; 
	} 
}; 

export const updateCustomChart = (pi, tax, ins, pmi, hoa, svgChart) => { 
	svgChart.innerHTML = ''; 
	const svgNS = "http://www.w3.org/2000/svg"; 
	const costs = [ 
		{ label: 'Tax', value: tax, color: '#F6AD55' }, 
		{ label: 'Ins', value: ins, color: '#4FD1C5' }, 
		{ label: 'MI', value: pmi, color: '#ED64A6' }, 
		{ label: 'HOA', value: hoa, color: '#4299E1' } 
	].filter(c => c.value > 0.01); 

	const totalOuter = costs.reduce((sum, item) => sum + item.value, 0); 
	const centerX = 100, centerY = 100, radius = 60, strokeWidth = 25; 
	let startAngle = -90; 

	function polarToCartesian(cx, cy, r, angleInDegrees) { 
		const angleInRadians = (angleInDegrees) * Math.PI / 180.0; 
		return { x: cx + (r * Math.cos(angleInRadians)), y: cy + (r * Math.sin(angleInRadians)) }; 
	} 

	function describeArc(x, y, r, start, end) { 
		const startPoint = polarToCartesian(x, y, r, start); 
		const endPoint = polarToCartesian(x, y, r, end); 
		const largeArcFlag = end - start <= 180 ? "0" : "1"; 
		return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`; 
	} 

	costs.forEach(cost => { 
		const angle = totalOuter > 0 ? (cost.value / totalOuter) * 360 : 0; 
		if (angle === 0) return; 
		const endAngle = startAngle + angle; 
		
		const group = document.createElementNS(svgNS, 'g'); 
		group.classList.add('chart-segment'); 

		const path = document.createElementNS(svgNS, 'path'); 
		path.setAttribute('d', describeArc(centerX, centerY, radius, startAngle, angle > 0.1 ? endAngle - 2 : endAngle)); 
		path.setAttribute('fill', 'none'); 
		path.setAttribute('stroke', cost.color); 
		path.setAttribute('stroke-width', strokeWidth); 
		
		const midAngle = startAngle + angle / 2; 
		const labelRadius = radius + strokeWidth + 5; 
		const labelPos = polarToCartesian(centerX, centerY, labelRadius, midAngle); 

		const text = document.createElementNS(svgNS, 'text'); 
		text.setAttribute('x', labelPos.x); 
		text.setAttribute('y', labelPos.y); 
		text.setAttribute('text-anchor', 'middle'); 
		text.setAttribute('dominant-baseline', 'middle'); 
		text.classList.add('chart-label'); 
		
		const tspan1 = document.createElementNS(svgNS, 'tspan'); 
		tspan1.setAttribute('x', labelPos.x); 
		tspan1.setAttribute('dy', '-0.3em'); 
		tspan1.textContent = cost.label; 
		
		const tspan2 = document.createElementNS(svgNS, 'tspan'); 
		tspan2.setAttribute('x', labelPos.x); 
		tspan2.setAttribute('dy', '1.2em'); 
		tspan2.textContent = formatCurrencyRounded(cost.value); 

		text.appendChild(tspan1); 
		text.appendChild(tspan2); 
		
		group.appendChild(path); 
		group.appendChild(text); 
		svgChart.appendChild(group); 

		startAngle = endAngle; 
	}); 

	const centerCircle = document.createElementNS(svgNS, 'circle'); 
	centerCircle.setAttribute('cx', centerX); centerCircle.setAttribute('cy', centerY); 
	centerCircle.setAttribute('r', radius - strokeWidth / 2 - 2); 
	centerCircle.setAttribute('fill', '#2d3748'); 
	svgChart.appendChild(centerCircle); 

	const centerText1 = document.createElementNS(svgNS, 'text'); 
	centerText1.setAttribute('x', centerX); centerText1.setAttribute('y', centerY - 6); 
	centerText1.setAttribute('text-anchor', 'middle'); centerText1.style.fontSize = '12px'; 
	centerText1.style.fill = '#A0AEC0'; centerText1.textContent = 'P&I'; 
	svgChart.appendChild(centerText1); 

	const centerText2 = document.createElementNS(svgNS, 'text'); 
	centerText2.setAttribute('x', centerX); centerText2.setAttribute('y', centerY + 12); 
	centerText2.setAttribute('text-anchor', 'middle'); centerText2.style.fontSize = '18px'; 
	centerText2.style.fontWeight = 'bold'; centerText2.style.fill = '#FFFFFF'; 
	centerText2.textContent = formatCurrencyRounded(pi); 
	svgChart.appendChild(centerText2); 
};
