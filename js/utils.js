// --- Utility Functions --- 
export const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v); 
export const formatCurrencyRounded = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v); 
export const parseFloatInput = (input) => parseFloat(input.value.replace(/,/g, '')) || 0; 
export const parseRoundInput = (input) => Math.round(parseFloatInput(input)); 

export const handleToggle = (activeBtn, inactiveBtns) => { 
	const buttons = Array.isArray(inactiveBtns) ? [activeBtn, ...inactiveBtns] : [activeBtn, inactiveBtns]; 
	buttons.forEach(btn => { 
		btn.classList.toggle('toggle-btn-active', btn === activeBtn); 
		btn.classList.toggle('toggle-btn-inactive', btn !== activeBtn); 
	}); 
}; 

// Resolve HOI clamp by property type and price (tiered for SFH)
export const resolveHoiClamp = (price, propertyType, UT_COSTS) => {
	if (propertyType === 'sfh') {
		for (const tier of UT_COSTS.sfhClampTiers) {
			if (price <= tier.maxPrice) return { min: tier.min, max: tier.max };
		}
		return { min: 300, max: 800 };
	}
	if (propertyType === 'townhome') return UT_COSTS.hoiMonthlyClampByType.townhome;
	return UT_COSTS.hoiMonthlyClampByType.condo;
};
