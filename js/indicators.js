/* Indicadores técnicos (MA, EMA, Bollinger, RSI) */
// ── INDICATORS ──
function calcMA(data,period){return data.map((_,i)=>{if(i<period-1)return null;return data.slice(i-period+1,i+1).reduce((a,b)=>a+b,0)/period});}

function calcEMA(data,period){const k=2/(period+1);let e=data[0];return data.map((v,i)=>{if(i===0)return e;e=v*k+e*(1-k);return +e.toFixed(4)});}

function calcBB(data,p=20,m=2){const ma=calcMA(data,p);return data.map((_,i)=>{if(i<p-1)return{mid:null,upper:null,lower:null};const sl=data.slice(i-p+1,i+1),mn=ma[i],sd=Math.sqrt(sl.reduce((a,b)=>a+(b-mn)**2,0)/p);return{mid:+mn.toFixed(4),upper:+(mn+m*sd).toFixed(4),lower:+(mn-m*sd).toFixed(4)};});}

function calcRSI(data,period=14){const r=[...Array(period).fill(null)];let g=0,l=0;for(let i=1;i<=period;i++){const d=data[i]-data[i-1];if(d>0)g+=d;else l+=Math.abs(d);}let ag=g/period,al=l/period;r.push(al===0?100:+(100-(100/(1+(ag/al)))).toFixed(2));for(let i=period+1;i<data.length;i++){const d=data[i]-data[i-1];ag=(ag*(period-1)+(d>0?d:0))/period;al=(al*(period-1)+(d<0?Math.abs(d):0))/period;r.push(al===0?100:+(100-(100/(1+(ag/al)))).toFixed(2));}return r;}
