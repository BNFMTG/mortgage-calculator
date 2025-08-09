# Advanced Mortgage Calculator

A comprehensive mortgage calculator with support for Conventional, FHA, and VA loans, featuring advanced calculations, scenario comparison, and detailed cost breakdowns.

## Features

- **Multiple Loan Types**: Conventional, FHA, and VA loan calculations
- **Purchase & Refinance**: Support for both transaction types
- **Property Types**: Single Family Home, Townhome, and Condo
- **Advanced Calculations**: 
  - Principal & Interest
  - Property Tax (Utah defaults)
  - Homeowner's Insurance (tiered by property type and price)
  - Mortgage Insurance (Conventional PMI, FHA MIP)
  - VA Funding Fees
- **Additional Features**:
  - Closing Cost Estimator
  - Extra Payment Calculator
  - Amortization Schedule
  - Max Purchase Price Calculator
  - Scenario Comparison (up to 3 scenarios)
  - PDF Export

## File Structure

```
mortgage-calculator/
├── index.html                 # Main HTML structure
├── css/
│   └── styles.css            # All custom CSS styles
├── js/
│   ├── main.js              # Main initialization and event handlers
│   ├── calculations.js       # Core mortgage calculation logic
│   ├── ui.js                # UI update functions and chart rendering
│   ├── data.js              # Rate tables and constants
│   ├── utils.js             # Utility functions (formatting, etc.)
│   └── features/
│       ├── closing-costs.js # Closing costs calculator
│       ├── extra-payments.js # Extra payment calculator
│       ├── scenarios.js     # Scenario comparison functionality
│       └── max-purchase-price.js # Max purchase price calculator
└── README.md                # This documentation
```

## Module Breakdown

### Core Modules

- **`main.js`**: Application entry point, event listeners, state management
- **`calculations.js`**: All mortgage calculation logic (P&I, MI, fees, etc.)
- **`ui.js`**: UI updates, chart rendering, dynamic section management
- **`data.js`**: Rate tables, constants, and Utah-specific defaults
- **`utils.js`**: Utility functions for formatting, parsing, and helper functions

### Feature Modules

- **`closing-costs.js`**: Closing cost estimation with Utah defaults
- **`extra-payments.js`**: Extra payment impact calculations
- **`scenarios.js`**: Scenario comparison and management
- **`max-purchase-price.js`**: Maximum affordable home price calculator

## Key Features

### Utah-Specific Defaults
- Property tax: 0.50% of home price annually
- Homeowner's insurance: Tiered by property type and price
- Closing costs: Utah-specific fee structure

### Tiered Insurance Calculations
- SFH: Price-based tiers with different monthly ranges
- Townhome/Condo: Fixed monthly ranges
- Automatic estimation with user override capability

### Advanced Loan Support
- **Conventional**: PMI calculations based on LTV and credit score
- **FHA**: UFMIP and monthly MIP with finance/cash options
- **VA**: Funding fees with exemption and use type options

## Usage

1. Open `index.html` in a modern web browser
2. Select transaction type (Purchase/Refinance)
3. Choose loan type (Conventional/FHA/VA)
4. Enter loan details
5. View results and use additional features as needed

## Browser Compatibility

- Modern browsers with ES6 module support
- Requires HTTPS for module loading (or local file access)

## Dependencies

- Tailwind CSS (CDN)
- Google Fonts: Inter
- jsPDF (CDN)
- html2canvas (CDN)

## Development

The modular structure makes it easy to:
- Add new loan types
- Modify calculation logic
- Add new features
- Update rate tables
- Customize for different states/regions

Each module has a single responsibility and clear interfaces, making maintenance and extension straightforward.
