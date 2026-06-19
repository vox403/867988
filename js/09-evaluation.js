    function evaluationDateKey(date = new Date()){
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }

    function evaluationTodayInfo(){
      const now = new Date();
      const actualKey = evaluationDateKey(now);
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      if (EVALUATION_PREVIEW_MODE){
        year = EVALUATION_YEAR;
        month = EVALUATION_MONTH;
        day = 1;
      }
      const key = `${year}-${pad2(month)}-${pad2(day)}`;
      const startKey = `${EVALUATION_YEAR}-06-01`;
      const endKey = `${EVALUATION_YEAR}-06-30`;
      return { year, month, day, key, actualKey, startKey, endKey, isBefore:key < startKey, isAfter:key > endKey, isActive:year === EVALUATION_YEAR && month === EVALUATION_MONTH && day >= 1 && day <= 30 };
    }

    function evaluationStorageKey(employee){
      const id = employee && employee.employeeId ? employee.employeeId : (employee && employee.name ? employee.name : 'unknown');
      return `${EVALUATION_STORAGE_PREFIX}${EVALUATION_YEAR}_${id}`;
    }

    function evaluationBlankState(){
      return { attendanceDates:[], clearedOrders:{}, updatedAt:new Date().toISOString() };
    }

    function evaluationLoadState(employee = getStoredEmployee()){
      if (!employee) return evaluationBlankState();
      try{
        const raw = localStorage.getItem(evaluationStorageKey(employee));
        if (!raw) return evaluationBlankState();
        const parsed = JSON.parse(raw);
        parsed.attendanceDates = Array.isArray(parsed.attendanceDates) ? parsed.attendanceDates : [];
        parsed.clearedOrders = parsed.clearedOrders && typeof parsed.clearedOrders === 'object' ? parsed.clearedOrders : {};
        return parsed;
      }catch(error){
        return evaluationBlankState();
      }
    }

    function evaluationSaveState(state, employee = getStoredEmployee()){
      if (!employee || !state) return;
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(evaluationStorageKey(employee), JSON.stringify(state));
    }

    function evaluationScore(state){
      const attendance = new Set(state.attendanceDates || []).size;
      const cleared = Object.values(state.clearedOrders || {});
      const clearCount = cleared.length;
      const perfectCount = cleared.filter(item => item && item.perfect).length;
      return { attendance, clearCount, perfectCount, total:attendance + clearCount * 2 + perfectCount };
    }

    function evaluationCurrentOrder(){
      const info = evaluationTodayInfo();
      if (!info.isActive) return null;
      return JUNE_DAILY_ORDERS[info.day - 1] || null;
    }

    function evaluationEventLog(type, detail = {}){
      const employee = getStoredEmployee();
      if (!employee) return;
      const dept = getDepartmentInfo(employee);
      const role = displayRoleForEmployee(employee);
      const row = {
        event_type:type,
        account_id:employee.employeeId || employee.name,
        employee_name:employee.name,
        mission_id:null,
        creature_name:null,
        mission_day:null,
        points:null,
        affection:null,
        local_date:evaluationTodayInfo().key,
        session_id:typeof getEventSession === 'function' ? getEventSession() : '',
        user_agent:navigator.userAgent,
        detail:{
          source:'june_evaluation',
          department:dept.name,
          department_key:dept.key || '',
          department_line:dept.line,
          team:role.team || role.employment || '',
          grade:role.grade || role.position || '',
          position:role.grade || role.position || '',
          base_team:role.baseTeam || '',
          base_grade:role.baseGrade || DEFAULT_GRADE,
          reward_rank:role.rewardRank || null,
          reward_label:role.rewardLabel || '',
          reward_season:role.rewardSeason || '',
          joined_at:employee.joinedAt || '',
          employee_id:employee.employeeId || '',
          client_time:new Date().toISOString(),
          ...detail
        }
      };
      if (supabaseClient){
        supabaseClient.from('voxtek_events').insert(row).then(({ error }) => {
          if (error) console.warn('Evaluation Supabase log failed:', error);
        });
      }
    }

    function evaluationEnsureAttendance(){
      const employee = getStoredEmployee();
      const info = evaluationTodayInfo();
      if (!employee || !info.isActive) return;
      const state = evaluationLoadState(employee);
      if (!state.attendanceDates.includes(info.key)){
        state.attendanceDates.push(info.key);
        evaluationSaveState(state, employee);
        evaluationEventLog('EVAL_ATTENDANCE', { score_gain:1 });
      }
    }

    function evaluationRenderStats(state){
      const score = evaluationScore(state);
      return `
        <div class="evaluation-stat-grid">
          <div class="evaluation-stat"><span>Attendance</span><b>${score.attendance}/30</b></div>
          <div class="evaluation-stat"><span>Orders</span><b>${score.clearCount}/30</b></div>
          <div class="evaluation-stat"><span>Perfect</span><b>${score.perfectCount}/30</b></div>
          <div class="evaluation-stat"><span>Score</span><b>${score.total}/120</b></div>
        </div>
      `;
    }

    function renderAdminEvaluation(employee){
      const profile = getAdminProfile(employee.adminKey);
      const info = evaluationTodayInfo();
      if (evaluationStatus) evaluationStatus.textContent = info.isActive ? 'ADMIN VIEW' : (info.isBefore ? 'LOCKED' : 'RECORDS');
      if (info.isBefore){
        evaluationBody.innerHTML = `
          <div class="evaluation-lock">
            <div class="evaluation-lock-box">
              <h3>ADMIN REVIEW LOCKED</h3>
              <p>평가 시스템은 ${EVALUATION_YEAR}.06.01부터 ${EVALUATION_YEAR}.06.30까지 진행됩니다.</p>
              <p class="evaluation-muted">평가가 시작되면 직원별 출석, 오늘의 지시 완료, 퍼펙트 보정 기록이 이 창구에 표시됩니다.</p>
              <p class="evaluation-muted">${escapeHtml(profile.name)} 관리자 권한으로 접속 중입니다.</p>
            </div>
          </div>
        `;
        return;
      }
      const order = evaluationCurrentOrder();
      const periodText = info.isActive
        ? '현재 6월 인사 평가가 진행 중입니다. 직원별 누적 기록을 확인할 수 있습니다.'
        : '6월 인사 평가 기간이 종료되었습니다. 직원별 평가 기록은 이 창구에 보존됩니다.';
      evaluationBody.innerHTML = `
        <div class="evaluation-grid">
          <section class="evaluation-card">
            <h3>관리자 확인 모드</h3>
            <p><strong>${escapeHtml(profile.name)}</strong> · ${escapeHtml(profile.handle)}</p>
            <p class="evaluation-muted">대표 계정에서는 평가 점수를 산정하지 않습니다. 직원들의 평가 수행 기록을 확인하는 관리자 전용 화면입니다.</p>
          </section>
          <section class="evaluation-card">
            <h3>평가 기간</h3>
            <p><strong>${EVALUATION_YEAR}.06.01 - ${EVALUATION_YEAR}.06.30</strong></p>
            <p class="evaluation-muted">${periodText}</p>
          </section>
        </div>
        ${info.isActive ? `
          <section class="evaluation-card">
            <h3>오늘의 지시</h3>
            <div class="evaluation-order-text">${escapeHtml(order ? order.text : '오늘 등록된 지시가 없습니다.')}</div>
            <p class="evaluation-mini-note">관리자 계정은 신호 보정 게임을 수행하지 않습니다. 오늘 직원들이 수행할 지시를 확인하는 용도입니다.</p>
          </section>
        ` : ''}
        <section class="evaluation-card">
          <h3>직원 평가 기록</h3>
          <p class="evaluation-muted">소속 구분 없이 전체 직원의 출석, 지시 완료, 퍼펙트 보정, 총점을 표시합니다.</p>
          <div class="admin-action-row">
            <button id="adminEvaluationRefresh" class="panel-btn primary" type="button">평가 기록 새로고침</button>
          </div>
          <div id="adminEvaluationReportList" class="admin-report-list">
            <div class="admin-mode-note">평가 기록을 불러오는 중입니다.</div>
          </div>
        </section>
      `;
      const refreshBtn = document.getElementById('adminEvaluationRefresh');
      if (refreshBtn) refreshBtn.addEventListener('click', () => loadAdminEvaluationReports(profile));
      loadAdminEvaluationReports(profile);
    }

    async function loadAdminEvaluationReports(profile){
      const mount = document.getElementById('adminEvaluationReportList');
      if (!mount) return;
      mount.innerHTML = '<div class="admin-mode-note">평가 기록을 불러오는 중입니다.</div>';
      if (!supabaseClient){
        mount.innerHTML = '<div class="admin-report-empty">평가 기록 조회 모듈이 준비되지 않았습니다.</div>';
        return;
      }
      try{
        let { data, error } = await supabaseClient
          .from('admin_evaluation_scores')
          .select('*')
          .order('total_score', { ascending:false })
          .order('joined_at', { ascending:true, nullsFirst:false })
          .limit(100);

        if (error){
          console.warn('Evaluation score view load failed. Trying raw event fallback:', error);
          const fallback = await supabaseClient
            .from('voxtek_events')
            .select('created_at, event_type, account_id, employee_name, local_date, detail')
            .in('event_type', ['EVAL_ATTENDANCE', 'DAILY_ORDER_CLEARED'])
            .gte('local_date', `${EVALUATION_YEAR}-06-01`)
            .lte('local_date', `${EVALUATION_YEAR}-06-30`)
            .order('created_at', { ascending:false })
            .limit(2000);
          data = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;
        renderAdminEvaluationReports(data || []);
      }catch(error){
        console.warn('Evaluation report load failed:', error);
        mount.innerHTML = '<div class="admin-report-empty">평가 기록 조회에 실패했습니다. 평가 기록 조회용 프로그램 설정을 확인하십시오.</div>';
      }
    }

    function renderAdminEvaluationSummary(results){
      const mount = document.getElementById('adminEvaluationReportList');
      if (!mount) return;
      const filtered = (results || []).filter((item) => item.attendance || item.clearCount || item.perfectCount || item.total);
      if (!filtered.length){
        mount.innerHTML = '<div class="admin-report-empty">표시할 평가 기록이 없습니다.</div>';
        return;
      }
      mount.innerHTML = filtered.map((item, index) => {
        const rank = Number(item.rank || index + 1);
        const reward = item.rewardLabel || rewardLabelFromRank(rank);
        return `
        <article class="admin-report-card evaluation-report-card">
          <div class="admin-report-no">${pad2(rank).padStart(3, '0')}</div>
          <div class="admin-report-main">
            <dl>
              <dt>직원 이름</dt><dd>${escapeHtml(item.employeeName || '-')}</dd>
              <dt>소속</dt><dd>${escapeHtml(item.department || '-')}</dd>
              <dt>팀</dt><dd>${escapeHtml(item.team || '-')}</dd>
              <dt>직급</dt><dd>${escapeHtml(item.grade || item.position || '-')}</dd>
              <dt>특혜</dt><dd>${escapeHtml(reward)}</dd>
              <dt>출석</dt><dd>${item.attendance} / 30</dd>
              <dt>지시 완료</dt><dd>${item.clearCount} / 30</dd>
              <dt>퍼펙트</dt><dd>${item.perfectCount} / 30</dd>
              <dt>점수</dt><dd><strong>${item.total} / 120</strong></dd>
              <dt>최근 기록</dt><dd>${escapeHtml(item.latestAt ? formatDate(item.latestAt) : '-')}</dd>
            </dl>
          </div>
        </article>
      `;
      }).join('');
    }

    function renderAdminEvaluationReports(records){
      const mount = document.getElementById('adminEvaluationReportList');
      if (!mount) return;
      if (!records.length){
        mount.innerHTML = `
          <div class="admin-report-empty">
            아직 접수된 평가 기록이 없습니다.<br>
            평가가 시작되면 직원별 출석, 지시 완료, 퍼펙트 보정, 총점이 표시됩니다.
          </div>
        `;
        return;
      }
      if ('total_score' in records[0] || 'attendance_days' in records[0]){
        const results = records.map((row) => {
          const rank = Number(row.rank || 0);
          return {
            employeeName:row.employee_name || '-',
            department:row.department || '-',
            team:row.team || '-',
            grade:row.grade || row.position || '-',
            position:row.grade || row.position || '-',
            rewardLabel:row.reward_label || rewardLabelFromRank(rank),
            attendance:Number(row.attendance_days || 0),
            clearCount:Number(row.order_clear_days || 0),
            perfectCount:Number(row.perfect_days || 0),
            total:Number(row.total_score || 0),
            latestAt:row.latest_recorded_at || row.created_at || '',
            joinedAt:row.joined_at || '',
            rank:rank || ''
          };
        });
        renderAdminEvaluationSummary(results);
        return;
      }

      const grouped = new Map();
      records.forEach((row) => {
        const detail = row && typeof row.detail === 'object' && row.detail ? row.detail : {};
        const key = row.account_id || row.employee_name || 'unknown';
        if (!grouped.has(key)){
          grouped.set(key, {
            accountId:key,
            employeeName:row.employee_name || '-',
            department:detail.department || '-',
            team:detail.team || '-',
            grade:detail.grade || detail.position || '-',
            position:detail.grade || detail.position || '-',
            joinedAt:detail.joined_at || '',
            latestAt:row.created_at || '',
            attendanceDates:new Set(),
            clearDates:new Set(),
            perfectDates:new Set()
          });
        }
        const item = grouped.get(key);
        if ((!item.department || item.department === '-') && detail.department) item.department = detail.department;
        if ((!item.team || item.team === '-') && detail.team) item.team = detail.team;
        if ((!item.grade || item.grade === '-') && (detail.grade || detail.position)) item.grade = detail.grade || detail.position;
        item.position = item.grade;
        if (!item.joinedAt && detail.joined_at) item.joinedAt = detail.joined_at;
        if (row.created_at && (!item.latestAt || row.created_at > item.latestAt)) item.latestAt = row.created_at;
        const dateKey = row.local_date || (detail.client_time ? String(detail.client_time).slice(0, 10) : '');
        if (!dateKey) return;
        if (row.event_type === 'EVAL_ATTENDANCE') item.attendanceDates.add(dateKey);
        if (row.event_type === 'DAILY_ORDER_CLEARED'){
          item.clearDates.add(dateKey);
          if (detail.perfect === true || detail.perfect === 'true') item.perfectDates.add(dateKey);
        }
      });
      const results = Array.from(grouped.values()).map((item) => {
        const attendance = item.attendanceDates.size;
        const clearCount = item.clearDates.size;
        const perfectCount = item.perfectDates.size;
        return { ...item, attendance, clearCount, perfectCount, total:attendance + clearCount * 2 + perfectCount };
      }).filter((item) => item.attendance || item.clearCount || item.perfectCount);
      if (!results.length){
        mount.innerHTML = '<div class="admin-report-empty">표시할 평가 기록이 없습니다.</div>';
        return;
      }
      results.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        const aj = a.joinedAt ? new Date(a.joinedAt).getTime() : Infinity;
        const bj = b.joinedAt ? new Date(b.joinedAt).getTime() : Infinity;
        if (aj !== bj) return aj - bj;
        return String(a.employeeName).localeCompare(String(b.employeeName), 'ko');
      });
      renderAdminEvaluationSummary(results.map((item, index) => ({ ...item, rank:index + 1, rewardLabel:rewardLabelFromRank(index + 1) })));
    }

    function renderEvaluation(){
      if (!evaluationBody) return;
      const employee = getActiveEmployee();
      if (!employee){
        evaluationBody.innerHTML = '<div class="evaluation-lock"><div class="evaluation-lock-box"><h3>NO EMPLOYEE DATA</h3><p>사원 기록을 먼저 생성하십시오.</p></div></div>';
        return;
      }
      if (isAdminEmployee(employee)){
        renderAdminEvaluation(employee);
        return;
      }
      const info = evaluationTodayInfo();
      if (evaluationStatus) evaluationStatus.textContent = info.isActive ? 'ACTIVE' : (info.isBefore ? 'LOCKED' : 'CLOSED');
      if (!info.isActive){
        const state = evaluationLoadState(employee);
        const score = evaluationScore(state);
        const message = info.isBefore
          ? `평가 시스템은 ${EVALUATION_YEAR}.06.01 00:00부터 활성화됩니다. 현재는 사전 공지만 열람 가능합니다.`
          : `6월 인사 평가 기간이 종료되었습니다. 최종 집계는 관리자 확인 후 별도 공지됩니다.`;
        evaluationBody.innerHTML = `
          <div class="evaluation-lock">
            <div class="evaluation-lock-box">
              <h3>${info.isBefore ? 'JUNE REVIEW LOCKED' : 'JUNE REVIEW CLOSED'}</h3>
              <p>${message}</p>
              <p class="evaluation-muted">현재 개인 기록: 출석 ${score.attendance}/30 · 지시 완료 ${score.clearCount}/30 · 퍼펙트 ${score.perfectCount}/30 · ${score.total}/120점</p>
            </div>
          </div>
        `;
        return;
      }
      evaluationEnsureAttendance();
      const state = evaluationLoadState(employee);
      const dept = getDepartmentInfo(employee);
      const role = displayRoleForEmployee(employee);
      const order = evaluationCurrentOrder();
      const cleared = state.clearedOrders[info.key];
      evaluationBody.innerHTML = `
        <div class="evaluation-grid">
          <section class="evaluation-card">
            <h3>사원 평가 현황</h3>
            <p><strong>${escapeHtml(employee.name)}</strong> 사원 · ${escapeHtml(dept.name)} 소속 · ${escapeHtml(role.team || '-')} · ${escapeHtml(role.grade || '-')}</p>
            ${evaluationRenderStats(state)}
            <p class="evaluation-mini-note">평가 점수 = 출석 1점 + 오늘의 지시 완료 2점 + 퍼펙트 보정 1점입니다.</p>
          </section>
          <section class="evaluation-card">
            <h3>평가 기간</h3>
            <p><strong>${EVALUATION_YEAR}.06.01 - ${EVALUATION_YEAR}.06.30</strong></p>
            <p class="evaluation-muted">랭킹은 평가 종료 후 별도 집계됩니다.</p>
          </section>
        </div>
        <section class="evaluation-card">
          <h3>오늘의 지시</h3>
          <div class="evaluation-order-text">${escapeHtml(order ? order.text : '오늘 등록된 지시가 없습니다.')}</div>
          <div id="evaluationGameMount" class="evaluation-game ${order && order.difficulty === 'EXTREME' ? 'is-extreme' : ''}">
            ${cleared ? evaluationRenderCompleted(cleared) : evaluationRenderGameReady(order)}
          </div>
        </section>
      `;
      evaluationBindGame(order, !!cleared);
    }

    function evaluationRenderCompleted(record){
      return `
        <div class="evaluation-complete">
          <strong>ORDER COMPLETE</strong><br>
          오늘의 지시 수행 기록이 이미 반영되었습니다.<br>
          ${record.perfect ? '퍼펙트 보정 보너스가 적용되었습니다.' : '보정 완료 점수가 적용되었습니다.'}
        </div>
      `;
    }

    function evaluationRenderGameReady(order){
      if (!order) return '<p class="evaluation-muted">오늘 등록된 신호 보정 임무가 없습니다.</p>';
      return `
        <div class="evaluation-game-head">
          <span>SIGNAL CALIBRATION</span>
          <span id="evaluationHitCounter">0/${order.game.requiredHits}</span>
        </div>
        <div class="evaluation-track" id="evaluationTrack" style="--eval-zone-width:${order.game.zoneWidth}%; --eval-zone-left:${Math.max(0, (100 - order.game.zoneWidth) / 2)}%; --eval-cursor-left:0%;">
          <div class="evaluation-zone" id="evaluationZone"></div>
          <div class="evaluation-cursor" id="evaluationCursor"></div>
        </div>
        <div id="evaluationGameMessage" class="evaluation-game-message">안정 구역에 커서를 맞춰 신호를 고정하십시오.</div>
        <div class="evaluation-actions">
          <button id="evaluationStartBtn" class="evaluation-btn" type="button">Start Calibration</button>
          <button id="evaluationLockBtn" class="evaluation-btn secondary" type="button" disabled>Lock Signal</button>
        </div>
      `;
    }

    function evaluationBindGame(order, alreadyCleared){
      if (!order || alreadyCleared) return;
      const startBtn = document.getElementById('evaluationStartBtn');
      const lockBtn = document.getElementById('evaluationLockBtn');
      if (startBtn) startBtn.addEventListener('click', () => evaluationStartGame(order));
      if (lockBtn) lockBtn.addEventListener('click', evaluationLockSignal);
      const track = document.getElementById('evaluationTrack');
      if (track) track.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'evaluationTrack') evaluationLockSignal();
      });
    }

    function evaluationPlayTone(kind){
      try{
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = kind === 'lost' ? 'sawtooth' : 'square';
        osc.frequency.value = kind === 'lost' ? 120 : 760;
        gain.gain.setValueAtTime(.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.08, ctx.currentTime + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + .18);
      }catch(error){}
    }

    function evaluationStartGame(order){
      if (evaluationGameState && evaluationGameState.rafId) cancelAnimationFrame(evaluationGameState.rafId);
      const info = evaluationTodayInfo();
      evaluationGameState = {
        order,
        dateKey:info.key,
        running:true,
        hits:0,
        misses:0,
        round:1,
        cursor:0,
        direction:1,
        startedAt:performance.now(),
        roundStartedAt:performance.now(),
        currentSpeed:order.game.speed,
        zoneLeft:Math.max(0, (100 - order.game.zoneWidth) / 2)
      };
      const startBtn = document.getElementById('evaluationStartBtn');
      const lockBtn = document.getElementById('evaluationLockBtn');
      if (startBtn) startBtn.disabled = true;
      if (lockBtn) lockBtn.disabled = false;
      evaluationPrepareRound();
      evaluationAnimateCursor();
    }

    function evaluationPrepareRound(){
      const state = evaluationGameState;
      if (!state) return;
      const order = state.order;
      const track = document.getElementById('evaluationTrack');
      const msg = document.getElementById('evaluationGameMessage');
      const width = order.game.zoneWidth;
      if (order.difficulty === 'EXTREME'){
        const seed = (state.round * 23 + state.misses * 17) % Math.max(1, 100 - width);
        state.zoneLeft = Math.max(2, Math.min(98 - width, seed));
        state.currentSpeed = order.game.speed + (state.round - 1) * .18 + state.misses * .06;
      } else {
        state.zoneLeft = Math.max(0, (100 - width) / 2);
        state.currentSpeed = order.game.speed;
      }
      if (track){
        track.style.setProperty('--eval-zone-width', `${width}%`);
        track.style.setProperty('--eval-zone-left', `${state.zoneLeft}%`);
      }
      if (msg){
        msg.classList.remove('lost');
        msg.textContent = `보정 진행: ${state.hits}/${order.game.requiredHits}`;
      }
      state.roundStartedAt = performance.now();
    }

    function evaluationAnimateCursor(){
      const state = evaluationGameState;
      if (!state || !state.running) return;
      const track = document.getElementById('evaluationTrack');
      const elapsed = performance.now() - state.roundStartedAt;
      const period = Math.max(620, 1700 / Math.max(.1, state.currentSpeed));
      const phase = (elapsed % period) / period;
      const cursor = phase < .5 ? phase * 200 : (1 - phase) * 200;
      state.cursor = cursor;
      if (track) track.style.setProperty('--eval-cursor-left', `${cursor}%`);
      state.rafId = requestAnimationFrame(evaluationAnimateCursor);
    }

    function evaluationLockSignal(){
      const state = evaluationGameState;
      if (!state || !state.running) return;
      const order = state.order;
      const width = order.game.zoneWidth;
      const hit = state.cursor >= state.zoneLeft && state.cursor <= state.zoneLeft + width;
      const msg = document.getElementById('evaluationGameMessage');
      const counter = document.getElementById('evaluationHitCounter');
      if (hit){
        state.hits += 1;
        evaluationPlayTone(order.difficulty === 'EXTREME' ? 'warn' : 'hit');
        if (counter) counter.textContent = `${state.hits}/${order.game.requiredHits}`;
        if (state.hits >= order.game.requiredHits){
          evaluationCompleteGame();
          return;
        }
        state.round += 1;
        evaluationPrepareRound();
      } else {
        state.misses += 1;
        evaluationPlayTone('lost');
        if (msg){
          msg.classList.add('lost');
          msg.textContent = 'SIGNAL LOST';
        }
        state.round += 1;
        setTimeout(() => {
          if (evaluationGameState && evaluationGameState.running) evaluationPrepareRound();
        }, 360);
      }
    }

    function evaluationCompleteGame(){
      const state = evaluationGameState;
      if (!state) return;
      state.running = false;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      const perfect = state.misses === 0;
      const elapsed = Math.round(performance.now() - state.startedAt);
      const employee = getStoredEmployee();
      const info = evaluationTodayInfo();
      const local = evaluationLoadState(employee);
      if (!local.clearedOrders[info.key]){
        local.clearedOrders[info.key] = {
          day:state.order.day,
          perfect,
          completedAt:new Date().toISOString(),
          attempts:state.hits + state.misses,
          misses:state.misses,
          clearTimeMs:elapsed,
          scoreGain:perfect ? 3 : 2
        };
        evaluationSaveState(local, employee);
        evaluationEventLog('DAILY_ORDER_CLEARED', {
          day:state.order.day,
          order_text:state.order.text,
          perfect,
          attempts:state.hits + state.misses,
          misses:state.misses,
          clear_time_ms:elapsed,
          score_gain:perfect ? 3 : 2
        });
      }
      const mount = document.getElementById('evaluationGameMount');
      if (mount) mount.innerHTML = evaluationRenderCompleted(local.clearedOrders[info.key]);
      setTimeout(renderEvaluation, 180);
    }
