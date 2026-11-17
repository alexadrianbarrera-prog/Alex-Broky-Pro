/* Circuit breaker: equity, alerta y bloqueo/desbloqueo del trading */
function calcEquity(){
  let portfolioVal=0;
  Object.keys(portfolio).forEach(sym=>{
    portfolioVal+=portfolio[sym].qty * allStocks[sym].price;
  });
  return cash + portfolioVal;
}


function checkCircuitBreaker(){
  const equity = calcEquity();
  const pnl    = equity - INITIAL_CAPITAL;
  const pct    = pnl / INITIAL_CAPITAL; // negative = loss

  // Update equity bar
  const lossPct = Math.max(0, -pct);
  const barW    = Math.min(lossPct / LOCK_THRESHOLD * 100, 100);
  const barColor= lossPct >= LOCK_THRESHOLD ? '#ff3d5a' : lossPct >= WARN_THRESHOLD ? '#ff9800' : '#00e5a0';
  document.getElementById('eq-bar-fill').style.width  = barW+'%';
  document.getElementById('eq-bar-fill').style.background = barColor;
  document.getElementById('eq-total').textContent = '$'+fmt(equity);
  document.getElementById('eq-total').style.color  = pnl>=0?'var(--green)':'var(--red)';
  document.getElementById('eq-pnl').textContent   = (pnl>=0?'+':'-')+'$'+fmt(Math.abs(pnl));
  document.getElementById('eq-pnl').style.color   = pnl>=0?'var(--green)':'var(--red)';
  document.getElementById('eq-pct-label').textContent = (pct>=0?'+':'')+fmt(pct*100)+'%';
  document.getElementById('eq-pct-label').style.color = barColor;

  // Warning banner (-7% ~ -10%)
  const banner = document.getElementById('alert-banner');
  if(!isLocked && lossPct>=WARN_THRESHOLD && lossPct<LOCK_THRESHOLD){
    banner.classList.add('show');
    document.getElementById('alert-pct-label').textContent = fmt(lossPct*100,1)+'% / 10%';
  } else {
    banner.classList.remove('show');
  }

  // LOCK trigger
  if(!isLocked && pct <= -LOCK_THRESHOLD){
    triggerLock(equity, pnl);
    return;
  }

  // UNLOCK check
  if(isLocked){
    const recovered = equity - lockEquityAtTrigger;
    const needed    = lockRecoveryTarget - lockEquityAtTrigger;
    const recPct    = Math.min(Math.max(recovered/needed,0),1);
    document.getElementById('lo-current').textContent = '$'+fmt(equity);
    document.getElementById('lo-loss').textContent    = '-$'+fmt(Math.abs(lockEquityAtTrigger-INITIAL_CAPITAL));
    document.getElementById('lo-need').textContent    = '+$'+fmt(needed);
    document.getElementById('lo-pct-label').textContent = fmt(recPct*100,1)+'%';
    document.getElementById('lo-progress').style.width  = (recPct*100)+'%';
    if(equity >= lockRecoveryTarget){
      triggerUnlock(equity);
    }
  }
}


function triggerLock(equity, pnl){
  isLocked = true;
  lockEquityAtTrigger = equity;
  // Recovery target: recover the full 10% loss from initial (i.e. get back to initial)
  const loss = INITIAL_CAPITAL - equity;
  lockRecoveryTarget = equity + loss; // = INITIAL_CAPITAL

  document.getElementById('lo-initial').textContent = '$'+fmt(INITIAL_CAPITAL);
  document.getElementById('lo-current').textContent = '$'+fmt(equity);
  document.getElementById('lo-loss').textContent    = '-$'+fmt(Math.abs(pnl));
  document.getElementById('lo-need').textContent    = '+$'+fmt(loss);
  document.getElementById('lo-progress').style.width='0%';
  document.getElementById('lo-pct-label').textContent='0%';
  document.getElementById('lockdown-overlay').classList.add('active');
  document.getElementById('trade-btn').disabled=true;
  document.getElementById('mkt-dot').style.background='var(--red)';
  document.getElementById('mkt-label').textContent='TRADING SUSPENDIDO';
  document.getElementById('alert-banner').classList.remove('show');

  // Log event
  history.unshift({type:'lock',sym:'ALEX',qty:0,price:equity,total:Math.abs(pnl),fee:0,time:new Date(),note:'Circuit breaker activado'});
  renderHistory();
  showToast('🔒 ALEX suspendió el trading — pérdida del 10% alcanzada','error');
}


function triggerUnlock(equity){
  isLocked = false;
  document.getElementById('lockdown-overlay').classList.remove('active');
  document.getElementById('trade-btn').disabled=false;
  document.getElementById('mkt-dot').style.background='var(--green)';
  document.getElementById('mkt-label').textContent='MERCADO ABIERTO';

  history.unshift({type:'unlock',sym:'ALEX',qty:0,price:equity,total:0,fee:0,time:new Date(),note:'Trading reactivado — recuperación lograda'});
  renderHistory();
  showToast('✅ ALEX reactivado — el portafolio recuperó el 10% perdido','warn');
}
