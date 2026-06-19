    function handleLogin(){
      if (isBooting) return;
      const raw = employeeNameInput.value.trim();
      if (!raw){
        loginStatus.textContent = '이름부터 입력해. 아무나 들여보낼 생각은 없거든.';
        employeeNameInput.focus();
        return;
      }
      if (isReservedAdminHandle(raw)){
        loginStatus.textContent = '대표 계정은 관리자 로그인 창구로 접속하십시오.';
        if (adminLoginOpenBtn) adminLoginOpenBtn.focus();
        return;
      }
      isBooting = true;
      loginBtn.disabled = true;
      quitBtn.disabled = true;
      if (adminLoginOpenBtn) adminLoginOpenBtn.disabled = true;
      loginStatus.textContent = '';
      const employee = saveEmployee(raw);
      runBootSequence(() => {
        isBooting = false;
        loginBtn.disabled = false;
        quitBtn.disabled = false;
        if (adminLoginOpenBtn) adminLoginOpenBtn.disabled = false;
        applyEmployeeHrAward(employee).then(async (updatedEmployee) => {
          const baseEmployee = updatedEmployee || employee;
          const syncedEmployee = await syncEmployeeFromRemoteProfile(baseEmployee);
          showIntroPopup(syncedEmployee || baseEmployee);
        });
      });
    }

    function resetEmployee(){
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SOUND_KEY);
      localStorage.removeItem(MAIL_READ_KEY);
      try{ sessionStorage.removeItem(ADMIN_SESSION_KEY); }catch(error){}
      bgAudio.pause();
      bgAudio.currentTime = 0;
      applyThemeMode('default');
      quitModal.classList.add('hidden');
      if (birthdayModal) birthdayModal.classList.add('hidden');
      if (nameEditModal) nameEditModal.classList.add('hidden');
      desktopScreen.classList.add('hidden');
      introScreen.classList.add('hidden');
      pendingEmployee = null;
      activeEmployee = null;
      if (topbarRoleLabel) topbarRoleLabel.textContent = '사원';
      setContentsShellMode(false);
      loginScreen.classList.remove('hidden');
      updateLoginState();
      soundToggle.textContent = 'SOUND OFF';
    }

    function openAdminLogin(){
      if (!adminLoginModal) return;
      setSelectedAdminAccount(selectedAdminKey || 'vox');
      if (adminPasscodeInput) adminPasscodeInput.value = '';
      if (adminLoginStatus) adminLoginStatus.textContent = '';
      adminLoginModal.classList.remove('hidden');
      setTimeout(() => adminPasscodeInput && adminPasscodeInput.focus(), 60);
    }

    function closeAdminLogin(){
      if (!adminLoginModal) return;
      adminLoginModal.classList.add('hidden');
      if (adminPasscodeInput) adminPasscodeInput.value = '';
      if (adminLoginStatus) adminLoginStatus.textContent = '';
    }

    function setSelectedAdminAccount(key){
      selectedAdminKey = key;
      adminAccountButtons.forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.adminKey === key);
      });
      if (adminLoginStatus) adminLoginStatus.textContent = '';
    }

    function handleAdminLogin(){
      const profile = getAdminProfile(selectedAdminKey);
      if (!profile) return;
      const value = adminPasscodeInput ? adminPasscodeInput.value.trim() : '';
      if (!value){
        if (adminLoginStatus) adminLoginStatus.textContent = '관리자 키를 입력하십시오.';
        return;
      }
      if (value.toLowerCase() !== profile.passcode.toLowerCase()){
        if (adminLoginStatus) adminLoginStatus.textContent = 'ACCESS DENIED. 관리자 키가 일치하지 않습니다.';
        return;
      }
      const employee = saveAdminEmployee(profile);
      closeAdminLogin();
      isBooting = true;
      loginBtn.disabled = true;
      quitBtn.disabled = true;
      if (adminLoginOpenBtn) adminLoginOpenBtn.disabled = true;
      runBootSequence(() => {
        isBooting = false;
        loginBtn.disabled = false;
        quitBtn.disabled = false;
        if (adminLoginOpenBtn) adminLoginOpenBtn.disabled = false;
        enterDesktop(employee);
      });
    }

    if (adminLoginOpenBtn) adminLoginOpenBtn.addEventListener('click', openAdminLogin);
    if (adminLoginCancel) adminLoginCancel.addEventListener('click', closeAdminLogin);
    if (adminLoginConfirm) adminLoginConfirm.addEventListener('click', handleAdminLogin);
    if (adminPasscodeInput) adminPasscodeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdminLogin(); });
    adminAccountButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setSelectedAdminAccount(button.dataset.adminKey || 'vox');
        if (adminPasscodeInput) adminPasscodeInput.focus();
      });
    });
    if (adminLoginModal){
      adminLoginModal.addEventListener('click', (e) => { if (e.target === adminLoginModal) closeAdminLogin(); });
    }

    loginBtn.addEventListener('click', handleLogin);
    employeeNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });

    introCloseBtn.addEventListener('click', closeIntroPopup);

    quitBtn.addEventListener('click', () => {
      const title = quitModal ? quitModal.querySelector('h3') : null;
      const copy = quitModal ? quitModal.querySelector('p') : null;
      if (title) title.textContent = '되돌릴 수 없습니다.';
      if (copy) copy.textContent = '당신의 무가치한 인생으로 돌아가겠습니까?';
      quitModal.classList.remove('hidden');
    });

    cancelQuit.addEventListener('click', () => quitModal.classList.add('hidden'));
    confirmQuit.addEventListener('click', resetEmployee);

    quitModal.addEventListener('click', (e) => {
      if (e.target === quitModal) quitModal.classList.add('hidden');
    });
