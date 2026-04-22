import React, { useState, useMemo } from 'react';

export default function FinancialComparisonToolDesktop() {
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
  // STATE WITH YOUR CURRENT DEFAULTS
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
      ? Math.min(
          income.annualSalary * proj.employerMatchLimit / 100,
          income.annualSalary * income.contribution401k / 100 * proj.employerMatchPercent / 100
        )
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
        localTaxableAnnual: taxableForLocal,
      };
    });
    
    const sorted = [...locs].sort((a, b) => results[b].monthlySavings - results[a].monthlySavings);
    results.winner = sorted[0]; 
    results.ranking = sorted; 
    results.computedRates = computedRates; 
    results.taxableAnnual = federalTaxableAnnual; 
    results.grossAnnual = grossAnnual;
    results.federalPreTax = federalPreTax;
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

        const match = proj.includeEmployerMatch
          ? Math.min(salary * proj.employerMatchLimit / 100, k401 * proj.employerMatchPercent / 100)
          : 0;

        const gains = invested * proj.investmentReturnRate / 100;

        const capGainsTax = proj.longTermGainsAnnual * calculations[effLoc].longTermCapGainsRate / 100
                          + proj.shortTermGainsAnnual * calculations[effLoc].shortTermCapGainsRate / 100;

        const toInvest = savings > 0 ? savings * proj.savingsAllocation / 100 : savings;

        invested += gains + toInvest + k401 + match - capGainsTax;
        cash += savings > 0 ? savings * (1 - proj.savingsAllocation / 100) : 0;

        if (cash < 0) { invested += cash; cash = 0; }
        nw = invested + cash;

        data.push({ year: y, netWorth: nw, invested, cash, savings, contributions: toInvest + k401 + match, gains, capGainsTax, salary, expenses: expAnnual });
      }

      results[loc] = {
        data,
        final: data[proj.projectionYears].netWorth,
        totalGains: data.reduce((s, d) => s + d.gains, 0),
        totalContrib: data.reduce((s, d) => s + d.contributions, 0),
        totalCapGainsTax: data.reduce((s, d) => s + d.capGainsTax, 0)
      };
    });

    const sorted = [...locs].sort((a, b) => results[b].final - results[a].final);
    results.winner = sorted[0];
    results.ranking = sorted;

    const winnerData = results[sorted[0]].data;
    results.deltas = {};
    locs.forEach(loc => {
      results.deltas[loc] = results[loc].data.map((d, i) => ({
        year: i,
        gap: d.netWorth - winnerData[i].netWorth
      }));
    });

    let flipYear = null, flipFrom = null, flipTo = null;
    for (let y = 1; y <= proj.projectionYears; y++) {
      const rankAtY = [...locs].sort((a, b) => results[b].data[y].netWorth - results[a].data[y].netWorth);
      if (rankAtY[0] !== sorted[0]) {
        flipYear = y;
        flipFrom = sorted[0];
        flipTo = rankAtY[0];
        break;
      }
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
    nyc: { name: 'New York City', emoji: '🗽', color: '#FF6B35', grad: 'linear-gradient(135deg, #FF6B35, #F7931E)' },
    nj: { name: 'New Jersey', emoji: '🏡', color: '#4ECDC4', grad: 'linear-gradient(135deg, #4ECDC4, #44A08D)' },
    philly: { name: 'Philadelphia', emoji: '🔔', color: '#667EEA', grad: 'linear-gradient(135deg, #667EEA, #764BA2)' },
    njnyc: { name: 'NJ → NYC', emoji: '🚆', color: '#EC4899', grad: 'linear-gradient(135deg, #EC4899, #DB2777)' },
  };

  // ===========================================
  // DESKTOP STYLES
  // ===========================================
  const s = {
    container: { fontFamily: "'IBM Plex Sans', system-ui, sans-serif", minHeight: '100vh', background: '#FAFBFC', padding: 32 },
    header: { textAlign: 'center', marginBottom: 24 },
    title: { fontSize: 38, fontWeight: 300, color: '#1A202C', margin: '0 0 8px' },
    titleAccent: { fontWeight: 700, background: 'linear-gradient(135deg, #667EEA, #764BA2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    subtitle: { fontSize: 16, color: '#64748B', margin: 0 },
    taxYear: { display: 'inline-block', background: '#10B981', color: '#FFF', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginTop: 8 },
    tabs: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 },
    tab: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, border: '2px solid #E2E8F0', borderRadius: 10, background: '#FFF', color: '#64748B', cursor: 'pointer' },
    tabActive: { borderColor: '#667EEA', background: 'linear-gradient(135deg, #667EEA, #764BA2)', color: '#FFF' },
    banner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderRadius: 14, marginBottom: 28, boxShadow: '0 6px 24px rgba(0,0,0,0.1)' },
    bannerContent: { display: 'flex', alignItems: 'center', gap: 16 },
    bannerEmoji: { fontSize: 44 },
    bannerLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
    bannerName: { fontSize: 24, fontWeight: 700, color: '#FFF', marginBottom: 2 },
    bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    bannerDiff: { textAlign: 'right' },
    diffLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
    diffAmt: { fontSize: 22, fontWeight: 700, color: '#FFF' },
    grid: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: 28, marginBottom: 28 },
    panel: { background: '#FFF', borderRadius: 14, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' },
    sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1A202C', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 },
    inputGroup: { marginBottom: 16 },
    inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 },
    inputWrap: { position: 'relative' },
    inputPre: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 },
    inputSuf: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 13 },
    input: { width: '100%', padding: '10px 10px 10px 24px', fontSize: 14, fontWeight: 500, border: '2px solid #E2E8F0', borderRadius: 8, outline: 'none', background: '#FAFBFC', boxSizing: 'border-box' },
    hint: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
    computed: { background: '#F0F9FF', borderRadius: 8, padding: 14, marginBottom: 20, border: '1px solid #BAE6FD' },
    computedRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#0369A1', padding: '3px 0' },
    computedTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0369A1', paddingTop: 6, borderTop: '1px dashed #7DD3FC', marginTop: 4 },
    warning: { background: '#FEF3C7', borderRadius: 6, padding: '8px 12px', marginTop: 10, fontSize: 11, color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 6 },
    subTitle: { fontSize: 13, fontWeight: 600, color: '#64748B', margin: '0 0 12px', paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 },
    toggleBtn: { padding: '5px 10px', borderRadius: 5, border: 'none', color: '#FFF', fontSize: 10, fontWeight: 700, cursor: 'pointer' },
    rateCard: { background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', marginBottom: 10 },
    rateHeader: { display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 },
    rateVal: { fontSize: 15, fontWeight: 700, color: '#1A202C' },
    rateDetails: { fontSize: 10, color: '#64748B', marginBottom: 6 },
    rateBar: { height: 5, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
    rateFill: { height: '100%', borderRadius: 3 },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 },
    card: { background: '#FFF', borderRadius: 12, padding: 18, border: '2px solid #E2E8F0', position: 'relative' },
    badge: { position: 'absolute', top: -10, right: 14, padding: '3px 10px', borderRadius: 16, fontSize: 10, fontWeight: 700, color: '#FFF' },
    cardHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
    cardEmoji: { fontSize: 24 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: '#1A202C', margin: 0 },
    metric: { background: '#F8FAFC', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    metricLabel: { fontSize: 11, color: '#64748B' },
    metricVal: { fontSize: 15, fontWeight: 700, color: '#1A202C' },
    savingsBox: { borderRadius: 10, padding: 14, textAlign: 'center', marginBottom: 14 },
    savingsLabel: { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginBottom: 2 },
    savingsVal: { fontSize: 22, fontWeight: 700, color: '#FFF' },
    savingsSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
    breakdown: { background: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 14 },
    breakdownTitle: { fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
    breakdownRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', padding: '3px 0' },
    breakdownTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#1A202C', paddingTop: 6, borderTop: '1px solid #E2E8F0', marginTop: 4 },
    hsaNote: { fontSize: 9, color: '#DC2626', marginTop: 6, fontStyle: 'italic' },
    expRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' },
    expLabel: { fontSize: 11, color: '#64748B' },
    expInput: { width: 70, padding: '5px 6px 5px 18px', fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 5, textAlign: 'right' },
    savingsBar: { marginTop: 8 },
    savingsBarLabel: { fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 4 },
    savingsTrack: { height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
    savingsFill: { height: '100%', borderRadius: 3 },
    projCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
    bigNum: { borderRadius: 10, padding: 18, textAlign: 'center', marginBottom: 14 },
    bigNumLabel: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginBottom: 6 },
    bigNumVal: { fontSize: 28, fontWeight: 700, color: '#FFF' },
    projRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', padding: '5px 0' },
    projTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#1A202C', paddingTop: 8, borderTop: '1px solid #E2E8F0', marginTop: 6 },
    chart: { background: '#F8FAFC', borderRadius: 10, padding: 20, marginBottom: 20 },
    chartSvg: { width: '100%', height: 180 },
    legend: { display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 },
    legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
    legendDot: { width: 12, height: 4, borderRadius: 2 },
    table: { borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', marginTop: 20 },
    tableHead: { display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' },
    tableRow: { display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', borderBottom: '1px solid #F1F5F9' },
    tableCell: { padding: '10px 14px', fontSize: 12, fontWeight: 500 },
    category: { marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' },
    catTitle: { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },
    checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
    checkbox: { width: 16, height: 16, accentColor: '#667EEA' },
    footer: { textAlign: 'center', padding: 20 },
    disclaimer: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
    scenarioBar: { display: 'flex', gap: 12, alignItems: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, flexWrap: 'wrap' },
    scenarioBarTitle: { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
    scenarioSlot: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: '#F8FAFC', borderRadius: 6 },
    scenarioSlotLabel: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 },
    scenarioSummary: { fontSize: 11, color: '#64748B', maxWidth: 160 },
    scenarioBtn: { padding: '5px 10px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 5, background: '#E2E8F0', color: '#1A202C', cursor: 'pointer' },
    scenarioPrimary: { padding: '5px 12px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 5, background: '#10B981', color: '#FFF', cursor: 'pointer' },
    compareBtn: { padding: '6px 14px', fontSize: 12, fontWeight: 700, border: '2px solid #667EEA', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto' },
    compareTable: { width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 },
    compareThCell: { padding: '10px 12px', background: '#F8FAFC', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #E2E8F0' },
    compareTdCell: { padding: '10px 12px', borderBottom: '1px solid #F1F5F9' },
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
        <div style={s.bannerContent}>
          <span style={s.bannerEmoji}>{locConfig[calculations.winner].emoji}</span>
          <div>
            <div style={s.bannerLabel}>OPTIMAL CHOICE (MONTHLY SAVINGS)</div>
            <div style={s.bannerName}>{locConfig[calculations.winner].name}</div>
            <div style={s.bannerSub}>{fmt(calculations[calculations.winner].monthlySavings)}/mo · {fmt(calculations[calculations.winner].annualSavings)}/yr</div>
          </div>
        </div>
        <div style={s.bannerDiff}>
          <div style={s.diffLabel}>vs 2nd place</div>
          <div style={s.diffAmt}>+{fmt((calculations[calculations.winner].monthlySavings - calculations[calculations.ranking[1]].monthlySavings) * 12)}/yr</div>
        </div>
      </div>

      <div style={s.grid}>
        <section style={s.panel}>
          <h2 style={s.sectionTitle}>💰 Income & Deductions</h2>
          <div style={s.inputGroup}>
            <label style={s.label}>Annual Salary</label>
            <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={income.annualSalary} onChange={e => updateIncome('annualSalary', e.target.value)} /></div>
          </div>
          <div style={s.inputGroup}>
            <label style={s.label}>Annual Bonus</label>
            <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={income.annualBonus} onChange={e => updateIncome('annualBonus', e.target.value)} /></div>
          </div>
          <div style={s.inputRow}>
            <div style={s.inputGroup}>
              <label style={s.label}>401(k) %</label>
              <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={income.contribution401k} onChange={e => updateIncome('contribution401k', e.target.value)} /><span style={s.inputSuf}>%</span></div>
            </div>
            <div style={s.inputGroup}>
              <label style={s.label}>HSA (Annual)</label>
              <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={income.hsaAnnual} onChange={e => updateIncome('hsaAnnual', e.target.value)} /></div>
            </div>
          </div>
          <div style={s.inputGroup}>
            <label style={s.label}>Other Pre-tax (Annual)</label>
            <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={income.otherPreTaxAnnual} onChange={e => updateIncome('otherPreTaxAnnual', e.target.value)} /></div>
          </div>
          
          <div style={s.computed}>
            <div style={s.computedRow}><span>Gross Annual</span><span>{fmt(calculations.grossAnnual)}</span></div>
            <div style={s.computedRow}><span>− 401(k)</span><span>{fmt(calculations.annual401k)}</span></div>
            <div style={s.computedRow}><span>− HSA</span><span>{fmt(income.hsaAnnual)}</span></div>
            {income.otherPreTaxAnnual > 0 && <div style={s.computedRow}><span>− Other Pre-tax</span><span>{fmt(income.otherPreTaxAnnual)}</span></div>}
            <div style={s.computedTotal}><span>= Federal Taxable</span><span>{fmt(calculations.taxableAnnual)}</span></div>
            {income.hsaAnnual > 0 && (
              <div style={s.warning}>
                <span>⚠️</span>
                <span>PA & Philly do NOT allow HSA deductions. PA/Philly taxable = {fmt(calculations.philly.stateTaxableAnnual)} ({fmt(income.hsaAnnual)} higher)</span>
              </div>
            )}
          </div>

          <h3 style={s.subTitle}>
            <button style={{ ...s.toggleBtn, background: taxOverride.useManualRates ? '#94A3B8' : '#10B981' }} onClick={() => updateTax('useManualRates', !taxOverride.useManualRates)}>{taxOverride.useManualRates ? 'MANUAL' : 'AUTO'}</button>
            {taxOverride.useManualRates ? 'Manual Tax Rates' : 'Auto Tax Rates (2026)'}
          </h3>
          {!taxOverride.useManualRates && (
            <>
              <div style={s.rateCard}>
                <div style={s.rateHeader}><span>🏛️ Federal</span><span style={s.rateVal}>{fmtPct(calculations.computedRates.federal)}</span></div>
                <div style={s.rateBar}><div style={{ ...s.rateFill, width: `${Math.min(100, calculations.computedRates.federal * 2.5)}%`, background: '#6366F1' }} /></div>
              </div>
              {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                <div key={loc} style={s.rateCard}>
                  <div style={s.rateHeader}><span>{locConfig[loc].emoji} {locConfig[loc].name}</span><span style={s.rateVal}>{fmtPct(calculations[loc].combinedStatLocalRate)}</span></div>
                  <div style={s.rateDetails}>
                    State: {fmtPct(calculations[loc].stateEffectiveRate)}
                    {calculations[loc].localEffectiveRate > 0 && ` + Local: ${fmtPct(calculations[loc].localEffectiveRate)}`}
                    {loc === 'philly' && income.hsaAnnual > 0 && ' (HSA not deductible)'}
                  </div>
                  <div style={s.rateBar}><div style={{ ...s.rateFill, width: `${Math.min(100, calculations[loc].combinedStatLocalRate * 5)}%`, background: locConfig[loc].grad }} /></div>
                </div>
              ))}
            </>
          )}
        </section>

        <section style={s.panel}>
          <h2 style={s.sectionTitle}>📊 Side-by-Side Comparison</h2>
          <div style={s.cards}>
            {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
              const c = calculations[loc], cfg = locConfig[loc], win = calculations.winner === loc;
              return (
                <div key={loc} style={{ ...s.card, borderColor: win ? cfg.color : '#E2E8F0' }}>
                  {win && <div style={{ ...s.badge, background: cfg.grad }}>✓ BEST</div>}
                  <div style={s.cardHead}><span style={s.cardEmoji}>{cfg.emoji}</span><h3 style={s.cardTitle}>{cfg.name}</h3></div>
                  <div style={s.metric}><span style={s.metricLabel}>Net Monthly</span><span style={s.metricVal}>{fmt(c.netMonthly)}</span></div>
                  <div style={s.metric}><span style={s.metricLabel}>Expenses</span><span style={s.metricVal}>{fmt(c.totalExpenses)}</span></div>
                  <div style={{ ...s.savingsBox, background: cfg.grad }}>
                    <div style={s.savingsLabel}>Monthly Savings</div>
                    <div style={s.savingsVal}>{fmt(c.monthlySavings)}</div>
                    <div style={s.savingsSub}>{fmt(c.annualSavings)}/yr</div>
                  </div>
                  <div style={s.breakdown}>
                    <div style={s.breakdownTitle}>Tax Breakdown</div>
                    <div style={s.breakdownRow}><span>Federal ({fmtPct(c.federalEffectiveRate)})</span><span>{fmt(c.federalTax)}</span></div>
                    <div style={s.breakdownRow}><span>State ({fmtPct(c.stateEffectiveRate)})</span><span>{fmt(c.stateTax)}</span></div>
                    <div style={s.breakdownRow}><span>Local ({fmtPct(c.localEffectiveRate)})</span><span>{fmt(c.localTax)}</span></div>
                    <div style={s.breakdownTotal}><span>Total</span><span>{fmt(c.totalTax)}/mo</span></div>
                    {loc === 'philly' && income.hsaAnnual > 0 && (
                      <div style={s.hsaNote}>* HSA ({fmt(income.hsaAnnual)}) not deductible for PA/Philly</div>
                    )}
                  </div>
                  <div style={s.breakdownTitle}>Monthly Expenses{loc === 'njnyc' && <span style={{ fontWeight: 400, textTransform: 'none', color: '#94A3B8', marginLeft: 6 }}>(mirrors NJ)</span>}</div>
                  {['rent', 'utilities', 'transportation', 'food', 'entertainment', 'healthcare', 'misc'].map(k => (
                    <div key={k} style={s.expRow}>
                      <span style={s.expLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                      {loc === 'njnyc' ? (
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{fmt(expenses.nj[k])}</span>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 11 }}>$</span>
                          <input style={s.expInput} type="number" value={expenses[loc][k]} onChange={e => updateExp(loc, k, e.target.value)} />
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={s.savingsBar}>
                    <div style={s.savingsBarLabel}>Savings Rate: {fmtPct(Math.max(0, c.savingsRate))}</div>
                    <div style={s.savingsTrack}><div style={{ ...s.savingsFill, width: `${Math.max(0, Math.min(100, c.savingsRate))}%`, background: cfg.grad }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );

  // ===========================================
  // PROJECTIONS TAB
  // ===========================================
  // ===========================================
  // COMPARE VIEW (A vs B side-by-side)
  // ===========================================
  const CompareView = () => {
    if (!scenarioA || !scenarioB || !calcA || !calcB || !projA || !projB) return null;
    const locs = ['nyc', 'nj', 'philly', 'njnyc'];
    const yrsA = scenarioA.proj.projectionYears;
    const yrsB = scenarioB.proj.projectionYears;

    const renderDelta = (val, goodIsPositive = true) => {
      if (Math.abs(val) < 1) return <span style={s.compareDeltaZero}>—</span>;
      const isPositive = val > 0;
      const isGood = goodIsPositive ? isPositive : !isPositive;
      return <span style={isGood ? s.compareDeltaPos : s.compareDeltaNeg}>{isPositive ? '+' : ''}{fmt(val)}</span>;
    };
    const renderDeltaK = (val, goodIsPositive = true) => {
      if (Math.abs(val) < 1) return <span style={s.compareDeltaZero}>—</span>;
      const isPositive = val > 0;
      const isGood = goodIsPositive ? isPositive : !isPositive;
      return <span style={isGood ? s.compareDeltaPos : s.compareDeltaNeg}>{isPositive ? '+' : ''}{fmtKPrecise(val)}</span>;
    };

    const summary = (snap, label, tint) => (
      <div style={{ background: tint, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12, color: '#1A202C' }}>
          <span style={{ color: '#64748B' }}>Salary</span><span style={{ fontWeight: 600 }}>{fmt(snap.income.annualSalary)}</span>
          <span style={{ color: '#64748B' }}>Bonus</span><span style={{ fontWeight: 600 }}>{fmt(snap.income.annualBonus)}</span>
          <span style={{ color: '#64748B' }}>401(k)</span><span style={{ fontWeight: 600 }}>{snap.income.contribution401k}%</span>
          <span style={{ color: '#64748B' }}>HSA</span><span style={{ fontWeight: 600 }}>{fmt(snap.income.hsaAnnual)}</span>
          <span style={{ color: '#64748B' }}>Net Worth</span><span style={{ fontWeight: 600 }}>{fmt(snap.proj.currentNetWorth)}</span>
          <span style={{ color: '#64748B' }}>Horizon</span><span style={{ fontWeight: 600 }}>{snap.proj.projectionYears} yrs</span>
          <span style={{ color: '#64748B' }}>Return</span><span style={{ fontWeight: 600 }}>{snap.proj.investmentReturnRate}%</span>
          <span style={{ color: '#64748B' }}>LT gains/yr</span><span style={{ fontWeight: 600 }}>{fmt(snap.proj.longTermGainsAnnual)}</span>
          <span style={{ color: '#64748B' }}>Life phases</span>
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
          <div style={s.bannerContent}>
            <span style={s.bannerEmoji}>🔬</span>
            <div>
              <div style={s.bannerLabel}>SCENARIO COMPARISON</div>
              <div style={s.bannerName}>A ↔ B</div>
              <div style={s.bannerSub}>Salary delta: {fmt(scenarioB.income.annualSalary - scenarioA.income.annualSalary)} · Horizon: A {yrsA}yr / B {yrsB}yr</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {summary(scenarioA, 'Scenario A', '#EEF2FF')}
          {summary(scenarioB, 'Scenario B', '#FEF3C7')}
        </div>

        <section style={s.panel}>
          <h2 style={s.sectionTitle}>💰 Monthly Savings by Jurisdiction</h2>
          <table style={s.compareTable}>
            <thead>
              <tr>
                <th style={s.compareThCell}>Jurisdiction</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>Scenario A</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>Scenario B</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>Δ (B − A)</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => {
                const aVal = calcA[loc].monthlySavings;
                const bVal = calcB[loc].monthlySavings;
                return (
                  <tr key={loc}>
                    <td style={{ ...s.compareTdCell, fontWeight: 600 }}>
                      <span style={{ color: locConfig[loc].color }}>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                    </td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmt(aVal)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmt(bVal)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{renderDelta(bVal - aVal)}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ ...s.compareTdCell, fontWeight: 700, background: '#F8FAFC' }}>🏆 Best of scenario</td>
                <td style={{ ...s.compareTdCell, fontWeight: 700, background: '#F8FAFC', textAlign: 'right' }}>{locConfig[calcA.winner].emoji} {locConfig[calcA.winner].name}</td>
                <td style={{ ...s.compareTdCell, fontWeight: 700, background: '#F8FAFC', textAlign: 'right' }}>{locConfig[calcB.winner].emoji} {locConfig[calcB.winner].name}</td>
                <td style={{ ...s.compareTdCell, background: '#F8FAFC', textAlign: 'right', fontSize: 11, color: '#64748B' }}>
                  {calcA.winner === calcB.winner ? 'same winner' : 'winner changed'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ ...s.panel, marginTop: 20 }}>
          <h2 style={s.sectionTitle}>📈 Projected Net Worth</h2>
          <table style={s.compareTable}>
            <thead>
              <tr>
                <th style={s.compareThCell}>Jurisdiction</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>A @ Yr {yrsA}</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>B @ Yr {yrsB}</th>
                <th style={{ ...s.compareThCell, textAlign: 'right' }}>Δ (B − A)</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(loc => {
                const aVal = projA[loc].final;
                const bVal = projB[loc].final;
                return (
                  <tr key={loc}>
                    <td style={{ ...s.compareTdCell, fontWeight: 600 }}>
                      <span style={{ color: locConfig[loc].color }}>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                    </td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmtKPrecise(aVal)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{fmtKPrecise(bVal)}</td>
                    <td style={{ ...s.compareTdCell, textAlign: 'right' }}>{renderDeltaK(bVal - aVal)}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ ...s.compareTdCell, fontWeight: 700, background: '#F8FAFC' }}>🏆 Best of scenario</td>
                <td style={{ ...s.compareTdCell, fontWeight: 700, background: '#F8FAFC', textAlign: 'right' }}>{locConfig[projA.winner].emoji} {locConfig[projA.winner].name}</td>
                <td style={{ ...s.compareTdCell, fontWeight: 700, background: '#F8FAFC', textAlign: 'right' }}>{locConfig[projB.winner].emoji} {locConfig[projB.winner].name}</td>
                <td style={{ ...s.compareTdCell, background: '#F8FAFC', textAlign: 'right', fontSize: 11, color: '#64748B' }}>
                  {projA.winner === projB.winner ? 'same winner' : 'winner changed'}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 12, background: '#F0F9FF', borderRadius: 8, fontSize: 12, color: '#0369A1', lineHeight: 1.5 }}>
            <strong>Takeaway:</strong> In Scenario A ({fmt(scenarioA.income.annualSalary)} salary), <strong>{locConfig[projA.winner].name}</strong> wins with {fmtKPrecise(projA[projA.winner].final)} after {yrsA} years.
            In Scenario B ({fmt(scenarioB.income.annualSalary)} salary), <strong>{locConfig[projB.winner].name}</strong> wins with {fmtKPrecise(projB[projB.winner].final)} after {yrsB} years.
            {projA.winner === projB.winner
              ? ` The optimal jurisdiction doesn't change — but the absolute advantage shifts by ${fmtKPrecise(projB[projB.winner].final - projA[projA.winner].final)}.`
              : ` The optimal jurisdiction flips between scenarios.`}
          </div>
        </section>
      </div>
    );
  };

  const ProjectionsTab = () => {
    const maxNW = Math.max(...['nyc', 'nj', 'philly', 'njnyc'].map(l => projections[l].final));
    return (
      <>
        <div style={{ ...s.banner, background: locConfig[projections.winner].grad }}>
          <div style={s.bannerContent}>
            <span style={s.bannerEmoji}>{locConfig[projections.winner].emoji}</span>
            <div>
              <div style={s.bannerLabel}>HIGHEST NET WORTH IN {proj.projectionYears} YEARS</div>
              <div style={s.bannerName}>{locConfig[projections.winner].name}</div>
              <div style={s.bannerSub}>{fmtK(projections[projections.winner].final)} projected</div>
            </div>
          </div>
          <div style={s.bannerDiff}>
            <div style={s.diffLabel}>vs 2nd place</div>
            <div style={s.diffAmt}>+{fmtK(projections[projections.winner].final - projections[projections.ranking[1]].final)}</div>
          </div>
        </div>

        <div style={s.grid}>
          <section style={s.panel}>
            <h2 style={s.sectionTitle}>⚙️ Projection Assumptions</h2>
            <div style={s.category}>
              <div style={s.catTitle}>Starting Point</div>
              <div style={s.inputGroup}>
                <label style={s.label}>Current Net Worth</label>
                <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={proj.currentNetWorth} onChange={e => updateProj('currentNetWorth', e.target.value)} /></div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Projection Years</label>
                <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.projectionYears} onChange={e => updateProj('projectionYears', e.target.value)} min="1" max="40" /><span style={s.inputSuf}>yrs</span></div>
              </div>
            </div>
            <div style={s.category}>
              <div style={s.catTitle}>Growth Rates</div>
              <div style={s.inputGroup}>
                <label style={s.label}>Investment Return</label>
                <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.investmentReturnRate} onChange={e => updateProj('investmentReturnRate', e.target.value)} step="0.5" /><span style={s.inputSuf}>%</span></div>
                <div style={s.hint}>7% = historical market avg</div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Salary Growth</label>
                <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.salaryGrowthRate} onChange={e => updateProj('salaryGrowthRate', e.target.value)} step="0.5" /><span style={s.inputSuf}>%</span></div>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}>Inflation</label>
                <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.inflationRate} onChange={e => updateProj('inflationRate', e.target.value)} step="0.5" /><span style={s.inputSuf}>%</span></div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }}>
                <div style={s.checkRow}>
                  <input type="checkbox" style={s.checkbox} checked={proj.useLifePhases} onChange={e => updateProj('useLifePhases', e.target.checked)} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Life-phase projection</span>
                </div>
                <div style={{ ...s.hint, marginBottom: 10 }}>
                  First N years use each jurisdiction's own profile, then all projections switch to one jurisdiction.
                </div>
                {proj.useLifePhases && (
                  <div style={s.inputRow}>
                    <div style={s.inputGroup}>
                      <label style={s.label}>Phase 1 duration</label>
                      <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.phase1Years} onChange={e => updateProj('phase1Years', e.target.value)} min="0" max={proj.projectionYears} step="1" /><span style={s.inputSuf}>yrs</span></div>
                      <div style={s.hint}>Years 1–{proj.phase1Years} use each jurisdiction's tax + expenses</div>
                    </div>
                    <div style={s.inputGroup}>
                      <label style={s.label}>Phase 2 jurisdiction</label>
                      <select
                        value={proj.phase2Jurisdiction}
                        onChange={e => updateProj('phase2Jurisdiction', e.target.value)}
                        style={{ ...s.input, paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}
                      >
                        <option value="nyc">🗽 NYC</option>
                        <option value="nj">🏡 NJ</option>
                        <option value="philly">🔔 Philly</option>
                        <option value="njnyc">🚆 NJ→NYC</option>
                      </select>
                      <div style={s.hint}>Years {proj.phase1Years + 1}+ use {locConfig[proj.phase2Jurisdiction].name}'s profile</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={s.category}>
              <div style={s.catTitle}>Savings Allocation</div>
              <div style={s.inputGroup}>
                <label style={s.label}>% Invested vs Cash</label>
                <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.savingsAllocation} onChange={e => updateProj('savingsAllocation', e.target.value)} min="0" max="100" /><span style={s.inputSuf}>%</span></div>
                <div style={s.hint}>{proj.savingsAllocation}% invested, {100 - proj.savingsAllocation}% cash</div>
              </div>
            </div>
            <div style={s.category}>
              <div style={s.catTitle}>Capital Gains (Realized Annually)</div>
              <div style={s.inputRow}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Short-term ($/yr)</label>
                  <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={proj.shortTermGainsAnnual} onChange={e => updateProj('shortTermGainsAnnual', e.target.value)} step="500" /></div>
                  <div style={s.hint}>Held ≤ 1 yr (ordinary rates)</div>
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Long-term ($/yr)</label>
                  <div style={s.inputWrap}><span style={s.inputPre}>$</span><input style={s.input} type="number" value={proj.longTermGainsAnnual} onChange={e => updateProj('longTermGainsAnnual', e.target.value)} step="500" /></div>
                  <div style={s.hint}>Held &gt; 1 yr (LTCG rates)</div>
                </div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>2026 Rates Applied (Auto)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '4px 10px', fontSize: 11, color: '#475569' }}>
                  <span style={{ fontWeight: 600, color: '#64748B' }}></span>
                  <span style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right' }}>Short-term</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right' }}>Long-term</span>
                  {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                    <React.Fragment key={loc}>
                      <span>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600 }}>{fmtPct(calculations[loc].shortTermCapGainsRate)}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600, color: locConfig[loc].color }}>{fmtPct(calculations[loc].longTermCapGainsRate)}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ ...s.hint, marginTop: 8 }}>Federal marginal + state/local + NIIT (if applicable). Philly wage tax does not apply to investment income.</div>
              </div>
            </div>
            <div style={s.category}>
              <div style={s.catTitle}>Sensitivity (What-If)</div>
              <div style={s.inputGroup}>
                <label style={s.label}>Rent Delta (applied to all): {sensitivity.rentDelta >= 0 ? '+' : ''}{fmt(sensitivity.rentDelta)}/mo</label>
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
                <span style={{ fontSize: 13 }}>Include employer match</span>
              </div>
              {proj.includeEmployerMatch && (
                <div style={s.inputRow}>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Match %</label>
                    <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.employerMatchPercent} onChange={e => updateProj('employerMatchPercent', e.target.value)} /><span style={s.inputSuf}>%</span></div>
                  </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Up to</label>
                    <div style={s.inputWrap}><input style={{ ...s.input, paddingLeft: 10 }} type="number" value={proj.employerMatchLimit} onChange={e => updateProj('employerMatchLimit', e.target.value)} /><span style={s.inputSuf}>%</span></div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section style={s.panel}>
            <h2 style={s.sectionTitle}>📈 Net Worth Projections</h2>
            <div style={s.chart}>
              <div
                style={{ position: 'relative', height: 260 }}
                onMouseLeave={() => setHoverYear(null)}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const plotLeft = 56, plotRight = rect.width - 16;
                  const px = e.clientX - rect.left;
                  if (px < plotLeft - 4 || px > plotRight + 4) { setHoverYear(null); return; }
                  const ratio = Math.max(0, Math.min(1, (px - plotLeft) / (plotRight - plotLeft)));
                  setHoverYear(Math.round(ratio * proj.projectionYears));
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 6, bottom: 26, width: 52, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', textAlign: 'right', paddingRight: 6 }}>
                  {[1, 0.75, 0.5, 0.25, 0].map(r => <div key={r}>{fmtK(maxNW * r)}</div>)}
                </div>

                <div style={{ position: 'absolute', left: 56, right: 16, top: 6, bottom: 26 }}>
                  <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 100 50" preserveAspectRatio="none">
                    {[0, 12.5, 25, 37.5, 50].map(y => (
                      <line key={'g'+y} x1="0" x2="100" y1={y} y2={y} stroke="#E2E8F0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    ))}
                    {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
                      const pts = projections[loc].data.map((d, i) => `${i / proj.projectionYears * 100},${50 - d.netWorth / maxNW * 48}`).join(' ');
                      return <polygon key={loc+'-fill'} points={`0,50 ${pts} 100,50`} fill={locConfig[loc].color} opacity="0.08" />;
                    })}
                    {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
                      const pts = projections[loc].data.map((d, i) => `${i / proj.projectionYears * 100},${50 - d.netWorth / maxNW * 48}`).join(' ');
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
                            cy={50 - projections[loc].data[hoverYear].netWorth / maxNW * 48}
                            r="4.5" fill={locConfig[loc].color} stroke="#FFF" strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        ))}
                      </g>
                    )}
                  </svg>
                </div>

                <div style={{ position: 'absolute', left: 56, right: 16, bottom: 0, height: 20, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8' }}>
                  {[0, 0.25, 0.5, 0.75, 1].map(r => <div key={r}>Yr {Math.round(proj.projectionYears * r)}</div>)}
                </div>

                {hoverYear !== null && projections.nyc.data[hoverYear] && (
                  <div style={{
                    position: 'absolute',
                    [hoverYear / proj.projectionYears > 0.55 ? 'left' : 'right']: 20,
                    top: 10,
                    background: '#1A202C',
                    color: '#FFF',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    pointerEvents: 'none',
                    minWidth: 180,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    zIndex: 10
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                      {hoverYear === 0 ? 'Today' : `Year ${hoverYear}`}
                    </div>
                    {[...projections.ranking].map(loc => (
                      <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0' }}>
                        <span>{locConfig[loc].emoji} {locConfig[loc].name}</span>
                        <span style={{ color: locConfig[loc].color, fontWeight: 700 }}>{fmtK(projections[loc].data[hoverYear].netWorth)}</span>
                      </div>
                    ))}
                    {hoverYear > 0 && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 10, color: '#CBD5E1' }}>
                        Cap gains tax this yr: {fmt(projections[projections.winner].data[hoverYear].capGainsTax)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={s.legend}>
                {['nyc', 'nj', 'philly', 'njnyc'].map(loc => (
                  <div key={loc} style={s.legendItem}><div style={{ ...s.legendDot, background: locConfig[loc].color }} />{locConfig[loc].name}</div>
                ))}
              </div>
            </div>

            <div style={{ ...s.chart, padding: '16px 20px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 4 }}>💸 What You'd Leave on the Table</div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>
                Over {proj.projectionYears} years, choosing <strong style={{ color: locConfig[projections.winner].color }}>{locConfig[projections.winner].name}</strong> over <strong>{locConfig[projections.ranking[1]].name}</strong> is worth <strong>{fmtK(projections[projections.winner].final - projections[projections.ranking[1]].final)}</strong>.
                {projections.flip && ` Ranking first changes at Year ${projections.flip.year} (${locConfig[projections.flip.from].name} → ${locConfig[projections.flip.to].name}).`}
              </div>
              <svg style={{ width: '100%', height: 80 }} viewBox="0 0 100 50" preserveAspectRatio="none">
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                <span>Yr 0 (tied)</span>
                <span>Yr {proj.projectionYears} (final gap)</span>
              </div>
            </div>

            <div style={s.projCards}>
              {['nyc', 'nj', 'philly', 'njnyc'].map(loc => {
                const p = projections[loc], cfg = locConfig[loc], win = projections.winner === loc;
                return (
                  <div key={loc} style={{ ...s.card, borderColor: win ? cfg.color : '#E2E8F0' }}>
                    {win && <div style={{ ...s.badge, background: cfg.grad }}>✓ BEST</div>}
                    <div style={s.cardHead}><span style={s.cardEmoji}>{cfg.emoji}</span><h3 style={s.cardTitle}>{cfg.name}</h3></div>
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
            </div>

            <div style={s.table}>
              <div style={s.tableHead}>
                <div style={s.tableCell}>Year</div>
                {['nyc', 'nj', 'philly', 'njnyc'].map(loc => <div key={loc} style={{ ...s.tableCell, color: locConfig[loc].color }}>{locConfig[loc].emoji} {locConfig[loc].name}</div>)}
              </div>
              {[0, Math.floor(proj.projectionYears / 4), Math.floor(proj.projectionYears / 2), Math.floor(proj.projectionYears * 3 / 4), proj.projectionYears].filter((v, i, a) => a.indexOf(v) === i).map(y => (
                <div key={y} style={{ ...s.tableRow, background: y === proj.projectionYears ? '#F0FDF4' : 'transparent' }}>
                  <div style={s.tableCell}>{y === 0 ? 'Today' : `Year ${y}`}</div>
                  {['nyc', 'nj', 'philly', 'njnyc'].map(loc => <div key={loc} style={s.tableCell}>{fmtK(projections[loc].data[y]?.netWorth || 0)}</div>)}
                </div>
              ))}
            </div>
          </section>
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
        <h1 style={s.title}><span style={s.titleAccent}>Where Should You Live?</span><br />Financial Comparison Tool</h1>
        <p style={s.subtitle}>Compare net income, expenses, savings, and long-term wealth across NYC, NJ, and Philadelphia</p>
        <span style={s.taxYear}>📅 2026 Tax Year</span>
      </header>

      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(activeTab === 'comparison' ? s.tabActive : {}) }} onClick={() => setActiveTab('comparison')}>💰 Monthly Comparison</button>
        <button style={{ ...s.tab, ...(activeTab === 'projections' ? s.tabActive : {}) }} onClick={() => setActiveTab('projections')}>📈 Net Worth Projections</button>
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
                  <span style={s.scenarioSummary}>
                    {fmt(snap.income.annualSalary)} · {snap.proj.projectionYears}yr · {snap.proj.investmentReturnRate}% return
                  </span>
                  <button onClick={() => loadScenario(snap)} style={s.scenarioBtn}>Load</button>
                  <button onClick={() => { setSnap(null); if (compareMode) setCompareMode(false); }} style={{ ...s.scenarioBtn, background: '#FFF', color: '#94A3B8' }}>✕</button>
                </>
              ) : (
                <button onClick={() => setSnap(snapshotCurrent())} style={s.scenarioPrimary}>Save Current</button>
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
        <p>💡 <strong>Tip:</strong> Changes in either tab automatically update projections!</p>
        <p style={s.disclaimer}>Tax rates updated for 2026 (Federal brackets per IRS Rev. Proc. 2025-32, NY per FY2026 budget, Philly wage tax effective July 2025). Projections are estimates.</p>
      </footer>
    </div>
  );
}
