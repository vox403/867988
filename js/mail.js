(function(){
  const app = window.Voxtek;
  const { dom, data, keys, state, u, employee } = app;

  function birthdayMail(){
    const current = employee.getActiveEmployee();
    if (!current || employee.isAdminEmployee(current)) return null;

    const monthDay = current.birthdayMonthDay || u.monthDay(current.birthday);
    if (!monthDay || monthDay !== u.currentMonthDay()) return null;

    const year = u.currentYear();
    const safeName = u.escapeHtml(current.name);
    return {
      id:`birthday_${year}_${current.employeeId || current.name}`,
      date:`${year}.${u.currentMonthDay().replace('-', '.')}`,
      sender:'VoxTek HR Celebration System',
      subject:`${current.name} 사원 생일 축하 메일`,
      badge:'BIRTHDAY',
      body:`<article class="memo-shell">
        <div class="memo-meta">
          <div class="memo-row"><div class="memo-key">제목</div><div class="memo-value">생일 축하 및 특별 안내</div></div>
          <div class="memo-row"><div class="memo-key">수신</div><div class="memo-value">${safeName} 사원</div></div>
          <div class="memo-row"><div class="memo-key">발신</div><div class="memo-value">VoxTek HR Celebration System</div></div>
          <div class="memo-row"><div class="memo-key">등급</div><div class="memo-value">사내 축하 메일 (BIRTHDAY)</div></div>
        </div>
        <h2 class="memo-title-main">HAPPY BIRTHDAY, ${safeName}</h2>
        <div class="memo-class">CLASSIFICATION: CELEBRATION NOTICE · PERSONAL MAIL</div>
        <div class="memo-content">
          <p>${safeName} 사원.</p>
          <p>오늘은 사원 기록상 생일로 등록된 날입니다. 복스테크는 귀하의 생존과 근속을 확인했으며, 그 사실을 최소한의 축하 문서로 남깁니다.</p>
          <p><strong>축하합니다.</strong> 오늘 하루 정도는 자신이 조금 더 특별하다는 착각을 허용하겠습니다.</p>
          <p class="memo-muted">※ 금일 특별 휴가를 지급하오니 만끽하시길 바랍니다.</p>
          <div class="memo-sign">
            <strong>— VoxTek HR Celebration System</strong>
            Employee Life Event Division<br>
            STATUS: BIRTHDAY SIGNAL DETECTED
          </div>
        </div>
      </article>`
    };
  }

  function sortValue(item){
    const value = String((item && (item.sortDate || item.date || item.visibleFrom)) || '').trim();
    const match = value.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if (!match) return 0;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  }

  function visibleItems(){
    const today = u.todayKey();
    const base = data.mailItems.filter((item) => !item.visibleFrom || item.visibleFrom <= today);
    const birth = birthdayMail();
    return (birth ? [birth, ...base] : base)
      .map((item, index) => ({ item, index }))
      .sort((a, b) => sortValue(b.item) - sortValue(a.item) || a.index - b.index)
      .map((entry) => entry.item);
  }

  function readIds(){
    const parsed = u.safeJson(localStorage.getItem(keys.mailRead), []);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  }

  function saveReadIds(ids){
    localStorage.setItem(keys.mailRead, JSON.stringify([...new Set(ids.filter(Boolean))]));
  }

  function markRead(id){
    if (!id) return;
    const ids = readIds();
    if (!ids.includes(id)){
      ids.push(id);
      saveReadIds(ids);
    }
    updateUnread();
  }

  function unreadCount(){
    const read = new Set(readIds());
    return visibleItems().filter((item) => !read.has(item.id)).length;
  }

  function updateUnread(){
    const count = unreadCount();

    if (dom.mailBadge){
      dom.mailBadge.textContent = String(count);
      dom.mailBadge.classList.toggle('hidden', count <= 0);
    }

    if (dom.mailIcon){
      dom.mailIcon.classList.toggle('has-unread', count > 0);
      dom.mailIcon.setAttribute('title', count > 0 ? `읽지 않은 메일 ${count}건` : '읽지 않은 메일 없음');
      dom.mailIcon.setAttribute('aria-label', count > 0 ? `메일, 읽지 않은 메일 ${count}건` : '메일');
    }
  }

  function renderInbox(selectedId = state.mailId){
    if (!dom.mailList || !dom.mailDetail) return;

    const items = visibleItems();
    if (!items.length){
      dom.mailList.innerHTML = '<div class="mail-empty"><div><strong>수신 메일 없음</strong>표시할 내부 메일이 없습니다.</div></div>';
      dom.mailDetail.innerHTML = '<div class="mail-empty"><div><strong>메일을 선택하세요.</strong>수신 메일이 없습니다.</div></div>';
      if (dom.mailShell) dom.mailShell.classList.remove('mail-selected');
      updateUnread();
      return;
    }

    const selected = selectedId ? items.find((item) => item.id === selectedId) : null;
    state.mailId = selected ? selected.id : '';
    if (dom.mailShell) dom.mailShell.classList.toggle('mail-selected', !!selected);

    if (selected) markRead(selected.id);
    else updateUnread();

    const read = new Set(readIds());
    dom.mailList.innerHTML = items.map((item) => {
      const unread = !read.has(item.id);
      return `
        <button class="mail-item ${item.id === state.mailId ? 'is-active' : ''} ${unread ? 'is-unread' : ''}" type="button" data-mail-id="${u.escapeHtml(item.id)}">
          <span class="mail-item-subject-row">
            <span class="mail-item-subject">${u.escapeHtml(item.subject)}</span>
            ${unread ? '<span class="mail-item-unread-chip">NEW</span>' : ''}
          </span>
          <span class="mail-item-meta">${u.escapeHtml(item.sender)} · ${u.escapeHtml(item.date)}</span>
          <span class="mail-item-badge">${u.escapeHtml(item.badge || 'MAIL')}</span>
        </button>
      `;
    }).join('');

    dom.mailList.querySelectorAll('[data-mail-id]').forEach((button) => {
      button.addEventListener('click', () => renderInbox(button.dataset.mailId));
    });

    if (selected){
      dom.mailDetail.innerHTML = `
        <div class="mail-mobile-detailbar">
          <button class="mail-mobile-back" type="button" data-mail-back>← 받은 메일함</button>
        </div>
        ${selected.body}
      `;
    } else {
      dom.mailDetail.innerHTML = `
        <div class="mail-empty">
          <div>
            <strong>메일을 선택하세요.</strong>
            받은 메일 제목을 클릭하면 상세 내용이 표시됩니다.<br>
            읽지 않은 메일은 파란 표시로 강조됩니다.
          </div>
        </div>
      `;
    }

    const back = dom.mailDetail.querySelector('[data-mail-back]');
    if (back) back.addEventListener('click', () => renderInbox(''));
    dom.mailDetail.scrollTop = 0;
  }

  app.mail = {
    renderInbox,
    updateUnread
  };

  window.renderMailInbox = renderInbox;
  window.updateMailUnreadIndicator = updateUnread;
})();
