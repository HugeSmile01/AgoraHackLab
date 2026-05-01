const Gate = (() => {
  const KEY = 'dh_gate_config_v1';
  const state = {
    authorized: false,
    strictMode: true,
    allowedHosts: [],
    maxRequestsPerMinute: 30,
    requestTimes: []
  };

  function normalizeHost(value) {
    return (value || '').trim().toLowerCase();
  }

  function parseHosts(raw) {
    return (raw || '')
      .split(',')
      .map(normalizeHost)
      .filter(Boolean);
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify({
      strictMode: state.strictMode,
      allowedHosts: state.allowedHosts,
      maxRequestsPerMinute: state.maxRequestsPerMinute
    }));
  }

  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      state.strictMode = data.strictMode !== false;
      state.allowedHosts = Array.isArray(data.allowedHosts) ? data.allowedHosts.map(normalizeHost).filter(Boolean) : [];
      state.maxRequestsPerMinute = Number.isFinite(data.maxRequestsPerMinute) ? Math.max(5, data.maxRequestsPerMinute) : 30;
    } catch {}
  }

  function syncUi() {
    const authorizedToggle = document.querySelector('#authorizedToggle');
    const consentState = document.querySelector('#consentState');
    const strictModeToggle = document.querySelector('#strictModeToggle');
    const allowedHostsInput = document.querySelector('#allowedHostsInput');
    const rpmInput = document.querySelector('#rpmLimitInput');
    const envState = document.querySelector('#envState');

    if (authorizedToggle) authorizedToggle.checked = !!state.authorized;
    if (strictModeToggle) strictModeToggle.checked = !!state.strictMode;
    if (allowedHostsInput) allowedHostsInput.value = state.allowedHosts.join(', ');
    if (rpmInput) rpmInput.value = String(state.maxRequestsPerMinute);

    if (consentState) {
      consentState.textContent = state.authorized ? 'Actions unlocked' : 'Actions locked';
      consentState.className = 'tag ' + (state.authorized ? 'success' : 'warn');
    }

    if (envState) {
      envState.textContent = state.strictMode
        ? `Strict scope ON • ${state.allowedHosts.length || 0} allowed host(s) • ${state.maxRequestsPerMinute}/min`
        : `Strict scope OFF • ${state.maxRequestsPerMinute}/min`;
    }
  }

  function isUrlAllowed(url) {
    let host = '';
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return false;
    }

    if (!state.strictMode) return true;
    if (!state.allowedHosts.length) return false;

    return state.allowedHosts.some(entry => host === entry || host.endsWith(`.${entry}`));
  }

  function checkRateLimit() {
    const now = Date.now();
    state.requestTimes = state.requestTimes.filter(t => now - t < 60_000);
    if (state.requestTimes.length >= state.maxRequestsPerMinute) {
      HBLogger.log(`Request blocked by rate limit (${state.maxRequestsPerMinute}/minute)`, 'warn');
      return false;
    }
    state.requestTimes.push(now);
    return true;
  }

  function allowed(url) {
    if (!state.authorized) {
      HBLogger.log('Action blocked until authorization is confirmed', 'warn');
      return false;
    }

    if (url && !isUrlAllowed(url)) {
      HBLogger.log(`URL blocked by strict scope policy: ${url}`, 'warn');
      return false;
    }

    return checkRateLimit();
  }

  function bind() {
    restore();
    syncUi();

    document.querySelector('#authorizedToggle')?.addEventListener('change', e => {
      state.authorized = !!e.target.checked;
      syncUi();
    });

    document.querySelector('#saveEnvBtn')?.addEventListener('click', () => {
      state.strictMode = !!document.querySelector('#strictModeToggle')?.checked;
      state.allowedHosts = parseHosts(document.querySelector('#allowedHostsInput')?.value || '');
      state.maxRequestsPerMinute = Math.max(5, Number(document.querySelector('#rpmLimitInput')?.value || 30));
      save();
      syncUi();
      HBLogger.log('Controlled environment settings saved', 'success');
    });
  }

  window.addEventListener('DOMContentLoaded', bind);

  return { allowed, isUrlAllowed, state };
})();

const Core = (() => {
  let history = [], idx = -1;
  function extractUrlParams(urlString){try{return [...new URL(urlString).searchParams.entries()].map(([name,value])=>({name,value}))}catch{return[]}}
  function analyzePage(iframeDoc){const forms=[...iframeDoc.querySelectorAll('form')].map(f=>({action:f.action,method:f.method||'GET',inputs:[...f.querySelectorAll('input,textarea,select')].map(i=>({name:i.name,type:i.type||i.tagName.toLowerCase()}))}));const inputs=[...iframeDoc.querySelectorAll('input,textarea,select')].map(i=>({name:i.name,type:i.type||i.tagName.toLowerCase()}));const links=[...iframeDoc.querySelectorAll('a[href]')].map(a=>a.href);const params=extractUrlParams(iframeDoc.location.href);return{forms,inputs,params,links}}
  function detectTech(htmlString){const rules={WordPress:/wp-content|wp-includes/i,Drupal:/drupal/i,jQuery:/jquery/i,React:/data-reactroot|__REACT/i,Vue:/vue/i,Angular:/ng-version|ng-app/i,PHP:/\.php|PHPSESSID/i,ASP_NET:/__VIEWSTATE|aspnet/i};return Object.entries(rules).filter(([,re])=>re.test(htmlString)).map(([k])=>k)}
  function buildInjectedUrl(baseUrl,param,payload){const u=new URL(baseUrl);u.searchParams.set(param,payload);return u.toString()}
  function updateStatus(report,tech=[]){countForms.textContent=report.forms.length;countInputs.textContent=report.inputs.length;countParams.textContent=report.params.length;countLinks.textContent=report.links.length;countTech.textContent=tech.length;detectedBar.innerHTML=tech.map(t=>`<span class="tag success">${t}</span>`).join('');paramSelect.innerHTML=report.params.map(p=>`<option>${p.name}</option>`).join('');formsList.innerHTML='<h3>Forms</h3>'+report.forms.map((f,i)=>`<pre>#${i+1} ${f.method} ${f.action}\n${JSON.stringify(f.inputs,null,2)}</pre>`).join('');paramsList.innerHTML='<h3>Params</h3>'+report.params.map(p=>`<button class="payload-item">${p.name}=${p.value}</button>`).join('')}
  function load(url){if(!url)return;if(!Gate.allowed(url))return;browserFrame.src=url;builderUrl.value=url;adminBaseUrl.value=url;history=history.slice(0,idx+1);history.push(url);idx=history.length-1;HBLogger.log(`Loaded ${url}`)}
  function bind(){document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button,.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#'+b.dataset.tab).classList.add('active')});loadBtn.onclick=()=>load(urlInput.value);reloadBtn.onclick=()=>browserFrame.contentWindow?.location.reload();backBtn.onclick=()=>{if(idx>0)browserFrame.src=history[--idx]};fwdBtn.onclick=()=>{if(idx<history.length-1)browserFrame.src=history[++idx]};browserFrame.addEventListener('load',()=>{try{const doc=browserFrame.contentDocument;const report=analyzePage(doc);const tech=detectTech(doc.documentElement.outerHTML);updateStatus(report,tech);HBLogger.log('Page analyzed','success')}catch(e){const params=extractUrlParams(browserFrame.src);updateStatus({forms:[],inputs:[],params,links:[]},[]);HBLogger.log('Limited analysis because the frame is cross-origin','warn')}});executePayloadBtn.onclick=()=>{if(!Gate.allowed(builderUrl.value))return;const url=buildInjectedUrl(builderUrl.value,paramSelect.value,payloadInput.value);builderOutput.textContent=url;HBLogger.log(`Built authorized test URL for ${paramSelect.value}`)}}
  window.addEventListener('DOMContentLoaded',bind);return{analyzePage,detectTech,extractUrlParams,buildInjectedUrl,load}
})();
