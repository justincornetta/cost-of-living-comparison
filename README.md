# Cost of Living Comparison Tool

A React-based financial comparison tool to help you decide between living in **New York City**, **New Jersey**, or **Philadelphia** based on your income, taxes, and expenses.

![2026 Tax Year](https://img.shields.io/badge/Tax%20Year-2026-green)
![React](https://img.shields.io/badge/React-18+-blue)

## Features

### 💰 Monthly Comparison Tab
- **Income & Deductions**: Input salary, bonus, 401(k) contributions, HSA, and other pre-tax deductions
- **Automatic Tax Calculation**: Uses 2026 federal and state/local tax brackets
- **Side-by-Side Comparison**: View net income, expenses, and monthly savings for each location
- **Editable Expenses**: Customize rent, utilities, transportation, food, entertainment, healthcare, and misc expenses

### 📈 Net Worth Projections Tab
- **Long-term Wealth Forecasting**: Project net worth over 1-40 years
- **Configurable Assumptions**: Investment return rate, salary growth, inflation
- **Employer 401(k) Match**: Include employer matching contributions
- **Visual Chart**: Line graph comparing wealth trajectories across locations

## 2026 Tax Rates

| Jurisdiction | Rate/Range | Notes |
|--------------|------------|-------|
| Federal | 10% - 37% | Updated brackets per IRS Rev. Proc. 2025-32 |
| NY State | 3.9% - 10.9% | 0.1% reduction on bottom 5 brackets (FY2026 budget) |
| NYC Local | 3.078% - 3.876% | Unchanged |
| NJ State | 1.4% - 10.75% | Unchanged |
| PA State | 3.07% flat | Unchanged |
| Philadelphia | 3.74% | Reduced from 3.75% (effective July 2025) |

### HSA Tax Treatment
- **Federal, NY, NJ**: HSA contributions are pre-tax (reduce taxable income)
- **PA & Philadelphia**: HSA contributions are NOT deductible (PA doesn't recognize HSA deduction)

## Files

| File | Description |
|------|-------------|
| `src/CostOfLivingMobile.jsx` | Mobile-optimized version (single column, stacked cards) |
| `src/CostOfLivingDesktop.jsx` | Desktop version (two-column grid layout) |

## Usage

### In Claude Artifacts
Simply copy either JSX file into a Claude artifact to render the interactive tool.

### In a React Project
```jsx
import CostOfLivingDesktop from './CostOfLivingDesktop';
// or
import CostOfLivingMobile from './CostOfLivingMobile';

function App() {
  return <CostOfLivingDesktop />;
}
```

## Default Values

The tool comes pre-configured with these defaults (easily customizable):

| Setting | Default |
|---------|---------|
| Annual Salary | $90,000 |
| 401(k) Contribution | 4% |
| HSA (Annual) | $3,850 |
| NYC Rent | $1,900/mo |
| NJ Rent | $1,700/mo |
| Philly Rent | $1,350/mo |

## Disclaimer

Tax rates and calculations are estimates based on 2026 tax law. This tool is for informational purposes only and should not be considered financial or tax advice. Consult a qualified professional for your specific situation.

## License

MIT
