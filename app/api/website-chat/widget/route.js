export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const agency = String(url.searchParams.get('agency') || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!agency) return new Response('// SafarOS chat: agency slug is required', { status: 400, headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
  const apiBase = url.origin + '/api/website-chat';
  const script = `(function(){
    if (window.__safarOSChatLoaded) return;
    window.__safarOSChatLoaded = true;
    var agencySlug = ${JSON.stringify(agency)};
    var endpoint = ${JSON.stringify(apiBase)};
    var scriptTag = document.currentScript;
    function pageContext(){
      var pageParts = location.pathname.split('/').filter(Boolean);
      var packageContext = /package|tour/i.test(location.pathname) ? (pageParts[pageParts.length - 1] || '') : '';
      return {
        packageId: (scriptTag && scriptTag.dataset && scriptTag.dataset.packageId) || packageContext,
        packageName: (scriptTag && scriptTag.dataset && scriptTag.dataset.packageName) || (packageContext ? document.title : '')
      };
    }
    var key = 'safaros-chat-' + agencySlug;
    var state = {};
    try { state = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch(e) {}
    var style = document.createElement('style');
    style.textContent = '.sos-chat-launch{position:fixed;right:22px;bottom:22px;z-index:2147483000;border:0;border-radius:999px;background:#5b45d6;color:#fff;padding:14px 19px;font:600 14px system-ui;box-shadow:0 8px 30px #17112b35;cursor:pointer}.sos-chat-box{position:fixed;right:22px;bottom:82px;z-index:2147483000;width:min(360px,calc(100vw - 28px));height:min(520px,calc(100vh - 115px));background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 18px 60px #17112b35;display:none;overflow:hidden;font:14px system-ui;color:#171923}.sos-chat-head{background:#5b45d6;color:white;padding:16px;display:flex;justify-content:space-between;align-items:center}.sos-chat-head strong{font-size:15px}.sos-chat-head button{border:0;background:transparent;color:white;font-size:22px;cursor:pointer}.sos-chat-body{height:calc(100% - 126px);overflow:auto;padding:14px;background:#f8f8fc}.sos-chat-msg{max-width:85%;padding:10px 12px;margin:7px 0;border-radius:13px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}.sos-chat-in{background:#fff;border:1px solid #ececf2;margin-right:auto}.sos-chat-out{background:#e9e5ff;margin-left:auto}.sos-chat-foot{height:62px;border-top:1px solid #eee;display:flex;gap:8px;padding:10px}.sos-chat-foot input{flex:1;min-width:0;border:1px solid #ddd;border-radius:999px;padding:0 13px;font:14px system-ui;outline:none}.sos-chat-foot button{border:0;border-radius:999px;background:#5b45d6;color:#fff;padding:0 15px;font-weight:600;cursor:pointer}.sos-chat-note{font-size:11px;color:#777;text-align:center;padding:5px}';
    document.head.appendChild(style);
    var launch = document.createElement('button'); launch.className='sos-chat-launch'; launch.type='button'; launch.textContent='Chat with us';
    var box = document.createElement('section'); box.className='sos-chat-box'; box.setAttribute('aria-label','Customer support chat');
    var head = document.createElement('div'); head.className='sos-chat-head';
    var title=document.createElement('strong'); title.textContent='How can we help?';
    var close=document.createElement('button'); close.type='button'; close.setAttribute('aria-label','Close chat'); close.textContent='×';
    head.append(title,close);
    var body=document.createElement('div'); body.className='sos-chat-body';
    var note=document.createElement('div'); note.className='sos-chat-note'; note.textContent='A member of the travel team will reply here.';
    var foot=document.createElement('form'); foot.className='sos-chat-foot';
    var input=document.createElement('input'); input.type='text'; input.maxLength=2000; input.placeholder='Type your message…'; input.setAttribute('aria-label','Message');
    var send=document.createElement('button'); send.type='submit'; send.textContent='Send'; foot.append(input,send);
    box.append(head,body,note,foot); document.body.append(launch,box);
    function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}}
    function addMessage(m){var el=document.createElement('div');el.className='sos-chat-msg '+(m.direction==='outbound'?'sos-chat-out':'sos-chat-in');el.textContent=m.text||'';body.appendChild(el);}
    function render(rows){body.textContent='';(rows||[]).forEach(addMessage);body.scrollTop=body.scrollHeight;}
    async function call(payload){var context=pageContext();var res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({agencySlug:agencySlug,visitorId:state.visitorId||'',visitorToken:state.visitorToken||'',conversationId:state.conversationId||'',pageUrl:location.href,packageId:context.packageId,packageName:context.packageName},payload))});var data=await res.json().catch(function(){return {};});if(!res.ok)throw new Error(data.error||'Chat is temporarily unavailable');return data;}
    async function openChat(){box.style.display='block';launch.style.display='none';if(!state.visitorId)state.visitorId=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);try{var data=await call({action:'start'});state.conversationId=data.conversationId;state.visitorToken=data.visitorToken||state.visitorToken;save();render(data.messages||[]);if(!data.messages||!data.messages.length){var welcome=document.createElement('div');welcome.className='sos-chat-note';welcome.textContent='Welcome! Send us your question and we’ll get back to you.';body.appendChild(welcome);}}catch(e){var error=document.createElement('div');error.className='sos-chat-note';error.textContent=e.message;body.appendChild(error);}}
    launch.addEventListener('click',openChat);
    close.addEventListener('click',function(){box.style.display='none';launch.style.display='block';});
    foot.addEventListener('submit',async function(e){e.preventDefault();var text=input.value.trim();if(!text)return;send.disabled=true;try{if(!state.conversationId||!state.visitorToken){await openChat();}var data=await call({action:'send',message:text});if(data.success){addMessage({direction:'inbound',text:text});input.value='';}}catch(err){var error=document.createElement('div');error.className='sos-chat-note';error.textContent=err.message;body.appendChild(error);}finally{send.disabled=false;body.scrollTop=body.scrollHeight;}});
    setInterval(async function(){if(box.style.display!=='block'||!state.conversationId||!state.visitorToken)return;try{var data=await call({action:'history'});render(data.messages||[]);}catch(e){}},5000);
  })();`;
  return new Response(script, { headers: {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
  }});
}
