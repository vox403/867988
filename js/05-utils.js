    function escapeHtml(str){
      return String(str).replace(/[&<>"']/g, function(m){
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'})[m];
      });
    }

    function escapeCssIdentifier(value){
      const text = String(value || '');
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(text);
      return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function pad2(num){
      return String(num).padStart(2, '0');
    }

    function formatDate(dateString){
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return '-';
      return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
    }

    function calculateDayCount(dateString){
      const joined = new Date(dateString);
      if (Number.isNaN(joined.getTime())) return 1;
      const now = new Date();
      const joinedMid = new Date(joined.getFullYear(), joined.getMonth(), joined.getDate());
      const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diff = nowMid - joinedMid;
      return Math.max(1, Math.floor(diff / 86400000) + 1);
    }

    function getAdminProfile(key){
      return ADMIN_PROFILES[key] || null;
    }

    function isReservedAdminHandle(value){
      const normalized = String(value || '').trim().toLowerCase();
      return Object.values(ADMIN_PROFILES).some(profile => profile.handle.toLowerCase() === normalized);
    }

    function isAdminEmployee(employee){
      return !!(employee && employee.isAdmin && getAdminProfile(employee.adminKey));
    }

    function getActiveEmployee(){
      return activeEmployee || getStoredEmployee();
    }
    function setContentsShellMode(){
      const title = document.querySelector('#window-contents .window-title');
      const iconLabel = document.querySelector('[data-app="contents"] .icon-label');
      const icon = document.querySelector('[data-app="contents"]');
      if (title) title.innerHTML = 'CONTENTS <small>VoxTek Program Hub</small>';
      if (iconLabel) iconLabel.textContent = 'CONTENTS';
      if (icon) icon.setAttribute('aria-label', 'CONTENTS');
    }
