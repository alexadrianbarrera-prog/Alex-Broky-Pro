/* Operaciones: compra/venta, portfolio, historial y exportación CSV */
function updateTradeUI(){
  const s=allStocks[selectedSym];
  const qty=parseInt(document.getElementById('qty-input').value)||1;
  const total=s.price*qty, fee=total*0.001;
  document.getElementById('ts-price').textContent=fmtP(s.price,selectedSym);
  document.getElementById('ts-qty').textContent=qty;
  document.getElementById('ts-fee').textContent=fmtP(fee,selectedSym);
  document.getElementById('ts-total').textContent=fmtP(tradeMode==='buy'?total+fee:total-fee,selectedSym);
  const btn=document.getElementById('trade-btn');
  btn.textContent=(tradeMode==='buy'?'COMPRAR ':'VENDER ')+selectedSym;
  btn.className='btn-trade '+(tradeMode==='buy'?'btn-buy':'btn-sell');
  if(isLocked)btn.disabled=true;
}


function updateSummary(){updateTradeUI();}

function setTradeMode(mode,el){tradeMode=mode;document.querySelectorAll('.trade-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');updateTradeUI();}


function executeTrade(){
  if(isLocked){showToast('🔒 ALEX: trading suspendido — recuperá el 10% primero','error');return;}
  const sym=selectedSym;
  const qty=parseInt(document.getElementById('qty-input').value)||0;
  if(qty<=0){showToast('Ingresá una cantidad válida','error');return;}
  const price=allStocks[sym].price, total=price*qty, fee=total*0.001;
  if(tradeMode==='buy'){
    if(total+fee>cash){showToast('Fondos insuficientes','error');return;}
    cash-=total+fee;
    if(!portfolio[sym])portfolio[sym]={qty:0,avgCost:0};
    const ex=portfolio[sym];
    ex.avgCost=(ex.avgCost*ex.qty+price*qty)/(ex.qty+qty);
    ex.qty+=qty;
    history.unshift({type:'buy',sym,qty,price,total,fee,time:new Date()});
    showToast(`✓ Compra: ${qty} ${sym} @ ${fmtP(price,sym)}  comisión ${fmtP(fee,sym)}`,'success');
  } else {
    if(!portfolio[sym]||portfolio[sym].qty<qty){showToast('Sin suficientes acciones','error');return;}
    cash+=total-fee;
    portfolio[sym].qty-=qty;
    if(portfolio[sym].qty===0)delete portfolio[sym];
    history.unshift({type:'sell',sym,qty,price,total,fee,time:new Date()});
    showToast(`✓ Venta: ${qty} ${sym} @ ${fmtP(price,sym)}  comisión ${fmtP(fee,sym)}`,'success');
  }
  document.getElementById('cash-display').textContent='$'+fmt(cash);
  renderPortfolio();renderHistory();
  checkCircuitBreaker();
}


function renderPortfolio(){
  const keys=Object.keys(portfolio);
  document.getElementById('port-count').textContent=keys.length?`(${keys.length})`:'';
  const list=document.getElementById('portfolio-list');
  if(!keys.length){
    list.innerHTML='<div class="empty-state">Sin posiciones abiertas</div>';
    ['ps-total','ps-pnl','ps-day'].forEach(id=>document.getElementById(id).textContent='$0.00');
    return;
  }
  let totalVal=0,totalPnl=0,dayPnl=0,html='';
  keys.forEach(sym=>{
    const pos=portfolio[sym],price=allStocks[sym].price;
    const val=pos.qty*price,cost=pos.qty*pos.avgCost,pnl=val-cost;
    const pct=((pnl/cost)*100).toFixed(2);
    const dp=(price-(dayStartPrices[sym]||price))*pos.qty;
    totalVal+=val;totalPnl+=pnl;dayPnl+=dp;
    const up=pnl>=0;
    html+=`<div class="portfolio-item" onclick="selectStock('${sym}')">
      <div class="pi-top"><span class="pi-sym">${sym}</span><span class="pi-val">${fmtP(val,sym)}</span></div>
      <div class="pi-bot"><span class="pi-info">${pos.qty} acc · avg ${fmtP(pos.avgCost,sym)}</span><span class="pi-pnl ${up?'up':'dn'}">${up?'+':''}${fmtP(pnl,sym)} (${up?'+':''}${pct}%)</span></div>
    </div>`;
  });
  list.innerHTML=html;
  document.getElementById('ps-total').textContent=fmtUSD(totalVal);
  const pe=document.getElementById('ps-pnl');
  pe.textContent=(totalPnl>=0?'+':'-')+fmtUSD(totalPnl);
  pe.style.color=totalPnl>=0?'var(--green)':'var(--red)';
  const de=document.getElementById('ps-day');
  de.textContent=(dayPnl>=0?'+':'-')+fmtUSD(dayPnl);
  de.style.color=dayPnl>=0?'var(--green)':'var(--red)';
}


function renderHistory(){
  document.getElementById('hist-count').textContent=history.length?`(${history.length})`:'';
  if(!history.length){document.getElementById('history-list').innerHTML='<div class="empty-state">Sin operaciones aún</div>';return;}
  const html=history.slice(0,40).map(h=>{
    const ts=h.time.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})+' '+h.time.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    if(h.type==='lock') return `<div class="history-item"><span class="hi-badge lock">🔒 LOCK</span><div class="hi-info"><div class="hi-sym">Circuit Breaker</div><div class="hi-detail">${h.note}</div></div><div><div class="hi-total dn">-${fmtUSD(h.total)}</div><div class="hi-time">${ts}</div></div></div>`;
    if(h.type==='unlock') return `<div class="history-item"><span class="hi-badge unlock">✅ ON</span><div class="hi-info"><div class="hi-sym">Reactivación</div><div class="hi-detail">${h.note}</div></div><div><div class="hi-total up">Recuperado</div><div class="hi-time">${ts}</div></div></div>`;
    return `<div class="history-item"><span class="hi-badge ${h.type}">${h.type==='buy'?'COMPRA':'VENTA'}</span><div class="hi-info"><div class="hi-sym">${h.sym}</div><div class="hi-detail">${h.qty} acc · ${fmtP(h.price,h.sym)} · com. ${fmtP(h.fee,h.sym)}</div></div><div><div class="hi-total ${h.type==='buy'?'dn':'up'}">${h.type==='buy'?'-':'+'}${fmtP(h.total,h.sym)}</div><div class="hi-time">${ts}</div></div></div>`;
  }).join('');
  document.getElementById('history-list').innerHTML=html;
}


function exportCSV(e){
  e.stopPropagation();
  if(!history.length){showToast('Sin operaciones para exportar','error');return;}
  const header='Tipo,Símbolo,Cantidad,Precio,Total,Comisión,Nota,Fecha,Hora\n';
  const rows=history.map(h=>{
    const d=h.time;
    return `${h.type.toUpperCase()},${h.sym},${h.qty||''},${h.price?.toFixed(4)||''},${h.total?.toFixed(4)||''},${h.fee?.toFixed(4)||''},"${h.note||''}",${d.toLocaleDateString('es-AR')},${d.toLocaleTimeString('es-AR')}`;
  }).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='alex_broker_historial.csv';a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Historial exportado como alex_broker_historial.csv','success');
}
