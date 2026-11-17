/* Utilidades de interfaz (toast, secciones colapsables) */
function showToast(msg,type='success'){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast '+type;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),4000);
}


function toggleSection(id){
  const el=document.getElementById(id+'-section');
  el.style.display=el.style.display==='none'?'':'none';
}
