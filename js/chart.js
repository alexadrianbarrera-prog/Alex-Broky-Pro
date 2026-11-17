/* Gráficos: datos, render y controles */
function getChartData(sym,range){
  const cuts={'1D':1,'1W':7,'1M':30,'3M':90};
  return (priceHistory[sym]||[]).slice(-Math.max(cuts[range]||30,2));
}


function buildChartLabel(d){
  const dt=new Date(d.x);
  return currentRange==='1D'?dt.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):dt.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'});
}


function buildChart(sym){
  initPriceHistory(sym);
  const raw=getChartData(sym,currentRange);
  const closes=raw.map(d=>d.c);
  const vols=raw.map(d=>d.v||Math.floor(Math.random()*2e6+1e5));
  const labels=raw.map(buildChartLabel);
  const trend=closes[closes.length-1]>=closes[0];
  const mc=trend?'#00e5a0':'#ff3d5a';
  const ctx=document.getElementById('mainChart').getContext('2d');
  if(mainChart){mainChart.destroy();mainChart=null;}
  if(rsiChart){rsiChart.destroy();rsiChart=null;}
  if(volChart){volChart.destroy();volChart=null;}

  const ds=[];
  if(currentChartType==='candlestick'||currentChartType==='bar'){
    ds.push({type:currentChartType==='bar'?'bar':'candlestick',label:sym,
      data:currentChartType==='candlestick'?raw.map(d=>({x:d.x,o:d.o,h:d.h,l:d.l,c:d.c})):closes,
      borderColor:mc,
      backgroundColor:currentChartType==='bar'?raw.map(d=>d.c>=d.o?'rgba(0,229,160,.65)':'rgba(255,61,90,.65)'):undefined,
      color:{up:{border:'#00e5a0',background:'rgba(0,229,160,.55)'},down:{border:'#ff3d5a',background:'rgba(255,61,90,.55)'},unchanged:{border:'#7a8aa8',background:'rgba(122,138,168,.3)'}},
      borderWidth:1,yAxisID:'y'});
  } else {
    ds.push({label:sym,data:closes,borderColor:mc,
      backgroundColor:(c2)=>{const g=c2.chart.ctx.createLinearGradient(0,0,0,c2.chart.height);g.addColorStop(0,trend?'rgba(0,229,160,.22)':'rgba(255,61,90,.22)');g.addColorStop(1,'rgba(0,0,0,0)');return g;},
      borderWidth:2,fill:true,tension:.35,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:mc,yAxisID:'y'});
  }
  if(indicators.ma&&currentChartType!=='candlestick') ds.push({label:'MA(20)',data:calcMA(closes,20),borderColor:'#f59e0b',borderWidth:1.5,pointRadius:0,fill:false,tension:.35,spanGaps:true,yAxisID:'y'});
  if(indicators.ema&&currentChartType!=='candlestick') ds.push({label:'EMA(12)',data:calcEMA(closes,12),borderColor:'#c084fc',borderWidth:1.5,pointRadius:0,fill:false,tension:.35,yAxisID:'y'});
  if(indicators.bb&&currentChartType!=='candlestick'){
    const bb=calcBB(closes,20);
    ds.push({label:'BB↑',data:bb.map(b=>b.upper),borderColor:'rgba(96,165,250,.45)',borderWidth:1,pointRadius:0,fill:false,tension:.35,spanGaps:true,yAxisID:'y',borderDash:[4,4]});
    ds.push({label:'BB↓',data:bb.map(b=>b.lower),borderColor:'rgba(96,165,250,.45)',borderWidth:1,pointRadius:0,fill:'-1',backgroundColor:'rgba(96,165,250,.04)',tension:.35,spanGaps:true,yAxisID:'y',borderDash:[4,4]});
  }

  const chartOpts={responsive:true,maintainAspectRatio:false,animation:{duration:300},interaction:{intersect:false,mode:'index'},
    plugins:{legend:{display:true,position:'top',align:'end',labels:{boxWidth:10,font:{family:"'IBM Plex Mono'",size:8},color:'#3d4f6a',padding:8}},
      tooltip:{backgroundColor:'#0f1420',borderColor:'rgba(255,255,255,.08)',borderWidth:1,titleColor:'#7a8aa8',bodyColor:'#dde4f0',
        titleFont:{family:"'IBM Plex Mono'",size:8},bodyFont:{family:"'IBM Plex Mono'",size:10,weight:'600'},
        callbacks:{label:c=>' '+c.dataset.label+': '+fmtP(c.parsed.y||c.parsed._custom?.c||0,sym)}}},
    scales:{
      x:{grid:{color:'rgba(255,255,255,.025)',drawBorder:false},ticks:{color:'#3d4f6a',font:{family:"'IBM Plex Mono'",size:8},maxTicksLimit:7},border:{display:false}},
      y:{grid:{color:'rgba(255,255,255,.025)',drawBorder:false},ticks:{color:'#3d4f6a',font:{family:"'IBM Plex Mono'",size:8},callback:v=>fmtP(v,sym)},border:{display:false},position:'right'},
    }};

  mainChart=new Chart(ctx,{type:currentChartType==='candlestick'?'candlestick':'line',data:{labels,datasets:ds},options:chartOpts});

  // RSI
  const rsiWrap=document.getElementById('rsi-wrap');
  rsiWrap.style.display=indicators.rsi?'':'none';
  if(indicators.rsi){
    const rv=calcRSI(closes,14);
    rsiChart=new Chart(document.getElementById('rsiChart').getContext('2d'),{
      type:'line',data:{labels,datasets:[{label:'RSI',data:rv,borderColor:'#f472b6',borderWidth:1.5,pointRadius:0,fill:false,tension:.3,spanGaps:true}]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:200},
        plugins:{legend:{display:false},tooltip:{backgroundColor:'#0f1420',borderColor:'rgba(255,255,255,.08)',borderWidth:1,bodyColor:'#f472b6',bodyFont:{family:"'IBM Plex Mono'",size:9},callbacks:{label:c=>` RSI: ${(c.parsed.y||0).toFixed(1)}`}}},
        scales:{x:{display:false,grid:{display:false}},y:{min:0,max:100,grid:{color:'rgba(255,255,255,.02)',drawBorder:false},ticks:{color:'#3d4f6a',font:{family:"'IBM Plex Mono'",size:8},callback:v=>v+'%'},border:{display:false},position:'right',afterBuildTicks:ax=>{ax.ticks=[{value:30},{value:50},{value:70}]}}}}});
  }

  // VOL
  const volWrap=document.getElementById('vol-wrap');
  volWrap.style.display=indicators.vol?'':'none';
  if(indicators.vol){
    volChart=new Chart(document.getElementById('volChart').getContext('2d'),{
      type:'bar',data:{labels,datasets:[{label:'Vol',data:vols,backgroundColor:raw.map(d=>d.c>=d.o?'rgba(0,229,160,.35)':'rgba(255,61,90,.35)'),borderColor:raw.map(d=>d.c>=d.o?'rgba(0,229,160,.6)':'rgba(255,61,90,.6)'),borderWidth:.5,borderRadius:1}]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:200},
        plugins:{legend:{display:false},tooltip:{backgroundColor:'#0f1420',borderColor:'rgba(255,255,255,.08)',borderWidth:1,bodyColor:'#7a8aa8',bodyFont:{family:"'IBM Plex Mono'",size:9},callbacks:{label:c=>` Vol: ${(c.parsed.y/1e6).toFixed(2)}M`}}},
        scales:{x:{display:false,grid:{display:false}},y:{grid:{color:'rgba(255,255,255,.02)',drawBorder:false},ticks:{color:'#3d4f6a',font:{size:8,family:"'IBM Plex Mono'"},callback:v=>v>=1e6?(v/1e6).toFixed(1)+'M':(v/1e3).toFixed(0)+'K'},border:{display:false},position:'right'}}}});
  }

  updateChartHeader(sym);
  updateStats(sym,raw);
}


function updateChartHeader(sym){
  const s=allStocks[sym];
  const hist=priceHistory[sym]||[];
  const prev=hist.length>1?hist[hist.length-2].c:s.price;
  const chg=s.price-prev, pct=(chg/prev)*100, up=chg>=0;
  document.getElementById('chart-name').textContent=s.name;
  document.getElementById('chart-sym').textContent=`${sym} · ${s.exchange}`;
  document.getElementById('chart-price').textContent=fmtP(s.price,sym);
  document.getElementById('chart-price').className='chart-price-big '+(up?'up':'dn');
  document.getElementById('chart-chg').textContent=`${up?'+':''}${fmtP(chg,sym)} (${up?'+':''}${fmt(pct)}%)`;
  document.getElementById('chart-chg').className='chart-chg-big '+(up?'up':'dn');
}


function updateStats(sym,data){
  document.getElementById('stat-open').textContent=fmtP(data[0]?.o||0,sym);
  document.getElementById('stat-high').textContent=fmtP(Math.max(...data.map(d=>d.h)),sym);
  document.getElementById('stat-low').textContent=fmtP(Math.min(...data.map(d=>d.l)),sym);
  const tv=data.reduce((a,d)=>a+(d.v||0),0);
  document.getElementById('stat-vol').textContent=tv>=1e6?(tv/1e6).toFixed(2)+'M':(tv/1e3).toFixed(0)+'K';
}


function setRange(range,el){currentRange=range;document.querySelectorAll('#range-btns .ctrl-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');buildChart(selectedSym);}

function setChartType(type,el){currentChartType=type;document.querySelectorAll('.chart-type-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');buildChart(selectedSym);}

function toggleIndicator(key,el){indicators[key]=!indicators[key];el.classList.toggle('active',indicators[key]);buildChart(selectedSym);}
