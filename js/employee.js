(function(){
  const app = window.Voxtek;
  const { data, keys, state, db, u } = app;

  const defaultGrade = '인턴';
  const specialTeam = 'V-PRIME 전략특임팀';
  const directTeam = '직속비서팀';

  function normalizeEmployeeId(value){
    const match = String(value || '').trim().toUpperCase().match(/VT-?\d{6}/);
    if (!match) return '';
    return `VT-${match[0].replace(/[^0-9]/g, '')}`;
  }

  function getAdminProfile(key){
    return data.admins[key] || null;
  }

  function isAdminEmployee(employee){
    return !!(employee && employee.isAdmin && getAdminProfile(employee.adminKey));
  }

  function getSpecialLock(employeeId){
    return data.specialEmployees[normalizeEmployeeId(employeeId)] || null;
  }

  function isSpecialEmployee(employee){
    return !!(employee && !employee.isAdmin && getSpecialLock(employee.employeeId));
  }

  function reservedAdminHandle(value){
    const normalized = String(value || '').trim().toLowerCase();
    return Object.values(data.admins).some((profile) => profile.handle.toLowerCase() === normalized);
  }

  function normalizeGrade(value, fallback = defaultGrade){
    const grade = String(value || '').trim();
    if (grade === '정규직') return '정규직 5급';
    return data.grades.includes(grade) ? grade : fallback;
  }

  function departmentKeyFromBadge(badge){
    const src = String((badge && badge.src) || badge || '').split('/').pop();
    if (src === 'v1.png') return 'valentino';
    if (src === 'v2.png') return 'vox';
    if (src === 'v3.png') return 'velvette';
    return 'unknown';
  }

  function departmentName(key){
    return ({ vox:'복스', valentino:'발렌티노', velvette:'벨벳', unknown:'미확인 소속' })[key] || '미확인 소속';
  }

  function getDepartmentInfo(employee = getStoredEmployee()){
    const key = departmentKeyFromBadge(employee && employee.badge);
    return {
      key,
      name:departmentName(key),
      line:({ vox:'VOX LINE', valentino:'VALENTINO LINE', velvette:'VELVETTE LINE', unknown:'UNASSIGNED LINE' })[key] || 'UNASSIGNED LINE'
    };
  }

  function pickBadge(departmentKey = ''){
    const fixed = {
      valentino:'v1.png',
      vox:'v2.png',
      velvette:'v3.png'
    }[departmentKey];

    if (fixed){
      const badge = data.badges.find((item) => item.src === fixed);
      if (badge) return { ...badge };
    }

    return { ...data.badges[Math.floor(Math.random() * data.badges.length)] };
  }

  function pickTeam(departmentKey){
    const pool = data.teams[departmentKey] || data.teams.unknown;
    return pool[Math.floor(Math.random() * pool.length)] || data.teams.unknown[0];
  }

  function isTeamAllowed(team, departmentKey){
    const value = String(team || '').trim();
    if (!value) return false;
    if (value === specialTeam) return true;
    if (value === directTeam) return departmentKey === 'vox';
    const pool = data.teams[departmentKey] || data.teams.unknown;
    return pool.includes(value);
  }

  function resolveTeam(team, departmentKey){
    return isTeamAllowed(team, departmentKey) ? String(team).trim() : pickTeam(departmentKey);
  }

  function buildSpecialRole(lock, role = {}){
    return {
      ...(role && typeof role === 'object' ? role : {}),
      departmentKey:lock.departmentKey,
      departmentName:lock.departmentName,
      baseTeam:lock.team,
      baseGrade:lock.grade,
      team:lock.team,
      grade:lock.grade,
      employment:lock.team,
      position:lock.grade,
      gradeIndex:-1,
      rewardSeason:'',
      rewardRank:null,
      rewardType:'',
      rewardLabel:'',
      rewardTotalScore:null
    };
  }

  function buildRole({ badge, role = {}, team = '', grade = '', baseTeam = '', baseGrade = '' } = {}){
    const departmentKey = departmentKeyFromBadge(badge);
    const cleanBaseTeam = isTeamAllowed(baseTeam, departmentKey) && baseTeam !== specialTeam && baseTeam !== directTeam
      ? String(baseTeam).trim()
      : pickTeam(departmentKey);
    const cleanBaseGrade = normalizeGrade(baseGrade || defaultGrade, defaultGrade);
    const cleanTeam = isTeamAllowed(team, departmentKey) ? String(team).trim() : cleanBaseTeam;
    const cleanGrade = normalizeGrade(grade || cleanBaseGrade, cleanBaseGrade);

    return {
      ...(role && typeof role === 'object' ? role : {}),
      departmentKey,
      departmentName:departmentName(departmentKey),
      baseTeam:cleanBaseTeam,
      baseGrade:cleanBaseGrade,
      team:cleanTeam,
      grade:cleanGrade,
      employment:cleanTeam,
      position:cleanGrade,
      gradeIndex:data.grades.indexOf(cleanGrade)
    };
  }

  function normalizeRole(role, badge){
    if (!role || typeof role !== 'object') return buildRole({ badge });

    const lock = Object.values(data.specialEmployees).find((item) => {
      return item.team === String(role.team || role.employment || '').trim() &&
        item.grade === String(role.grade || role.position || '').trim();
    });
    if (lock) return buildSpecialRole(lock, role);

    const departmentKey = departmentKeyFromBadge(badge);
    const incomingTeam = String(role.team || role.employment || '').trim();
    const incomingBaseTeam = String(role.baseTeam || '').trim();
    const incomingGrade = normalizeGrade(role.grade || role.position || defaultGrade, defaultGrade);
    const incomingBaseGrade = normalizeGrade(role.baseGrade || incomingGrade || defaultGrade, defaultGrade);

    const baseTeam = incomingBaseTeam && incomingBaseTeam !== specialTeam && incomingBaseTeam !== directTeam && isTeamAllowed(incomingBaseTeam, departmentKey)
      ? incomingBaseTeam
      : (incomingTeam && incomingTeam !== specialTeam && incomingTeam !== directTeam && isTeamAllowed(incomingTeam, departmentKey) ? incomingTeam : pickTeam(departmentKey));

    return buildRole({
      badge,
      role,
      team:isTeamAllowed(incomingTeam, departmentKey) ? incomingTeam : baseTeam,
      grade:incomingGrade,
      baseTeam,
      baseGrade:incomingBaseGrade
    });
  }

  function applySpecialLock(employee){
    const lock = employee ? getSpecialLock(employee.employeeId) : null;
    if (!lock) return employee;
    employee.employeeId = normalizeEmployeeId(employee.employeeId);
    employee.name = lock.displayName;
    employee.badge = { src:lock.badgeSrc, label:lock.badgeSrc };
    employee.role = buildSpecialRole(lock, employee.role);
    return employee;
  }

  function displayRole(employee){
    const lock = employee ? getSpecialLock(employee.employeeId) : null;
    if (lock) return buildSpecialRole(lock, employee && employee.role);
    return normalizeRole(employee && employee.role, employee && employee.badge);
  }

  function generateEmployeeId(){
    return `VT-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  function normalizeEmployeeRecord(record){
    if (!record || typeof record.name !== 'string' || !record.joinedAt) return null;
    if (record.isAdmin) return null;

    if (!record.badge || !record.badge.src) record.badge = pickBadge();
    if (!record.employeeId) record.employeeId = generateEmployeeId();
    record.employeeId = normalizeEmployeeId(record.employeeId) || record.employeeId;
    record.nameHistory = Array.isArray(record.nameHistory) ? record.nameHistory : [];

    if (record.birthday && !record.birthdayMonthDay){
      record.birthdayMonthDay = u.monthDay(record.birthday);
    }

    if (isSpecialEmployee(record)) return applySpecialLock(record);

    record.role = normalizeRole(record.role, record.badge);
    return record;
  }

  function getStoredEmployee(){
    const parsed = u.safeJson(localStorage.getItem(keys.employee), null);
    const record = normalizeEmployeeRecord(parsed);
    if (record) localStorage.setItem(keys.employee, JSON.stringify(record));
    return record;
  }

  function getActiveEmployee(){
    return state.activeEmployee || getStoredEmployee();
  }

  function saveAdminEmployee(profile){
    const payload = {
      name:profile.name,
      joinedAt:profile.joinedAt,
      role:{ employment:profile.authority, position:profile.position },
      badge:{ ...profile.badge },
      employeeId:`ADMIN-${profile.key.toUpperCase()}`,
      isAdmin:true,
      adminKey:profile.key,
      handle:profile.handle,
      adminAuthority:profile.authority,
      adminPosition:profile.position,
      lastLoginAt:new Date().toISOString()
    };
    try{
      sessionStorage.setItem(keys.adminSession, JSON.stringify({ key:profile.key, at:payload.lastLoginAt }));
    }catch(error){}
    return payload;
  }

  function saveEmployee(name, departmentKey = ''){
    const current = getStoredEmployee();
    let payload;

    if (current && current.name === name){
      const badge = current.badge || pickBadge();
      payload = {
        ...current,
        badge,
        role:normalizeRole(current.role, badge),
        employeeId:current.employeeId || generateEmployeeId(),
        lastLoginAt:new Date().toISOString()
      };
    } else {
      const badge = pickBadge(departmentKey);
      payload = {
        name,
        joinedAt:new Date().toISOString(),
        badge,
        role:buildRole({ badge }),
        employeeId:generateEmployeeId(),
        lastLoginAt:new Date().toISOString()
      };
    }

    localStorage.setItem(keys.employee, JSON.stringify(payload));
    return payload;
  }

  function updateEmployee(updater){
    const current = getStoredEmployee();
    if (!current) return null;
    const draft = JSON.parse(JSON.stringify(current));
    const next = normalizeEmployeeRecord(updater(draft) || draft);
    if (!next) return null;
    localStorage.setItem(keys.employee, JSON.stringify(next));
    state.activeEmployee = next;
    if (app.dom.topbarName) app.dom.topbarName.textContent = next.name || '-';
    if (app.dom.employeeName) app.dom.employeeName.value = next.name || '';
    if (window.renderIdCard) window.renderIdCard(next);
    syncEmployeeProfile(next);
    if (window.updateMailUnreadIndicator) window.updateMailUnreadIndicator();
    return next;
  }

  async function insertTable(table, payload, options = {}){
    if (!db || !table || !payload) return { ok:false };
    try{
      const query = db.from(table);
      const result = options.upsert ? await query.upsert(payload, options.upsert) : await query.insert(payload);
      if (result.error) throw result.error;
      return { ok:true };
    }catch(error){
      return { ok:false, error };
    }
  }

  function profilePayload(employee, extra = {}){
    if (!employee || isAdminEmployee(employee)) return null;
    const lock = getSpecialLock(employee.employeeId);

    if (lock){
      return {
        employee_id:normalizeEmployeeId(employee.employeeId),
        display_name:lock.displayName,
        joined_at:employee.joinedAt || null,
        birthday:employee.birthday || null,
        birthday_month_day:employee.birthdayMonthDay || u.monthDay(employee.birthday || ''),
        department_key:lock.departmentKey,
        department_name:lock.departmentName,
        badge_src:lock.badgeSrc,
        team:lock.team,
        grade:lock.grade,
        updated_at:new Date().toISOString(),
        ...extra
      };
    }

    const dept = getDepartmentInfo(employee);
    const role = displayRole(employee);
    return {
      employee_id:employee.employeeId || employee.name || '',
      display_name:employee.name || '',
      joined_at:employee.joinedAt || null,
      birthday:employee.birthday || null,
      birthday_month_day:employee.birthdayMonthDay || u.monthDay(employee.birthday || ''),
      department_key:dept.key,
      department_name:dept.name,
      badge_src:employee.badge && employee.badge.src ? employee.badge.src : '',
      team:resolveTeam(role.team || role.employment || '', dept.key),
      grade:role.grade || role.position || '',
      updated_at:new Date().toISOString(),
      ...extra
    };
  }

  function syncEmployeeProfile(employee, extra = {}){
    const payload = profilePayload(employee, extra);
    if (!payload || !payload.employee_id) return;
    insertTable('voxtek_employee_profiles', payload, { upsert:{ onConflict:'employee_id' } });
  }

  function badgeForDepartment(key){
    if (key === 'vox') return { src:'v2.png', label:'v2.png' };
    if (key === 'valentino') return { src:'v1.png', label:'v1.png' };
    if (key === 'velvette') return { src:'v3.png', label:'v3.png' };
    return null;
  }

  function applyRemoteProfile(employee, profile){
    if (!employee || !profile || isAdminEmployee(employee)) return employee;
    const next = JSON.parse(JSON.stringify(employee));

    if (profile.display_name) next.name = String(profile.display_name);
    if (profile.joined_at && !next.joinedAt) next.joinedAt = profile.joined_at;
    if (profile.birthday){
      next.birthday = profile.birthday;
      next.birthdayMonthDay = profile.birthday_month_day || u.monthDay(profile.birthday);
    } else if (profile.birthday_month_day && !next.birthdayMonthDay){
      next.birthdayMonthDay = profile.birthday_month_day;
    }

    const lock = getSpecialLock(profile.employee_id || next.employeeId);
    if (lock){
      if (profile.joined_at) next.joinedAt = profile.joined_at;
      return normalizeEmployeeRecord(applySpecialLock(next)) || next;
    }

    const departmentBadge = badgeForDepartment(profile.department_key);
    const badgeSrc = profile.badge_src || (departmentBadge ? departmentBadge.src : '');
    if (badgeSrc) next.badge = { src:badgeSrc, label:badgeSrc };

    const role = normalizeRole(next.role, next.badge);
    const departmentKey = departmentKeyFromBadge(next.badge);
    const team = resolveTeam(profile.team || role.team || role.employment || '', departmentKey);
    const grade = normalizeGrade(profile.grade || role.grade || role.position || defaultGrade, defaultGrade);

    next.role = buildRole({
      badge:next.badge,
      role,
      team,
      grade,
      baseTeam:role.baseTeam || team,
      baseGrade:role.baseGrade || grade
    });

    return normalizeEmployeeRecord(next) || next;
  }

  async function syncRemoteProfile(employee){
    if (!employee || isAdminEmployee(employee) || !db || !employee.employeeId) return employee;
    try{
      const { data:profile, error } = await db
        .from('voxtek_employee_profiles')
        .select('*')
        .eq('employee_id', employee.employeeId)
        .maybeSingle();

      if (error) return employee;
      if (!profile){
        syncEmployeeProfile(employee);
        return employee;
      }

      const next = applyRemoteProfile(employee, profile);
      if (!next) return employee;

      localStorage.setItem(keys.employee, JSON.stringify(next));
      state.activeEmployee = next;
      if (app.dom.topbarName) app.dom.topbarName.textContent = next.name || '-';
      if (app.dom.employeeName) app.dom.employeeName.value = next.name || '';
      if (window.renderIdCard) window.renderIdCard(next);
      if (window.updateMailUnreadIndicator) window.updateMailUnreadIndicator();
      return next;
    }catch(error){
      return employee;
    }
  }

  function sendEmployeeEvent(type, employee, detail = {}){
    if (!db || !employee || isAdminEmployee(employee)) return;
    const row = {
      event_type:type,
      account_id:employee.employeeId || employee.name || '',
      employee_name:employee.name || '',
      mission_id:null,
      creature_name:null,
      mission_day:null,
      points:null,
      affection:null,
      local_date:u.todayKey(),
      session_id:getEventSession(),
      user_agent:navigator.userAgent,
      detail:{
        source:'employee_profile',
        employee_id:employee.employeeId || '',
        client_time:new Date().toISOString(),
        ...detail
      }
    };
    db.from('voxtek_events').insert(row).then(({ error }) => {
      if (error) console.warn(`[${type}] log failed`, error);
    });
  }

  function getEventSession(){
    let value = localStorage.getItem(keys.eventSession);
    if (!value){
      value = u.uid();
      localStorage.setItem(keys.eventSession, value);
    }
    return value;
  }

  app.employee = {
    defaultGrade,
    specialTeam,
    directTeam,
    normalizeEmployeeId,
    getAdminProfile,
    isAdminEmployee,
    getSpecialLock,
    reservedAdminHandle,
    normalizeGrade,
    departmentKeyFromBadge,
    departmentName,
    getDepartmentInfo,
    displayRole,
    buildRole,
    normalizeRole,
    getStoredEmployee,
    getActiveEmployee,
    saveAdminEmployee,
    saveEmployee,
    updateEmployee,
    syncEmployeeProfile,
    syncRemoteProfile,
    sendEmployeeEvent,
    getEventSession
  };

  Object.assign(window, {
    getAdminProfile,
    isAdminEmployee,
    getDepartmentInfo,
    displayRoleForEmployee:displayRole,
    normalizeGrade,
    normalizeEmployeeRecord,
    getStoredEmployee,
    getActiveEmployee,
    saveEmployee,
    saveAdminEmployee,
    updateEmployeeRecord:updateEmployee,
    syncEmployeeProfile,
    syncEmployeeFromRemoteProfile:syncRemoteProfile,
    sendEmployeeEvent,
    currentDateKey:u.todayKey,
    getEventSession
  });
})();
