import React, { useState, useMemo } from 'react';

export default function FinancialComparisonTool() {
  // ===========================================
  // TAX BRACKETS (2026)
  // ===========================================
  const federalBrackets = [
    { min: 0, max: 12400, rate: 0.10 },
    { min: 12400, max: 50400, rate: 0.12 },
    { min: 50400, max: 105700, rate: 0.22 },
    { min: 105700, max: 201775, rate: 0.24 },
    { min: 201775, max: 256225, rate: 0.32 },
    { min: 256225, max: 640600, rate: 0.35 },
    { min: 640600, max: Infinity, rate: 0.37 },
  ];

  const nyStateBrackets = [
    { min: 0, max: 8500, rate: 0.039 },
    { min: 8500, max: 11700, rate: 0.044 },
    { min: 11700, max: 13900, rate: 0.0515 },
    { min: 13900, max: 80650, rate: 0.054 },
    { min: 80650, max: 215400, rate: 0.059 },
    { min: 215400, max: 1077550, rate: 0.0685 },
    { min: 1077550, max: 5000000, rate: 0.0965 },
    { min: 5000000, max: 25000000, rate: 0.103 },
    { min: 25000000, max: Infinity, rate: 0.109 },
  ];

  const nycLocalBrackets = [
    { min: 0, max: 12000, rate: 0.03078 },
    { min: 12000, max: 25000, rate: 0.03762 },
    { min: 25000, max: 50000, rate: 0.03819 },
    { min: 50000, max: Infinity, rate: 0.03876 },
  ];

  const njStateBrackets = [
    { min: 0, max: 20000, rate: 0.014 },
    { min: 20000, max: 35000, rate: 0.0175 },
    { min: 35000, max: 40000, rate: 0.035 },
    { min: 40000, max: 75000, rate: 0.05525 },
    { min: 75000, max: 500000, rate: 0.0637 },
    { min: 500000, max: 1000000, rate: 0.0897 },
    { min: 1000000, max: Infinity, rate: 0.1075 },
  ];

  const paStateRate = 0.0307;
  const phillyWageTaxRate = 0.0374;

  const calculateBracketTax = (income, brackets) => {
    let tax = 0, remaining = income;
    for (const b of brackets) {
      if (remaining <= 0) break;
      tax += Math.min(remaining, b.max - b.min) * b.rate;
      remaining -= b.max - b.min;
    }
    return tax;
  };

  const getMarginalRate = (income, brackets) => {
    for (const b of brackets) { if (income > b.min && income <= b.max) return b.rate; }
    return brackets[brackets.length - 1].rate;
  };

  const federalLtcgBrackets = [
    { min: 0, max: 48350, rate: 0.00 },
    { min: 48350, max: 533400, rate: 0.15 },
    { min: 533400, max: Infinity, rate: 0.20 },
  ];
  const niitThreshold = 200000;
  const niitRate = 0.038;

  // ===========================================
  // STATE
  // ===========================================
  const [activeTab, setActiveTab] = useState('comparison');
  const [income, setIncome] = useState({ 
    annualSalary: 90000, 
    annualBonus: 0, 
    contribution401k: 4, 
    hsaAnnual: 3850, 
    otherPreTaxAnnual: 0 
  });
  const [taxOverride, setTaxOverride] = useState({ 
    useManualRates: false, 
    manualFederal: 22, 
    manualNyState: 5.9, 
    manualNyLocal: 3.876, 
    manualNjState: 6.37, 
    manualPaState: 3.07, 
    manualPhillyLocal: 3.74 
  });
  const [expenses, setExpenses] = useState({
    nyc: { rent: 1900, utilities: 150, transportation: 100, food: 600, entertainment: 250, healthcare: 0, misc: 1000 },
    nj: { rent: 1700, utilities: 150, transportation: 200, food: 550, entertainment: 250, healthcare: 0, misc: 1000 },
    philly: { rent: 1350, utilities: 150, transportation: 50, food: 500, entertainment: 250, healthcare: 0, misc: 1000 },
  });
  const [proj, setProj] = useState({
    currentNetWorth: 50000,
    projectionYears: 10,
    investmentReturnRate: 7,
    salaryGrowthRate: 3,
    inflationRate: 2.5,
    savingsAllocation: 80,
    includeEmployerMatch: true,
    employerMatchPercent: 50,
    employerMatchLimit: 6,
    shortTermGainsAnnual: 0,
    longTermGainsAnnual: 0,
    useLifePhases: false,
    phase1Years: 2,
    phase2Jurisdiction: 'nj'
  });

  const [sensitivity, setSensitivity] = useState({ rentDelta: 0, salaryDeltaPct: 0 });
  const [hoverYear, setHoverYear] = useState(null);

  // Scenario snapshots for side-by-side comparison
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);
  const [compareMode, setCompareMode] = useState(false);

  // ===========================================
  // CALCULATIONS (pure, accepts state snapshot)
  // ===========================================
  const computeCalculationsFor = (income, taxOverride, expenses, proj) => {
    const locs = ['nyc', 'nj', 'philly', 'njnyc'];
    const results = {};
    
    const grossAnnual = income.annualSalary + income.annualBonus;
    const annual401k = income.annualSalary * (income.contribution401k / 100);
    const federalPreTax = annual401k + income.hsaAnnual + income.otherPreTaxAnnual;
    const federalTaxableAnnual = grossAnnual - federalPreTax;
    const paTaxableAnnual = grossAnnual - annual401k;
    const phillyTaxableAnnual = grossAnnual - annual401k;

    const fedTax = taxOverride.useManualRates 
      ? federalTaxableAnnual * taxOverride.manualFederal / 100 
      : calculateBracketTax(federalTaxableAnnual, federalBrackets);
    const fedRate = taxOverride.useManualRates 
      ? taxOverride.manualFederal 
      : (federalTaxableAnnual > 0 ? fedTax / federalTaxableAnnual * 100 : 0);
    
    const computedRates = { federal: fedRate };
    const employerMatch = proj.includeEmployerMatch
      ? Math.min(income.annualSalary * proj.employerMatchLimit / 100, income.annualSalary * income.contribution401k / 100 * proj.employerMatchPercent / 100)
      : 0;

    const fedOrdMarginal = getMarginalRate(federalTaxableAnnual, federalBrackets);
    const fedLtcgMarginal = getMarginalRate(federalTaxableAnnual, federalLtcgBrackets);
    const niit = federalTaxableAnnual > niitThreshold ? niitRate : 0;

    locs.forEach(loc => {
      let stTax, locTax, stRate, locRate;
      const isNjNyc = loc === 'njnyc';
      let taxableForState = loc === 'philly' ? paTaxableAnnual : federalTaxableAnnual;
      let taxableForLocal = loc === 'philly' ? phillyTaxableAnnual : federalTaxableAnnual;

      if (taxOverride.useManualRates) {
        if (loc === 'nyc') {
          stTax = taxableForState * taxOverride.manualNyState / 100;
          locTax = taxableForLocal * taxOverride.manualNyLocal / 100;
          stRate = taxOverride.manualNyState;
          locRate = taxOverride.manualNyLocal;
        } else if (loc === 'nj') {
          stTax = taxableForState * taxOverride.manualNjState / 100;
          locTax = 0;
          stRate = taxOverride.manualNjState;
          locRate = 0;
        } else if (isNjNyc) {
          const nyManual = taxableForState * taxOverride.manualNyState / 100;
          const njManual = taxableForState * taxOverride.manualNjState / 100;
          stTax = Math.max(nyManual, njManual);
          locTax = 0;
          stRate = Math.max(taxOverride.manualNyState, taxOverride.manualNjState);
          locRate = 0;
        } else {
          stTax = taxableForState * taxOverride.manualPaState / 100;
          locTax = taxableForLocal * taxOverride.manualPhillyLocal / 100;
          stRate = taxOverride.manualPaState;
          locRate = taxOverride.manualPhillyLocal;
        }
      } else {
        if (loc === 'nyc') {
          stTax = calculateBracketTax(taxableForState, nyStateBrackets);
          locTax = calculateBracketTax(taxableForLocal, nycLocalBrackets);
        } else if (loc === 'nj') {
          stTax = calculateBracketTax(taxableForState, njStateBrackets);
          locTax = 0;
        } else if (isNjNyc) {
          const nyTax = calculateBracketTax(taxableForState, nyStateBrackets);
          const njTax = calculateBracketTax(taxableForState, njStateBrackets);
          stTax = Math.max(nyTax, njTax);
          locTax = 0;
        } else {
          stTax = taxableForState * paStateRate;
          locTax = taxableForLocal * phillyWageTaxRate;
        }
        stRate = taxableForState > 0 ? stTax / taxableForState * 100 : 0;
        locRate = taxableForLocal > 0 ? locTax / taxableForLocal * 100 : 0;
      }

      computedRates[loc] = { state: stRate, local: locRate };

      let stateCapMarginal = 0, localCapMarginal = 0;
      if (loc === 'nyc') {
        stateCapMarginal = getMarginalRate(taxableForState, nyStateBrackets);
        localCapMarginal = getMarginalRate(taxableForLocal, nycLocalBrackets);
      } else if (loc === 'nj' || isNjNyc) {
        stateCapMarginal = getMarginalRate(taxableForState, njStateBrackets);
      } else {
        stateCapMarginal = paStateRate;
      }
      const shortTermCapGainsRate = (fedOrdMarginal + stateCapMarginal + localCapMarginal + niit) * 100;
      const longTermCapGainsRate  = (fedLtcgMarginal + stateCapMarginal + localCapMarginal + niit) * 100;

      const totalTaxAnnual = fedTax + stTax + locTax;
      const totalTaxMonthly = totalTaxAnnual / 12;
      const netMonthly = grossAnnual / 12 - federalPreTax / 12 - totalTaxMonthly;
      const exp = isNjNyc ? expenses.nj : expenses[loc];
      const totalExp = exp.rent + exp.utilities + exp.transportation + exp.food + exp.entertainment + exp.healthcare + exp.misc;

      results[loc] = {
        grossMonthly: grossAnnual / 12,
        monthlyPreTax: federalPreTax / 12,
        federalTax: fedTax / 12,
        stateTax: stTax / 12,
        localTax: locTax / 12,
        totalTax: totalTaxMonthly,
        netMonthly,
        totalExpenses: totalExp,
        monthlySavings: netMonthly - totalExp,
        annualSavings: (netMonthly - totalExp) * 12,
        effectiveTaxRate: totalTaxAnnual / grossAnnual * 100,
        savingsRate: netMonthly > 0 ? (netMonthly - totalExp) / netMonthly * 100 : 0,
        federalEffectiveRate: fedRate,
        stateEffectiveRate: stRate,
        localEffectiveRate: locRate,
        combinedStatLocalRate: stRate + locRate,
        shortTermCapGainsRate,
        longTermCapGainsRate,
        annual401k,
        employerMatch,
        stateTaxableAnnual: taxableForState,
      };
    });
    
    const sorted = [...locs].sort((a, b) => results[b].monthlySavings - results[a].monthlySavings);
    results.winner = sorted[0]; 
    results.ranking = sorted; 
    results.computedRates = computedRates; 
    results.taxableAnnual = federalTaxableAnnual; 
    results.grossAnnual = grossAnnual;
    results.annual401k = annual401k;
    
    return results;
  };

  const calculations = useMemo(() => computeCalculationsFor(income, taxOverride, expenses, proj),
    [income, taxOverride, expenses, proj.includeEmployerMatch, proj.employerMatchPercent, proj.employerMatchLimit]);

  // ===========================================
  // PROJECTIONS (pure, accepts state snapshot + calcs)
  // ===========================================
  const computeProjectionsFor = (income, calculations, proj, sensitivity) => {
    const locs = ['nyc', 'nj', 'philly', 'njnyc'];
    const results = {};
    
    const salaryMult = 1 + (sensitivity.salaryDeltaPct || 0) / 100;
    const rentDelta = sensitivity.rentDelta || 0;

    const phaseOn = !!proj.useLifePhases;
    const phaseYrs = Math.max(0, Math.floor(proj.phase1Years || 0));
    const phase2Loc = proj.phase2Jurisdiction || 'nj';
    const effectiveLocFor = (loc, y) => (phaseOn && y > phaseYrs) ? phase2Loc : loc;

    locs.forEach(loc => {
      const data = [];
      let nw = proj.currentNetWorth;
      let invested = nw * proj.savingsAllocation / 100;
      let cash = nw - invested;
      const salaryBase = income.annualSalary * salaryMult;
      const y0ExpBase = (calculations[loc].totalExpenses + rentDelta) * 12;
      data.push({ year: 0, netWorth: nw, invested, cash, savings: 0, contributions: 0, gains: 0, capGainsTax: 0, salary: salaryBase, expenses: y0ExpBase });

      for (let y = 1; y <= proj.projectionYears; y++) {
        const effLoc = effectiveLocFor(loc, y);
        const salary = salaryBase * Math.pow(1 + proj.salaryGrowthRate / 100, y);
        const expAnnual = (calculations[effLoc].totalExpenses + rentDelta) * 12 * Math.pow(1 + proj.inflationRate / 100, y);
        const gross = salary + income.annualBonus * salaryMult;
        const k401 = salary * income.contribution401k / 100;
        const preTaxTotal = k401 + income.hsaAnnual + income.otherPreTaxAnnual;
        const effectiveRate = calculations[effLoc].effectiveTaxRate / 100;
        const taxes = gross * effectiveRate;
        const net = gross - preTaxTotal - taxes;
        const savings = net - expAnnual;
        const match = proj.includeEmployerMatch ? Math.min(salary * proj.employerMatchLimit / 100, k401 * proj.employerMatchPercent / 100) : 0;
        const gains = invested * proj.investmentReturnRate / 100;
        const capGainsTax = proj.longTermGainsAnnual * calculations[effLoc].longTermCapGainsRate / 100 + proj.shortTermGainsAnnual * calculations[effLoc].shortTermCapGainsRate / 100;
        const toInvest = savings > 0 ? savings * proj.savingsAllocation / 100 : savings;
        invested += gains + toInvest + k401 + match - capGainsTax;
        cash += savings > 0 ? savings * (1 - proj.savingsAllocation / 100) : 0;
        if (cash < 0) { invested += cash; cash = 0; }
        nw = invested + cash;
        data.push({ year: y, netWorth: nw, invested, cash, savings, contributions: toInvest + k401 + match, gains, capGainsTax, salary, expenses: expAnnual });
      }
      results[loc] = { data, final: data[proj.projectionYears].netWorth, totalGains: data.reduce((s, d) => s + d.gains, 0), totalContrib: data.reduce((s, d) => s + d.contributions, 0), totalCapGainsTax: data.reduce((s, d) => s + d.capGainsTax, 0) };
    });

    const sorted = [...locs].sort((a, b) => results[b].final - results[a].final);
    results.winner = sorted[0];
    results.ranking = sorted;

    const winnerData = results[sorted[0]].data;
    results.deltas = {};
    locs.forEach(loc => {
      results.deltas[loc] = results[loc].data.map((d, i) => ({ year: i, gap: d.netWorth - winnerData[i].netWorth }));
    });

    let flipYear = null, flipFrom = null, flipTo = null;
    for (let y = 1; y <= proj.projectionYears; y++) {
      const rankAtY = [...locs].sort((a, b) => results[b].data[y].netWorth - results[a].data[y].netWorth);
      if (rankAtY[0] !== sorted[0]) { flipYear = y; flipFrom = sorted[0]; flipTo = rankAtY[0]; break; }
    }
    results.flip = flipYear ? { year: flipYear, from: flipFrom, to: flipTo } : null;

    return results;
  };

  const projections = useMemo(() => computeProjectionsFor(income, calculations, proj, sensitivity),
    [calculations, proj, income, sensitivity]);

  const calcA = useMemo(() => scenarioA
    ? computeCalculationsFor(scenarioA.income, scenarioA.taxOverride, scenarioA.expenses, scenarioA.proj) : null,
    [scenarioA]);
  const projA = useMemo(() => (scenarioA && calcA)
    ? computeProjectionsFor(scenarioA.income, calcA, scenarioA.proj, scenarioA.sensitivity) : null,
    [scenarioA, calcA]);
  const calcB = useMemo(() => scenarioB
    ? computeCalculationsFor(scenarioB.income, scenarioB.taxOverride, scenarioB.expenses, scenarioB.proj) : null,
    [scenarioB]);
  const projB = useMemo(() => (scenarioB && calcB)
    ? computeProjectionsFor(scenarioB.income, calcB, scenarioB.proj, scenarioB.sensitivity) : null,
    [scenarioB, calcB]);

  const snapshotCurrent = () => JSON.parse(JSON.stringify({ income, taxOverride, expenses, proj, sensitivity }));
  const loadScenario = (snap) => {
    if (!snap) return;
    setIncome(snap.income);
    setTaxOverride(snap.taxOverride);
    setExpenses(snap.expenses);
    setProj(snap.proj);
    setSensitivity(snap.sensitivity);
  };

  // ===========================================
  // HELPERS
  // ===========================================
  const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtK = n => Math.abs(n) >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : fmt(n);
  const fmtKPrecise = n => Math.abs(n) >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : Math.abs(n) >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : fmt(n);
  const fmtPct = n => `${n.toFixed(2)}%`;
  
  const updateIncome = (k, v) => setIncome(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const updateTax = (k, v) => setTaxOverride(p => ({ ...p, [k]: typeof v === 'boolean' ? v : parseFloat(v) || 0 }));
  const updateExp = (loc, k, v) => setExpenses(p => ({ ...p, [loc]: { ...p[loc], [k]: parseFloat(v) || 0 } }));
  const updateProj = (k, v) => setProj(p => ({ ...p, [k]: typeof v === 'boolean' ? v : (typeof p[k] === 'string' ? v : (parseFloat(v) || 0)) }));
  const updateSensitivity = (k, v) => setSensitivity(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const locConfig = {
    nyc: { name: 'NYC', fullName: 'New York City', emoji: '🗽', color: '#FF6B35', grad: 'linear-gradient(135deg, #FF6B35, #F7931E)' },
    nj: { name: 'NJ', fullName: 'New Jersey', emoji: '🏡', color: '#4ECDC4', grad: 'linear-gradient(135deg, #4ECDC4, #44A08D)' },
    philly: { name: 'Philly', fullName: 'Philadelphia', emoji: '🔔', color: '#667EEA', grad: 'linear-gradient(135deg, #667EEA, #764BA2)' },
    njnyc: { name: 'NJ→NYC', fullName: 'NJ → NYC Commute', emoji: '🚆', color: '#EC4899', grad: 'linear-gradient(135deg, #EC4899, #DB2777)' },
  };

  // ===========================================
  // MOBILE-FIRST STYLES
  // ===========================================
  const s = {
    container: { 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
      minHeight: '100vh', 
      background: '#F8FAFC', 
      padding: '16px',
      boxSizing: 'border-box',
      maxWidth: '100%',
      overflow: 'hidden'
    },
    header: { textAlign: 'center', marginBottom: 16 },
    title: { fontSize: 22, fontWeight: 700, color: '#1E293B', margin: '0 0 4px', lineHeight: 1.2 },
    titleAccent: { background: 'linear-gradient(135deg, #667EEA, #764BA2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { fontSize: 13, color: '#64748B', margin: 0 },
    taxYear: { display: 'inline-block', background: '#10B981', color: '#FFF', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, marginTop: 6 },
    tabs: { display: 'flex', gap: 8, marginBottom: 16 },
    tab: { 
      flex: 1, 
      padding: '10px 8px', 
      fontSize: 13, 
      fontWeight: 600, 
      border: '2px solid #E2E8F0', 
      borderRadius: 10, 
      background: '#FFF', 
      color: '#64748B', 
      cursor: 'pointer',
      textAlign: 'center'
    },
    tabActive: { borderColor: '#667EEA', background: 'linear-gradient(135deg, #667EEA, #764BA2)', color: '#FFF' },
    banner: { 
      padding: '16px', 
      borderRadius: 12, 
      marginBottom: 16, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
    },
    bannerEmoji: { fontSize: 32, marginBottom: 8, display: 'block' },
    bannerLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)', marginBottom: 2, textTransform: 'uppercase' },
    bannerName: { fontSize: 20, fontWeight: 700, color: '#FFF', marginBottom: 4 },
    bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    bannerDiff: { marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' },
    diffLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
    diffAmt: { fontSize: 18, fontWeight: 700, color: '#FFF' },
    panel: { 
      background: '#FFF', 
      borderRadius: 12, 
      padding: 16, 
      marginBottom: 16, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
      border: '1px solid #E2E8F0' 
    },
    sectionTitle: { fontSize: 15, fontWeight: 600, color: '#1E293B', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 },
    inputGroup: { marginBottom: 14 },
    inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 },
    inputWrap: { position: 'relative' },
    inputPre: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 },
    inputSuf: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 },
    input: { 
      width: '100%', 
      padding: '12px 12px 12px 26px', 
      fontSize: 16, 
      fontWeight: 500, 
      border: '2px solid #E2E8F0', 
      borderRadius: 8, 
      outline: 'none', 
      background: '#F8FAFC', 
      boxSizing: 'border-box',
      WebkitAppearance: 'none'
    },
    hint: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
    computed: { background: '#EFF6FF', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid #BFDBFE' },
    computedRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#1E40AF', padding: '4px 0' },
    computedTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#1E40AF', paddingTop: 8, borderTop: '1px dashed #93C5FD', marginTop: 4 },
    warning: { background: '#FEF3C7', borderRadius: 8, padding: 10, marginTop: 10, fontSize: 12, color: '#92400E', lineHeight: 1.4 },
    subTitle: { fontSize: 13, fontWeight: 600, color: '#64748B', margin: '0 0 12px', paddingTop: 14, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 },
    toggleBtn: { padding: '6px 12px', borderRadius: 6, border: 'none', color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
    rateCard: { background: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 10 },
    rateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    rateLabel: { fontSize: 13 },
    rateVal: { fontSize: 16, fontWeight: 700, color: '#1E293B' },
    rateDetails: { fontSize: 11, color: '#64748B', marginBottom: 6 },
    rateBar: { height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
    rateFill: { height: '100%', borderRadius: 3 },
    // Location cards - stack vertically on mobile
    cards: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { background: '#FFF', borderRadius: 12, padding: 16, border: '2px solid #E2E8F0', position: 'relative' },
    badge: { position: 'absolute', top: -10, right: 12, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#FFF' },
    cardHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
    cardEmoji: { fontSize: 28 },
    cardTitle: { fontSize: 17, fontWeight: 700, color: '#1E293B', margin: 0 },
    metricRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' },
    metricLabel: { fontSize: 13, color: '#64748B' },
    metricVal: { fontSize: 15, fontWeight: 600, color: '#1E293B' },
    savingsBox: { borderRadius: 10, padding: 16, textAlign: 'center', margin: '12px 0' },
    savingsLabel: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginBottom: 4 },
    savingsVal: { fontSize: 28, fontWeight: 700, color: '#FFF' },
    savingsSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    breakdown: { background: '#F8FAFC', borderRadius: 8, padding: 12, margin: '12px 0' },
    breakdownTitle: { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
    breakdownRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', padding: '4px 0' },
    breakdownTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: '#1E293B', paddingTop: 8, borderTop: '1px solid #E2E8F0', marginTop: 4 },
    hsaNote: { fontSize: 11, color: '#DC2626', marginTop: 8, fontStyle: 'italic' },
    expSection: { marginTop: 12 },
    expRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' },
    expLabel: { fontSize: 13, color: '#64748B' },
    expInputWrap: { position: 'relative' },
    expInputPre: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 12 },
    expInput: { width: 80, padding: '8px 8px 8px 22px', fontSize: 14, border: '1px solid #E2E8F0', borderRadius: 6, textAlign: 'right', boxSizing: 'border-box' },
    savingsBar: { marginTop: 12 },
    savingsBarLabel: { fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 },
    savingsTrack: { height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
    savingsFill: { height: '100%', borderRadius: 4 },
    // Projections
    projCard: { background: '#FFF', borderRadius: 12, padding: 16, border: '2px solid #E2E8F0', marginBottom: 12, position: 'relative' },
    bigNum: { borderRadius: 10, padding: 16, textAlign: 'center', margin: '12px 0' },
    bigNumLabel: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginBottom: 6 },
    bigNumVal: { fontSize: 32, fontWeight: 700, color: '#FFF' },
    projRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', padding: '6px 0' },
    projTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#1E293B', paddingTop: 10, borderTop: '1px solid #E2E8F0', marginTop: 6 },
    chart: { background: '#F8FAFC', borderRadius: 10, padding: 16, marginBottom: 16 },
    chartSvg: { width: '100%', height: 150 },
    legend: { display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' },
    legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
    legendDot: { width: 12, height: 4, borderRadius: 2 },
    table: { borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', marginTop: 16 },
    tableHead: { display: 'grid', gridTemplateColumns: '60px repeat(4, 1fr)', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' },
    tableRow: { display: 'grid', gridTemplateColumns: '60px repeat(4, 1fr)', borderBottom: '1px solid #F1F5F9' },
    tableCell: { padding: '10px 6px', fontSize: 11, fontWeight: 500, textAlign: 'center' },
    category: { marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #F1F5F9' },
    catTitle: { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },
    checkRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
    checkbox: { width: 20, height: 20, accentColor: '#667EEA' },
    footer: { textAlign: 'center', padding: '16px 0' },
    footerText: { fontSize: 12, color: '#64748B', lineHeight: 1.5 },
    disclaimer: { fontSize: 10, color: '#94A3B8', marginTop: 8, lineHeight: 1.4 },
    scenarioBar: { display: 'flex', gap: 8, alignItems: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 10px', marginBottom: 14, flexWrap: 'wrap' },
    scenarioBarTitle: { fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
    scenarioSlot: { display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: '#F8FAFC', borderRadius: 6 },
    scenarioSlotLabel: { fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 },
    scenarioSummary: { fontSize: 10, color: '#64748B' },
    scenarioBtn: { padding: '4px 8px', fontSize: 10, fontWeight: 600, border: 'none', borderRadius: 4, background: '#E2E8F0', color: '#1A202C' },
    scenarioPrimary: { padding: '4px 10px', fontSize: 10, fontWeight: 600, border: 'none', borderRadius: 4, background: '#10B981', color: '#FFF' },
    compareBtn: { padding: '5px 10px', fontSize: 11, fontWeight: 700, border: '2px solid #667EEA', borderRadius: 6, width: '100%', marginTop: 4 },
    compareTable: { width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 11 },
    compareThCell: { padding: '8px 6px', background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #E2E8F0' },
    compareTdCell: { padding: '8px 6px', borderBottom: '1px solid #F1F5F9' },
    compareDeltaPos: { color: '#059669', fontWeight: 700 },
    compareDeltaNeg: { color: '#DC2626', fontWeight: 700 },
    compareDeltaZero: { color: '#94A3B8' },
  };

  // ===========================================
  // COMPARISON TAB
  // ===========================================
  const ComparisonTab = () => (
    <>
      <div style={{ ...s.banner, background: locConfig[calculations.winner].grad }}>
        <span style={s.bannerEmoji}>{locConfig[calculations.winner].emoji}</span>
        <div style={s.bannerLabel}>Best for Monthly Savings</div>
        <div style={s.bannerName}>{locConfig[calculations.winner].fullName}</div>
        <div style={s.bannerSub}>{fmt(calculations[calculations.winner].monthlySavings)}/mo · {fmt(calculations[calculations.winner].annualSavings)}/yr</div>
        <div style={s.bannerDiff}>
          <span style={s.diffLabel}>vs 2nd place: </span>
          <span style={s.diffAmt}>+{fmt((calculations[calculations.winner].monthlySavings - calculations[calculations.ranking[1]].monthlySavings) * 12)}/yr</span>
        </div>
      </div>

      <div style={s.panel}>
        <h2 style={s.sectionTitle}>💰 Income</h2>
        <div style={s.inputGroup}>
          <label style={s.label}>Annual Salary</label>
          <div style={s.inputWrap}>
            <span style={s.inputPre}>$</span>
            <input style={s.input} type="number" inputMode="numeric" value={income.annualSalary} onChange={e => updateIncome('annualSalary', e.target.value)} />
          </div>
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Annual Bonus</label>
          <div style={s.inputWrap}>
            <span style={s.inputPre}>$</span>
            <input style={s.input} type="number" inputMode="numeric" value={income.annualBonus} onChange={e => updateIncome('annualBonus', e.target.value)} />
          </div>
        </div>
        <div style={s.inputRow}>
          <div style={s.inputGroup}>
            <label style={s.label}>401(k) %</label>
            <div style={s.inputWrap}>
              <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="decimal" value={income.contribution401k} onChange={e => updateIncome('contribution401k', e.target.value)} />
              <span style={s.inputSuf}>%</span>
            </div>
          </div>
          <div style={s.inputGroup}>
            <label style={s.label}>HSA (Annual)</label>
            <div style={s.inputWrap}>
              <span style={s.inputPre}>$</span>
              <input style={s.input} type="number" inputMode="numeric" value={income.hsaAnnual} onChange={e => updateIncome('hsaAnnual', e.target.value)} />
            </div>
          </div>
        </div>
        
        <div style={s.computed}>
          <div style={s.computedRow}><span>Gross Annual</span><span>{fmt(calculations.grossAnnual)}</span></div>
          <div style={s.computedRow}><span>− Pre-tax Deductions</span><span>{fmt(calculations.annual401k + income.hsaAnnual)}</span></div>
          <div style={s.computedTotal}><span>Federal Taxable</span><span>{fmt(calculations.taxableAnnual)}</span></div>
          {income.hsaAnnual > 0 && (
            <div style={s.warning}>
              ⚠️ PA & Philly don't allow HSA deductions. Their taxable income is {fmt(calculations.philly.stateTaxableAnnual)}.
            </div>
          )}
        </div>

        <h3 style={s.subTitle}>
          <button style={{ ...s.toggleBtn, background: taxOverride.useManualRates ? '#94A3B8' : '#10B981' }} onClick={() => updateTax('useManualRates', !taxOverride.useManualRates)}>
            {taxOverride.useManualRates ? 'MANUAL' : 'AUTO'}
          </button>
          Tax Rates (2026)
        </h3>
        {!taxOverride.useManualRates && (
          <>
            <div style={s.rateCard}>
              <div style={s.rateHeader}>
                <span style={s.rateLabel}>🏛️ Federal</span>
                <span style={s.rateVal}>{fmtPct(calculations.computedRates.federal)}</span>
              </div>
              <div style={s.rateBar}><div style={{ ...s.rateFill, width: `${Math.min(100, calculations.computedRates.federal * 3)}%`, background: '#6366F1' }} /></div>
            </div>
            {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
              <div key={loc} style={s.rateCard}>
                <div style={s.rateHeader}>
                  <span style={s.rateLabel}>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                  <span style={s.rateVal}>{fmtPct(calculations[loc].combinedStatLocalRate)}</span>
                </div>
                <div style={s.rateDetails}>
                  State: {fmtPct(calculations[loc].stateEffectiveRate)}
                  {calculations[loc].localEffectiveRate > 0 && ` + Local: ${fmtPct(calculations[loc].localEffectiveRate)}`}
                </div>
                <div style={s.rateBar}><div style={{ ...s.rateFill, width: `${Math.min(100, calculations[loc].combinedStatLocalRate * 5)}%`, background: locConfig[loc].grad }} /></div>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={s.panel}>
        <h2 style={s.sectionTitle}>📊 Location Comparison</h2>
        <div style={s.cards}>
          {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
            const c = calculations[loc], cfg = locConfig[loc], win = calculations.winner === loc;
            return (
              <div key={loc} style={{ ...s.card, borderColor: win ? cfg.color : '#E2E8F0' }}>
                {win && <div style={{ ...s.badge, background: cfg.grad }}>✓ BEST</div>}
                <div style={s.cardHead}>
                  <span style={s.cardEmoji}>{cfg.emoji}</span>
                  <h3 style={s.cardTitle}>{cfg.fullName}</h3>
                </div>
                
                <div style={s.metricRow}><span style={s.metricLabel}>Net Monthly Income</span><span style={s.metricVal}>{fmt(c.netMonthly)}</span></div>
                <div style={s.metricRow}><span style={s.metricLabel}>Total Expenses</span><span style={s.metricVal}>{fmt(c.totalExpenses)}</span></div>
                
                <div style={{ ...s.savingsBox, background: cfg.grad }}>
                  <div style={s.savingsLabel}>Monthly Savings</div>
                  <div style={s.savingsVal}>{fmt(c.monthlySavings)}</div>
                  <div style={s.savingsSub}>{fmt(c.annualSavings)}/yr</div>
                </div>
                
                <div style={s.breakdown}>
                  <div style={s.breakdownTitle}>Monthly Taxes</div>
                  <div style={s.breakdownRow}><span>Federal ({fmtPct(c.federalEffectiveRate)})</span><span>{fmt(c.federalTax)}</span></div>
                  <div style={s.breakdownRow}><span>State ({fmtPct(c.stateEffectiveRate)})</span><span>{fmt(c.stateTax)}</span></div>
                  <div style={s.breakdownRow}><span>Local ({fmtPct(c.localEffectiveRate)})</span><span>{fmt(c.localTax)}</span></div>
                  <div style={s.breakdownTotal}><span>Total</span><span>{fmt(c.totalTax)}</span></div>
                  {loc === 'philly' && income.hsaAnnual > 0 && (
                    <div style={s.hsaNote}>* HSA not deductible for PA/Philly taxes</div>
                  )}
                </div>
                
                <div style={s.expSection}>
                  <div style={s.breakdownTitle}>Monthly Expenses{loc === 'njnyc' && <span style={{ fontWeight: 400, textTransform: 'none', color: '#94A3B8', marginLeft: 6 }}>(mirrors NJ)</span>}</div>
                  {['rent', 'utilities', 'transportation', 'food', 'entertainment', 'healthcare', 'misc'].map(k => (
                    <div key={k} style={s.expRow}>
                      <span style={s.expLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                      {loc === 'njnyc' ? (
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{fmt(expenses.nj[k])}</span>
                      ) : (
                        <div style={s.expInputWrap}>
                          <span style={s.expInputPre}>$</span>
                          <input style={s.expInput} type="number" inputMode="numeric" value={expenses[loc][k]} onChange={e => updateExp(loc, k, e.target.value)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={s.savingsBar}>
                  <div style={s.savingsBarLabel}>Savings Rate: {fmtPct(Math.max(0, c.savingsRate))}</div>
                  <div style={s.savingsTrack}><div style={{ ...s.savingsFill, width: `${Math.max(0, Math.min(100, c.savingsRate))}%`, background: cfg.grad }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  // ===========================================
  // PROJECTIONS TAB
  // ===========================================
  // ===========================================
  // COMPARE VIEW
  // ===========================================
  const CompareView = () => {
    if (!scenarioA || !scenarioB || !calcA || !calcB || !projA || !projB) return null;
    const locs = ['nyc', 'nj', 'philly', 'njnyc'];
    const yrsA = scenarioA.proj.projectionYears;
    const yrsB = scenarioB.proj.projectionYears;

    const deltaStyle = (val) => Math.abs(val) < 1 ? s.compareDeltaZero : (val > 0 ? s.compareDeltaPos : s.compareDeltaNeg);
    const sign = (v) => v > 0 ? '+' : '';

    const summary = (snap, label, tint) => (
      <div style={{ background: tint, borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 8px', fontSize: 11 }}>
          <span style={{ color: '#64748B' }}>Salary</span><span style={{ fontWeight: 600 }}>{fmt(snap.income.annualSalary)}</span>
          <span style={{ color: '#64748B' }}>Horizon</span><span style={{ fontWeight: 600 }}>{snap.proj.projectionYears} yrs</span>
          <span style={{ color: '#64748B' }}>Return</span><span style={{ fontWeight: 600 }}>{snap.proj.investmentReturnRate}%</span>
          <span style={{ color: '#64748B' }}>LT gains/yr</span><span style={{ fontWeight: 600 }}>{fmt(snap.proj.longTermGainsAnnual)}</span>
          <span style={{ color: '#64748B' }}>Phases</span>
          <span style={{ fontWeight: 600 }}>
            {snap.proj.useLifePhases
              ? `${snap.proj.phase1Years}yr → ${locConfig[snap.proj.phase2Jurisdiction].name}`
              : 'off'}
          </span>
        </div>
      </div>
    );

    return (
      <div>
        <div style={{ ...s.banner, background: 'linear-gradient(135deg, #6366F1, #F59E0B)' }}>
          <span style={s.bannerEmoji}>🔬</span>
          <div style={s.bannerLabel}>Scenario Comparison</div>
          <div style={s.bannerName}>A ↔ B</div>
          <div style={s.bannerSub}>Salary Δ: {fmt(scenarioB.income.annualSalary - scenarioA.income.annualSalary)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {summary(scenarioA, 'Scenario A', '#EEF2FF')}
          {summary(scenarioB, 'Scenario B', '#FEF3C7')}
        </div>

        <div style={s.panel}>
          <h2 style={s.sectionTitle}>💰 Monthly Savings</h2>
          <table style={s.compareTable}>
            <thead>
              <tr>
                <th style={s.compareThCell}>Jurisdiction</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>A</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>B</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => {
                const a = calcA[loc].monthlySavings, b = calcB[loc].monthlySavings, d = b - a;
                return (
                  <tr key={loc}>
                    <td style={{ ...s.compareTdCell, fontWeight: 600, color: locConfig[loc].color }}>{locConfig[loc].emoji} {locConfig[loc].name}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmt(a)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmt(b)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right', ...deltaStyle(d) }}>{Math.abs(d) < 1 ? '—' : `${sign(d)}${fmt(d)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ ...s.panel, marginTop: 14 }}>
          <h2 style={s.sectionTitle}>📈 Final Net Worth</h2>
          <table style={s.compareTable}>
            <thead>
              <tr>
                <th style={s.compareThCell}>Jurisdiction</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>A Yr{yrsA}</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>B Yr{yrsB}</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => {
                const a = projA[loc].final, b = projB[loc].final, d = b - a;
                return (
                  <tr key={loc}>
                    <td style={{ ...s.compareTdCell, fontWeight: 600, color: locConfig[loc].color }}>{locConfig[loc].emoji} {locConfig[loc].name}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmtKPrecise(a)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmtKPrecise(b)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right', ...deltaStyle(d) }}>{Math.abs(d) < 1 ? '—' : `${sign(d)}${fmtKPrecise(d)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: 10, background: '#F0F9FF', borderRadius: 8, fontSize: 11, color: '#0369A1', lineHeight: 1.4 }}>
            <strong>A:</strong> {locConfig[projA.winner].fullName} wins @ {fmtKPrecise(projA[projA.winner].final)}<br />
            <strong>B:</strong> {locConfig[projB.winner].fullName} wins @ {fmtKPrecise(projB[projB.winner].final)}
          </div>
        </div>
      </div>
    );
  };

  const ProjectionsTab = () => {
    const maxNW = Math.max(...['nyc', 'nj', 'philly', 'njnyc'].map(l => projections[l].final));
    return (
      <>
        <div style={{ ...s.banner, background: locConfig[projections.winner].grad }}>
          <span style={s.bannerEmoji}>{locConfig[projections.winner].emoji}</span>
          <div style={s.bannerLabel}>Highest Net Worth in {proj.projectionYears} Years</div>
          <div style={s.bannerName}>{locConfig[projections.winner].fullName}</div>
          <div style={s.bannerSub}>{fmtK(projections[projections.winner].final)} projected</div>
          <div style={s.bannerDiff}>
            <span style={s.diffLabel}>vs 2nd place: </span>
            <span style={s.diffAmt}>+{fmtK(projections[projections.winner].final - projections[projections.ranking[1]].final)}</span>
          </div>
        </div>

        <div style={s.panel}>
          <h2 style={s.sectionTitle}>⚙️ Assumptions</h2>
          
          <div style={s.category}>
            <div style={s.catTitle}>Starting Point</div>
            <div style={s.inputGroup}>
              <label style={s.label}>Current Net Worth</label>
              <div style={s.inputWrap}>
                <span style={s.inputPre}>$</span>
                <input style={s.input} type="number" inputMode="numeric" value={proj.currentNetWorth} onChange={e => updateProj('currentNetWorth', e.target.value)} />
              </div>
            </div>
            <div style={s.inputGroup}>
              <label style={s.label}>Projection Years</label>
              <div style={s.inputWrap}>
                <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="numeric" value={proj.projectionYears} onChange={e => updateProj('projectionYears', e.target.value)} min="1" max="40" />
                <span style={s.inputSuf}>yrs</span>
              </div>
            </div>
          </div>
          
          <div style={s.category}>
            <div style={s.catTitle}>Growth Rates</div>
            <div style={s.inputGroup}>
              <label style={s.label}>Investment Return</label>
              <div style={s.inputWrap}>
                <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="decimal" value={proj.investmentReturnRate} onChange={e => updateProj('investmentReturnRate', e.target.value)} step="0.5" />
                <span style={s.inputSuf}>%</span>
              </div>
              <div style={s.hint}>7% = historical market average</div>
            </div>
            <div style={s.inputRow}>
              <div style={s.inputGroup}>
                <label style={s.label}>Salary Growth</label>
                <div style={s.inputWrap}>
                  <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="decimal" value={proj.salaryGrowthRate} onChange={e => updateProj('salaryGrowthRate', e.target.value)} step="0.5" />
                  <span style={s.inputSuf}>%</span>
                </div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Inflation</label>
                <div style={s.inputWrap}>
                  <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="decimal" value={proj.inflationRate} onChange={e => updateProj('inflationRate', e.target.value)} step="0.5" />
                  <span style={s.inputSuf}>%</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
              <div style={s.checkRow}>
                <input type="checkbox" style={s.checkbox} checked={proj.useLifePhases} onChange={e => updateProj('useLifePhases', e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Life-phase projection</span>
              </div>
              <div style={{ ...s.hint, marginBottom: 8 }}>
                First N years use each jurisdiction, then switch to one.
              </div>
              {proj.useLifePhases && (
                <div style={s.inputRow}>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Phase 1 yrs</label>
                    <div style={s.inputWrap}>
                      <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="numeric" value={proj.phase1Years} onChange={e => updateProj('phase1Years', e.target.value)} min="0" max={proj.projectionYears} step="1" />
                      <span style={s.inputSuf}>yrs</span>
                    </div>
                  </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Phase 2</label>
                    <select
                      value={proj.phase2Jurisdiction}
                      onChange={e => updateProj('phase2Jurisdiction', e.target.value)}
                      style={{ ...s.input, paddingLeft: 12, paddingRight: 12, cursor: 'pointer' }}
                    >
                      <option value="nyc">🗽 NYC</option>
                      <option value="nj">🏡 NJ</option>
                      <option value="philly">🔔 Philly</option>
                      <option value="njnyc">🚆 NJ→NYC</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={s.category}>
            <div style={s.catTitle}>Savings Allocation</div>
            <div style={s.inputGroup}>
              <label style={s.label}>% Invested vs Cash</label>
              <div style={s.inputWrap}>
                <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="numeric" value={proj.savingsAllocation} onChange={e => updateProj('savingsAllocation', e.target.value)} min="0" max="100" />
                <span style={s.inputSuf}>%</span>
              </div>
              <div style={s.hint}>{proj.savingsAllocation}% invested, {100 - proj.savingsAllocation}% cash</div>
            </div>
          </div>
          
          <div style={s.category}>
            <div style={s.catTitle}>Capital Gains (Realized Annually)</div>
            <div style={s.inputRow}>
              <div style={s.inputGroup}>
                <label style={s.label}>Short-term ($/yr)</label>
                <div style={s.inputWrap}>
                  <span style={s.inputPre}>$</span>
                  <input style={s.input} type="number" inputMode="numeric" value={proj.shortTermGainsAnnual} onChange={e => updateProj('shortTermGainsAnnual', e.target.value)} step="500" />
                </div>
                <div style={s.hint}>Held ≤ 1 yr</div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Long-term ($/yr)</label>
                <div style={s.inputWrap}>
                  <span style={s.inputPre}>$</span>
                  <input style={s.input} type="number" inputMode="numeric" value={proj.longTermGainsAnnual} onChange={e => updateProj('longTermGainsAnnual', e.target.value)} step="500" />
                </div>
                <div style={s.hint}>Held &gt; 1 yr</div>
              </div>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>2026 Rates Applied (Auto)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '4px 10px', fontSize: 11, color: '#475569' }}>
                <span></span>
                <span style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right' }}>Short</span>
                <span style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right' }}>Long</span>
                {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                  <React.Fragment key={loc}>
                    <span>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600 }}>{fmtPct(calculations[loc].shortTermCapGainsRate)}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600, color: locConfig[loc].color }}>{fmtPct(calculations[loc].longTermCapGainsRate)}</span>
                  </React.Fragment>
                ))}
              </div>
              <div style={{ ...s.hint, marginTop: 8 }}>Fed marginal + state/local + NIIT. Philly wage tax does not apply to investments.</div>
            </div>
          </div>

          <div style={s.category}>
            <div style={s.catTitle}>Sensitivity (What-If)</div>
            <div style={s.inputGroup}>
              <label style={s.label}>Rent Delta: {sensitivity.rentDelta >= 0 ? '+' : ''}{fmt(sensitivity.rentDelta)}/mo</label>
              <input type="range" min="-500" max="500" step="25" value={sensitivity.rentDelta} onChange={e => updateSensitivity('rentDelta', e.target.value)} style={{ width: '100%', accentColor: '#667EEA' }} />
            </div>
            <div style={s.inputGroup}>
              <label style={s.label}>Salary Delta: {sensitivity.salaryDeltaPct >= 0 ? '+' : ''}{sensitivity.salaryDeltaPct}%</label>
              <input type="range" min="-20" max="20" step="1" value={sensitivity.salaryDeltaPct} onChange={e => updateSensitivity('salaryDeltaPct', e.target.value)} style={{ width: '100%', accentColor: '#667EEA' }} />
            </div>
            {(sensitivity.rentDelta !== 0 || sensitivity.salaryDeltaPct !== 0) && (
              <button onClick={() => setSensitivity({ rentDelta: 0, salaryDeltaPct: 0 })} style={{ ...s.toggleBtn, background: '#94A3B8', padding: '6px 12px' }}>RESET</button>
            )}
          </div>

          <div style={s.category}>
            <div style={s.catTitle}>401(k) Employer Match</div>
            <div style={s.checkRow}>
              <input type="checkbox" style={s.checkbox} checked={proj.includeEmployerMatch} onChange={e => updateProj('includeEmployerMatch', e.target.checked)} />
              <span style={{ fontSize: 14 }}>Include employer match</span>
            </div>
            {proj.includeEmployerMatch && (
              <div style={s.inputRow}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Match %</label>
                  <div style={s.inputWrap}>
                    <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="numeric" value={proj.employerMatchPercent} onChange={e => updateProj('employerMatchPercent', e.target.value)} />
                    <span style={s.inputSuf}>%</span>
                  </div>
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Up to</label>
                  <div style={s.inputWrap}>
                    <input style={{ ...s.input, paddingLeft: 12 }} type="number" inputMode="numeric" value={proj.employerMatchLimit} onChange={e => updateProj('employerMatchLimit', e.target.value)} />
                    <span style={s.inputSuf}>%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={s.panel}>
          <h2 style={s.sectionTitle}>📈 Net Worth Projections</h2>
          
          <div style={s.chart}>
            <div
              style={{ position: 'relative', height: 220, touchAction: 'none' }}
              onPointerLeave={() => setHoverYear(null)}
              onPointerMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const plotLeft = 48, plotRight = rect.width - 12;
                const px = e.clientX - rect.left;
                if (px < plotLeft - 4 || px > plotRight + 4) { setHoverYear(null); return; }
                const ratio = Math.max(0, Math.min(1, (px - plotLeft) / (plotRight - plotLeft)));
                setHoverYear(Math.round(ratio * proj.projectionYears));
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 4, bottom: 22, width: 44, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8', textAlign: 'right', paddingRight: 4 }}>
                {[1, 0.75, 0.5, 0.25, 0].map(r => <div key={r}>{fmtK(maxNW * r)}</div>)}
              </div>
              <div style={{ position: 'absolute', left: 48, right: 12, top: 4, bottom: 22 }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 100 50" preserveAspectRatio="none">
                  {[0, 12.5, 25, 37.5, 50].map(y => (
                    <line key={'g'+y} x1="0" x2="100" y1={y} y2={y} stroke="#E2E8F0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  ))}
                  {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
                    const pts = projections[loc].data.map((d, i) => `${i / proj.projectionYears * 100},${50 - d.netWorth / maxNW * 46}`).join(' ');
                    return <polygon key={loc+'-fill'} points={`0,50 ${pts} 100,50`} fill={locConfig[loc].color} opacity="0.08" />;
                  })}
                  {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
                    const pts = projections[loc].data.map((d, i) => `${i / proj.projectionYears * 100},${50 - d.netWorth / maxNW * 46}`).join(' ');
                    return <polyline key={loc} points={pts} fill="none" stroke={locConfig[loc].color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />;
                  })}
                  {hoverYear !== null && projections.nyc.data[hoverYear] && (
                    <g>
                      <line
                        x1={hoverYear / proj.projectionYears * 100}
                        x2={hoverYear / proj.projectionYears * 100}
                        y1="0" y2="50"
                        stroke="#64748B" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke"
                      />
                      {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                        <circle
                          key={loc+'-dot'}
                          cx={hoverYear / proj.projectionYears * 100}
                          cy={50 - projections[loc].data[hoverYear].netWorth / maxNW * 46}
                          r="5" fill={locConfig[loc].color} stroke="#FFF" strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </g>
                  )}
                </svg>
              </div>
              <div style={{ position: 'absolute', left: 48, right: 12, bottom: 0, height: 18, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94A3B8' }}>
                {[0, 0.25, 0.5, 0.75, 1].map(r => <div key={r}>Yr {Math.round(proj.projectionYears * r)}</div>)}
              </div>
              {hoverYear !== null && projections.nyc.data[hoverYear] && (
                <div style={{
                  position: 'absolute',
                  [hoverYear / proj.projectionYears > 0.55 ? 'left' : 'right']: 12,
                  top: 8,
                  background: '#1A202C',
                  color: '#FFF',
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 10,
                  pointerEvents: 'none',
                  minWidth: 140,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  zIndex: 10
                }}>
                  <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    {hoverYear === 0 ? 'Today' : `Year ${hoverYear}`}
                  </div>
                  {[...projections.ranking].map(loc => (
                    <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '2px 0' }}>
                      <span>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                      <span style={{ color: locConfig[loc].color, fontWeight: 700 }}>{fmtK(projections[loc].data[hoverYear].netWorth)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={s.legend}>
              {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                <div key={loc} style={s.legendItem}>
                  <div style={{ ...s.legendDot, background: locConfig[loc].color }} />
                  {locConfig[loc].name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.chart, padding: '14px 16px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 4 }}>💸 What You'd Leave on the Table</div>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
              Over {proj.projectionYears} yrs, <strong style={{ color: locConfig[projections.winner].color }}>{locConfig[projections.winner].name}</strong> beats <strong>{locConfig[projections.ranking[1]].name}</strong> by <strong>{fmtK(projections[projections.winner].final - projections[projections.ranking[1]].final)}</strong>.
              {projections.flip && ` Lead changes Yr ${projections.flip.year} (${locConfig[projections.flip.from].name} → ${locConfig[projections.flip.to].name}).`}
            </div>
            <svg style={{ width: '100%', height: 70 }} viewBox="0 0 100 50" preserveAspectRatio="none">
              <line x1="0" x2="100" y1="2" y2="2" stroke="#94A3B8" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
              {(() => {
                const minGap = Math.min(0, ...['nyc', 'nj', 'philly', 'njnyc'].flatMap(l => projections.deltas[l].map(d => d.gap)));
                const range = Math.abs(minGap) || 1;
                return ['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
                  const pts = projections.deltas[loc].map((d, i) => `${i / proj.projectionYears * 100},${2 + (-d.gap / range) * 46}`).join(' ');
                  return <polyline key={loc} points={pts} fill="none" stroke={locConfig[loc].color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />;
                });
              })()}
            </svg>
          </div>

          {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
            const p = projections[loc], cfg = locConfig[loc], win = projections.winner === loc;
            return (
              <div key={loc} style={{ ...s.projCard, borderColor: win ? cfg.color : '#E2E8F0' }}>
                {win && <div style={{ ...s.badge, background: cfg.grad }}>✓ BEST</div>}
                <div style={s.cardHead}>
                  <span style={s.cardEmoji}>{cfg.emoji}</span>
                  <h3 style={s.cardTitle}>{cfg.fullName}</h3>
                </div>
                <div style={{ ...s.bigNum, background: cfg.grad }}>
                  <div style={s.bigNumLabel}>Net Worth in {proj.projectionYears} Yrs</div>
                  <div style={s.bigNumVal}>{fmtK(p.final)}</div>
                </div>
                <div style={s.breakdown}>
                  <div style={s.projRow}><span>Starting</span><span>{fmt(proj.currentNetWorth)}</span></div>
                  <div style={s.projRow}><span>Total Contributions</span><span style={{ color: '#059669' }}>+{fmtK(p.totalContrib)}</span></div>
                  <div style={s.projRow}><span>Investment Gains</span><span style={{ color: '#059669' }}>+{fmtK(p.totalGains)}</span></div>
                  {p.totalCapGainsTax > 0 && (
                    <div style={s.projRow}><span>Cap Gains Tax</span><span style={{ color: '#DC2626' }}>−{fmtK(p.totalCapGainsTax)}</span></div>
                  )}
                  <div style={s.projTotal}><span>Final</span><span>{fmtK(p.final)}</span></div>
                </div>
              </div>
            );
          })}

          <div style={s.table}>
            <div style={s.tableHead}>
              <div style={s.tableCell}>Year</div>
              {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                <div key={loc} style={{ ...s.tableCell, color: locConfig[loc].color }}>{locConfig[loc].name}</div>
              ))}
            </div>
            {[0, Math.ceil(proj.projectionYears / 2), proj.projectionYears].filter((v, i, a) => a.indexOf(v) === i).map(y => (
              <div key={y} style={{ ...s.tableRow, background: y === proj.projectionYears ? '#F0FDF4' : 'transparent' }}>
                <div style={s.tableCell}>{y === 0 ? 'Now' : `Yr ${y}`}</div>
                {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                  <div key={loc} style={s.tableCell}>{fmtK(projections[loc].data[y]?.netWorth || 0)}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // ===========================================
  // MAIN RENDER
  // ===========================================
  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>
          <span style={s.titleAccent}>Where Should You Live?</span>
        </h1>
        <p style={s.subtitle}>NYC vs NJ vs Philadelphia</p>
        <span style={s.taxYear}>📅 2026 Tax Year</span>
      </header>

      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(activeTab === 'comparison' ? s.tabActive : {}) }} onClick={() => setActiveTab('comparison')}>
          💰 Compare
        </button>
        <button style={{ ...s.tab, ...(activeTab === 'projections' ? s.tabActive : {}) }} onClick={() => setActiveTab('projections')}>
          📈 Project
        </button>
      </div>

      <div style={s.scenarioBar}>
        <span style={s.scenarioBarTitle}>📸 Scenarios</span>
        {['A', 'B'].map(slot => {
          const snap = slot === 'A' ? scenarioA : scenarioB;
          const setSnap = slot === 'A' ? setScenarioA : setScenarioB;
          const bg = slot === 'A' ? '#6366F1' : '#F59E0B';
          return (
            <div key={slot} style={s.scenarioSlot}>
              <span style={{ ...s.scenarioSlotLabel, background: bg, color: '#FFF' }}>{slot}</span>
              {snap ? (
                <>
                  <span style={s.scenarioSummary}>{fmt(snap.income.annualSalary)} · {snap.proj.projectionYears}yr</span>
                  <button onClick={() => loadScenario(snap)} style={s.scenarioBtn}>Load</button>
                  <button onClick={() => { setSnap(null); if (compareMode) setCompareMode(false); }} style={{ ...s.scenarioBtn, background: '#FFF', color: '#94A3B8' }}>✕</button>
                </>
              ) : (
                <button onClick={() => setSnap(snapshotCurrent())} style={s.scenarioPrimary}>Save</button>
              )}
            </div>
          );
        })}
        {scenarioA && scenarioB && (
          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              ...s.compareBtn,
              background: compareMode ? '#667EEA' : '#FFF',
              color: compareMode ? '#FFF' : '#667EEA',
            }}
          >
            {compareMode ? '✓ Comparing A ↔ B' : '🔬 Compare A ↔ B'}
          </button>
        )}
      </div>

      {compareMode && scenarioA && scenarioB ? CompareView() : (activeTab === 'comparison' ? ComparisonTab() : ProjectionsTab())}

      <footer style={s.footer}>
        <p style={s.footerText}>💡 Changes auto-update projections!</p>
        <p style={s.disclaimer}>2026 tax rates. Projections are estimates only.</p>
      </footer>
    </div>
  );
}
