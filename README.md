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
- **Capital Gains Tax**: Separate short-term and long-term rate inputs, realization rate slider, and long-term % of realizations — tax drag on investment gains is applied each year and surfaced in the per-jurisdiction breakdown
- **Employer 401(k) Match**: Include employer matching contributions
- **Interactive Chart**: Hover (or touch on mobile) across years to see exact net worth per jurisdiction with a floating tooltip; Y-axis dollar labels and X-axis year markers
- **"What You'd Leave on the Table" Chart**: Shows the cumulative dollar gap between the winner and each other jurisdiction over time, with a break-even year callout when rankings flip
- **Sensitivity Sliders**: Layer a rent delta (±$500/mo) and salary delta (±20%) onto all jurisdictions to stress-test how robust the ranking is

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

### Capital Gains Tax Defaults
The tool ships with two editable inputs — short-term (default 37%, ordinary income) and long-term (default 23.8%, federal 20% + 3.8% NIIT). Both rates apply uniformly to all three jurisdictions; adjust them to reflect your actual bracket and state treatment. Jurisdictional differences in net worth come from differing savings rates already modeled by the income-tax engine. Capital gains tax only applies to the portion of annual gains you mark as realized via the realization-rate input (default 10%).

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
