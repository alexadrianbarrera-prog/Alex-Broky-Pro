/* Mercado: historial de precios, lista, ticker y simulación de ticks */
function initPriceHistory(sym){
  if(priceHistory[sym])return;
  const base=allStocks[sym].price;
  let price=base*0.82;const data=[];
  for(let i=90;i>=0;i--){
    const v=price*(0.012+Math.random()*0.028),o=price,c=price+(Math.random()-.47)*v*2;
    const h=Math.max(o,c)+Math.random()*v*.5,l=Math.min(o,c)-Math.random()*v*.5;
    const vol=Math.floor(Math.random()*4000000+300000);
    data.push({x:Date.now()-i*24*3600000,o:+o.toFixed(2),h:+h.toFixed(2),l:+l.toFixed(2),c:+c.toFixed(2),v:vol});
    price=c;
  }
  allStocks[sym].price=data[data.length-1].c;
  priceHistory[sym]=data;
  dayStartPrices[sym]=data[data.length-1].c;
}


function selectStock(sym){
  selectedSym=sym;
  document.querySelectorAll('.stock-row').forEach(r=>r.classList.remove('active'));
  const el=document.getElementById('row-'+sym);if(el)el.classList.add('active');
  buildChart(sym);updateTradeUI();
  document.getElementById('trade-sym-label').textContent=sym;
}


function buildStockList(){
  ['intl','arg'].forEach(grp=>{
    document.getElementById(grp+'-list').innerHTML=STOCKS[grp].map(s=>`
      <div class="stock-row ${s.sym===selectedSym?'active':''}" id="row-${s.sym}" onclick="selectStock('${s.sym}')">
        <div class="stock-icon" style="background:${s.bg};color:${s.color}">${s.sym.slice(0,2)}</div>
        <div class="stock-info"><div class="stock-sym">${s.sym}</div><div class="stock-name">${s.name}</div></div>
        <div class="stock-prices"><div class="stock-price" id="p-${s.sym}">${fmtP(s.price,s.sym)}</div><div class="stock-chg" id="c-${s.sym}">—</div></div>
      </div>`).join('');
  });
}


function buildTicker(){
  const all=[...STOCKS.intl,...STOCKS.arg];
  document.getElementById('ticker').innerHTML=[...all,...all].map(s=>{
    const chg=(Math.random()-.48)*2,up=chg>=0;
    return `<div class="ticker-item"><span class="ticker-sym">${s.sym}</span><span class="${up?'up':'dn'}">${fmtP(s.price,s.sym)}</span><span class="${up?'up':'dn'}">${up?'▲':'▼'}${Math.abs(chg).toFixed(2)}%</span></div>`;
  }).join('');
}


function simulatePriceTick(){
  [...STOCKS.intl,...STOCKS.arg].forEach(s=>{
    const sym=s.sym,stock=allStocks[sym];
    const vol=isArg(sym)?0.009:0.004;
    const change=stock.price*(Math.random()-.49)*vol;
    stock.price=Math.max(stock.price+change,1);
    if(priceHistory[sym]){
      const last=priceHistory[sym][priceHistory[sym].length-1];
      const nc=+stock.price.toFixed(isArg(sym)?0:2);
      const volume=Math.floor(Math.random()*3e6+1e5);
      priceHistory[sym].push({x:Date.now(),o:last.c,h:Math.max(last.c,nc)*(1+Math.random()*.003),l:Math.min(last.c,nc)*(1-Math.random()*.003),c:nc,v:volume});
      if(priceHistory[sym].length>300)priceHistory[sym].shift();
    }
    const prev=priceHistory[sym]?priceHistory[sym][priceHistory[sym].length-2]?.c||stock.price:stock.price;
    const chg=stock.price-prev,pct=((chg/prev)*100).toFixed(2),up=chg>=0;
    const pEl=document.getElementById('p-'+sym),cEl=document.getElementById('c-'+sym);
    if(pEl){pEl.textContent=fmtP(stock.price,sym);pEl.className='stock-price '+(up?'up':'dn');}
    if(cEl){cEl.textContent=`${up?'+':''}${pct}%`;cEl.className='stock-chg '+(up?'up':'dn');}
  });
  if(mainChart){
    const data=getChartData(selectedSym,currentRange);
    const closes=data.map(d=>d.c);
    if(currentChartType==='line'){
      mainChart.data.datasets[0].data=closes;
      let di=1;
      if(indicators.ma&&mainChart.data.datasets[di]){mainChart.data.datasets[di].data=calcMA(closes,20);di++;}
      if(indicators.ema&&mainChart.data.datasets[di]){mainChart.data.datasets[di].data=calcEMA(closes,12);di++;}
    }
    mainChart.update('none');
    updateChartHeader(selectedSym);
  }
  renderPortfolio();
  checkCircuitBreaker();
}
