/* Estado global de la aplicación */
// ── CORE STATE ──
const INITIAL_CAPITAL = 100000;

const LOCK_THRESHOLD  = 0.10;   // -10% triggers lock

const WARN_THRESHOLD  = 0.07;   // -7% shows warning banner

let cash = INITIAL_CAPITAL;

let selectedSym='AAPL', tradeMode='buy';

let portfolio={}, history=[], priceHistory={};

let mainChart=null, rsiChart=null, volChart=null;

let currentRange='1D', currentChartType='line';

let indicators={ma:true,ema:true,bb:true,rsi:true,vol:true};

let dayStartPrices={};


// ── LOCK STATE ──
let isLocked = false;

let lockEquityAtTrigger = 0;   // equity at the moment of locking

let lockRecoveryTarget  = 0;   // must reach this equity to unlock
