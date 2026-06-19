    function getDepartmentInfo(employee = getStoredEmployee()){
      const key = getDepartmentKeyFromBadge(employee && employee.badge ? employee.badge : '');
      const map = {
        valentino: { key:'valentino', name:'발렌티노', line:'VALENTINO LINE' },
        vox: { key:'vox', name:'복스', line:'VOX LINE' },
        velvette: { key:'velvette', name:'벨벳', line:'VELVETTE LINE' },
        unknown: { key:'unknown', name:'미확인 소속', line:'UNASSIGNED LINE' }
      };
      return map[key] || map.unknown;
    }

    function vocScroll(includeWindow = false){
      if (vocRoom) vocRoom.scrollTop = vocRoom.scrollHeight;
      if (includeWindow){
        const supportWindow = document.getElementById('window-support');
        const supportBody = supportWindow ? supportWindow.querySelector('.window-body') : null;
        if (supportBody) supportBody.scrollTop = supportBody.scrollHeight;
      }
    }

    function vocScrollToBottom(includeWindow = true){
      vocScroll(includeWindow);
      requestAnimationFrame(() => vocScroll(includeWindow));
      setTimeout(() => vocScroll(includeWindow), 80);
      setTimeout(() => vocScroll(includeWindow), 220);
    }

    function vocFormatAnswerText(value){
      return escapeHtml(value || '').replace(/\n/g, '<br>');
    }

    function vocFindAnswerLane(key){
      return VOC_ANSWER_LANES.find((lane) => lane.key === key) || VOC_ANSWER_LANES[0];
    }

    function vocRenderPublicAnswers(laneKey){
      if (!vocPublicAnswers) return;
      const lane = vocFindAnswerLane(laneKey || vocPublicActiveLane || 'valentino');
      const items = VOC_PUBLIC_ANSWERS[lane.key] || [];
      const cards = items.length
        ? items.map((item) => `
            <article class="voc-answer-card">
              <div class="voc-answer-question">${vocFormatAnswerText(item.question)}</div>
              <div class="voc-answer-label">답변</div>
              <div class="voc-answer-reply">${vocFormatAnswerText(item.answer)}</div>
              ${item.date ? `<div class="voc-answer-meta">${escapeHtml(item.date)}</div>` : ''}
            </article>
          `).join('')
        : `<div class="voc-answer-empty">${escapeHtml(lane.empty)}<br>답변이 등록되면 익명 공개 기록으로 표시됩니다.</div>`;

      if (vocPublicTitle) vocPublicTitle.textContent = '공개 답변';
      if (vocPublicDesc) vocPublicDesc.textContent = '질문자 정보는 표시하지 않습니다. 선택한 대표 소속의 답변만 공개됩니다.';
      vocPublicAnswers.innerHTML = `
        <section class="voc-answer-column voc-answer-${lane.key}">
          <div class="voc-answer-title">
            <strong>${escapeHtml(lane.title)}</strong>
            <span>${escapeHtml(lane.label)}</span>
          </div>
          <div class="voc-answer-list">${cards}</div>
        </section>
      `;
    }

    function vocSetAdminInboxButton(open){
      if (!vocAdminInboxToggle) return;
      vocAdminInboxToggle.classList.toggle('is-active', !!open);
      vocAdminInboxToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function vocSetAdminAffiliationButton(open){
      if (!vocAdminAffiliationToggle) return;
      vocAdminAffiliationToggle.classList.toggle('is-active', !!open);
      vocAdminAffiliationToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function vocSetPublicButtons(open, activeLane){
      vocPublicButtons.forEach((button) => {
        const active = !!open && button.dataset.vocLane === activeLane;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-expanded', active ? 'true' : 'false');
      });
      if (open){
        vocSetAdminInboxButton(false);
        vocSetAdminAffiliationButton(false);
      }
    }

    function vocSetLauncherMode(admin){
      const launcher = document.querySelector('.voc-public-launcher');
      if (launcher){
        launcher.style.display = '';
        launcher.setAttribute('aria-label', admin ? '관리자 VOC 조회' : '공개 답변 소속 선택');
      }
      vocPublicButtons.forEach((button) => button.classList.toggle('hidden', !!admin));
      if (vocAdminInboxToggle) vocAdminInboxToggle.classList.toggle('hidden', !admin);
      if (vocAdminAffiliationToggle) vocAdminAffiliationToggle.classList.toggle('hidden', !admin);
    }

    function vocSetPublicBoardOpen(open, laneKey){
      if (!vocPublicBoard) return;
      const lane = vocFindAnswerLane(laneKey || vocPublicActiveLane || 'valentino');
      vocPublicActiveLane = open ? lane.key : '';

      if (open){
        vocRenderPublicAnswers(lane.key);
      }

      vocPublicBoard.classList.toggle('is-open', !!open);
      vocPublicBoard.setAttribute('aria-hidden', open ? 'false' : 'true');
      vocSetPublicButtons(open, lane.key);

      if (open){
        requestAnimationFrame(() => {
          vocPublicBoard.scrollIntoView({ block:'nearest', behavior:'smooth' });
        });
      } else {
        vocScrollToBottom(true);
      }
    }

    function vocRenderAdminVocLoading(){
      if (vocPublicTitle) vocPublicTitle.textContent = '접수된 VOC 건의';
      if (vocPublicDesc) vocPublicDesc.textContent = '소속과 문의내용만 표시합니다. 버그 확인 시 제보 바랍니다.';
      if (vocPublicAnswers){
        vocPublicAnswers.innerHTML = `
          <section class="voc-answer-column voc-answer-admin">
            <div class="voc-answer-title">
              <strong>건의 조회 중</strong>
              <span>ADMIN VOC</span>
            </div>
            <div class="voc-answer-list">
              <div class="voc-answer-empty">접수된 VOC 건의를 불러오는 중입니다.</div>
            </div>
          </section>
        `;
      }
    }

    function vocRenderAdminVocRows(items){
      if (!vocPublicAnswers) return;
      const rows = items.length
        ? items.map((item) => `
            <article class="voc-answer-card">
              <dl class="voc-admin-inquiry-card">
                <dt>소속</dt>
                <dd>${escapeHtml(item.department || '미확인 소속')}</dd>
                <dt>문의내용</dt>
                <dd>${vocFormatAnswerText(item.message || '')}</dd>
              </dl>
              ${item.createdAt ? `<div class="voc-answer-meta">${escapeHtml(formatDate(item.createdAt))}</div>` : ''}
            </article>
          `).join('')
        : `<div class="voc-answer-empty">표시할 VOC 건의가 없습니다.<br>직원이 불편사항을 작성해 전송하면 이곳에 소속과 문의내용만 표시됩니다.</div>`;

      vocPublicAnswers.innerHTML = `
        <section class="voc-answer-column voc-answer-admin">
          <div class="voc-answer-title">
            <strong>접수된 건의</strong>
            <span>ADMIN VOC</span>
          </div>
          <div class="voc-answer-list">${rows}</div>
        </section>
      `;
    }

    async function vocFetchAdminVocRows(){
      if (!supabaseClient) throw new Error('Supabase 연결 모듈을 찾지 못했습니다.');

      const rpcResult = await supabaseClient.rpc('get_admin_voc_inbox');
      if (!rpcResult.error){
        return (rpcResult.data || [])
          .map((row) => ({
            message:String(row.message || '').trim(),
            department:String(row.department || '미확인 소속').trim(),
            createdAt:row.created_at || ''
          }))
          .filter((item) => item.message)
          .slice(0, 50);
      }

      console.warn('Admin VOC RPC load failed. Trying direct table fallback:', rpcResult.error);

      const tableResult = await supabaseClient
        .from('voxtek_events')
        .select('created_at, detail')
        .eq('event_type', 'VOC_SUBMITTED')
        .order('created_at', { ascending:false })
        .limit(80);

      if (tableResult.error) throw tableResult.error;

      return (tableResult.data || [])
        .map((row) => {
          const detail = row && typeof row.detail === 'object' && row.detail ? row.detail : {};
          const source = String(detail.source || '');
          const message = String(detail.message || detail.text || '').trim();
          const department = String(detail.department || detail.department_line || '미확인 소속').trim();
          return { source, message, department, createdAt:row.created_at || '' };
        })
        .filter((item) => item.source === 'voc_center' && item.message)
        .slice(0, 50);
    }

    async function vocLoadAdminVocSubmissions(){
      vocRenderAdminVocLoading();
      try{
        const items = await vocFetchAdminVocRows();
        if (vocPublicDesc) vocPublicDesc.textContent = '직원 식별 정보는 숨기고, 소속과 문의내용만 표시합니다.';
        vocRenderAdminVocRows(items);
      }catch(error){
        console.warn('Admin VOC submissions load failed:', error);
        const message = error && error.message ? error.message : '알 수 없는 오류';
        if (vocPublicTitle) vocPublicTitle.textContent = '들어온 VOC 건의';
        if (vocPublicDesc) vocPublicDesc.textContent = 'VOC 건의 조회에 실패했습니다. get_admin_voc_inbox 프로그램 또는 SELECT 권한을 확인하십시오. 버그 제보 전달 바랍니다.';
        if (vocPublicAnswers){
          vocPublicAnswers.innerHTML = `
            <section class="voc-answer-column voc-answer-admin">
              <div class="voc-answer-title">
                <strong>조회 실패</strong>
                <span>ADMIN VOC</span>
              </div>
              <div class="voc-answer-list">
                <div class="voc-answer-empty">건의 목록을 불러오지 못했습니다.<br><br>오류: ${escapeHtml(message)}</div>
              </div>
            </section>
          `;
        }
      }
    }

    function vocRenderAdminAffiliationLoading(){
      if (vocPublicTitle) vocPublicTitle.textContent = '소속 변경 요청';
      if (vocPublicDesc) vocPublicDesc.textContent = '대기 중인 소속 변경 요청을 확인하고 승인할 수 있습니다.';
      if (vocPublicAnswers){
        vocPublicAnswers.innerHTML = `
          <section class="voc-answer-column voc-answer-admin">
            <div class="voc-answer-title">
              <strong>요청 조회 중</strong>
              <span>ADMIN HR</span>
            </div>
            <div class="voc-answer-list">
              <div class="voc-answer-empty">접수된 소속 변경 요청을 불러오는 중입니다.</div>
            </div>
          </section>
        `;
      }
    }

    function departmentDefaultsForApproval(key, name){
      const cleanKey = String(key || '').trim();
      const cleanName = String(name || '').trim();
      if (cleanKey === 'vox' || cleanName === '복스') return { key:'vox', name:'복스', badge:'v2.png', team:pickRandomTeam('vox'), grade:DEFAULT_GRADE };
      if (cleanKey === 'valentino' || cleanName === '발렌티노') return { key:'valentino', name:'발렌티노', badge:'v1.png', team:pickRandomTeam('valentino'), grade:DEFAULT_GRADE };
      if (cleanKey === 'velvette' || cleanName === '벨벳') return { key:'velvette', name:'벨벳', badge:'v3.png', team:pickRandomTeam('velvette'), grade:DEFAULT_GRADE };
      return { key:cleanKey || 'unknown', name:cleanName || '미확인 소속', badge:'v1.png', team:pickRandomTeam('unknown'), grade:DEFAULT_GRADE };
    }

    function vocRequestStatusLabel(status){
      const value = String(status || 'pending').toLowerCase();
      if (value === 'approved') return '승인 완료';
      if (value === 'rejected') return '반려';
      return '대기 중';
    }

    let directSecretaryLastAffiliationItems = [];

    function directSecretaryPanelHtml(){
      const staff = directSecretaryGetStaffList();
      const staffCards = staff.length ? staff.map((item) => {
        const label = directSecretaryStaffLabel(item);
        return `
          <article class="voc-answer-card voc-admin-request-card" data-direct-secretary-row="${escapeHtml(item.employeeId)}">
            <span class="voc-admin-request-status" data-direct-secretary-chip="${escapeHtml(item.employeeId)}">상태 확인 중</span>
            <dl>
              <dt>직원 ID</dt>
              <dd>${escapeHtml(item.employeeId)}</dd>
              <dt>표시명</dt>
              <dd>${escapeHtml(label)}</dd>
              <dt>팀</dt>
              <dd><strong>${escapeHtml(DIRECT_SECRETARY_TEAM)}</strong></dd>
              <dt>조건</dt>
              <dd>복스 소속에서만 설정 가능 · 해제 시 이전 복스 팀으로 복귀</dd>
              <dt>현재 상태</dt>
              <dd data-direct-secretary-status="${escapeHtml(item.employeeId)}">원격 프로필 확인 중입니다.</dd>
            </dl>
            <div class="voc-admin-request-actions">
              <button class="voc-approve-request" type="button" data-direct-secretary-action="assign" data-employee-id="${escapeHtml(item.employeeId)}">설정</button>
              <button class="voc-approve-request" type="button" data-direct-secretary-action="release" data-employee-id="${escapeHtml(item.employeeId)}">해제</button>
              <button class="voc-approve-request" type="button" data-direct-secretary-remove="${escapeHtml(item.employeeId)}">목록 삭제</button>
            </div>
          </article>
        `;
      }).join('') : `
        <div class="voc-answer-empty">등록된 직원 ID가 없습니다.<br>아래 입력칸에 직원 ID를 추가한 뒤 설정 버튼을 누르십시오.</div>
      `;

      return `
        <article class="voc-answer-card voc-admin-request-card">
          <div class="voc-answer-question">직속비서팀 지정 관리</div>
          <div class="voc-answer-meta">직원 ID를 등록한 뒤 설정/해제합니다. 직속비서팀은 복스 소속에서만 적용됩니다.</div>
          <dl>
            <dt>직원 ID</dt>
            <dd><input id="directSecretaryEmployeeIdInput" class="search-input" type="text" autocomplete="off" placeholder="예: VT-123456"></dd>
            <dt>표시명</dt>
            <dd><input id="directSecretaryEmployeeNameInput" class="search-input" type="text" autocomplete="off" placeholder="이름 입력"></dd>
          </dl>
          <div class="voc-admin-request-actions">
            <button id="directSecretaryAddBtn" class="voc-approve-request" type="button">목록 추가</button>
          </div>
          <div class="voc-answer-meta">직원 ID 입력칸에 “VT-123456 이름”처럼 한 번에 적어도 자동으로 분리됩니다.</div>
        </article>
        ${staffCards}
      `;
    }

    function directSecretaryBindButtons(){
      if (!vocPublicAnswers) return;
      const addBtn = vocPublicAnswers.querySelector('#directSecretaryAddBtn');
      const idInput = vocPublicAnswers.querySelector('#directSecretaryEmployeeIdInput');
      const nameInput = vocPublicAnswers.querySelector('#directSecretaryEmployeeNameInput');
      if (addBtn) addBtn.addEventListener('click', directSecretaryAddFromForm);
      [idInput, nameInput].forEach((input) => {
        if (!input) return;
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') directSecretaryAddFromForm();
        });
      });
      vocPublicAnswers.querySelectorAll('[data-direct-secretary-action]').forEach((button) => {
        button.addEventListener('click', () => directSecretaryToggle(button.dataset.employeeId, button.dataset.directSecretaryAction, button));
      });
      vocPublicAnswers.querySelectorAll('[data-direct-secretary-remove]').forEach((button) => {
        button.addEventListener('click', () => directSecretaryRemoveFromList(button.dataset.directSecretaryRemove));
      });
      directSecretaryRefreshStatuses();
    }

    function directSecretaryAddFromForm(){
      if (!vocPublicAnswers) return;
      const idInput = vocPublicAnswers.querySelector('#directSecretaryEmployeeIdInput');
      const nameInput = vocPublicAnswers.querySelector('#directSecretaryEmployeeNameInput');
      const parsed = directSecretaryParseStaffInput(idInput ? idInput.value : '', nameInput ? nameInput.value : '');
      if (!parsed.employeeId){
        showToast('직원 ID를 입력해줘.');
        if (idInput) idInput.focus();
        return;
      }
      const result = directSecretaryUpsertStaff(parsed);
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      showToast(result.updated ? '목록 갱신 완료.' : '목록 추가 완료.');
      vocRenderAdminAffiliationRows(directSecretaryLastAffiliationItems || []);
    }

    function directSecretaryRemoveFromList(employeeId){
      const id = normalizeDirectSecretaryEmployeeId(employeeId);
      if (!id) return;
      directSecretarySetStaffList(directSecretaryGetStaffList().filter((staff) => staff.employeeId !== id));
      showToast('목록에서 삭제했습니다.');
      vocRenderAdminAffiliationRows(directSecretaryLastAffiliationItems || []);
    }

    function directSecretarySetStatus(employeeId, text, chipText = '', active = false){
      const statusEl = vocPublicAnswers ? vocPublicAnswers.querySelector(`[data-direct-secretary-status="${escapeCssIdentifier(employeeId)}"]`) : null;
      const chipEl = vocPublicAnswers ? vocPublicAnswers.querySelector(`[data-direct-secretary-chip="${escapeCssIdentifier(employeeId)}"]`) : null;
      if (statusEl) statusEl.innerHTML = text;
      if (chipEl){
        chipEl.textContent = chipText || (active ? '설정됨' : '일반 팀');
        chipEl.classList.toggle('done', !!active);
      }
    }

    function directSecretarySetButtonState(employeeId, active){
      if (!vocPublicAnswers) return;
      const assignBtn = vocPublicAnswers.querySelector(`[data-direct-secretary-action="assign"][data-employee-id="${escapeCssIdentifier(employeeId)}"]`);
      const releaseBtn = vocPublicAnswers.querySelector(`[data-direct-secretary-action="release"][data-employee-id="${escapeCssIdentifier(employeeId)}"]`);
      if (assignBtn) assignBtn.disabled = !!active;
      if (releaseBtn) releaseBtn.disabled = !active;
    }

    async function directSecretaryFetchProfiles(){
      if (!supabaseClient) throw new Error('Supabase 연결 모듈을 찾지 못했습니다.');
      const ids = directSecretaryGetStaffList().map((staff) => staff.employeeId);
      if (!ids.length) return new Map();
      const { data, error } = await supabaseClient
        .from('voxtek_employee_profiles')
        .select('*')
        .in('employee_id', ids);
      if (error) throw error;
      const map = new Map();
      (data || []).forEach((row) => map.set(row.employee_id, row));
      return map;
    }

    async function directSecretaryRefreshStatuses(){
      if (!vocPublicAnswers) return;
      const staffList = directSecretaryGetStaffList();
      if (!staffList.length) return;
      try{
        const profiles = await directSecretaryFetchProfiles();
        staffList.forEach((staff) => {
          const profile = profiles.get(staff.employeeId);
          const team = profile ? String(profile.team || '').trim() : '';
          const deptKey = profile ? String(profile.department_key || '').trim() : '';
          const deptName = profile ? String(profile.department_name || '').trim() : '';
          const active = deptKey === 'vox' && team === DIRECT_SECRETARY_TEAM;
          if (!profile){
            directSecretarySetStatus(staff.employeeId, '원격 프로필 없음 · 설정 시 복스 소속으로 새 프로필이 생성됩니다.', '미등록', false);
            directSecretarySetButtonState(staff.employeeId, false);
            return;
          }
          directSecretarySetStatus(
            staff.employeeId,
            `${escapeHtml(deptName || getDepartmentLabelByKey(deptKey))} 소속 · ${escapeHtml(team || '-')}`,
            active ? '설정됨' : '일반 팀',
            active
          );
          directSecretarySetButtonState(staff.employeeId, active);
        });
      }catch(error){
        console.warn('Direct secretary status load failed:', error);
        staffList.forEach((staff) => {
          directSecretarySetStatus(staff.employeeId, '상태 조회 실패. Supabase 프로필 테이블 접근 권한을 확인하십시오.', '조회 실패', false);
        });
      }
    }

    function directSecretaryProfilePayload(staff, base = {}, team = DIRECT_SECRETARY_TEAM){
      const now = new Date().toISOString();
      const displayName = String(base.display_name || staff.displayName || staff.name || staff.employeeId || '').trim();
      const grade = normalizeGrade(base.grade || DEFAULT_GRADE, DEFAULT_GRADE);
      return {
        employee_id:staff.employeeId,
        display_name:displayName,
        joined_at:base.joined_at || now,
        birthday:base.birthday || null,
        birthday_month_day:base.birthday_month_day || '',
        department_key:'vox',
        department_name:'복스',
        badge_src:'v2.png',
        team,
        grade,
        updated_at:now
      };
    }

    async function directSecretaryPreviousTeamFromEvent(staff){
      if (!supabaseClient || !staff) return '';
      try{
        const { data, error } = await supabaseClient
          .from('voxtek_events')
          .select('detail')
          .eq('event_type', 'DIRECT_SECRETARY_TEAM_ASSIGNED')
          .eq('account_id', staff.employeeId)
          .order('created_at', { ascending:false })
          .limit(1);
        if (error) throw error;
        const detail = Array.isArray(data) && data[0] && typeof data[0].detail === 'object' ? data[0].detail : null;
        return detail ? String(detail.previous_team || '').trim() : '';
      }catch(error){
        console.warn('Direct secretary previous team event lookup failed:', error);
        return '';
      }
    }

    async function directSecretaryRecordEvent(eventType, staff, detail = {}){
      if (!supabaseClient) return;
      try{
        await supabaseClient.from('voxtek_events').insert({
          event_type:eventType,
          account_id:staff.employeeId,
          employee_name:directSecretaryStaffLabel(staff),
          mission_id:null,
          creature_name:null,
          mission_day:null,
          points:null,
          affection:null,
          local_date:typeof currentDateKey === 'function' ? currentDateKey() : new Date().toISOString().slice(0, 10),
          session_id:typeof getEventSession === 'function' ? getEventSession() : '',
          user_agent:navigator.userAgent,
          detail:{
            source:'direct_secretary_team_console',
            employee_id:staff.employeeId,
            employee_name:directSecretaryStaffLabel(staff),
            team:DIRECT_SECRETARY_TEAM,
            client_time:new Date().toISOString(),
            ...detail
          }
        });
      }catch(error){
        console.warn(`[${eventType}] Direct secretary event log failed:`, error);
      }
    }

    async function directSecretaryToggle(employeeId, action, button){
      if (!supabaseClient) return showToast('Supabase 연결 모듈이 없습니다.');
      const staff = directSecretaryStaffById(employeeId);
      if (!staff) return showToast('목록에 등록된 직원 ID가 아닙니다.');

      const originalText = button ? button.textContent : '';
      if (button){
        button.disabled = true;
        button.textContent = action === 'assign' ? '설정 중' : '해제 중';
      }

      try{
        const { data:profile, error:selectError } = await supabaseClient
          .from('voxtek_employee_profiles')
          .select('*')
          .eq('employee_id', staff.employeeId)
          .maybeSingle();
        if (selectError) throw selectError;

        if (action === 'assign'){
          const currentTeam = profile ? String(profile.team || '').trim() : '';
          const currentDeptKey = profile ? String(profile.department_key || '').trim() : '';
          const previousTeam = currentDeptKey === 'vox' && currentTeam && currentTeam !== DIRECT_SECRETARY_TEAM
            ? normalizeDirectSecretaryRestoreTeam(currentTeam)
            : normalizeDirectSecretaryRestoreTeam(directSecretaryReadBackup(staff.employeeId)?.previousTeam);

          directSecretarySaveBackup(staff.employeeId, {
            previousTeam,
            previousGrade:profile ? profile.grade : DEFAULT_GRADE,
            previousDepartmentKey:'vox',
            previousDepartmentName:'복스',
            previousBadgeSrc:'v2.png'
          });

          const { error:upsertError } = await supabaseClient
            .from('voxtek_employee_profiles')
            .upsert(directSecretaryProfilePayload(staff, profile || {}, DIRECT_SECRETARY_TEAM), { onConflict:'employee_id' });
          if (upsertError) throw upsertError;

          await directSecretaryRecordEvent('DIRECT_SECRETARY_TEAM_ASSIGNED', staff, {
            previous_team:previousTeam,
            current_team:DIRECT_SECRETARY_TEAM
          });
          showToast('직속비서팀 설정 완료.');
        } else {
          const backup = directSecretaryReadBackup(staff.employeeId);
          const eventPreviousTeam = backup ? '' : await directSecretaryPreviousTeamFromEvent(staff);
          const restoreTeam = normalizeDirectSecretaryRestoreTeam(backup ? backup.previousTeam : (eventPreviousTeam || (profile ? profile.base_team || profile.team : '')));
          const { error:upsertError } = await supabaseClient
            .from('voxtek_employee_profiles')
            .upsert(directSecretaryProfilePayload(staff, profile || {}, restoreTeam), { onConflict:'employee_id' });
          if (upsertError) throw upsertError;

          directSecretaryRemoveBackup(staff.employeeId);
          await directSecretaryRecordEvent('DIRECT_SECRETARY_TEAM_RELEASED', staff, {
            restored_team:restoreTeam,
            previous_team:DIRECT_SECRETARY_TEAM
          });
          showToast(`${restoreTeam} 복귀 완료.`);
        }

        await directSecretaryRefreshStatuses();
      }catch(error){
        console.warn('Direct secretary toggle failed:', error);
        showToast('직속비서팀 처리 실패. 프로필 테이블 권한을 확인해줘.');
      }finally{
        if (button){
          button.textContent = originalText || (action === 'assign' ? '설정' : '해제');
        }
      }
    }

    function vocRenderAdminAffiliationRows(items){
      if (!vocPublicAnswers) return;
      const rows = items.length
        ? items.map((item) => {
            const status = String(item.status || 'pending').toLowerCase();
            const pending = status === 'pending';
            const requestId = item.id || item.request_id || '';
            return `
              <article class="voc-answer-card voc-admin-request-card">
                <span class="voc-admin-request-status ${pending ? '' : 'done'}">${escapeHtml(vocRequestStatusLabel(status))}</span>
                <dl>
                  <dt>직원</dt>
                  <dd>${escapeHtml(item.employee_name || '-')} <span class="voc-answer-meta">${escapeHtml(item.employee_id || '')}</span></dd>
                  <dt>현재 소속</dt>
                  <dd>${escapeHtml(item.current_department || '-')}</dd>
                  <dt>희망 소속</dt>
                  <dd><strong>${escapeHtml(item.requested_department || '-')}</strong></dd>
                  <dt>사유</dt>
                  <dd>${vocFormatAnswerText(item.reason || '-')}</dd>
                  <dt>접수일</dt>
                  <dd>${escapeHtml(item.created_at ? formatDate(item.created_at) : '-')}</dd>
                </dl>
                ${requestId && status !== 'rejected' ? `
                  <div class="voc-admin-request-actions">
                    <button class="voc-approve-request" type="button" data-approve-affiliation="${escapeHtml(String(requestId))}">${pending ? '승인' : '팀 재배정'}</button>
                  </div>
                ` : `<div class="voc-answer-meta">${item.handled_at ? `처리일: ${escapeHtml(formatDate(item.handled_at))}` : '처리된 요청입니다.'}</div>`}
              </article>
            `;
          }).join('')
        : `<div class="voc-answer-empty">대기 중인 소속 변경 요청이 없습니다.</div>`;

      vocPublicAnswers.innerHTML = `
        <section class="voc-answer-column voc-answer-admin">
          <div class="voc-answer-title">
            <strong>소속 변경 요청</strong>
            <span>ADMIN HR</span>
          </div>
          <div class="voc-answer-list">${directSecretaryPanelHtml()}${rows}</div>
        </section>
      `;
      vocBindAffiliationApprovalButtons();
      directSecretaryBindButtons();
    }

    async function vocFetchAdminAffiliationRows(){
      if (!supabaseClient) throw new Error('Supabase 연결 모듈을 찾지 못했습니다.');
      const { data, error } = await supabaseClient
        .from('voxtek_affiliation_requests')
        .select('id, created_at, status, employee_id, employee_name, current_department, requested_department, requested_department_key, reason, admin_note, handled_at')
        .order('created_at', { ascending:false })
        .limit(80);
      if (error) throw error;
      return data || [];
    }

    async function vocLoadAdminAffiliationRequests(){
      vocRenderAdminAffiliationLoading();
      try{
        const items = await vocFetchAdminAffiliationRows();
        directSecretaryLastAffiliationItems = items;
        if (vocPublicDesc) vocPublicDesc.textContent = '소속 변경 요청과 직속비서팀 설정/해제를 처리합니다. 직속비서팀은 복스 소속에서만 적용됩니다.';
        vocRenderAdminAffiliationRows(items);
      }catch(error){
        console.warn('Admin affiliation requests load failed:', error);
        const message = error && error.message ? error.message : '알 수 없는 오류';
        if (vocPublicTitle) vocPublicTitle.textContent = '소속 변경 요청';
        if (vocPublicDesc) vocPublicDesc.textContent = '소속 변경 요청 조회에 실패했습니다. 승인 패치 SQL 실행 여부를 확인하십시오.';
        if (vocPublicAnswers){
          vocPublicAnswers.innerHTML = `
            <section class="voc-answer-column voc-answer-admin">
              <div class="voc-answer-title">
                <strong>조회 실패</strong>
                <span>ADMIN HR</span>
              </div>
              <div class="voc-answer-list">
                <div class="voc-answer-empty">소속 변경 요청을 불러오지 못했습니다.<br><br>오류: ${escapeHtml(message)}</div>
              </div>
            </section>
          `;
        }
      }
    }

    function vocBindAffiliationApprovalButtons(){
      if (!vocPublicAnswers) return;
      vocPublicAnswers.querySelectorAll('[data-approve-affiliation]').forEach((button) => {
        button.addEventListener('click', () => vocApproveAffiliationRequest(button.dataset.approveAffiliation, button));
      });
    }

    async function vocApproveAffiliationRequest(requestId, button){
      if (!requestId || !supabaseClient) return;
      const originalText = button ? button.textContent : '';
      if (button){
        button.disabled = true;
        button.textContent = '처리 중';
      }
      try{
        const { data, error } = await supabaseClient.rpc('approve_voxtek_affiliation_request', {
          p_request_id:Number(requestId),
          p_admin_note:'관리자 승인'
        });
        if (error) throw error;
        showToast('소속 변경 적용 완료.');
        await vocLoadAdminAffiliationRequests();
      }catch(error){
        console.warn('Approve affiliation RPC failed:', error);
        try{
          await vocApproveAffiliationRequestDirect(requestId);
          showToast('소속 변경 적용 완료.');
          await vocLoadAdminAffiliationRequests();
        }catch(fallbackError){
          console.warn('Approve affiliation direct fallback failed:', fallbackError);
          if (button){
            button.disabled = false;
            button.textContent = originalText || '승인';
          }
          showToast('승인 실패. 승인 패치 SQL 실행 여부를 확인해줘.');
        }
      }
    }

    async function vocApproveAffiliationRequestDirect(requestId){
      const { data:request, error:requestError } = await supabaseClient
        .from('voxtek_affiliation_requests')
        .select('*')
        .eq('id', Number(requestId))
        .single();
      if (requestError) throw requestError;
      if (!request) throw new Error('요청을 찾지 못했습니다.');
      const dept = departmentDefaultsForApproval(request.requested_department_key, request.requested_department);
      const now = new Date().toISOString();
      const { error:profileError } = await supabaseClient
        .from('voxtek_employee_profiles')
        .upsert({
          employee_id:request.employee_id,
          display_name:request.employee_name || request.employee_id,
          department_key:dept.key,
          department_name:dept.name,
          badge_src:dept.badge,
          team:dept.team,
          grade:dept.grade,
          updated_at:now
        }, { onConflict:'employee_id' });
      if (profileError) throw profileError;
      const { error:updateError } = await supabaseClient
        .from('voxtek_affiliation_requests')
        .update({ status:'approved', admin_note:'관리자 승인', handled_at:now })
        .eq('id', Number(requestId));
      if (updateError) throw updateError;
    }

    function vocSetAdminAffiliationOpen(open){
      if (!vocPublicBoard) return;
      vocPublicActiveLane = open ? 'admin-affiliation' : '';

      if (open){
        vocLoadAdminAffiliationRequests();
      }

      vocPublicBoard.classList.toggle('is-open', !!open);
      vocPublicBoard.setAttribute('aria-hidden', open ? 'false' : 'true');
      vocSetPublicButtons(false, '');
      vocSetAdminInboxButton(false);
      vocSetAdminAffiliationButton(open);

      if (open){
        requestAnimationFrame(() => {
          vocPublicBoard.scrollIntoView({ block:'nearest', behavior:'smooth' });
        });
      } else {
        vocScrollToBottom(true);
      }
    }

    function vocSetAdminInboxOpen(open){
      if (!vocPublicBoard) return;
      vocPublicActiveLane = open ? 'admin-inquiries' : '';

      if (open){
        vocLoadAdminVocSubmissions();
      }

      vocPublicBoard.classList.toggle('is-open', !!open);
      vocPublicBoard.setAttribute('aria-hidden', open ? 'false' : 'true');
      vocSetPublicButtons(false, '');
      vocSetAdminAffiliationButton(false);
      vocSetAdminInboxButton(open);

      if (open){
        requestAnimationFrame(() => {
          vocPublicBoard.scrollIntoView({ block:'nearest', behavior:'smooth' });
        });
      } else {
        vocScrollToBottom(true);
      }
    }

    function vocBindPublicBoard(){
      if (!vocPublicBoard) return;
      vocPublicButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const laneKey = button.dataset.vocLane || 'valentino';
          const isSameOpen = vocPublicBoard.classList.contains('is-open') && vocPublicActiveLane === laneKey;
          vocSetPublicBoardOpen(!isSameOpen, laneKey);
        });
      });
      if (vocAdminInboxToggle){
        vocAdminInboxToggle.addEventListener('click', () => {
          const isSameOpen = vocPublicBoard.classList.contains('is-open') && vocPublicActiveLane === 'admin-inquiries';
          vocSetAdminInboxOpen(!isSameOpen);
        });
      }
      if (vocAdminAffiliationToggle){
        vocAdminAffiliationToggle.addEventListener('click', () => {
          const isSameOpen = vocPublicBoard.classList.contains('is-open') && vocPublicActiveLane === 'admin-affiliation';
          vocSetAdminAffiliationOpen(!isSameOpen);
        });
      }
      if (vocPublicClose){
        vocPublicClose.addEventListener('click', () => {
          if (vocPublicActiveLane === 'admin-affiliation') vocSetAdminAffiliationOpen(false);
          else if (vocPublicActiveLane === 'admin-inquiries') vocSetAdminInboxOpen(false);
          else vocSetPublicBoardOpen(false);
        });
      }
    }

    function vocClearActions(){
      if (vocActions) vocActions.innerHTML = '';
    }

    function vocAppendBubble(side, html, name = ''){
      if (!vocRoom) return null;
      const isLeft = side === 'left';
      const row = document.createElement('div');
      row.className = 'voc-row ' + (isLeft ? 'left' : 'right');
      if (isLeft){
        row.innerHTML = `
          <div class="voc-avatar">
            <img src="icon_5.png" alt="VOC" onerror="assetFail(this)" loading="lazy" decoding="async">
            <div class="fallback">VOC</div>
          </div>
          <div class="voc-stack">
            <div class="voc-name">${escapeHtml(name || 'VOXTEK VOC')}</div>
            <div class="voc-bubble left">${html}</div>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="voc-stack">
            <div class="voc-bubble right">${html}</div>
          </div>
        `;
      }
      vocRoom.appendChild(row);
      vocScroll();
      return row;
    }

    function vocAddChoice(label, handler, primary = false){
      if (!vocActions) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'voc-choice' + (primary ? ' primary' : '');
      btn.innerHTML = label;
      btn.addEventListener('click', handler);
      vocActions.appendChild(btn);
      vocScrollToBottom(true);
    }

    function vocSetStatus(text){
      if (vocStatus) vocStatus.textContent = text;
    }

    function vocBeginAdmin(employee){
      const profile = getAdminProfile(employee.adminKey);
      if (!profile) return;
      vocSetLauncherMode(true);
      vocFlowState = 'admin';
      vocRoom.innerHTML = `<div class="voc-date">${formatDateKey(currentDateKey())}</div>`;
      vocSetAdminInboxOpen(false);
      vocSetAdminAffiliationOpen(false);
      vocClearActions();
      vocSetStatus(profile.line);
      vocScrollToBottom(true);
      setTimeout(() => {
        vocAppendBubble('left', `안녕하십니까, ${escapeHtml(profile.name)} 사장님.<br>행복한 근무 환경을 만들기 위해 최소한의 노력을 다하는 복스테크 사내 VOC 센터입니다. 시키실 일이 있다면 말씀 주시면 최우선 처리하겠습니다.`);
        vocShowAdminChoices(profile);
        vocScrollToBottom(true);
      }, 220);
    }

    function vocShowAdminChoices(profile){
      vocClearActions();
      const others = Object.values(ADMIN_PROFILES).filter(item => item.key !== profile.key);
      others.forEach((target) => {
        vocAddChoice(`${escapeHtml(target.name)} 불러줘.`, () => vocAdminCallExecutive(profile, target));
      });
      vocAddChoice('시킬 일이 있어.', () => vocAdminTask(profile), true);
      vocAddChoice('문의 종료하기', () => vocAdminClose(profile));
      vocScrollToBottom(true);
    }

    function vocAdminClose(profile){
      vocClearActions();
      vocSetStatus('CLOSED');
      vocAppendBubble('right', '문의 종료하기');
      setTimeout(() => {
        vocAppendBubble('left', `${escapeHtml(profile.name)} 사장님, 관리자 VOC 회선을 종료하겠습니다.<br>필요하시면 언제든 다시 호출해 주십시오.`);
        vocClearActions();
        vocAddChoice('다시 호출하기', () => vocBegin(), true);
        vocScrollToBottom(true);
      }, 300);
    }

    function vocAdminCallExecutive(profile, target){
      vocClearActions();
      vocAppendBubble('right', `${escapeHtml(target.name)} 불러줘.`);
      setTimeout(() => {
        vocAppendBubble('left', '네, 바로 전달 드리겠습니다. 추가로 시키실 일이 있을까요?');
        vocShowAdminCommandInput(profile, { type:'call', target:target.key, targetName:target.name });
      }, 300);
    }

    function vocAdminTask(profile){
      vocClearActions();
      vocAppendBubble('right', '시킬 일이 있어.');
      setTimeout(() => {
        vocAppendBubble('left', '네, 말씀 주시면 진행하겠습니다.');
        vocShowAdminCommandInput(profile, { type:'task' });
      }, 300);
    }

    function vocShowAdminCommandInput(profile, meta = {}){
      vocClearActions();
      const wrap = document.createElement('div');
      wrap.className = 'voc-input-wrap active';
      wrap.innerHTML = `
        <textarea id="vocAdminCommandText" class="voc-input" maxlength="700" placeholder="지시 내용을 입력하세요."></textarea>
        <button id="vocAdminCommandSend" class="voc-send" type="button">전송</button>
        <div class="voc-mini-note">※ 관리자 지시는 내부 회선 기록으로 분류됩니다.</div>
      `;
      vocActions.appendChild(wrap);
      const textarea = document.getElementById('vocAdminCommandText');
      const send = document.getElementById('vocAdminCommandSend');
      if (textarea) textarea.focus();
      if (send){
        send.addEventListener('click', () => {
          const text = textarea ? textarea.value.trim() : '';
          if (!text){
            showToast('내용이 비어 있어.');
            return;
          }
          vocClearActions();
          vocAppendBubble('right', escapeHtml(text).replace(/\n/g, '<br>'));
          saveAdminVocCommand(profile, text, meta);
          setTimeout(() => {
            vocAppendBubble('left', '확인했습니다. 오늘도 복스테크를 위해 몸 바쳐 일하는 센터가 되겠습니다.');
            vocShowAdminChoices(profile);
            vocScrollToBottom(true);
          }, 300);
        });
      }
      vocScrollToBottom(true);
    }

    function saveAdminVocCommand(profile, text, meta = {}){
      const row = { at:new Date().toISOString(), admin:profile.name, handle:profile.handle, text, meta };
      try{
        const key = `voxtek_admin_voc_commands_${profile.key}_v1`;
        const logs = JSON.parse(localStorage.getItem(key) || '[]');
        logs.push(row);
        localStorage.setItem(key, JSON.stringify(logs.slice(-100)));
      }catch(error){
        console.warn('Admin VOC command local log failed:', error);
      }
      if (supabaseClient){
        supabaseClient.from('voxtek_events').insert({
          event_type:'VOC_SUBMITTED',
          account_id:`ADMIN-${profile.key.toUpperCase()}`,
          employee_name:profile.name,
          local_date:currentDateKey(),
          session_id:getEventSession(),
          user_agent:navigator.userAgent,
          detail:{
            source:'admin_voc_center',
            admin_key:profile.key,
            admin_name:profile.name,
            handle:profile.handle,
            department:`관리자 · ${profile.name}`,
            department_line:profile.line,
            inquiry_type:meta.type || 'task',
            target:meta.target || '',
            target_name:meta.targetName || '',
            message:text,
            text,
            client_time:row.at
          }
        }).then(({ error }) => { if (error) console.warn('Admin VOC command log failed:', error); });
      }
      showToast('관리자 지시 전송 완료.');
    }

    function vocBegin(){
      const employee = getActiveEmployee();
      if (!employee || !vocRoom || !vocActions) return;
      if (isAdminEmployee(employee)){
        vocBeginAdmin(employee);
        return;
      }
      vocSetLauncherMode(false);
      const dept = getDepartmentInfo(employee);
      vocFlowState = 'intro';
      vocRoom.innerHTML = `<div class="voc-date">${formatDateKey(currentDateKey())}</div>`;
      vocRenderPublicAnswers('valentino');
      vocSetPublicBoardOpen(false);
      vocClearActions();
      vocSetStatus('CONNECTING');
      vocScrollToBottom(true);
      setTimeout(() => {
        vocAppendBubble('left', '안녕하십니까. 행복한 근무 환경을 만들기 위해 최소한의 노력을 다하는 복스테크 사내 VOC 센터입니다.<br>성함과 소속을 말씀해 주시면 해당 소속 대표 회선으로 문의를 분류하겠습니다.');
        vocSetStatus(dept.line);
        vocClearActions();
        vocAddChoice(`안녕하세요. 저는 ${escapeHtml(dept.name)} 님 직속 ${escapeHtml(employee.name)}입니다.`, () => vocConfirmIdentity(employee, dept), true);
        vocScrollToBottom(true);
      }, 220);
    }

    function vocConfirmIdentity(employee, dept){
      vocClearActions();
      vocAppendBubble('right', `안녕하세요. 저는 ${escapeHtml(dept.name)} 님 직속 ${escapeHtml(employee.name)}입니다.`);
      vocSetStatus('INQUIRY');
      setTimeout(() => {
        vocAppendBubble('left', `${escapeHtml(employee.name)} 님, 확인되었습니다.<br>현재 소속은 ${escapeHtml(dept.name)} 님 직속으로 분류됩니다. 어떠한 일로 문의를 주셨습니까?`);
        vocShowInquiryChoices(employee, dept);
        vocScrollToBottom(true);
      }, 360);
    }

    function vocShowInquiryChoices(employee, dept){
      vocClearActions();
      vocAddChoice('하... 그냥 너무 힘들어요. 혹시 퇴사하면 어떻게 되나요?', () => vocAnswerPreset('quit', employee, dept));
      vocAddChoice('소속을 바꾸고 싶은데 방법이 없을까요?', () => vocAnswerPreset('change', employee, dept));
      vocAddChoice('불편사항을 접수하고 싶은데 말씀드려도 될까요?', () => vocAnswerPreset('complaint', employee, dept));
      vocScrollToBottom(true);
    }

    function vocAnswerPreset(type, employee, dept){
      const userTexts = {
        quit:'하... 그냥 너무 힘들어요. 혹시 퇴사하면 어떻게 되나요?',
        change:'소속을 바꾸고 싶은데 방법이 없을까요?',
        complaint:'불편사항을 접수하고 싶은데 말씀드려도 될까요?'
      };
      vocClearActions();
      vocAppendBubble('right', escapeHtml(userTexts[type]));
      if (type === 'quit'){
        setTimeout(() => {
          vocAppendBubble('left', '확인했습니다. 퇴사 시 현재 사원 기록, 근속일, 임무 데이터는 영구 삭제되며 복구되지 않습니다.<br>다만 복스테크는 언제나 새 인력을 환영하므로 재입사는 가능합니다. 단, 이전 기록이 존중될 거라는 착각은 권장하지 않습니다.');
          vocShowSimpleEnd(employee, dept, type);
        }, 360);
        return;
      }
      if (type === 'change'){
        setTimeout(() => {
          vocAppendBubble('left', '소속 변경 요청을 접수하려면 희망 소속을 선택하십시오.<br>승인 전까지 현재 소속은 유지되며, 요청 내용은 인사 검토 기록으로 남습니다.');
          vocShowAffiliationChoices(employee, dept);
        }, 360);
        return;
      }
      setTimeout(() => {
        vocAppendBubble('left', '접수 가능합니다. 작성하신 내용은 담당 대표님께 전달됩니다.<br>단, 불필요한 장문, 도발, 헛소리 등으로 그분들의 기분을 자극할 경우 신변 안전은 보장하지 않습니다.');
        vocShowFeedbackInput(employee, dept);
      }, 360);
    }

    function vocShowAffiliationChoices(employee, dept){
      vocClearActions();
      const options = [
        { key:'vox', name:'복스' },
        { key:'valentino', name:'발렌티노' },
        { key:'velvette', name:'벨벳' }
      ];
      options.forEach((target) => {
        vocAddChoice(`${escapeHtml(target.name)} 소속으로 변경 요청`, () => vocAskAffiliationReason(employee, dept, target), target.name !== dept.name);
      });
      vocAddChoice('요청 취소', () => {
        vocAppendBubble('right', '요청 취소');
        vocShowSimpleEnd(employee, dept, 'change_cancelled');
      });
      vocScrollToBottom(true);
    }

    function vocAskAffiliationReason(employee, dept, target){
      vocClearActions();
      vocAppendBubble('right', `${escapeHtml(target.name)} 소속으로 변경 요청`);
      setTimeout(() => {
        vocAppendBubble('left', `${escapeHtml(target.name)} 소속으로 변경을 요청하셨습니다.<br>변경 사유를 자유롭게 입력하십시오. 불필요한 말도 기록은 됩니다.`);
        vocShowAffiliationReasonInput(employee, dept, target);
      }, 300);
    }

    function vocShowAffiliationReasonInput(employee, dept, target){
      vocClearActions();
      const wrap = document.createElement('div');
      wrap.className = 'voc-input-wrap active';
      wrap.innerHTML = `
        <textarea id="vocAffiliationReasonText" class="voc-input" maxlength="600" placeholder="소속 변경 사유를 입력하세요."></textarea>
        <button id="vocAffiliationReasonSend" class="voc-send" type="button">전송</button>
        <div class="voc-mini-note">※ 요청은 접수 기록으로 저장됩니다.</div>
      `;
      vocActions.appendChild(wrap);
      const textarea = document.getElementById('vocAffiliationReasonText');
      const send = document.getElementById('vocAffiliationReasonSend');
      if (textarea) textarea.focus();
      if (send){
        send.addEventListener('click', () => {
          const reason = textarea ? textarea.value.trim() : '';
          if (!reason){
            showToast('변경 사유가 비어 있습니다.');
            return;
          }
          vocClearActions();
          vocAppendBubble('right', escapeHtml(reason).replace(/\n/g, '<br>'));
          vocFinish(employee, dept, {
            type:'affiliation_change_request',
            message:`희망 소속: ${target.name}\n변경 사유: ${reason}`,
            requestedDepartment:target.name,
            requestedDepartmentKey:target.key,
            currentDepartment:dept.name,
            reason
          });
        });
      }
      vocScrollToBottom(true);
    }

    function vocShowSimpleEnd(employee, dept, type){
      vocClearActions();
      vocAddChoice('도움이 되었습니다. 감사합니다.', () => {
        vocClearActions();
        vocAppendBubble('right', '도움이 되었습니다. 감사합니다.');
        vocFinish(employee, dept, { type, message:'' });
      }, true);
      vocScrollToBottom(true);
    }

    function vocShowFeedbackInput(employee, dept){
      vocClearActions();
      const wrap = document.createElement('div');
      wrap.className = 'voc-input-wrap active';
      wrap.innerHTML = `
        <textarea id="vocFeedbackText" class="voc-input" maxlength="600" placeholder="문의 및 건의사항을 입력하세요."></textarea>
        <button id="vocFeedbackSend" class="voc-send" type="button">전송</button>
        <div class="voc-mini-note">※ 입력한 내용은 복스테크 내부 기록으로 분류됩니다.</div>
      `;
      vocActions.appendChild(wrap);
      const textarea = document.getElementById('vocFeedbackText');
      const send = document.getElementById('vocFeedbackSend');
      if (textarea) textarea.focus();
      if (send){
        send.addEventListener('click', () => {
          const text = textarea ? textarea.value.trim() : '';
          if (!text){
            showToast('내용이 비어 있어.');
            return;
          }
          vocClearActions();
          vocAppendBubble('right', escapeHtml(text).replace(/\n/g, '<br>'));
          vocFinish(employee, dept, { type:'complaint', message:text });
        });
      }
      vocScrollToBottom(true);
    }

    async function vocInsertSupabaseRow(supabaseRow){
      console.log('[VOC] insert payload:', JSON.parse(JSON.stringify(supabaseRow)));

      if (supabaseClient){
        try{
          const { error } = await supabaseClient
            .from('voxtek_events')
            .insert(supabaseRow);

          if (!error){
            console.log('[VOC] Supabase insert success.');
            return { ok:true, method:'supabase-js' };
          }

          console.warn('[VOC] supabase-js insert failed. Trying REST fallback:', error);
        }catch(error){
          console.warn('[VOC] supabase-js threw. Trying REST fallback:', error);
        }
      } else {
        console.warn('[VOC] supabaseClient is not available. Trying REST fallback.');
      }

      try{
        const response = await fetch(`${SUPABASE_URL}/rest/v1/voxtek_events`, {
          method:'POST',
          headers:{
            apikey:SUPABASE_ANON_KEY,
            Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type':'application/json',
            Prefer:'return=minimal'
          },
          body:JSON.stringify(supabaseRow)
        });

        const text = await response.text();
        let data = null;
        try{ data = text ? JSON.parse(text) : null; }catch(error){ data = text; }

        console.log('[VOC] REST fallback response:', response.status, data);

        if (response.ok){
          return { ok:true, method:'rest' };
        }

        return { ok:false, method:'rest', error:data, status:response.status };
      }catch(error){
        console.error('[VOC] REST fallback threw:', error);
        return { ok:false, method:'rest', error };
      }
    }

    function vocFinish(employee, dept, payload){
      vocSetStatus('COMPLETED');

      const row = {
        at:new Date().toISOString(),
        employeeName:employee ? employee.name : '',
        employeeId:employee ? (employee.employeeId || '') : '',
        department:dept ? dept.name : '',
        departmentLine:dept ? dept.line : '',
        type:payload ? payload.type : '',
        message:payload ? payload.message : '',
        requestedDepartment:payload ? (payload.requestedDepartment || '') : '',
        requestedDepartmentKey:payload ? (payload.requestedDepartmentKey || '') : '',
        currentDepartment:payload ? (payload.currentDepartment || (dept ? dept.name : '')) : (dept ? dept.name : ''),
        reason:payload ? (payload.reason || '') : ''
      };

      try{
        const key = 'voxtek_voc_logs_v1';
        const logs = JSON.parse(localStorage.getItem(key) || '[]');
        logs.push(row);
        localStorage.setItem(key, JSON.stringify(logs.slice(-100)));
      }catch(error){
        console.warn('VOC local log failed:', error);
      }

      try{
        const structuredAffiliationPromise = row.type === 'affiliation_change_request'
          ? recordStructuredAffiliationRequest(row)
          : Promise.resolve({ ok:true, skipped:true });

        const supabaseRow = {
          event_type: row.type === 'affiliation_change_request' ? 'AFFILIATION_CHANGE_REQUEST' : 'VOC_SUBMITTED',
          account_id: employee ? (employee.employeeId || employee.name) : '',
          employee_name: employee ? employee.name : '',
          mission_id: null,
          creature_name: null,
          mission_day: null,
          points: null,
          affection: null,
          local_date: typeof currentDateKey === 'function' ? currentDateKey() : new Date().toISOString().slice(0, 10),
          session_id: typeof getEventSession === 'function' ? getEventSession() : '',
          user_agent: navigator.userAgent,
          detail: {
            source: 'voc_center',
            department: row.department,
            department_line: row.departmentLine,
            inquiry_type: row.type,
            message: row.message,
            employee_id: row.employeeId,
            requested_department: row.requestedDepartment,
            requested_department_key: row.requestedDepartmentKey,
            current_department: row.currentDepartment,
            reason: row.reason,
            client_time: row.at
          }
        };

        Promise.allSettled([
          vocInsertSupabaseRow(supabaseRow),
          structuredAffiliationPromise
        ]).then(([eventResult, affiliationResult]) => {
          const eventValue = eventResult.status === 'fulfilled'
            ? eventResult.value
            : { ok:false, error:eventResult.reason };
          const affiliationValue = affiliationResult.status === 'fulfilled'
            ? affiliationResult.value
            : { ok:false, error:affiliationResult.reason };
          const isAffiliationRequest = row.type === 'affiliation_change_request';
          const affiliationOk = !isAffiliationRequest || (affiliationValue && affiliationValue.ok);

          if (eventValue && eventValue.ok && affiliationOk){
            console.log('[VOC] Supabase log sent by', eventValue.method);
            showToast('문의 내용 전송 완료.');
            return;
          }

          if (isAffiliationRequest && affiliationOk){
            console.warn('[VOC] event log failed, but affiliation request was saved:', eventValue);
            showToast('소속 변경 신청 전송 완료.');
            return;
          }

          if (eventValue && eventValue.ok && !affiliationOk){
            console.warn('[VOC] event log saved, but affiliation request table insert failed:', affiliationValue);
            showToast('문의는 기록됐지만 관리자 신청 목록 저장 실패. 버그 제보 바람.');
            return;
          }

          console.warn('[VOC] Supabase log failed after all attempts:', eventValue, affiliationValue);
          showToast('문의는 로컬에 기록됨. 콘솔 오류 확인 필요. 버그 제보 바람.');
        });
      }catch(error){
        console.warn('VOC Supabase log failed:', error);
        showToast('문의는 로컬에 기록됨. 데이터 베이스 전송 실패. 버그 제보 바람.');
      }

      setTimeout(() => {
        vocAppendBubble('left', '문의 및 건의 주신 내용은 더욱 더 나은 복스테크가 되기 위한 밑거름으로 쓰겠습니다. 감사합니다.');
        vocClearActions();
        vocAddChoice('채팅 종료', () => { vocClearActions(); vocSetStatus('CLOSED'); vocAppendBubble('left', '상담이 종료되었습니다. 창을 닫거나 재문의를 선택해 주세요.'); vocScrollToBottom(true); });
        vocAddChoice('재문의 하기', () => vocBegin(), true);
        vocScrollToBottom(true);
      }, 360);
    }
