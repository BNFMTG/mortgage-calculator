import { calculateAll } from './calculations.js';
import { updateUI, updateDynamicSections } from './ui.js';
import { handleToggle } from './utils.js';
import { calculateClosingCosts, buildClosingCostsBreakdown } from './features/closing-costs.js';
import { calculateExtraPayments } from './features/extra-payments.js';
import { renderScenarioTable, clearAllScenarios } from './features/scenarios.js';
import { calculateMaxPurchasePrice } from './features/max-purchase-price.js';

document.addEventListener('DOMContentLoaded', function () { 
	// --- DOM Element References --- 
	const allInputs = Array.from(document.getElementById('mortgage-form').querySelectorAll('input, select, button')); 
	const homePriceInput = document.getElementById('home-price'); 
	const downPaymentDollarInput = document.getElementById('down-payment-dollar'); 
	const downPaymentPercentInput = document.getElementById('down-payment-percent'); 
	const loanAmountInput = document.getElementById('loan-amount'); 
	const loanTermInput = document.getElementById('loan-term'); 
	const creditScoreInput = document.getElementById('credit-score'); 
	const hoaInput = document.getElementById('hoa'); 
	const ltvPercentInput = document.getElementById('ltv-percent'); 

	// Unified Input Fields 
	const interestRateInput = document.getElementById('interest-rate'); 
	const propertyTaxMonthlyInput = document.getElementById('property-tax-monthly');
	const propertyTaxYearlyInput = document.getElementById('property-tax-yearly');
	const homeInsuranceMonthlyInput = document.getElementById('home-insurance-monthly');
	const homeInsuranceYearlyInput = document.getElementById('home-insurance-yearly');
	const miMonthlyInput = document.getElementById('mi-monthly');
	const miPercentInput = document.getElementById('mi-percent');
	
	// Estimate Display Elements 
	const interestRateEstimateEl = document.getElementById('interest-rate-estimate'); 
	const propertyTaxEstimateEl = document.getElementById('property-tax-estimate'); 
	const homeInsuranceEstimateEl = document.getElementById('home-insurance-estimate'); 
	const miEstimateEl = document.getElementById('mi-estimate'); 

	const homePriceLabel = document.getElementById('home-price-label'); 
	const downPaymentContainer = document.getElementById('down-payment-container'); 
	const downPaymentWarningEl = document.getElementById('down-payment-warning'); 
	const creditScoreWarningEl = document.getElementById('credit-score-warning'); 
	const fhaSuggestionWarningEl = document.getElementById('fha-suggestion-warning'); 
	const loanBreakdownDisplay = document.getElementById('loan-breakdown-display'); 
	const hoaWarningEl = document.getElementById('hoa-warning'); 
	const ltvContainer = document.getElementById('ltv-container'); 

	// Toggles 
	const btnPurchase = document.getElementById('btn-purchase'); 
	const btnRefinance = document.getElementById('btn-refinance'); 
	const btnConventional = document.getElementById('btn-conventional'); 
	const btnFha = document.getElementById('btn-fha'); 
	const btnVa = document.getElementById('btn-va'); 
	const propTypeSfhBtn = document.getElementById('prop-type-sfh'); 
	const propTypeTownhomeBtn = document.getElementById('prop-type-townhome'); 
	const propTypeCondoBtn = document.getElementById('prop-type-condo'); 

	// FHA Section 
	const fhaOptionsContainer = document.getElementById('fha-options-container'); 
	const fhaFinanceUfmipBtn = document.getElementById('fha-finance-ufmip'); 
	const fhaPayCashUfmipBtn = document.getElementById('fha-pay-cash-ufmip'); 

	// VA Section 
	const vaContainer = document.getElementById('va-funding-fee-container'); 
	const vaOptionsContainer = document.getElementById('va-options-container'); 
	const vaExemptYesBtn = document.getElementById('va-exempt-yes'); 
	const vaExemptNoBtn = document.getElementById('va-exempt-no'); 
	const vaFirstUseBtn = document.getElementById('va-first-use'); 
	const vaSubsequentUseBtn = document.getElementById('va-subsequent-use'); 
	const vaFinanceFeeBtn = document.getElementById('va-finance-fee'); 
	const vaPayCashBtn = document.getElementById('va-pay-cash'); 

	// Results 
	const monthlyPaymentEl = document.getElementById('monthly-payment'); 
	const totalInterestDisplay = document.getElementById('total-interest-display'); 
	const amortizationTableBody = document.getElementById('amortization-table').querySelector('tbody'); 
	const svgChart = document.getElementById('custom-chart'); 
	
	// Scenarios 
    const saveScenarioBtn = document.getElementById('save-scenario-btn'); 
    const clearScenariosBtn = document.getElementById('clear-scenarios-btn'); 
    const resetFieldsBtn = document.getElementById('reset-fields-btn'); 
	const scenarioComparisonContainer = document.getElementById('scenario-comparison-container'); 
	const scenarioTableBody = document.getElementById('scenario-table-body'); 
	
	// --- Settings Panel & Feature Elements --- 
	 
	
	const affordableHomePriceEl = document.getElementById('affordable-home-price'); 
    const closingCostsCard = document.getElementById('closing-costs-card'); 
	const amortizationContainer = document.getElementById('amortization-container'); 
	
	const maxPurchasePriceInputs = [ 
		document.getElementById('monthly-income'), 
		document.getElementById('monthly-debts'), 
		document.getElementById('afford-down-payment'), 
		document.getElementById('afford-dti') 
	]; 

 
 
	const closingCostsContentEl = document.getElementById('closing-costs-content'); 
    // Removed Print Summary

	// --- State Variables --- 
	let state = { 
		transactionType: 'purchase', 
		loanType: 'conventional', 
		propertyType: 'sfh', 
		fhaFinanceUfmip: true, 
		vaExempt: false, 
		vaUseType: 'first_use', 
		vaFinanceFee: true, 
		lastFocused: null, 
		savedScenarios: [], 
		currentScenarioData: {}, 
		 
		// State for tracking last calculated values 
		lastCalculatedInterest: null, 
		lastCalculatedTax: null, 
		lastCalculatedInsurance: null, 
		lastCalculatedMI: null,
		lastCalculatedMIRatePercent: null,
		editingInterestRate: false,
		editingPropertyTax: false,
		editingHomeInsurance: false,
		editingMI: false,
		// Track whether user has overridden auto-calculated optional fields
		overrides: {
			propertyTax: false,
			homeInsurance: false,
			mi: false
		}
	}; 

	// Create elements object for easier passing to functions
	const elements = {
		// Inputs
		homePriceInput, downPaymentDollarInput, downPaymentPercentInput, loanAmountInput, 
		loanTermInput, creditScoreInput, hoaInput, ltvPercentInput, interestRateInput,
		propertyTaxMonthlyInput, propertyTaxYearlyInput, homeInsuranceMonthlyInput, 
		homeInsuranceYearlyInput, miMonthlyInput, miPercentInput,
		
		// Display elements
		interestRateEstimateEl, propertyTaxEstimateEl, homeInsuranceEstimateEl, miEstimateEl,
		homePriceLabel, downPaymentContainer, downPaymentWarningEl, creditScoreWarningEl,
		fhaSuggestionWarningEl, loanBreakdownDisplay, hoaWarningEl, ltvContainer,
		
		// Results
		monthlyPaymentEl, totalInterestDisplay, amortizationTableBody, svgChart,
		
		// Features
		closingCostsContentEl, affordableHomePriceEl,
		scenarioComparisonContainer, scenarioTableBody, saveScenarioBtn, clearScenariosBtn, resetFieldsBtn,
		
		// Max purchase price inputs
		monthlyIncomeInput: maxPurchasePriceInputs[0],
		monthlyDebtsInput: maxPurchasePriceInputs[1],
		affordDownPaymentInput: maxPurchasePriceInputs[2],
		affordDtiInput: maxPurchasePriceInputs[3],
		

		
		// Containers
        closingCostsCard, amortizationContainer,
		fhaOptionsContainer, vaContainer, vaOptionsContainer, amortizationTableBody
	};

	// --- Event Listeners --- 
	allInputs.forEach(input => { 
		const isToggleButton = input.tagName === 'BUTTON' && (input.parentElement.classList.contains('p-1') || input.parentElement.classList.contains('p-0.5')); 
		if (isToggleButton) return; 
		
		// Special handling for interest rate to prevent down payment recalculation
		const isInterestRateInput = input === interestRateInput;
		
		input.addEventListener('input', () => {
			let data;
			// If this is the interest rate input, preserve current down payment and loan amount (INPUT EVENT)
			if (isInterestRateInput) {
				// Store current values before calculation
				const currentDownPayment = parseFloat(downPaymentDollarInput.value) || 0;
				const currentLoanAmount = parseFloat(loanAmountInput.value) || 0;
				const currentDownPaymentPercent = parseFloat(downPaymentPercentInput.value) || 0;
				
				// Temporarily set lastFocused to prevent recalculation of down payment
				const originalLastFocused = state.lastFocused;
				state.lastFocused = null;
				
				data = calculateAll(state, elements);
				
				// Restore the original down payment and loan amount values
				if (state.transactionType === 'purchase') {
					downPaymentDollarInput.value = currentDownPayment.toFixed(0);
					downPaymentPercentInput.value = currentDownPaymentPercent.toFixed(2);
					loanAmountInput.value = currentLoanAmount.toFixed(0);
					
					// Update the data object to reflect the preserved values
					data.downPayment = currentDownPayment;
					data.baseLoanAmount = currentLoanAmount;
					data.downPaymentPercent = currentDownPaymentPercent;
				}
				
				// Restore lastFocused
				state.lastFocused = originalLastFocused;
			} else {
				data = calculateAll(state, elements);
			}
			
			updateUI(data, state, elements);
			
			// Store current scenario data with proper loan type and closing costs
			updateCurrentScenarioData(data, state, elements);
			
			// Trigger feature calculations (input event) - first instance
			calculateClosingCosts(data, state, elements); // Always calculate closing costs 
		}); 
		input.addEventListener('change', () => {
			let data;
			// If this is the interest rate input, preserve current down payment and loan amount (CHANGE EVENT)
			if (isInterestRateInput) {
				// Store current values before calculation
				const currentDownPayment = parseFloat(downPaymentDollarInput.value) || 0;
				const currentLoanAmount = parseFloat(loanAmountInput.value) || 0;
				const currentDownPaymentPercent = parseFloat(downPaymentPercentInput.value) || 0;
				
				// Temporarily set lastFocused to prevent recalculation of down payment
				const originalLastFocused = state.lastFocused;
				state.lastFocused = null;
				
				data = calculateAll(state, elements);
				
				// Restore the original down payment and loan amount values
				if (state.transactionType === 'purchase') {
					downPaymentDollarInput.value = currentDownPayment.toFixed(0);
					downPaymentPercentInput.value = currentDownPaymentPercent.toFixed(2);
					loanAmountInput.value = currentLoanAmount.toFixed(0);
					
					// Update the data object to reflect the preserved values
					data.downPayment = currentDownPayment;
					data.baseLoanAmount = currentLoanAmount;
					data.downPaymentPercent = currentDownPaymentPercent;
				}
				
				// Restore lastFocused
				state.lastFocused = originalLastFocused;
			} else {
				data = calculateAll(state, elements);
			}
			
			updateUI(data, state, elements);
			
			// Store current scenario data with proper loan type and closing costs
			updateCurrentScenarioData(data, state, elements);
			
			// Trigger feature calculations (change event) - second instance
			calculateClosingCosts(data, state, elements); // Always calculate closing costs
		}); 
	}); 
	
	document.getElementById('mortgage-form').addEventListener('focusin', (e) => { 
		if (e.target.tagName === 'INPUT') state.lastFocused = e.target; 
		if (e.target === interestRateInput) state.editingInterestRate = true;
	}); 

	// Dynamic field listeners and editing flags
	// Focus handlers to mark editing state
	propertyTaxMonthlyInput.addEventListener('focus', () => { state.editingPropertyTax = true; });
	propertyTaxYearlyInput.addEventListener('focus', () => { state.editingPropertyTax = true; });
	homeInsuranceMonthlyInput.addEventListener('focus', () => { state.editingHomeInsurance = true; });
	homeInsuranceYearlyInput.addEventListener('focus', () => { state.editingHomeInsurance = true; });
	miMonthlyInput.addEventListener('focus', () => { state.editingMI = true; });
	miPercentInput.addEventListener('focus', () => { state.editingMI = true; });

	propertyTaxMonthlyInput.addEventListener('input', () => {
		const val = propertyTaxMonthlyInput.value;
		if (val === '') {
			propertyTaxYearlyInput.value = '';
		} else {
			const monthly = parseFloat(val) || 0;
			propertyTaxYearlyInput.value = (monthly * 12).toFixed(2);
		}
		state.overrides.propertyTax = true;
		// Update chart immediately when user changes property tax
		const data = calculateAll(state, elements);
		updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	});
	propertyTaxYearlyInput.addEventListener('input', () => {
		const val = propertyTaxYearlyInput.value;
		if (val === '') {
			propertyTaxMonthlyInput.value = '';
		} else {
			const yearly = parseFloat(val) || 0;
			propertyTaxMonthlyInput.value = (yearly / 12).toFixed(2);
		}
		state.overrides.propertyTax = true;
		// Update chart immediately when user changes property tax
		const data = calculateAll(state, elements);
		updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	});
	homeInsuranceMonthlyInput.addEventListener('input', () => {
		const val = homeInsuranceMonthlyInput.value;
		if (val === '') {
			homeInsuranceYearlyInput.value = '';
		} else {
			const monthly = parseFloat(val) || 0;
			homeInsuranceYearlyInput.value = (monthly * 12).toFixed(2);
		}
		state.overrides.homeInsurance = true;
		// Update chart immediately when user changes home insurance
		const data = calculateAll(state, elements);
		updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	});
	homeInsuranceYearlyInput.addEventListener('input', () => {
		const val = homeInsuranceYearlyInput.value;
		if (val === '') {
			homeInsuranceMonthlyInput.value = '';
		} else {
			const yearly = parseFloat(val) || 0;
			homeInsuranceMonthlyInput.value = (yearly / 12).toFixed(2);
		}
		state.overrides.homeInsurance = true;
		// Update chart immediately when user changes home insurance
		const data = calculateAll(state, elements);
		updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	});
	miMonthlyInput.addEventListener('input', () => {
		const val = miMonthlyInput.value;
		const loanAmount = parseFloat(loanAmountInput.value) || 0;
		if (val === '') {
			miPercentInput.value = '';
		} else if (loanAmount > 0) {
			const monthly = parseFloat(val) || 0;
			miPercentInput.value = ((monthly * 12 / loanAmount) * 100).toFixed(2);
		}
		state.overrides.mi = true;
		// Update chart immediately when user changes mortgage insurance
		const data = calculateAll(state, elements);
		updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	});
	miPercentInput.addEventListener('input', () => {
		const val = miPercentInput.value;
		const loanAmount = parseFloat(loanAmountInput.value) || 0;
		if (val === '') {
			miMonthlyInput.value = '';
		} else {
			const percent = parseFloat(val) || 0;
			miMonthlyInput.value = ((loanAmount * (percent / 100)) / 12).toFixed(2);
		}
		state.overrides.mi = true;
		// Update chart immediately when user changes mortgage insurance
		const data = calculateAll(state, elements);
		updateCustomChart(data.monthlyPI, data.monthlyTax, data.monthlyInsurance, data.monthlyMI, data.monthlyHOA, elements.svgChart);
	});

	// Blur: if both fields empty, restore calculated; else keep override
	propertyTaxMonthlyInput.addEventListener('blur', () => {
		state.editingPropertyTax = false;
		if (propertyTaxMonthlyInput.value === '' && propertyTaxYearlyInput.value === '') {
			if (state.lastCalculatedTax != null) {
				propertyTaxMonthlyInput.value = state.lastCalculatedTax.toFixed(2);
				propertyTaxYearlyInput.value = (state.lastCalculatedTax * 12).toFixed(2);
			}
			state.overrides.propertyTax = false;
		}
	});
	propertyTaxYearlyInput.addEventListener('blur', () => {
		state.editingPropertyTax = false;
		if (propertyTaxMonthlyInput.value === '' && propertyTaxYearlyInput.value === '') {
			if (state.lastCalculatedTax != null) {
				propertyTaxMonthlyInput.value = state.lastCalculatedTax.toFixed(2);
				propertyTaxYearlyInput.value = (state.lastCalculatedTax * 12).toFixed(2);
			}
			state.overrides.propertyTax = false;
		}
	});
	homeInsuranceMonthlyInput.addEventListener('blur', () => {
		state.editingHomeInsurance = false;
		if (homeInsuranceMonthlyInput.value === '' && homeInsuranceYearlyInput.value === '') {
			if (state.lastCalculatedInsurance != null) {
				homeInsuranceMonthlyInput.value = state.lastCalculatedInsurance.toFixed(2);
				homeInsuranceYearlyInput.value = (state.lastCalculatedInsurance * 12).toFixed(2);
			}
			state.overrides.homeInsurance = false;
		}
	});
	homeInsuranceYearlyInput.addEventListener('blur', () => {
		state.editingHomeInsurance = false;
		if (homeInsuranceMonthlyInput.value === '' && homeInsuranceYearlyInput.value === '') {
			if (state.lastCalculatedInsurance != null) {
				homeInsuranceMonthlyInput.value = state.lastCalculatedInsurance.toFixed(2);
				homeInsuranceYearlyInput.value = (state.lastCalculatedInsurance * 12).toFixed(2);
			}
			state.overrides.homeInsurance = false;
		}
	});
	miMonthlyInput.addEventListener('blur', () => {
		state.editingMI = false;
		if (miMonthlyInput.value === '' && miPercentInput.value === '') {
			if (state.lastCalculatedMI != null) {
				miMonthlyInput.value = state.lastCalculatedMI.toFixed(2);
			}
			if (state.lastCalculatedMIRatePercent != null) {
				miPercentInput.value = state.lastCalculatedMIRatePercent.toFixed(2);
			}
			state.overrides.mi = false;
		}
	});
	miPercentInput.addEventListener('blur', () => {
		state.editingMI = false;
		if (miMonthlyInput.value === '' && miPercentInput.value === '') {
			if (state.lastCalculatedMI != null) {
				miMonthlyInput.value = state.lastCalculatedMI.toFixed(2);
			}
			if (state.lastCalculatedMIRatePercent != null) {
				miPercentInput.value = state.lastCalculatedMIRatePercent.toFixed(2);
			}
			state.overrides.mi = false;
		}
	});
	
	// Top Level Toggles 
	btnPurchase.addEventListener('click', () => { 
		state.transactionType = 'purchase'; 
		handleToggle(btnPurchase, btnRefinance); 
		updateDynamicSections(state, elements); 
		// Reset interest rate so the new program's estimate is applied
		state.editingInterestRate = false;
		interestRateInput.value = '';
		const data = calculateAll(state, elements);
		updateUI(data, state, elements);
		
		// Update current scenario data with new transaction type
		updateCurrentScenarioData(data, state, elements);
	}); 
	btnRefinance.addEventListener('click', () => { 
		state.transactionType = 'refinance'; 
		handleToggle(btnRefinance, btnPurchase); 
		updateDynamicSections(state, elements); 
		state.editingInterestRate = false;
		interestRateInput.value = '';
		const data = calculateAll(state, elements);
		updateUI(data, state, elements);
		
		// Update current scenario data with new transaction type
		updateCurrentScenarioData(data, state, elements);
	}); 
    	btnConventional.addEventListener('click', () => { 
		state.loanType = 'conventional'; 
		handleToggle(btnConventional, [btnFha, btnVa]); 
		updateDynamicSections(state, elements); 
		state.editingInterestRate = false;
		interestRateInput.value = '';
		// Clear MI fields so new loan type calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	btnFha.addEventListener('click', () => { 
		state.loanType = 'fha'; 
		handleToggle(btnFha, [btnConventional, btnVa]); 
		updateDynamicSections(state, elements); 
		state.editingInterestRate = false;
		interestRateInput.value = '';
		// Clear MI fields so new loan type calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	btnVa.addEventListener('click', () => { 
		state.loanType = 'va'; 
		handleToggle(btnVa, [btnConventional, btnFha]); 
		updateDynamicSections(state, elements); 
		state.editingInterestRate = false;
		interestRateInput.value = '';
		// Clear MI fields so new loan type calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	
	// Helper function for complete recalculation and UI update
    const recalcAndRenderAll = () => {
        const data = calculateAll(state, elements);
        updateUI(data, state, elements);
        updateCurrentScenarioData(data, state, elements);
        calculateClosingCosts(data, state, elements); // Always calculate closing costs (recalcAndRenderAll)
    };

	// Sub-Toggles 
    propTypeSfhBtn.addEventListener('click', () => { 
        state.propertyType = 'sfh'; 
        handleToggle(propTypeSfhBtn, [propTypeTownhomeBtn, propTypeCondoBtn]); 
        // Clear property-type dependent fields so new calculations take effect
        if (!state.overrides.propertyTax) {
            elements.propertyTaxMonthlyInput.value = '';
            elements.propertyTaxYearlyInput.value = '';
        }
        if (!state.overrides.homeInsurance) {
            elements.homeInsuranceMonthlyInput.value = '';
            elements.homeInsuranceYearlyInput.value = '';
        }
        if (!state.overrides.mi) {
            elements.miMonthlyInput.value = '';
            elements.miPercentInput.value = '';
        }
        recalcAndRenderAll();
    }); 
    propTypeTownhomeBtn.addEventListener('click', () => { 
        state.propertyType = 'townhome'; 
        handleToggle(propTypeTownhomeBtn, [propTypeSfhBtn, propTypeCondoBtn]); 
        // Clear property-type dependent fields so new calculations take effect
        if (!state.overrides.propertyTax) {
            elements.propertyTaxMonthlyInput.value = '';
            elements.propertyTaxYearlyInput.value = '';
        }
        if (!state.overrides.homeInsurance) {
            elements.homeInsuranceMonthlyInput.value = '';
            elements.homeInsuranceYearlyInput.value = '';
        }
        if (!state.overrides.mi) {
            elements.miMonthlyInput.value = '';
            elements.miPercentInput.value = '';
        }
        recalcAndRenderAll();
    }); 
    propTypeCondoBtn.addEventListener('click', () => { 
        state.propertyType = 'condo'; 
        handleToggle(propTypeCondoBtn, [propTypeSfhBtn, propTypeTownhomeBtn]); 
        // Clear property-type dependent fields so new calculations take effect
        if (!state.overrides.homeInsurance) {
            elements.homeInsuranceMonthlyInput.value = '';
            elements.homeInsuranceYearlyInput.value = '';
        }
        if (!state.overrides.mi) {
            elements.miMonthlyInput.value = '';
            elements.miPercentInput.value = '';
        }
        recalcAndRenderAll();
    }); 

		// FHA Toggles 
	fhaFinanceUfmipBtn.addEventListener('click', () => { 
		state.fhaFinanceUfmip = true; 
		handleToggle(fhaFinanceUfmipBtn, fhaPayCashUfmipBtn); 
		// Clear MI fields so new FHA calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	fhaPayCashUfmipBtn.addEventListener('click', () => { 
		state.fhaFinanceUfmip = false; 
		handleToggle(fhaPayCashUfmipBtn, fhaFinanceUfmipBtn); 
		// Clear MI fields so new FHA calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 

	// VA Toggles 
	vaExemptNoBtn.addEventListener('click', () => { 
		state.vaExempt = false; 
		handleToggle(vaExemptNoBtn, vaExemptYesBtn); 
		updateDynamicSections(state, elements); 
        recalcAndRenderAll();
	}); 
	vaExemptYesBtn.addEventListener('click', () => { 
		state.vaExempt = true; 
		handleToggle(vaExemptYesBtn, vaExemptNoBtn); 
		updateDynamicSections(state, elements); 
        recalcAndRenderAll();
	}); 
		vaFirstUseBtn.addEventListener('click', () => { 
		state.vaUseType = 'first_use'; 
		handleToggle(vaFirstUseBtn, vaSubsequentUseBtn); 
		// Clear MI fields so new VA calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	vaSubsequentUseBtn.addEventListener('click', () => { 
		state.vaUseType = 'subsequent_use'; 
		handleToggle(vaSubsequentUseBtn, vaFirstUseBtn); 
		// Clear MI fields so new VA calculations take effect
		if (!state.overrides.mi) {
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	vaFinanceFeeBtn.addEventListener('click', () => { 
		state.vaFinanceFee = true; 
		handleToggle(vaFinanceFeeBtn, vaPayCashBtn); 
		// Clear MI fields so new VA calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	vaPayCashBtn.addEventListener('click', () => { 
		state.vaFinanceFee = false; 
		handleToggle(vaPayCashBtn, vaFinanceFeeBtn); 
		// Clear MI fields so new VA calculations take effect
		if (!state.overrides.mi) {
			elements.miMonthlyInput.value = '';
			elements.miPercentInput.value = '';
		}
		recalcAndRenderAll();
	}); 
	
    resetFieldsBtn.addEventListener('click', () => {
		interestRateInput.value = ''; 
		propertyTaxMonthlyInput.value = ''; 
		propertyTaxYearlyInput.value = ''; 
		homeInsuranceMonthlyInput.value = ''; 
		homeInsuranceYearlyInput.value = ''; 
		miMonthlyInput.value = ''; 
		miPercentInput.value = '';
		// Clear overrides so fields auto-update again
		state.editingInterestRate = false;
		state.editingPropertyTax = false;
		state.editingHomeInsurance = false;
		state.editingMI = false;
		state.overrides.propertyTax = false;
		state.overrides.homeInsurance = false;
		state.overrides.mi = false;
        recalcAndRenderAll();
        // Disable reset until user changes optional fields again
        resetFieldsBtn.disabled = true;
        resetFieldsBtn.classList.add('opacity-50', 'cursor-not-allowed');
	}); 

	// When leaving the interest rate field: format or restore
	interestRateInput.addEventListener('blur', () => {
		state.editingInterestRate = false;
		if (interestRateInput.value === '') {
			const data = calculateAll(state, elements);
			updateUI(data, state, elements);
		} else {
			const val = parseFloat(interestRateInput.value);
			if (!isNaN(val)) interestRateInput.value = val.toFixed(3);
		}
	});
	
 

 

	maxPurchasePriceInputs.forEach(input => input.addEventListener('input', () => calculateMaxPurchasePrice(state, elements))); 

	// --- Scenarios ---
    saveScenarioBtn.addEventListener('click', () => { 
 		// Recalculate to ensure current UI values (including interest rate) are captured
		const data = calculateAll(state, elements);
		updateCurrentScenarioData(data, state, elements);
		// Deep clone so later edits don't mutate saved scenarios
		const snapshot = JSON.parse(JSON.stringify(state.currentScenarioData));
		if (state.savedScenarios.length < 3) { 
			state.savedScenarios.push(snapshot); 
			renderScenarioTable(state, elements); 
		} 
		if (state.savedScenarios.length >= 3) { 
			saveScenarioBtn.disabled = true; 
			saveScenarioBtn.classList.add('opacity-50', 'cursor-not-allowed'); 
		} 
        // Enable clear scenarios since we have at least one now
        clearScenariosBtn.disabled = state.savedScenarios.length === 0;
        clearScenariosBtn.classList.toggle('opacity-50', state.savedScenarios.length === 0);
        clearScenariosBtn.classList.toggle('cursor-not-allowed', state.savedScenarios.length === 0);
	}); 

    clearScenariosBtn.addEventListener('click', () => { 
        if (state.savedScenarios.length === 0) return; 
        clearAllScenarios(state, elements); 
        // Reset buttons state
        clearScenariosBtn.disabled = true;
        clearScenariosBtn.classList.add('opacity-50', 'cursor-not-allowed');
        saveScenarioBtn.disabled = false;
        saveScenarioBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }); 
	
	scenarioTableBody.addEventListener('click', function(e) { 
		if (e.target && e.target.classList.contains('delete-scenario-btn')) { 
			const indexToDelete = parseInt(e.target.dataset.index, 10); 
			state.savedScenarios.splice(indexToDelete, 1); 
			if (state.savedScenarios.length === 0) { 
				clearAllScenarios(state, elements); 
			} else { 
				renderScenarioTable(state, elements); 
			} 
			saveScenarioBtn.disabled = false; 
			saveScenarioBtn.classList.remove('opacity-50', 'cursor-not-allowed'); 
		} 
	}); 
	
    // Removed print summary logic


    // Track if optional fields changed to enable reset button
    const markOptionalFieldsChanged = () => {
        resetFieldsBtn.disabled = false;
        resetFieldsBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    };

    [propertyTaxMonthlyInput, propertyTaxYearlyInput, homeInsuranceMonthlyInput, homeInsuranceYearlyInput, miMonthlyInput, miPercentInput]
        .forEach(el => el.addEventListener('input', markOptionalFieldsChanged));

    // --- Initial Setup --- 
     
	updateDynamicSections(state, elements); 
	calculateMaxPurchasePrice(state, elements);
	
	// Helper function to get closing costs data
	const getClosingCostsData = (data, state, elements) => {

		// Build the exact breakdown using the same logic as the UI render function
		const breakdown = buildClosingCostsBreakdown(data, state, elements);
		return {
			homePrice: data.homePrice,
			baseLoanAmount: data.baseLoanAmount,
			loanType: state.loanType,
			interestRate: data.interestRate,
			estimatedTotal: breakdown.total,
			ufmip: data.ufmip || 0,
			vaFundingFee: data.vaFundingFee || 0,
			monthlyInsurance: parseFloat(elements.homeInsuranceMonthlyInput?.value) || 0,
			monthlyTax: parseFloat(elements.propertyTaxMonthlyInput?.value) || 0,
			breakdown
		};
	};
	
	// Helper function to update current scenario data
	const updateCurrentScenarioData = (data, state, elements) => {
		state.currentScenarioData = { 
			loanType: state.loanType.toUpperCase(), 
			transactionType: state.transactionType,
			propertyType: state.propertyType,
			homePrice: data.homePrice, 
			downPayment: state.transactionType === 'purchase' ? (data.homePrice - data.baseLoanAmount) : 'N/A', 
			loanAmount: data.baseLoanAmount, 
			financedFee: data.financedFee, 
			totalLoanAmount: data.finalLoanAmount, 
			interestRate: data.interestRate, 
			term: parseInt(loanTermInput.value) || 0, 
			monthlyPayment: data.totalMonthlyPayment, 
			pAndI: data.monthlyPI, 
			tax: data.monthlyTax, 
			insurance: data.monthlyInsurance, 
			mi: data.monthlyMI, 
			hoa: data.monthlyHOA, 
			totalInterest: data.totalInterestPaid, 
			amortizationData: data.amortizationData,
			// Add closing costs data
			closingCosts: getClosingCostsData(data, state, elements)
		};
	};

	// Initial calculation
		const data = calculateAll(state, elements);
		updateUI(data, state, elements);

		// Seed current scenario data so Save Scenario works before any input changes
		updateCurrentScenarioData(data, state, elements);

		        // Populate feature sections on first load
        calculateClosingCosts(data, state, elements); // Always calculate closing costs (initial setup)
        
        // Populate amortization schedule on first load
        const amortizationData = data.amortizationData;
        if (amortizationData && amortizationData.length > 0) {
            elements.amortizationTableBody.innerHTML = amortizationData.map(row => `
                <tr class="hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3 text-sm text-gray-300">${row.month}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${row.payment}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${row.principal}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${row.interest}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${row.balance}</td>
                </tr>
            `).join('');
        }

        // Initialize action buttons state
        clearScenariosBtn.disabled = state.savedScenarios.length === 0;
        clearScenariosBtn.classList.toggle('opacity-50', state.savedScenarios.length === 0);
        clearScenariosBtn.classList.toggle('cursor-not-allowed', state.savedScenarios.length === 0);
        
        // Initialize Extra Payment Modal functionality
        try {
            const extraPaymentBtn = document.getElementById('extra-payment-btn');
            const extraPaymentModal = document.getElementById('extra-payment-modal');
            const closeExtraPaymentModal = document.getElementById('close-extra-payment-modal');
            
            if (extraPaymentBtn && extraPaymentModal && closeExtraPaymentModal) {
                // Extra Payment Modal Event Listeners
                extraPaymentBtn.addEventListener('click', () => {
                    extraPaymentModal.classList.remove('hidden');
                    // Focus on first input when modal opens
                    setTimeout(() => {
                        document.getElementById('extra-monthly-payment')?.focus();
                    }, 100);
                });
                
                closeExtraPaymentModal.addEventListener('click', () => {
                    extraPaymentModal.classList.add('hidden');
                });
                
                // Close modal when clicking outside
                extraPaymentModal.addEventListener('click', (e) => {
                    if (e.target === extraPaymentModal) {
                        extraPaymentModal.classList.add('hidden');
                    }
                });
                
                // Close modal with Escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && !extraPaymentModal.classList.contains('hidden')) {
                        extraPaymentModal.classList.add('hidden');
                    }
                });
                
                // Extra payment input event listeners for real-time calculation
                const extraMonthlyPaymentInput = document.getElementById('extra-monthly-payment');
                const extraYearlyPaymentInput = document.getElementById('extra-yearly-payment');
                const oneTimePaymentInput = document.getElementById('one-time-payment');
                
                if (extraMonthlyPaymentInput && extraYearlyPaymentInput && oneTimePaymentInput) {
                    [extraMonthlyPaymentInput, extraYearlyPaymentInput, oneTimePaymentInput].forEach(input => {
                        input.addEventListener('input', () => {
                            calculateExtraPayments(state, elements);
                        });
                    });
                }
            }
        } catch (error) {
            console.warn('Extra Payment Modal initialization failed:', error);
        }
    });
