/* Datos del mercado y helpers de formato */
const STOCKS={
  intl:[
    {sym:'AAPL',name:'Apple Inc.',exchange:'NASDAQ',price:182.34,color:'#3b82f6',bg:'#1a2a4a'},
    {sym:'MSFT',name:'Microsoft',exchange:'NASDAQ',price:415.20,color:'#10b981',bg:'#0e2e1e'},
    {sym:'GOOGL',name:'Alphabet',exchange:'NASDAQ',price:175.80,color:'#f59e0b',bg:'#2e2008'},
    {sym:'AMZN',name:'Amazon',exchange:'NASDAQ',price:203.45,color:'#f97316',bg:'#2e1408'},
    {sym:'TSLA',name:'Tesla Inc.',exchange:'NASDAQ',price:248.90,color:'#ef4444',bg:'#2e0e0e'},
    {sym:'NVDA',name:'NVIDIA Corp.',exchange:'NASDAQ',price:892.10,color:'#76c442',bg:'#142608'},
    {sym:'META',name:'Meta Platforms',exchange:'NASDAQ',price:512.65,color:'#818cf8',bg:'#1a1a40'},
  ],
  arg:[
    {sym:'GGAL',name:'Grupo Galicia',exchange:'BYMA',price:7820,color:'#00d4aa',bg:'#062820'},
    {sym:'YPF',name:'YPF S.A.',exchange:'BYMA',price:42350,color:'#fbbf24',bg:'#2e2008'},
    {sym:'BMA',name:'Banco Macro',exchange:'BYMA',price:9640,color:'#c084fc',bg:'#1e1030'},
    {sym:'PAMP',name:'Pampa Energía',exchange:'BYMA',price:18920,color:'#fb923c',bg:'#2e1408'},
    {sym:'TXAR',name:'Ternium Arg.',exchange:'BYMA',price:12750,color:'#34d399',bg:'#062018'},
    {sym:'CEPU',name:'Central Puerto',exchange:'BYMA',price:8430,color:'#60a5fa',bg:'#061430'},
    {sym:'LOMA',name:'Loma Negra',exchange:'BYMA',price:5680,color:'#f472b6',bg:'#280a18'},
  ]
};

const allStocks={};

[...STOCKS.intl,...STOCKS.arg].forEach(s=>{allStocks[s.sym]={...s}});

const isArg=sym=>STOCKS.arg.some(s=>s.sym===sym);

const fmt=(n,d=2)=>n.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});

const fmtUSD=n=>'$'+fmt(Math.abs(n));

const fmtP=(n,sym)=>isArg(sym)?'$'+fmt(Math.abs(n),0):'$'+fmt(Math.abs(n));
