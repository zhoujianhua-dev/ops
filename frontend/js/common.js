/* 校园快递代拿 + 二手交易平台 前端公共脚本 */
var API = window.location.origin;

/* 环境角标：正式环境（服务器版 yizhancampus.loca.lt）不显示；
   本机/测试隧道/本地开发一律显示"测试环境"，防止误把测试数据当正式业务 */
(function(){
  const PROD_HOSTS = ['yizhancampus', 'zhoujianhua.tail'];
  function mount(){
    for (const p of PROD_HOSTS) {
      if (location.hostname.indexOf(p) === 0) return;
    }
    const b = document.createElement('div');
    b.textContent = '🧪 测试环境';
    b.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9999;'
      + 'background:rgba(15,23,42,.72);color:#fff;padding:4px 11px;border-radius:999px;'
      + 'font-size:12px;font-weight:600;pointer-events:none;backdrop-filter:blur(4px);';
    document.body.appendChild(b);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();

/* 全站 favicon（渐变「易」图标，一处注入全站生效） */
(function(){
  const fav = document.createElement('link');
  fav.rel = 'icon';
  fav.href = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#a855f7"/>'
    + '</linearGradient></defs>'
    + '<rect width="64" height="64" rx="14" fill="url(#g)"/>'
    + '<text x="32" y="44" font-size="34" font-weight="bold" text-anchor="middle" fill="#fff" '
    + 'font-family="PingFang SC, Microsoft YaHei, sans-serif">易</text></svg>');
  document.head.appendChild(fav);
})();

const STATUS_GOODS = {0:'待审核',1:'在售',2:'已下架',3:'已售罄'};
const STATUS_ORDER = {0:'待支付',1:'已支付',2:'交付中',3:'已完成',4:'已取消',5:'已退款'};
const STATUS_PARCEL = {0:'待接单',1:'已接单',2:'配送中',3:'已完成',4:'已取消'};
const BIZ_TYPE = {0:'充值',1:'商品消费',2:'快递消费',3:'代拿收入',4:'商品收入',5:'退款',6:'提现'};

function getToken(){ return localStorage.getItem('token') || ''; }
function setToken(t){ localStorage.setItem('token', t); }
function clearToken(){ localStorage.removeItem('token'); localStorage.removeItem('user'); }

async function api(path, opts={}){
  const headers = {'Content-Type':'application/json'};
  const t = getToken();
  if (t) headers['Authorization'] = 'Bearer ' + t;
  const init = {headers, method: opts.method || 'GET'};
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  let res;
  try { res = await fetch(API + path, init); }
  catch(e){ throw new Error('网络错误，请检查后端服务是否启动'); }
  let data = null;
  try { data = await res.json(); } catch(e){}
  if (res.status === 401){ clearToken(); location.href = 'login.html'; throw new Error('登录已过期'); }
  if (!res.ok){ throw new Error((data && data.detail) || ('请求失败(' + res.status + ')')); }
  return data;
}

function money(v){ return '¥' + Number(v || 0).toFixed(2); }
function fmtTime(s){ if(!s) return '-'; return String(s).replace('T',' ').substring(0,19); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function badge(status, map, cls){
  const text = map[status] || String(status);
  if (!cls) cls = status===3||status===1 ? 'ok' : (status===4||status===5||status===0? 'warn' : 'info');
  return '<span class="badge '+cls+'">'+esc(text)+'</span>';
}

/* 导航渲染 */
const NAV_LINKS = [
  {href:'index.html', name:'二手集市'},
  {href:'publish_goods.html', name:'发布商品', perm:'seller'},
  {href:'parcels.html', name:'快递大厅'},
  {href:'my_orders.html', name:'我的订单'},
  {href:'wallet.html', name:'钱包'},
  {href:'admin.html', name:'管理后台', perm:'admin'},
];
let CURRENT_USER = null;

async function loadUser(){
  if (!getToken()) return null;
  try { CURRENT_USER = await api('/api/auth/me'); return CURRENT_USER; }
  catch(e){ return null; }
}
function hasRole(user, code){ return user && Array.isArray(user.roles) && user.roles.indexOf(code) >= 0; }

async function renderNav(active){
  const user = await loadUser();
  const box = document.getElementById('nav');
  if (!box) return;
  let links = NAV_LINKS.filter(l => !l.perm || (user && hasRole(user, l.perm)));
  let html = '<div class="nav-inner">'
    + '<a class="brand" href="index.html">校园易站<small>快递代拿 · 二手交易</small></a>'
    + '<div class="nav-links">';
  links.forEach(l => {
    html += '<a href="'+l.href+'" class="'+(active===l.href?'active':'')+'">'+l.name+'</a>';
  });
  html += '</div><div class="nav-user">';
  if (user){
    const courier = user.is_courier ? ' <span class="badge info">跑腿</span>' : '';
    html += '<span>'+esc(user.nickname)+courier+'</span>'
      + '<button class="btn btn-outline btn-sm" onclick="logout()">退出</button>';
  } else {
    html += '<a class="btn btn-sm" href="login.html">登录</a><a class="btn btn-outline btn-sm" href="register.html">注册</a>';
  }
  html += '</div></div>';
  box.innerHTML = html;
  if (!document.getElementById('siteFooter')){
    const f = document.createElement('footer');
    f.className = 'site-footer'; f.id = 'siteFooter';
    f.innerHTML = '<div class="foot-brand">校 园 易 站</div>'
      + '<div class="foot-sub">数据库课程设计 · FastAPI + MySQL + Redis · 校园二手交易与快递代拿平台</div>';
    document.body.appendChild(f);
  }
}

async function logout(){
  clearToken(); location.href = 'index.html';
}

function showMsg(id, text, ok){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg show ' + (ok ? 'ok' : 'err');
}

async function requireLogin(){
  const user = await loadUser();
  if (!user){ location.href = 'login.html'; throw new Error('未登录'); }
  return user;
}

async function requireRole(code){
  const user = await requireLogin();
  if (!hasRole(user, code)){
    const names = {seller:'卖家', courier:'跑腿者', admin:'管理员'};
    showMsg('msg', '需要 ' + (names[code]||code) + ' 权限。普通用户请先开通：' + (code==='seller'?'「发布商品」页会引导你一键开通':'在「快递大厅」页开通跑腿者身份'), false);
    throw new Error('无权限');
  }
  return user;
}

async function openSeller(){
  await api('/api/auth/become-seller', {method:'POST'});
  await loadUser();
}
async function openCourier(){
  await api('/api/auth/become-courier', {method:'POST'});
  await loadUser();
}
