    function saveAdminEmployee(profile){
      const payload = {
        name: profile.name,
        joinedAt: profile.joinedAt,
        role: {
          employment: profile.authority,
          position: profile.position
        },
        badge: { ...profile.badge },
        employeeId: `ADMIN-${profile.key.toUpperCase()}`,
        isAdmin: true,
        adminKey: profile.key,
        handle: profile.handle,
        adminAuthority: profile.authority,
        adminPosition: profile.position,
        lastLoginAt: new Date().toISOString()
      };
      try{
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ key: profile.key, at: payload.lastLoginAt }));
      }catch(error){}
      return payload;
    }

    function pickRandomBadge(){
      const badge = badgePool[Math.floor(Math.random() * badgePool.length)];
      return { ...badge };
    }

    function getDepartmentKeyFromBadge(badge){
      const src = badge && badge.src ? String(badge.src) : String(badge || '');
      const normalized = src.split('/').pop();
      if (normalized === 'v1.png') return 'valentino';
      if (normalized === 'v2.png') return 'vox';
      if (normalized === 'v3.png') return 'velvette';
      return 'unknown';
    }

    function getDepartmentLabelByKey(key){
      const map = {
        vox:'복스',
        valentino:'발렌티노',
        velvette:'벨벳',
        unknown:'미확인 소속'
      };
      return map[key] || map.unknown;
    }

    function pickRandomTeam(departmentKey){
      const pool = TEAM_POOL[departmentKey] || TEAM_POOL.unknown;
      return pool[Math.floor(Math.random() * pool.length)] || TEAM_POOL.unknown[0];
    }

    function isKnownTeamName(value){
      return TEAM_NAME_SET.has(String(value || '').trim());
    }

    function isTeamForDepartment(value, departmentKey){
      const team = String(value || '').trim();
      if (!team) return false;
      const key = String(departmentKey || '').trim() || 'unknown';
      if (team === DIRECT_SECRETARY_TEAM) return key === 'vox';
      if (team === SPECIAL_TEAM) return true;
      const pool = TEAM_POOL[key] || TEAM_POOL.unknown;
      return pool.includes(team);
    }

    function resolveTeamForDepartment(value, departmentKey){
      const team = String(value || '').trim();
      if (isTeamForDepartment(team, departmentKey)) return team;
      return pickRandomTeam(departmentKey);
    }

    function normalizeDirectSecretaryEmployeeId(value){
      const match = String(value || '').trim().toUpperCase().match(/VT-?\d{6}/);
      if (!match) return '';
      const digits = match[0].replace(/[^0-9]/g, '');
      return `VT-${digits}`;
    }

    function normalizeDirectSecretaryStaffItem(item){
      if (!item || typeof item !== 'object') return null;
      const employeeId = normalizeDirectSecretaryEmployeeId(item.employeeId || item.id || '');
      if (!employeeId) return null;
      return {
        employeeId,
        displayName:String(item.displayName || item.name || '').trim()
      };
    }

    function directSecretaryGetStaffList(){
      try{
        const raw = localStorage.getItem(DIRECT_SECRETARY_STAFF_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : DIRECT_SECRETARY_DEFAULT_STAFF;
        const list = Array.isArray(parsed) ? parsed : [];
        const map = new Map();
        list.forEach((item) => {
          const normalized = normalizeDirectSecretaryStaffItem(item);
          if (!normalized) return;
          map.set(normalized.employeeId, normalized);
        });
        return Array.from(map.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
      }catch(error){
        return [];
      }
    }

    function directSecretarySetStaffList(list){
      const map = new Map();
      (Array.isArray(list) ? list : []).forEach((item) => {
        const normalized = normalizeDirectSecretaryStaffItem(item);
        if (!normalized) return;
        map.set(normalized.employeeId, normalized);
      });
      localStorage.setItem(DIRECT_SECRETARY_STAFF_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
    }

    function directSecretaryParseStaffInput(rawId, rawName = ''){
      const idSource = String(rawId || '').trim();
      const nameSource = String(rawName || '').trim();
      const employeeId = normalizeDirectSecretaryEmployeeId(idSource || nameSource);
      let displayName = nameSource;
      if (!displayName && employeeId){
        displayName = idSource
          .replace(new RegExp(employeeId.replace('-', '-?'), 'i'), '')
          .replace(/\s+/g, ' ')
          .trim();
      }
      return { employeeId, displayName };
    }

    function directSecretaryUpsertStaff(item){
      const normalized = normalizeDirectSecretaryStaffItem(item);
      if (!normalized) return { ok:false, updated:false };
      const list = directSecretaryGetStaffList();
      const index = list.findIndex((staff) => staff.employeeId === normalized.employeeId);
      if (index >= 0){
        list[index] = {
          ...list[index],
          displayName:normalized.displayName || list[index].displayName || ''
        };
        directSecretarySetStaffList(list);
        return { ok:true, updated:true };
      }
      list.push(normalized);
      directSecretarySetStaffList(list);
      return { ok:true, updated:false };
    }

    function directSecretaryStaffLabel(staff){
      const label = String(staff && (staff.displayName || staff.name) || '').trim();
      return label || (staff ? staff.employeeId : '-');
    }

    function isDirectSecretaryEligibleEmployeeId(employeeId){
      const id = normalizeDirectSecretaryEmployeeId(employeeId);
      return directSecretaryGetStaffList().some((staff) => staff.employeeId === id);
    }

    function directSecretaryStaffById(employeeId){
      const id = normalizeDirectSecretaryEmployeeId(employeeId);
      return directSecretaryGetStaffList().find((staff) => staff.employeeId === id) || null;
    }

    function directSecretaryGetBackupMap(){
      try{
        const parsed = JSON.parse(localStorage.getItem(DIRECT_SECRETARY_TEAM_BACKUP_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }catch(error){
        return {};
      }
    }

    function directSecretarySaveBackup(employeeId, backup){
      const id = normalizeDirectSecretaryEmployeeId(employeeId);
      if (!id) return;
      const map = directSecretaryGetBackupMap();
      map[id] = {
        previousTeam:backup.previousTeam || '',
        previousGrade:backup.previousGrade || DEFAULT_GRADE,
        previousDepartmentKey:backup.previousDepartmentKey || 'vox',
        previousDepartmentName:backup.previousDepartmentName || '복스',
        previousBadgeSrc:backup.previousBadgeSrc || 'v2.png',
        savedAt:new Date().toISOString()
      };
      localStorage.setItem(DIRECT_SECRETARY_TEAM_BACKUP_KEY, JSON.stringify(map));
    }

    function directSecretaryReadBackup(employeeId){
      const map = directSecretaryGetBackupMap();
      return map[normalizeDirectSecretaryEmployeeId(employeeId)] || null;
    }

    function directSecretaryRemoveBackup(employeeId){
      const id = normalizeDirectSecretaryEmployeeId(employeeId);
      if (!id) return;
      const map = directSecretaryGetBackupMap();
      delete map[id];
      localStorage.setItem(DIRECT_SECRETARY_TEAM_BACKUP_KEY, JSON.stringify(map));
    }

    function directSecretaryFallbackTeam(){
      return TEAM_POOL.vox[0] || '인사평가팀';
    }

    function normalizeDirectSecretaryRestoreTeam(value){
      const team = String(value || '').trim();
      if (team && team !== DIRECT_SECRETARY_TEAM && team !== SPECIAL_TEAM && isTeamForDepartment(team, 'vox')){
        return team;
      }
      return directSecretaryFallbackTeam();
    }

    function normalizeGrade(value, fallback = DEFAULT_GRADE){
      const grade = String(value || '').trim();
      return GRADE_ORDER.includes(grade) ? grade : fallback;
    }

    function promoteGrade(baseGrade, steps = 0){
      const start = Math.max(0, GRADE_ORDER.indexOf(normalizeGrade(baseGrade, DEFAULT_GRADE)));
      const next = Math.min(GRADE_ORDER.length - 1, start + Math.max(0, Number(steps) || 0));
      return GRADE_ORDER[next] || DEFAULT_GRADE;
    }

    function rewardLabelFromRank(rank){
      const value = Number(rank || 0);
      if (value === 1) return '특별팀 배정 · 한 단계 승진';
      if (value >= 2 && value <= 5) return '한 단계 승진';
      return '유지';
    }

    function currentLocalDateKey(){
      const d = new Date();
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    function isHrAwardEffective(){
      return currentLocalDateKey() >= HR_AWARD_EFFECTIVE_DATE;
    }

    function buildHrRole({ badge, role = null, team = '', grade = '', baseTeam = '', baseGrade = '', reward = null } = {}){
      const departmentKey = getDepartmentKeyFromBadge(badge);
      const fallbackTeam = pickRandomTeam(departmentKey);
      const cleanBaseTeam = isTeamForDepartment(baseTeam, departmentKey) && baseTeam !== SPECIAL_TEAM && baseTeam !== DIRECT_SECRETARY_TEAM ? String(baseTeam).trim() : fallbackTeam;
      const cleanBaseGrade = normalizeGrade(baseGrade || DEFAULT_GRADE, DEFAULT_GRADE);
      const cleanTeam = isTeamForDepartment(team, departmentKey) ? String(team).trim() : cleanBaseTeam;
      const cleanGrade = normalizeGrade(grade || cleanBaseGrade, cleanBaseGrade);

      return {
        ...(role && typeof role === 'object' ? role : {}),
        hrVersion: HR_ROLE_VERSION,
        departmentKey,
        departmentName: getDepartmentLabelByKey(departmentKey),
        baseTeam: cleanBaseTeam,
        baseGrade: cleanBaseGrade,
        team: cleanTeam,
        grade: cleanGrade,
        employment: cleanTeam,
        position: cleanGrade,
        gradeIndex: GRADE_ORDER.indexOf(cleanGrade),
        rewardSeason: reward ? (reward.rewardSeason || '') : ((role && role.rewardSeason) || ''),
        rewardRank: reward ? (reward.rewardRank !== null && reward.rewardRank !== '' && Number.isFinite(Number(reward.rewardRank)) ? Number(reward.rewardRank) : null) : ((role && role.rewardRank) || null),
        rewardType: reward ? (reward.rewardType || '') : ((role && role.rewardType) || ''),
        rewardLabel: reward ? (reward.rewardLabel || '') : ((role && role.rewardLabel) || ''),
        rewardTotalScore: reward ? (reward.rewardTotalScore !== null && reward.rewardTotalScore !== '' && Number.isFinite(Number(reward.rewardTotalScore)) ? Number(reward.rewardTotalScore) : null) : ((role && role.rewardTotalScore) || null)
      };
    }

    function pickRandomRole(badge){
      return buildHrRole({ badge, baseGrade:DEFAULT_GRADE, grade:DEFAULT_GRADE });
    }

    function normalizeRole(role, badge){
      const departmentKey = getDepartmentKeyFromBadge(badge);
      if (!role || typeof role !== 'object'){
        return pickRandomRole(badge);
      }

      const lockedRoleTeam = String(role.team || role.employment || '').trim();
      const lockedRoleGrade = String(role.grade || role.position || '').trim();
      const matchedSpecialLock = Object.values(SPECIAL_EMPLOYEE_LOCKS || {}).find((lock) => {
        return lock && lockedRoleTeam === lock.team && lockedRoleGrade === lock.grade;
      });
      if (matchedSpecialLock){
        return buildSpecialLockedRole(matchedSpecialLock, role);
      }

      const looksLikeNewHrRole = role.hrVersion === HR_ROLE_VERSION ||
        (GRADE_ORDER.includes(String(role.position || '').trim()) && isKnownTeamName(role.employment));

      if (!looksLikeNewHrRole){

        return buildHrRole({ badge, role:{}, baseTeam:pickRandomTeam(departmentKey), baseGrade:DEFAULT_GRADE, grade:DEFAULT_GRADE });
      }

      const incomingTeam = String(role.team || role.employment || '').trim();
      const incomingBaseTeam = String(role.baseTeam || '').trim();
      const baseTeam = incomingBaseTeam && incomingBaseTeam !== SPECIAL_TEAM && incomingBaseTeam !== DIRECT_SECRETARY_TEAM && isTeamForDepartment(incomingBaseTeam, departmentKey)
        ? incomingBaseTeam
        : (incomingTeam && incomingTeam !== SPECIAL_TEAM && incomingTeam !== DIRECT_SECRETARY_TEAM && isTeamForDepartment(incomingTeam, departmentKey) ? incomingTeam : pickRandomTeam(departmentKey));
      const baseGrade = normalizeGrade(role.baseGrade || DEFAULT_GRADE, DEFAULT_GRADE);
      const team = isTeamForDepartment(incomingTeam, departmentKey) ? incomingTeam : baseTeam;
      const grade = normalizeGrade(role.grade || role.position || baseGrade, baseGrade);

      return buildHrRole({ badge, role, team, grade, baseTeam, baseGrade });
    }

    function clearHrReward(role, badge){
      const normalized = normalizeRole(role, badge);
      const keepTeam = normalized.team === DIRECT_SECRETARY_TEAM ? DIRECT_SECRETARY_TEAM : normalized.baseTeam;
      return buildHrRole({
        badge,
        role: normalized,
        team: keepTeam,
        grade: normalized.baseGrade,
        baseTeam: normalized.baseTeam,
        baseGrade: normalized.baseGrade,
        reward:{ rewardSeason:'', rewardRank:null, rewardType:'', rewardLabel:'', rewardTotalScore:null }
      });
    }

    function generateEmployeeId(){
      return `VT-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    function normalizeEmployeeRecord(data){
      if (!data || typeof data.name !== 'string' || !data.joinedAt) return null;
      if (data.isAdmin) return null;
      if (!data.badge || !data.badge.src){
        data.badge = pickRandomBadge();
      }
      if (!data.employeeId){
        data.employeeId = generateEmployeeId();
      }
      data.employeeId = normalizeEmployeeId(data.employeeId) || data.employeeId;
      data.nameHistory = Array.isArray(data.nameHistory) ? data.nameHistory : [];
      if (data.birthday && !data.birthdayMonthDay){
        data.birthdayMonthDay = birthdayMonthDayFromValue(data.birthday);
      }

      if (isSpecialEmployee(data)){
        applySpecialEmployeeLock(data);
        return data;
      }

      data.role = normalizeRole(data.role, data.badge);
      if (!isHrAwardEffective()){
        data.role = clearHrReward(data.role, data.badge);
      }
      return data;
    }

    function birthdayMonthDayFromValue(value){
      const text = String(value || '').trim();
      const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) return `${match[2]}-${match[3]}`;
      const shortMatch = text.match(/^(\d{2})-(\d{2})$/);
      if (shortMatch) return text;
      return '';
    }

    function currentMonthDay(){
      const d = new Date();
      return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    function currentYear(){
      return new Date().getFullYear();
    }

    function birthdayDisplay(value){
      const text = String(value || '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)){
        const [, month, day] = text.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
        return `${month}월 ${day}일`;
      }
      if (/^\d{2}-\d{2}$/.test(text)){
        const [month, day] = text.split('-');
        return `${month}월 ${day}일`;
      }
      return '-';
    }

    function updateEmployeeRecord(updater){
      const current = getStoredEmployee();
      if (!current) return null;
      const draft = JSON.parse(JSON.stringify(current));
      const next = normalizeEmployeeRecord(updater(draft) || draft);
      if (!next) return null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      activeEmployee = next;
      if (topbarName) topbarName.textContent = next.name || '-';
      if (employeeNameInput) employeeNameInput.value = next.name || '';
      renderIdCard(next);
      syncEmployeeProfile(next);
      updateMailUnreadIndicator();
      return next;
    }

    function sendEmployeeEvent(eventType, employee, detail = {}){
      if (!employee) return;
      const row = {
        event_type:eventType,
        account_id:employee.employeeId || employee.name || '',
        employee_name:employee.name || '',
        mission_id:null,
        creature_name:null,
        mission_day:null,
        points:null,
        affection:null,
        local_date:typeof currentDateKey === 'function' ? currentDateKey() : new Date().toISOString().slice(0, 10),
        session_id:typeof getEventSession === 'function' ? getEventSession() : '',
        user_agent:navigator.userAgent,
        detail:{
          source:'employee_profile',
          employee_id:employee.employeeId || '',
          client_time:new Date().toISOString(),
          ...detail
        }
      };

      if (typeof recordStructuredEmployeeEvent === 'function'){
        recordStructuredEmployeeEvent(eventType, employee, detail);
      }

      if (typeof vocInsertSupabaseRow === 'function'){
        vocInsertSupabaseRow(row).then((result) => {
          if (!result || !result.ok) console.warn(`[${eventType}] Supabase log failed:`, result);
        });
      } else if (supabaseClient){
        supabaseClient.from('voxtek_events').insert(row).then(({ error }) => {
          if (error) console.warn(`[${eventType}] Supabase log failed:`, error);
        });
      }
    }

    async function insertStructuredTable(tableName, payload, options = {}){
      if (!supabaseClient || !tableName || !payload) return { ok:false, reason:'no_supabase' };
      try{
        const query = supabaseClient.from(tableName);
        const result = options.upsert
          ? await query.upsert(payload, options.upsert)
          : await query.insert(payload);
        if (result.error) throw result.error;
        return { ok:true };
      }catch(error){
        console.warn(`[${tableName}] structured record failed:`, error);
        return { ok:false, error };
      }
    }

    function employeeProfilePayload(employee, extra = {}){
      if (!employee || isAdminEmployee(employee)) return null;

      const specialLock = getSpecialEmployeeLock(employee.employeeId);
      if (specialLock){
        return {
          employee_id:normalizeEmployeeId(employee.employeeId),
          display_name:specialLock.displayName,
          joined_at:employee.joinedAt || null,
          birthday:employee.birthday || null,
          birthday_month_day:employee.birthdayMonthDay || birthdayMonthDayFromValue(employee.birthday || ''),
          department_key:specialLock.departmentKey,
          department_name:specialLock.departmentName,
          badge_src:specialLock.badgeSrc,
          team:specialLock.team,
          grade:specialLock.grade,
          updated_at:new Date().toISOString(),
          ...extra
        };
      }

      const dept = getDepartmentInfo(employee);
      const role = displayRoleForEmployee(employee);
      const profileTeam = resolveTeamForDepartment(role.team || role.employment || '', dept.key);
      return {
        employee_id:employee.employeeId || employee.name || '',
        display_name:employee.name || '',
        joined_at:employee.joinedAt || null,
        birthday:employee.birthday || null,
        birthday_month_day:employee.birthdayMonthDay || birthdayMonthDayFromValue(employee.birthday || ''),
        department_key:dept.key || '',
        department_name:dept.name || '',
        badge_src:employee.badge && employee.badge.src ? employee.badge.src : '',
        team:profileTeam,
        grade:role.grade || role.position || '',
        updated_at:new Date().toISOString(),
        ...extra
      };
    }

    function syncEmployeeProfile(employee, extra = {}){
      const payload = employeeProfilePayload(employee, extra);
      if (!payload || !payload.employee_id) return;
      insertStructuredTable('voxtek_employee_profiles', payload, { upsert:{ onConflict:'employee_id' } });
    }

    function badgeForDepartmentKey(departmentKey){
      const key = String(departmentKey || '').trim();
      if (key === 'vox') return { src:'v2.png', label:'v2.png' };
      if (key === 'valentino') return { src:'v1.png', label:'v1.png' };
      if (key === 'velvette') return { src:'v3.png', label:'v3.png' };
      return null;
    }

    function applyRemoteEmployeeProfile(employee, profile){
      if (!employee || !profile || isAdminEmployee(employee)) return employee;
      const next = JSON.parse(JSON.stringify(employee));

      if (profile.display_name) next.name = String(profile.display_name);
      if (profile.joined_at && !next.joinedAt) next.joinedAt = profile.joined_at;
      if (profile.birthday){
        next.birthday = profile.birthday;
        next.birthdayMonthDay = profile.birthday_month_day || birthdayMonthDayFromValue(profile.birthday);
      } else if (profile.birthday_month_day && !next.birthdayMonthDay){
        next.birthdayMonthDay = profile.birthday_month_day;
      }

      const specialLock = getSpecialEmployeeLock(profile.employee_id || next.employeeId);
      if (specialLock){
        if (profile.joined_at) next.joinedAt = profile.joined_at;
        applySpecialEmployeeLock(next);
        const normalizedSpecial = normalizeEmployeeRecord(next);
        return normalizedSpecial || next;
      }

      const departmentBadge = badgeForDepartmentKey(profile.department_key);
      const badgeSrc = profile.badge_src || (departmentBadge ? departmentBadge.src : '');
      if (badgeSrc){
        next.badge = { src:badgeSrc, label:badgeSrc };
      } else if (departmentBadge){
        next.badge = { ...departmentBadge };
      }

      const currentRole = normalizeRole(next.role, next.badge);
      const departmentKey = getDepartmentKeyFromBadge(next.badge);
      const remoteTeam = String(profile.team || '').trim();
      const remoteGrade = String(profile.grade || '').trim();
      const finalTeam = isTeamForDepartment(remoteTeam, departmentKey)
        ? remoteTeam
        : resolveTeamForDepartment(currentRole.team || currentRole.employment || '', departmentKey);
      const finalGrade = GRADE_ORDER.includes(remoteGrade) ? remoteGrade : (currentRole.grade || currentRole.position || DEFAULT_GRADE);
      const finalBaseTeam = currentRole.baseTeam && currentRole.baseTeam !== SPECIAL_TEAM && currentRole.baseTeam !== DIRECT_SECRETARY_TEAM && isTeamForDepartment(currentRole.baseTeam, departmentKey)
        ? currentRole.baseTeam
        : (finalTeam === DIRECT_SECRETARY_TEAM ? directSecretaryFallbackTeam() : finalTeam);

      next.role = buildHrRole({
        badge:next.badge,
        role:currentRole,
        team:finalTeam,
        grade:finalGrade,
        baseTeam:finalBaseTeam,
        baseGrade:currentRole.baseGrade || DEFAULT_GRADE
      });

      const normalized = normalizeEmployeeRecord(next);
      return normalized || next;
    }

    async function syncEmployeeFromRemoteProfile(employee){
      if (!employee || isAdminEmployee(employee) || !supabaseClient || !employee.employeeId) return employee;
      try{
        const { data, error } = await supabaseClient
          .from('voxtek_employee_profiles')
          .select('*')
          .eq('employee_id', employee.employeeId)
          .maybeSingle();

        if (error){
          console.warn('[employee profile] remote sync failed:', error);
          return employee;
        }

        if (!data){
          syncEmployeeProfile(employee);
          return employee;
        }

        const next = applyRemoteEmployeeProfile(employee, data);
        if (!next) return employee;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        activeEmployee = next;
        if (topbarName) topbarName.textContent = next.name || '-';
        if (employeeNameInput) employeeNameInput.value = next.name || '';
        renderIdCard(next);
        updateMailUnreadIndicator();
        return next;
      }catch(error){
        console.warn('[employee profile] remote sync threw:', error);
        return employee;
      }
    }

    function recordStructuredEmployeeEvent(eventType, employee, detail = {}){
      if (!employee || isAdminEmployee(employee)) return;
      syncEmployeeProfile(employee);

      if (eventType === 'NAME_CHANGED'){
        const changedAt = detail.changed_at || new Date().toISOString();
        insertStructuredTable('voxtek_name_change_logs', {
          employee_id:employee.employeeId || employee.name || '',
          previous_name:detail.old_name || '',
          new_name:detail.new_name || employee.name || '',
          current_name:employee.name || '',
          changed_at:changedAt,
          created_at:changedAt
        });
        syncEmployeeProfile(employee, { last_name_changed_at:changedAt });
      }

      if (eventType === 'BIRTHDAY_REGISTERED'){
        const updatedAt = detail.updated_at || new Date().toISOString();
        insertStructuredTable('voxtek_birthday_records', {
          employee_id:employee.employeeId || employee.name || '',
          employee_name:employee.name || '',
          birthday:detail.birthday || employee.birthday || null,
          birthday_month_day:detail.birthday_month_day || employee.birthdayMonthDay || '',
          display_birthday:detail.display_birthday || birthdayDisplay(employee.birthday || ''),
          created_at:updatedAt
        });
        syncEmployeeProfile(employee, {
          birthday:detail.birthday || employee.birthday || null,
          birthday_month_day:detail.birthday_month_day || employee.birthdayMonthDay || '',
          updated_at:updatedAt
        });
      }
    }

    function affiliationRequestPayload(row){
      if (!row || row.type !== 'affiliation_change_request') return null;
      return {
        employee_id:row.employeeId || row.employeeName || '',
        employee_name:row.employeeName || '',
        current_department:row.currentDepartment || row.department || '',
        requested_department:row.requestedDepartment || '',
        requested_department_key:row.requestedDepartmentKey || '',
        reason:row.reason || row.message || '',
        status:'pending',
        created_at:row.at || new Date().toISOString()
      };
    }

    async function insertAffiliationRequestStructured(row){
      const payload = affiliationRequestPayload(row);
      if (!payload) return { ok:true, skipped:true };

      if (supabaseClient){
        try{
          const { error } = await supabaseClient
            .from('voxtek_affiliation_requests')
            .insert(payload);

          if (!error){
            console.log('[VOC] affiliation request insert success.');
            return { ok:true, method:'supabase-js' };
          }

          console.warn('[VOC] affiliation request supabase-js insert failed. Trying REST fallback:', error);
        }catch(error){
          console.warn('[VOC] affiliation request supabase-js threw. Trying REST fallback:', error);
        }
      } else {
        console.warn('[VOC] supabaseClient is not available. Trying affiliation REST fallback.');
      }

      try{
        const response = await fetch(`${SUPABASE_URL}/rest/v1/voxtek_affiliation_requests`, {
          method:'POST',
          headers:{
            apikey:SUPABASE_ANON_KEY,
            Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type':'application/json',
            Prefer:'return=minimal'
          },
          body:JSON.stringify(payload)
        });

        const text = await response.text();
        let data = null;
        try{ data = text ? JSON.parse(text) : null; }catch(error){ data = text; }

        console.log('[VOC] affiliation REST fallback response:', response.status, data);

        if (response.ok){
          return { ok:true, method:'rest' };
        }

        return { ok:false, method:'rest', error:data, status:response.status };
      }catch(error){
        console.error('[VOC] affiliation REST fallback threw:', error);
        return { ok:false, method:'rest', error };
      }
    }

    function recordStructuredAffiliationRequest(row){
      return insertAffiliationRequestStructured(row);
    }

    function getStoredEmployee(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = normalizeEmployeeRecord(JSON.parse(raw));
        if (!parsed){
          return null;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }catch(e){
        return null;
      }
    }

    async function applyEmployeeHrAward(employee){
      if (!employee || isAdminEmployee(employee)) return employee;
      const normalized = normalizeEmployeeRecord({ ...employee, role:{ ...(employee.role || {}) }, badge:{ ...(employee.badge || {}) } });
      if (!normalized){
        return employee;
      }
      if (!isHrAwardEffective()){
        normalized.role = clearHrReward(normalized.role, normalized.badge);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
      if (!supabaseClient || !normalized.employeeId){
        return normalized;
      }

      try{
        const { data, error } = await supabaseClient.rpc('get_employee_hr_award', { p_employee_id: normalized.employeeId });
        if (error) throw error;
        const award = Array.isArray(data) ? data[0] : data;
        const baseRole = normalizeRole(normalized.role, normalized.badge);

        if (!award || !Number(award.reward_rank || award.rank || 0)){
          const keepTeam = baseRole.team === DIRECT_SECRETARY_TEAM ? DIRECT_SECRETARY_TEAM : baseRole.baseTeam;
          normalized.role = buildHrRole({
            badge: normalized.badge,
            role: baseRole,
            team: keepTeam,
            grade: baseRole.baseGrade,
            baseTeam: baseRole.baseTeam,
            baseGrade: baseRole.baseGrade,
            reward:{ rewardSeason:'', rewardRank:null, rewardType:'', rewardLabel:'', rewardTotalScore:null }
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }

        const rewardRank = Number(award.reward_rank || award.rank || 0);
        const promotionSteps = Number(award.promotion_steps || (rewardRank >= 1 && rewardRank <= 5 ? 1 : 0));
        const rewardTeam = baseRole.team === DIRECT_SECRETARY_TEAM ? DIRECT_SECRETARY_TEAM : (rewardRank === 1 ? SPECIAL_TEAM : baseRole.baseTeam);
        const rewardGrade = award.grade_after || promoteGrade(baseRole.baseGrade, promotionSteps);
        const rewardType = award.reward_type || (rewardRank === 1 ? 'SPECIAL_TEAM_PROMOTION' : rewardRank <= 5 ? 'PROMOTION' : 'NONE');
        const rewardLabel = award.reward_label || rewardLabelFromRank(rewardRank);

        normalized.role = buildHrRole({
          badge: normalized.badge,
          role: baseRole,
          team: rewardTeam,
          grade: rewardGrade,
          baseTeam: baseRole.baseTeam,
          baseGrade: baseRole.baseGrade,
          reward:{
            rewardSeason: HR_AWARD_SEASON,
            rewardRank,
            rewardType,
            rewardLabel,
            rewardTotalScore: Number(award.total_score || 0)
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }catch(error){
        console.warn('HR award sync failed:', error);
        return normalized || employee;
      }
    }

    function normalizeRestoreLoginCode(value){
      return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    }

    function isVal267903RestoreCode(value){
      return normalizeRestoreLoginCode(value) === 'VALRESTORE267903';
    }

    function mergeVal267903EvaluationLocalState(){
      try{
        const wrongKey = 'voxtek_june_evaluation_v1_2026_VT-670742';
        const rightKey = 'voxtek_june_evaluation_v1_2026_VT-267903';
        const wrongRaw = localStorage.getItem(wrongKey);
        if (!wrongRaw) return;

        const wrong = JSON.parse(wrongRaw);
        const right = JSON.parse(localStorage.getItem(rightKey) || '{"attendanceDates":[],"clearedOrders":{}}');
        const attendanceDates = Array.from(new Set([
          ...(Array.isArray(right.attendanceDates) ? right.attendanceDates : []),
          ...(Array.isArray(wrong.attendanceDates) ? wrong.attendanceDates : [])
        ])).sort();
        const clearedOrders = {
          ...(wrong.clearedOrders && typeof wrong.clearedOrders === 'object' ? wrong.clearedOrders : {}),
          ...(right.clearedOrders && typeof right.clearedOrders === 'object' ? right.clearedOrders : {})
        };

        localStorage.setItem(rightKey, JSON.stringify({
          attendanceDates,
          clearedOrders,
          updatedAt:new Date().toISOString(),
          restoredFrom:'VT-670742'
        }));
      }catch(error){
        console.warn('[restore] Val evaluation local merge failed:', error);
      }
    }

    function buildVal267903RestoreEmployee(){
      const badge = { src:'v1.png', label:'v1.png' };
      return {
        name:'Val',
        joinedAt:'2026-05-21T00:00:00+09:00',
        badge,
        role:buildHrRole({
          badge,
          team:'촬영팀',
          grade:'계약직',
          baseTeam:'촬영팀',
          baseGrade:'계약직',
          reward:{
            rewardSeason:'',
            rewardRank:null,
            rewardType:'',
            rewardLabel:'',
            rewardTotalScore:null
          }
        }),
        employeeId:'VT-267903',
        nameHistory:[],
        lastLoginAt:new Date().toISOString(),
        restoredBy:'VALRESTORE267903'
      };
    }

    function saveEmployee(name){
      if (isVal267903RestoreCode(name)){
        const payload = buildVal267903RestoreEmployee();
        mergeVal267903EvaluationLocalState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return payload;
      }

      const current = getStoredEmployee();
      let payload;
      if (current && current.name === name){
        const badge = current.badge || pickRandomBadge();
        payload = {
          ...current,
          badge,
          role: normalizeRole(current.role, badge),
          employeeId: current.employeeId || generateEmployeeId(),
          lastLoginAt: new Date().toISOString()
        };
      } else {
        const badge = pickRandomBadge();
        payload = {
          name,
          joinedAt: new Date().toISOString(),
          badge,
          role: pickRandomRole(badge),
          employeeId: generateEmployeeId(),
          lastLoginAt: new Date().toISOString()
        };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return payload;
    }

    function updateLoginState(){
      const saved = getStoredEmployee();
      loginStatus.textContent = '';
      if (saved){
        employeeNameInput.value = saved.name;
        employeeNameInput.readOnly = true;
        employeeNameInput.placeholder = '';
        loginBtn.textContent = '로그인';
        quitBtn.textContent = '퇴사하기';
        quitBtn.classList.remove('hidden');
        if (adminLoginOpenBtn) adminLoginOpenBtn.classList.remove('hidden');
        loginNote.textContent = '';
      } else {
        employeeNameInput.value = '';
        employeeNameInput.readOnly = false;
        employeeNameInput.placeholder = '이름을 입력하세요';
        loginBtn.textContent = '로그인';
        quitBtn.textContent = '퇴사하기';
        quitBtn.classList.add('hidden');
        if (adminLoginOpenBtn) adminLoginOpenBtn.classList.remove('hidden');
        loginNote.textContent = '';
      }
    }

    function runBootSequence(callback){
      bootOverlay.classList.remove('hidden');
      bootLines.forEach(line => line.classList.remove('active'));
      const delays = [250, 740, 1220];
      delays.forEach((delay, i) => {
        setTimeout(() => bootLines[i].classList.add('active'), delay);
      });
      setTimeout(() => {
        bootOverlay.classList.add('hidden');
        callback();
      }, 1900);
    }

    function centerIntroPopup(){
      if (!introPopup || !introScreen || introScreen.classList.contains('hidden')) return;
      const bounds = introScreen.getBoundingClientRect();
      const popupRect = introPopup.getBoundingClientRect();
      const left = Math.max(10, Math.round((bounds.width - popupRect.width) / 2));
      const top = Math.max(18, Math.round((bounds.height - popupRect.height) / 2));
      introPopup.style.left = `${left}px`;
      introPopup.style.top = `${top}px`;
    }

    function showIntroPopup(employee){
      pendingEmployee = employee;
      enterDesktop(employee);
      introScreen.classList.remove('hidden');
      requestAnimationFrame(centerIntroPopup);
      setTimeout(centerIntroPopup, 60);
    }

    function closeIntroPopup(){
      introScreen.classList.add('hidden');
      pendingEmployee = null;
      maybeShowBirthdayPrompt();
    }

    function enterDesktop(employee){
      activeEmployee = employee;
      const admin = isAdminEmployee(employee);
      if (!admin) recordPortalLogin(employee);
      const specialLock = !admin && employee ? getSpecialEmployeeLock(employee.employeeId) : null;
      if (topbarRoleLabel) topbarRoleLabel.textContent = admin ? '관리자' : (specialLock ? specialLock.topbarRoleLabel : '사원');
      topbarName.textContent = employee ? employee.name : '-';
      setContentsShellMode(admin);
      renderIdCard(employee);
      if (!admin) syncEmployeeProfile(employee);
      updateMailUnreadIndicator();
      applyMusicVideoSource();
      closeAllWindows();
      applyThemeMode('default');
      loginScreen.classList.add('hidden');
      desktopScreen.classList.remove('hidden');
    }

    function maybeShowBirthdayPrompt(){
      const employee = getActiveEmployee();
      if (!employee || isAdminEmployee(employee) || !birthdayModal) return;
      const hasBirthday = !!(employee.birthdayMonthDay || birthdayMonthDayFromValue(employee.birthday));
      const dismissed = sessionStorage.getItem(BIRTHDAY_PROMPT_SESSION_KEY) === 'dismissed';
      if (!hasBirthday && !dismissed){
        setTimeout(openBirthdayModal, 360);
      }
    }

    function openBirthdayModal(){
      if (!birthdayModal) return;
      const employee = getActiveEmployee();
      if (!employee || isAdminEmployee(employee)) return;
      if (birthdayInput) birthdayInput.value = employee.birthday || '';
      if (birthdayStatus) birthdayStatus.textContent = '';
      birthdayModal.classList.remove('hidden');
      setTimeout(() => birthdayInput && birthdayInput.focus(), 60);
    }

    function closeBirthdayModal(markDismissed = false){
      if (!birthdayModal) return;
      birthdayModal.classList.add('hidden');
      if (birthdayStatus) birthdayStatus.textContent = '';
      if (markDismissed) sessionStorage.setItem(BIRTHDAY_PROMPT_SESSION_KEY, 'dismissed');
    }

    function saveBirthday(){
      const value = birthdayInput ? birthdayInput.value.trim() : '';
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)){
        if (birthdayStatus) birthdayStatus.textContent = '생일을 선택하십시오.';
        return;
      }
      const next = updateEmployeeRecord((employee) => {
        employee.birthday = value;
        employee.birthdayMonthDay = birthdayMonthDayFromValue(value);
        employee.birthdayUpdatedAt = new Date().toISOString();
        return employee;
      });
      if (next){
        sendEmployeeEvent('BIRTHDAY_REGISTERED', next, {
          birthday:value,
          birthday_month_day:next.birthdayMonthDay,
          display_birthday:birthdayDisplay(value),
          updated_at:next.birthdayUpdatedAt || new Date().toISOString()
        });
        closeBirthdayModal(true);
        showToast('생일 기록 저장 완료.');
        if (mailList && !document.getElementById('window-mail').classList.contains('hidden')) renderMailInbox(activeMailId);
      }
    }

    function ensureNameEditModalLayerPatch(){
      if (document.getElementById('voxtek-name-edit-modal-layer-patch')) return;
      const style = document.createElement('style');
      style.id = 'voxtek-name-edit-modal-layer-patch';
      style.textContent = `
        #nameEditModal:not(.hidden){
          position:fixed !important;
          inset:0 !important;
          z-index:999999 !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          padding:18px !important;
          box-sizing:border-box !important;
        }
        #nameEditModal.hidden{ display:none !important; }
        #nameEditModal > *{
          max-width:min(420px, calc(100vw - 32px)) !important;
          max-height:calc(100dvh - 36px) !important;
          overflow:auto !important;
        }
        @media (max-width:720px){
          #nameEditModal:not(.hidden){
            align-items:center !important;
            justify-content:center !important;
          }
          #nameEditModal input,
          #nameEditModal button{
            font-size:16px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    function bringModalToFront(modal){
      if (!modal) return;
      ensureNameEditModalLayerPatch();
      if (modal.parentElement !== document.body){
        document.body.appendChild(modal);
      }
      const topZ = Math.max(999999, (typeof zCounter === 'number' ? zCounter + 1000 : 999999));
      modal.style.zIndex = String(topZ);
      modal.style.position = 'fixed';
      modal.style.inset = '0';
    }

    function openNameEditModal(){
      if (!nameEditModal) return;
      const employee = getActiveEmployee();
      if (!employee || isAdminEmployee(employee)) return;
      if (nameEditInput) nameEditInput.value = employee.name || '';
      if (nameEditStatus) nameEditStatus.textContent = '';
      bringModalToFront(nameEditModal);
      nameEditModal.classList.remove('hidden');
      requestAnimationFrame(() => {
        if (!nameEditInput) return;
        try{ nameEditInput.focus({ preventScroll:true }); }
        catch(error){ nameEditInput.focus(); }
      });
    }

    function closeNameEditModal(){
      if (!nameEditModal) return;
      nameEditModal.classList.add('hidden');
      if (nameEditStatus) nameEditStatus.textContent = '';
    }

    function saveEditedName(){
      const employee = getActiveEmployee();
      const nextName = nameEditInput ? nameEditInput.value.trim() : '';
      if (!employee || isAdminEmployee(employee)) return;
      if (!nextName){
        if (nameEditStatus) nameEditStatus.textContent = '새 이름을 입력하십시오.';
        return;
      }
      if (isReservedAdminHandle(nextName)){
        if (nameEditStatus) nameEditStatus.textContent = '대표 계정명은 일반 사원 이름으로 사용할 수 없습니다.';
        return;
      }
      if (nextName === employee.name){
        if (nameEditStatus) nameEditStatus.textContent = '현재 이름과 동일합니다.';
        return;
      }
      const oldName = employee.name;
      const changedAt = new Date().toISOString();
      const updated = updateEmployeeRecord((record) => {
        record.nameHistory = Array.isArray(record.nameHistory) ? record.nameHistory : [];
        record.nameHistory.push({ from:oldName, to:nextName, at:changedAt, employeeId:record.employeeId || '' });
        record.name = nextName;
        record.lastNameChangedAt = changedAt;
        return record;
      });
      if (updated){
        sendEmployeeEvent('NAME_CHANGED', updated, {
          old_name:oldName,
          new_name:nextName,
          changed_at:changedAt,
          history_count:updated.nameHistory.length
        });
        showToast('이름 수정 완료.');
        closeNameEditModal();
      }
    }

    if (birthdaySave) birthdaySave.addEventListener('click', saveBirthday);
    if (birthdayLater) birthdayLater.addEventListener('click', () => closeBirthdayModal(true));
    if (birthdayInput) birthdayInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveBirthday(); });
    if (birthdayModal) birthdayModal.addEventListener('click', (e) => { if (e.target === birthdayModal) closeBirthdayModal(true); });
    if (editNameBtn) editNameBtn.addEventListener('click', openNameEditModal);
    if (nameEditSave) nameEditSave.addEventListener('click', saveEditedName);
    if (nameEditCancel) nameEditCancel.addEventListener('click', closeNameEditModal);
    if (nameEditInput) nameEditInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEditedName(); });
    if (nameEditModal) nameEditModal.addEventListener('click', (e) => { if (e.target === nameEditModal) closeNameEditModal(); });
