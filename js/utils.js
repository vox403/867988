(function(){
  const app = window.Voxtek;

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    })[char]);
  }

  function escapeCss(value){
    const text = String(value || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(text);
    return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function pad(num){
    return String(num).padStart(2, '0');
  }

  function todayKey(date = new Date()){
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatDate(value){
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  }

  function daysSince(value){
    const joined = new Date(value);
    if (Number.isNaN(joined.getTime())) return 1;
    const now = new Date();
    const a = new Date(joined.getFullYear(), joined.getMonth(), joined.getDate());
    const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(1, Math.floor((b - a) / 86400000) + 1);
  }

  function monthDay(value){
    const text = String(value || '').trim();
    const long = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (long) return `${long[2]}-${long[3]}`;
    const short = text.match(/^(\d{2})-(\d{2})$/);
    return short ? text : '';
  }

  function currentMonthDay(){
    const now = new Date();
    return `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function currentYear(){
    return new Date().getFullYear();
  }

  function birthdayText(value){
    const text = String(value || '').trim();
    const long = text.match(/^\d{4}-(\d{2})-(\d{2})$/);
    if (long) return `${long[1]}월 ${long[2]}일`;
    const short = text.match(/^(\d{2})-(\d{2})$/);
    if (short) return `${short[1]}월 ${short[2]}일`;
    return '-';
  }

  function uid(){
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function safeJson(value, fallback){
    try{
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    }catch(error){
      return fallback;
    }
  }

  function assetFail(img){
    const parent = img && img.parentElement;
    if (!parent) return;
    img.style.display = 'none';
    const fallback = parent.querySelector('.asset-fallback, .icon-fallback, .fallback');
    if (fallback) fallback.style.display = 'flex';
  }

  app.u = {
    escapeHtml,
    escapeCss,
    pad,
    todayKey,
    formatDate,
    daysSince,
    monthDay,
    currentMonthDay,
    currentYear,
    birthdayText,
    uid,
    safeJson,
    assetFail
  };

  window.assetFail = assetFail;
})();
