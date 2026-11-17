/* Inicialización */
// INIT
[...STOCKS.intl,...STOCKS.arg].forEach(s=>initPriceHistory(s.sym));
buildStockList();buildTicker();buildChart(selectedSym);updateTradeUI();

document.getElementById('eq-initial').textContent='$'+fmt(INITIAL_CAPITAL);

document.getElementById('eq-limit').textContent='$'+fmt(INITIAL_CAPITAL*(1-LOCK_THRESHOLD));

setInterval(simulatePriceTick,2500);
