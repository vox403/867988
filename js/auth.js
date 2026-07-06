(function(){
  const app = window.Voxtek;
  const { dom, state, keys, u, employee } = app;
  let affiliationName = '';

  function updateLoginState(){
    const saved = employee.getStoredEmployee();
    if (dom.loginStatus) dom.loginStatus.textContent = '';

    if (saved){
      dom.employeeName.value = saved.name;
      dom.employeeName.readOnly = true;
      dom.employeeName.placeholder = '';
      dom.loginBtn.textContent = '로그인';
      dom.quitBtn.textContent = '퇴사하기';
      dom.quitBtn.classList.remove('hidden');
      dom.adminOpen.classList.remove('hidden');
    } else {
      dom.employeeName.value = '';
      dom.employeeName.readOnly = false;
      dom.employeeName.placeholder = '이름을 입력하세요';
      dom.loginBtn.textContent = '로그인';
      dom.quitBtn.textContent = '퇴사하기';
      dom.quitBtn.classList.add('hidden');
      dom.adminOpen.classList.remove('hidden');
    }
  }

  function runBoot(callback){
    dom.bootOverlay.classList.remove('hidden');
    dom.bootLines.forEach((line) => line.classList.remove('active'));
    [250,740,1220].forEach((delay, index) => {
      setTimeout(() => dom.bootLines[index].classList.add('active'), delay);
    });
    setTimeout(() => {
      dom.bootOverlay.classList.add('hidden');
      callback();
    }, 1900);
  }

  function enterDesktop(record){
    state.activeEmployee = record;

    if (record && !employee.isAdminEmployee(record) && app.attendance){
      state.activeEmployee = app.attendance.applyPromotions(record) || record;
      record = state.activeEmployee;
    }

    const admin = employee.isAdminEmployee(record);
    if (!admin) employee.sendEmployeeEvent('LOGIN', record, { source:'portal_login' });

    const lock = !admin && record ? employee.getSpecialLock(record.employeeId) : null;
    if (dom.topbarRole) dom.topbarRole.textContent = admin ? '관리자' : (lock ? lock.topbarRoleLabel : '사원');
    if (dom.topbarName) dom.topbarName.textContent = record ? record.name : '-';

    renderIdCard(record);
    if (!admin) employee.syncEmployeeProfile(record);
    app.mail.updateUnread();
    app.windows.closeAllWindows();
    dom.loginScreen.classList.add('hidden');
    dom.desktopScreen.classList.remove('hidden');
  }

  function showIntro(record){
    state.activeEmployee = record;
    enterDesktop(record);
    dom.introScreen.classList.remove('hidden');
    requestAnimationFrame(app.windows.centerIntro);
    setTimeout(app.windows.centerIntro, 60);
  }

  function closeIntro(){
    dom.introScreen.classList.add('hidden');
    maybeBirthday();
  }

  function login(){
    if (state.booting) return;

    const name = dom.employeeName.value.trim();
    if (!name){
      dom.loginStatus.textContent = '이름부터 입력해. 아무나 들여보낼 생각은 없거든.';
      dom.employeeName.focus();
      return;
    }

    if (employee.reservedAdminHandle(name)){
      dom.loginStatus.textContent = '대표 계정은 관리자 로그인 창구로 접속하십시오.';
      dom.adminOpen.focus();
      return;
    }

    const saved = employee.getStoredEmployee();
    if (!saved){
      openAffiliationSelect(name);
      return;
    }

    startSession(employee.saveEmployee(name));
  }

  function openAffiliationSelect(name){
    affiliationName = name;
    dom.loginStatus.textContent = '';
    dom.affiliationModal.classList.remove('hidden');
  }

  function closeAffiliationSelect(){
    affiliationName = '';
    dom.affiliationModal.classList.add('hidden');
  }

  function chooseAffiliation(key){
    const name = affiliationName || dom.employeeName.value.trim();
    if (!name) return;

    const record = employee.saveEmployee(name, key);
    closeAffiliationSelect();
    startSession(record);
  }

  function startSession(record){
    state.booting = true;
    dom.loginBtn.disabled = true;
    dom.quitBtn.disabled = true;
    dom.adminOpen.disabled = true;
    dom.loginStatus.textContent = '';

    runBoot(() => {
      state.booting = false;
      dom.loginBtn.disabled = false;
      dom.quitBtn.disabled = false;
      dom.adminOpen.disabled = false;

      showIntro(record);
      employee.syncRemoteProfile(record).then((synced) => {
        const next = synced || record;
        state.activeEmployee = next;
        if (dom.topbarName) dom.topbarName.textContent = next.name || '-';
        renderIdCard(next);
        app.mail.updateUnread();
      });
    });
  }

  function resetEmployee(){
    localStorage.removeItem(keys.employee);
    localStorage.removeItem(keys.sound);
    localStorage.removeItem(keys.mailRead);
    try{ sessionStorage.removeItem(keys.adminSession); }catch(error){}

    if (dom.bgAudio){
      dom.bgAudio.pause();
      dom.bgAudio.currentTime = 0;
    }

    dom.quitModal.classList.add('hidden');
    dom.birthdayModal.classList.add('hidden');
    dom.nameModal.classList.add('hidden');
    dom.desktopScreen.classList.add('hidden');
    dom.introScreen.classList.add('hidden');

    state.activeEmployee = null;
    if (dom.topbarRole) dom.topbarRole.textContent = '사원';
    dom.loginScreen.classList.remove('hidden');
    updateLoginState();
    if (dom.soundToggle) dom.soundToggle.textContent = 'SOUND OFF';
  }

  function selectAdmin(key){
    state.adminKey = key;
    dom.adminButtons.forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.adminKey === key);
    });
    if (dom.adminStatus) dom.adminStatus.textContent = '';
  }

  function openAdmin(){
    selectAdmin(state.adminKey || 'vox');
    dom.adminPass.value = '';
    dom.adminStatus.textContent = '';
    dom.adminModal.classList.remove('hidden');
    setTimeout(() => dom.adminPass.focus(), 60);
  }

  function closeAdmin(){
    dom.adminModal.classList.add('hidden');
    dom.adminPass.value = '';
    dom.adminStatus.textContent = '';
  }

  function adminLogin(){
    const profile = employee.getAdminProfile(state.adminKey);
    if (!profile) return;

    const value = dom.adminPass.value.trim();
    if (!value){
      dom.adminStatus.textContent = '관리자 키를 입력하십시오.';
      return;
    }

    if (value.toLowerCase() !== profile.passcode.toLowerCase()){
      dom.adminStatus.textContent = 'ACCESS DENIED. 관리자 키가 일치하지 않습니다.';
      return;
    }

    const record = employee.saveAdminEmployee(profile);
    closeAdmin();

    state.booting = true;
    dom.loginBtn.disabled = true;
    dom.quitBtn.disabled = true;
    dom.adminOpen.disabled = true;

    runBoot(() => {
      state.booting = false;
      dom.loginBtn.disabled = false;
      dom.quitBtn.disabled = false;
      dom.adminOpen.disabled = false;
      enterDesktop(record);
    });
  }

  function maybeBirthday(){
    const record = employee.getActiveEmployee();
    if (!record || employee.isAdminEmployee(record)) return;

    const hasBirthday = !!(record.birthdayMonthDay || u.monthDay(record.birthday));
    const dismissed = sessionStorage.getItem(keys.birthdayPrompt) === 'dismissed';
    if (!hasBirthday && !dismissed) setTimeout(openBirthday, 360);
  }

  function openBirthday(){
    const record = employee.getActiveEmployee();
    if (!record || employee.isAdminEmployee(record)) return;

    dom.birthdayInput.value = record.birthday || '';
    dom.birthdayStatus.textContent = '';
    dom.birthdayModal.classList.remove('hidden');
    setTimeout(() => dom.birthdayInput.focus(), 60);
  }

  function closeBirthday(dismiss = false){
    dom.birthdayModal.classList.add('hidden');
    dom.birthdayStatus.textContent = '';
    if (dismiss) sessionStorage.setItem(keys.birthdayPrompt, 'dismissed');
  }

  function saveBirthday(){
    const value = dom.birthdayInput.value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)){
      dom.birthdayStatus.textContent = '생일을 선택하십시오.';
      return;
    }

    const updated = employee.updateEmployee((record) => {
      record.birthday = value;
      record.birthdayMonthDay = u.monthDay(value);
      record.birthdayUpdatedAt = new Date().toISOString();
      return record;
    });

    if (!updated) return;

    employee.sendEmployeeEvent('BIRTHDAY_REGISTERED', updated, {
      birthday:value,
      birthday_month_day:updated.birthdayMonthDay,
      display_birthday:u.birthdayText(value),
      updated_at:updated.birthdayUpdatedAt || new Date().toISOString()
    });

    closeBirthday(true);
    showToast('생일 기록 저장 완료.');
    const mailWindow = document.getElementById('window-mail');
    if (mailWindow && !mailWindow.classList.contains('hidden')) app.mail.renderInbox(state.mailId);
  }

  function openNameEdit(){
    const record = employee.getActiveEmployee();
    if (!record || employee.isAdminEmployee(record)) return;

    dom.nameInput.value = record.name || '';
    dom.nameStatus.textContent = '';
    dom.nameModal.classList.remove('hidden');
    setTimeout(() => dom.nameInput.focus(), 60);
  }

  function closeNameEdit(){
    dom.nameModal.classList.add('hidden');
    dom.nameStatus.textContent = '';
  }

  function saveName(){
    const record = employee.getActiveEmployee();
    const nextName = dom.nameInput.value.trim();

    if (!record || employee.isAdminEmployee(record)) return;
    if (!nextName){
      dom.nameStatus.textContent = '새 이름을 입력하십시오.';
      return;
    }
    if (employee.reservedAdminHandle(nextName)){
      dom.nameStatus.textContent = '대표 계정명은 일반 사원 이름으로 사용할 수 없습니다.';
      return;
    }
    if (nextName === record.name){
      dom.nameStatus.textContent = '현재 이름과 동일합니다.';
      return;
    }

    const oldName = record.name;
    const changedAt = new Date().toISOString();
    const updated = employee.updateEmployee((draft) => {
      draft.nameHistory = Array.isArray(draft.nameHistory) ? draft.nameHistory : [];
      draft.nameHistory.push({ from:oldName, to:nextName, at:changedAt, employeeId:draft.employeeId || '' });
      draft.name = nextName;
      draft.lastNameChangedAt = changedAt;
      return draft;
    });

    if (!updated) return;

    employee.sendEmployeeEvent('NAME_CHANGED', updated, {
      old_name:oldName,
      new_name:nextName,
      changed_at:changedAt,
      history_count:updated.nameHistory.length
    });

    showToast('이름 수정 완료.');
    closeNameEdit();
  }

  function bindAuth(){
    dom.loginBtn.addEventListener('click', login);
    dom.employeeName.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') login();
    });

    dom.introClose.addEventListener('click', closeIntro);

    dom.quitBtn.addEventListener('click', () => {
      const title = dom.quitModal.querySelector('h3');
      const copy = dom.quitModal.querySelector('p');
      if (title) title.textContent = '되돌릴 수 없습니다.';
      if (copy) copy.textContent = '당신의 무가치한 인생으로 돌아가겠습니까?';
      dom.quitModal.classList.remove('hidden');
    });
    dom.quitNo.addEventListener('click', () => dom.quitModal.classList.add('hidden'));
    dom.quitYes.addEventListener('click', resetEmployee);
    dom.quitModal.addEventListener('click', (event) => {
      if (event.target === dom.quitModal) dom.quitModal.classList.add('hidden');
    });

    dom.adminOpen.addEventListener('click', openAdmin);
    dom.adminCancel.addEventListener('click', closeAdmin);
    dom.adminConfirm.addEventListener('click', adminLogin);
    dom.adminPass.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') adminLogin();
    });
    dom.adminButtons.forEach((button) => {
      button.addEventListener('click', () => {
        selectAdmin(button.dataset.adminKey || 'vox');
        dom.adminPass.focus();
      });
    });
    dom.adminModal.addEventListener('click', (event) => {
      if (event.target === dom.adminModal) closeAdmin();
    });

    dom.affiliationButtons.forEach((button) => {
      button.addEventListener('click', () => chooseAffiliation(button.dataset.affiliationKey || 'vox'));
    });

    dom.birthdaySave.addEventListener('click', saveBirthday);
    dom.birthdayLater.addEventListener('click', () => closeBirthday(true));
    dom.birthdayInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveBirthday();
    });
    dom.birthdayModal.addEventListener('click', (event) => {
      if (event.target === dom.birthdayModal) closeBirthday(true);
    });

    dom.editNameBtn.addEventListener('click', openNameEdit);
    dom.nameSave.addEventListener('click', saveName);
    dom.nameCancel.addEventListener('click', closeNameEdit);
    dom.nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveName();
    });
    dom.nameModal.addEventListener('click', (event) => {
      if (event.target === dom.nameModal) closeNameEdit();
    });
  }

  app.auth = {
    bind:bindAuth,
    updateLoginState,
    enterDesktop
  };
})();
