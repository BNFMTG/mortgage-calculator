import { UT_COSTS } from '../data.js';
import { formatCurrency, parseFloatInput } from '../utils.js';

// Pure calculator that returns a structured breakdown for closing costs
export const buildClosingCostsBreakdown = (data, state, elements) => {
    if (!data || !data.homePrice) {
        return { items: [], total: 0 };
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

    const items = Object.entries(costs).map(([label, value]) => ({ label, value }));
    const total = items.reduce((sum, i) => sum + i.value, 0);
    return { items, total };
};

export const calculateClosingCosts = (data, state, elements) => {
	if (!data || !data.homePrice) {
		elements.closingCostsContentEl.innerHTML = '<p>Enter loan details to estimate closing costs.</p>';
		return;
	}

    const breakdown = buildClosingCostsBreakdown(data, state, elements);

    // Bucket configuration using base labels (ignore dynamic parentheses)
    const lenderFeesBase = ['Appraisal', 'Credit Report', 'Flood Certification', 'Upfront MIP (Paid Cash)', 'VA Funding Fee (Paid Cash)'];
    const thirdPartyBase = ["Lender's Title Insurance", 'Settlement/Escrow Fee', 'Recording Fees'];
    const escrowPrepaidsBase = ['Prepaid Interest', "Homeowner's Insurance", 'Property Tax Escrow'];

    const buckets = {
        'Lender Fees': [],
        'Third-Party Fees': [],
        'Escrow/Prepaids': [],
        'Other': []
    };

    const getBase = (label) => label.split(' (')[0];
    const pushToBucket = (item) => {
        const base = getBase(item.label);
        if (lenderFeesBase.includes(base)) return buckets['Lender Fees'].push(item);
        if (thirdPartyBase.includes(base)) return buckets['Third-Party Fees'].push(item);
        if (escrowPrepaidsBase.includes(base)) return buckets['Escrow/Prepaids'].push(item);
        return buckets['Other'].push(item);
    };

    breakdown.items.forEach(pushToBucket);

    // Remove Other bucket if empty
    if (buckets['Other'].length === 0) delete buckets['Other'];

    const renderBucket = (bucketName, items) => {
        const subtotal = items.reduce((sum, i) => sum + i.value, 0);
        const bucketId = `bucket-${bucketName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        let section = `
            <div class="bg-blue-500/10 rounded-lg">
                <button data-target="${bucketId}" class="w-full flex items-center justify-between p-4 text-left">
                    <span class="flex items-center gap-2">
                        <span class="bucket-caret" aria-hidden="true">▶</span>
                        <span class="text-sm font-semibold text-blue-200">${bucketName}</span>
                    </span>
                    <span class="text-sm font-semibold">${formatCurrency(subtotal)}</span>
                </button>
                <div id="${bucketId}" class="hidden px-4 pb-4">
                    <div class="divide-y divide-blue-400/10">`;
        items.forEach(item => {
            section += `
                        <div class="flex justify-between py-1.5">
                            <span class="text-blue-100/80 text-sm">${item.label}</span>
                            <span class="text-sm">${formatCurrency(item.value)}</span>
                        </div>`;
        });
        section += `
                    </div>
                </div>
            </div>`;
        return section;
    };

    let html = '<div class="space-y-4">';
    
    // Add collapse/expand all buttons
    html += `
        <div class="flex justify-center gap-2 mb-2">
            <button id="expand-all-closing-costs" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                Expand All
            </button>
            <button id="collapse-all-closing-costs" class="text-xs bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                Collapse All
            </button>
        </div>
    `;
    
    Object.entries(buckets).forEach(([name, items]) => {
        if (items.length > 0) html += renderBucket(name, items);
    });
    html += `
        <div class="flex justify-between text-lg font-bold border-t-2 border-blue-300/60 pt-3 mt-2">
            <span>Total Estimated Costs</span>
            <span>${formatCurrency(breakdown.total)}</span>
        </div>
        <p class="text-xs text-blue-100/70 mt-1">Note: Utah defaults. Title/escrow vary by company and file.</p>`;

    elements.closingCostsContentEl.innerHTML = html;

    // Wire up collapse/expand with default collapsed
    const container = elements.closingCostsContentEl;
    container.querySelectorAll('button[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const panel = document.getElementById(targetId);
            if (!panel) return;
            const arrow = btn.querySelector('.bucket-caret');
            const isHidden = panel.classList.contains('hidden');
            if (isHidden) {
                panel.classList.remove('hidden');
                if (arrow) arrow.textContent = '▼';
            } else {
                panel.classList.add('hidden');
                if (arrow) arrow.textContent = '▶';
            }
        });
    });
    
    // Wire up collapse/expand all buttons
    const expandAllBtn = container.querySelector('#expand-all-closing-costs');
    const collapseAllBtn = container.querySelector('#collapse-all-closing-costs');
    
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            const allPanels = container.querySelectorAll('[id^="bucket-"]');
            const allArrows = container.querySelectorAll('.bucket-caret');
            
            // Expand all
            allPanels.forEach(panel => panel.classList.remove('hidden'));
            allArrows.forEach(arrow => arrow.textContent = '▼');
        });
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            const allPanels = container.querySelectorAll('[id^="bucket-"]');
            const allArrows = container.querySelectorAll('.bucket-caret');
            
            // Collapse all
            allPanels.forEach(panel => panel.classList.add('hidden'));
            allArrows.forEach(arrow => arrow.textContent = '▶');
        });
    }
};
