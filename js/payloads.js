const PayloadLibrary=(()=>{
  const safe=(label)=>`[AUTHORIZED_TEST:${label}]`;
  const categories={
    sqli:['Union pattern marker','Error-pattern marker','Boolean-pattern marker','Timing-behavior marker','Stacked-query marker'].map(safe),
    xss:['Reflected marker','Stored marker','DOM-sink marker','Attribute-context marker','URL-context marker'].map(safe),
    lfi:['Unix path traversal marker','Windows path traversal marker','PHP wrapper marker','Null-byte legacy marker'].map(safe),
    rce:['Shell metacharacter marker','Command separator marker','Substitution marker','Environment marker'].map(safe),
    auth:['Login bypass marker','Default credential check marker','Session fixation marker'].map(safe),
    waf:['Case alternation marker','Mixed encoding marker','Whitespace variation marker'].map(safe),
    xxe:['External entity marker','Parameter entity marker','DTD reference marker'].map(safe),
    ssrf:['Loopback probe marker','RFC1918 probe marker','Metadata service marker'].map(safe),
    idor:['Numeric decrement marker','Numeric increment marker','UUID swap marker','Tenant boundary marker'].map(safe),
    redirect:['Absolute URL redirect marker','Protocol-relative marker','Encoded redirect marker'].map(safe),
    dios:Array.from({length:44},(_,i)=>safe(`DIOS_EDUCATIONAL_LABEL_${String(i+1).padStart(2,'0')}`)),
    headers:['CRLF header marker','Host override marker','Forwarded chain marker'].map(safe)
  };
  function all(){return Object.values(categories).flat()}
  function render(){const root=document.querySelector('#payloadCategories');if(!root)return;root.innerHTML='';Object.entries(categories).forEach(([name,items])=>{const div=document.createElement('div');div.className='cat';div.innerHTML=`<button type="button"><b>${name}</b><span>${items.length}</span></button>`;items.forEach(p=>{const b=document.createElement('button');b.className='payload-item';b.textContent=p;b.onclick=()=>{document.querySelector('#payloadInput').value=p;HBLogger.log(`Selected ${name} safe marker`)};div.appendChild(b)});root.appendChild(div)});const dios=document.querySelector('#diosList');if(dios)dios.innerHTML=categories.dios.map(x=>`<button class="payload-item">${x}</button>`).join('')}
  window.addEventListener('DOMContentLoaded',render);return{categories,all,render};
})();
