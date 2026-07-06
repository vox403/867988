(function(){
  const app = window.Voxtek;
  const { dom, state, keys, db, u, employee } = app;

  const year = 2026;
  const firstMonth = 7;
  const lastMonth = 12;

  function dateKey(y, m, d){
    return `${y}-${u.pad(m)}-${u.pad(d)}`;
  }

  function today(){
    const now = new Date();
    return {
      year:now.getFullYear(),
      month:now.getMonth() + 1,
      day:now.getDate(),
      key:dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
    };
  }

  function storageKey(record){
    const id = record && (record.employeeId || record.name) ? (record.employeeId || record.name) : 'unknown';
    return `${keys.attendance}${year}_${id}`;
  }

  function blank(){
    return { dates:[], promotions:{}, updatedAt:new Date().toISOString() };
  }

  function load(record = employee.getActiveEmployee()){
    if (!record) return blank();
    const parsed = u.safeJson(localStorage.getItem(storageKey(record)), blank());
    parsed.dates = Array.isArray(parsed.dates) ? parsed.dates.filter(Boolean) : [];
    parsed.promotions = parsed.promotions && typeof parsed.promotions === 'object' ? parsed.promotions : {};
    return parsed;
  }

  function save(record, attendance){
    if (!record || !attendance) return;
    attendance.dates = [...new Set((attendance.dates || []).filter(Boolean))].sort();
    attendance.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey(record), JSON.stringify(attendance));
  }

  function daysIn(month){
    return new Date(year, month, 0).getDate();
  }

  function monthKey(month){
    return `${year}-${u.pad(month)}`;
  }

  function inPeriod(key){
    return key >= `${year}-07-01` && key <= `${year}-12-31`;
  }

  function currentPeriod(){
    const now = today();
    return now.year === year && now.month >= firstMonth && now.month <= lastMonth;
  }

  function checkedSet(attendance){
    return new Set((attendance && attendance.dates) || []);
  }

  function monthStats(month, attendance){
    const checked = checkedSet(attendance);
    const now = today();
    const days = daysIn(month);
    let checkedCount = 0;
    let missedCount = 0;

    for (let day = 1; day <= days; day += 1){
      const key = dateKey(year, month, day);
      if (checked.has(key)) checkedCount += 1;
      else if (key < now.key && inPeriod(key)) missedCount += 1;
    }

    return { days, checkedCount, missedCount, full:checkedCount === days };
  }

  function nextGrade(current){
    const normalized = employee.normalizeGrade(current, employee.defaultGrade);
    if (normalized === '임원급') return '임원급';
    if (normalized === '선임직') return '선임직';

    const grades = app.data.grades;
    const index = grades.indexOf(normalized);
    const senior = grades.indexOf('선임직');
    if (index < 0) return employee.defaultGrade;
    return grades[Math.min(index + 1, senior)] || normalized;
  }

  function applyGrade(record, grade){
    if (!record || employee.isAdminEmployee(record)) return record;

    const next = JSON.parse(JSON.stringify(record));
    const role = employee.displayRole(next);

    next.role = employee.buildRole({
      badge:next.badge,
      role,
      team:role.team || role.employment || '',
      grade,
      baseTeam:role.baseTeam || role.team || role.employment || '',
      baseGrade:role.baseGrade || role.grade || role.position || employee.defaultGrade
    });

    next.role.grade = grade;
    next.role.position = grade;
    next.role.gradeIndex = app.data.grades.indexOf(grade);
    return window.normalizeEmployeeRecord(next) || next;
  }

  function applyPromotions(record = employee.getActiveEmployee()){
    if (!record || employee.isAdminEmployee(record)) return record;

    const now = today();
    const attendance = load(record);
    let nextRecord = window.normalizeEmployeeRecord(JSON.parse(JSON.stringify(record))) || record;
    let changedRecord = false;
    let changedState = false;

    for (let month = firstMonth; month <= lastMonth; month += 1){
      const key = monthKey(month);
      if (attendance.promotions[key]) continue;

      const unlock = month === 12 ? `${year + 1}-01-01` : `${year}-${u.pad(month + 1)}-01`;
      if (now.key < unlock) continue;

      const stats = monthStats(month, attendance);
      if (!stats.full) continue;

      const role = employee.displayRole(nextRecord);
      const currentGrade = employee.normalizeGrade(role.grade || role.position || employee.defaultGrade, employee.defaultGrade);
      const promotedGrade = nextGrade(currentGrade);

      attendance.promotions[key] = {
        at:new Date().toISOString(),
        from:currentGrade,
        to:promotedGrade,
        month:key,
        promoted:promotedGrade !== currentGrade
      };
      changedState = true;

      if (promotedGrade !== currentGrade){
        nextRecord = applyGrade(nextRecord, promotedGrade);
        changedRecord = true;
      }
    }

    if (changedState) save(nextRecord, attendance);
    if (changedRecord){
      localStorage.setItem(keys.employee, JSON.stringify(nextRecord));
      state.activeEmployee = nextRecord;
      employee.syncEmployeeProfile(nextRecord);
    }

    return nextRecord;
  }

  function checkToday(){
    const record = employee.getActiveEmployee();
    if (!record || employee.isAdminEmployee(record)) return;

    const now = today();
    if (!currentPeriod()){
      showToast('현재 출석 기간이 아닙니다.');
      return;
    }

    const attendance = load(record);
    if (attendance.dates.includes(now.key)){
      showToast('오늘 출석은 이미 기록되었습니다.');
      return;
    }

    attendance.dates.push(now.key);
    save(record, attendance);
    state.attendanceMonth = now.month;

    if (db){
      db.from('voxtek_events').insert({
        event_type:'ATTENDANCE_CHECK_IN',
        account_id:record.employeeId || record.name || '',
        employee_name:record.name || '',
        mission_id:null,
        creature_name:null,
        mission_day:null,
        points:null,
        affection:null,
        local_date:now.key,
        session_id:employee.getEventSession(),
        user_agent:navigator.userAgent,
        detail:{
          source:'attendance_board',
          employee_id:record.employeeId || '',
          grade:(employee.displayRole(record).grade || ''),
          checked_at:new Date().toISOString()
        }
      }).then(({ error }) => {
        if (error) console.warn('attendance log failed', error);
      });
    }

    showToast('출석 체크 완료.');
    render();
  }

  function renderCalendar(month, attendance){
    const checked = checkedSet(attendance);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const total = daysIn(month);
    const now = today();
    const weekdays = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const cells = weekdays.map((name) => `<div class="attendance-weekday">${name}</div>`);

    for (let i = 0; i < firstDay; i += 1){
      cells.push('<div class="attendance-day is-empty" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= total; day += 1){
      const key = dateKey(year, month, day);
      const isChecked = checked.has(key);
      const isMissed = !isChecked && key < now.key && inPeriod(key);
      const isToday = key === now.key;
      const classes = [
        'attendance-day',
        isChecked ? 'is-checked' : '',
        isMissed ? 'is-missed' : '',
        isToday ? 'is-today' : ''
      ].filter(Boolean).join(' ');
      const mark = isChecked
        ? '<img class="attendance-mark" src="Stamp.png" alt="출석" loading="lazy" decoding="async">'
        : (isMissed ? '<img class="attendance-mark" src="X.png" alt="미출석" loading="lazy" decoding="async">' : '');
      const miss = isMissed ? '<span class="attendance-miss-text">MISS</span>' : '';

      cells.push(`
        <div class="${classes}">
          <span class="attendance-day-num">${day}</span>
          ${mark}
          ${miss}
        </div>
      `);
    }

    return `<div class="attendance-calendar">${cells.join('')}</div>`;
  }

  function render(){
    if (!dom.evaluationBody) return;

    let record = employee.getActiveEmployee();
    if (!record){
      dom.evaluationBody.innerHTML = '<div class="evaluation-lock"><div class="evaluation-lock-box"><h3>NO EMPLOYEE DATA</h3><p>사원 기록을 먼저 생성하십시오.</p></div></div>';
      return;
    }

    if (employee.isAdminEmployee(record)){
      if (dom.evaluationStatus) dom.evaluationStatus.textContent = 'ADMIN';
      dom.evaluationBody.innerHTML = `
        <div class="evaluation-lock">
          <div class="evaluation-lock-box">
            <h3>ATTENDANCE BOARD</h3>
            <p>관리자 계정은 출석 승진 대상이 아닙니다.</p>
            <p class="evaluation-muted">일반 사원 계정으로 접속하면 월별 출석판이 표시됩니다.</p>
          </div>
        </div>
      `;
      return;
    }

    record = applyPromotions(record) || record;
    const attendance = load(record);
    const now = today();

    if (now.year === year && now.month >= firstMonth && now.month <= lastMonth){
      state.attendanceMonth = Math.min(lastMonth, Math.max(firstMonth, state.attendanceMonth || now.month));
    } else {
      state.attendanceMonth = Math.min(lastMonth, Math.max(firstMonth, state.attendanceMonth || firstMonth));
    }

    const month = state.attendanceMonth;
    const role = employee.displayRole(record);
    const dept = employee.getDepartmentInfo(record);
    const checkedToday = attendance.dates.includes(now.key);
    const canCheck = currentPeriod() && !checkedToday;
    const currentGrade = employee.normalizeGrade(role.grade || role.position || employee.defaultGrade, employee.defaultGrade);
    const next = nextGrade(currentGrade);
    const nextText = next === currentGrade ? '자동 승진 한도 도달' : `${currentGrade} → ${next}`;

    if (dom.evaluationStatus) dom.evaluationStatus.textContent = 'ATTENDANCE';

    dom.evaluationBody.innerHTML = `
      <div class="attendance-shell">
        <div class="attendance-overview">
          <section class="evaluation-card attendance-profile">
            <span class="attendance-grade-chip">${u.escapeHtml(role.grade || role.position || employee.defaultGrade)}</span>
            <h3>${u.escapeHtml(record.name)} 사원 출석 기록</h3>
            <p>${u.escapeHtml(dept.name)} 소속 · ${u.escapeHtml(role.team || role.employment || '-')}</p>
          </section>
          <section class="evaluation-card attendance-guide">
            <h3>승진 기준</h3>
            <p>한 달 만근 시, 다음 달 1일에 자동 승진됩니다.</p>
            <div class="attendance-empty-note">다음 승진 검토: ${u.escapeHtml(nextText)}</div>
          </section>
        </div>
        <section class="evaluation-card attendance-board">
          <div class="attendance-board-head">
            <div class="attendance-month-nav">
              <button class="attendance-nav-btn" type="button" data-attendance-prev ${month <= firstMonth ? 'disabled' : ''}>‹</button>
              <div class="attendance-month-title">${year}.${u.pad(month)}</div>
              <button class="attendance-nav-btn" type="button" data-attendance-next ${month >= lastMonth ? 'disabled' : ''}>›</button>
            </div>
            <button class="attendance-check-btn" type="button" data-attendance-check ${canCheck ? '' : 'disabled'}>
              ${checkedToday ? 'CHECKED' : '출석체크'}
            </button>
          </div>
          ${renderCalendar(month, attendance)}
        </section>
      </div>
    `;

    const prev = dom.evaluationBody.querySelector('[data-attendance-prev]');
    const nextButton = dom.evaluationBody.querySelector('[data-attendance-next]');
    const check = dom.evaluationBody.querySelector('[data-attendance-check]');

    if (prev) prev.addEventListener('click', () => {
      state.attendanceMonth = Math.max(firstMonth, state.attendanceMonth - 1);
      render();
    });
    if (nextButton) nextButton.addEventListener('click', () => {
      state.attendanceMonth = Math.min(lastMonth, state.attendanceMonth + 1);
      render();
    });
    if (check) check.addEventListener('click', checkToday);
  }

  app.attendance = {
    render,
    checkToday,
    applyPromotions
  };

  window.renderEvaluation = render;
  window.attendanceApplyMonthlyPromotions = applyPromotions;
})();
