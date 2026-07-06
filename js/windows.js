(function(){
  const app = window.Voxtek;
  const { dom, state, keys, u } = app;

  function showToast(message){
    if (dom.loginStatus) dom.loginStatus.textContent = '';

    const old = document.getElementById('voxtekToast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'voxtekToast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:120;border:1px solid rgba(124,205,255,.26);border-radius:999px;padding:11px 15px;background:rgba(5,10,18,.96);box-shadow:0 12px 34px rgba(0,0,0,.42);font-size:14px;color:#e9f7ff;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1600);
  }

  function updateClock(){
    if (!dom.clock) return;
    const now = new Date();
    dom.clock.textContent = `${u.pad(now.getHours())}:${u.pad(now.getMinutes())}:${u.pad(now.getSeconds())}`;
  }

  function setSound(on){
    localStorage.setItem(keys.sound, on ? 'on' : 'off');
    if (dom.soundToggle) dom.soundToggle.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  }

  function restoreSound(){
    const on = localStorage.getItem(keys.sound) === 'on';
    if (on && dom.bgAudio){
      dom.bgAudio.play().then(() => setSound(true)).catch(() => setSound(false));
    } else {
      setSound(false);
    }
  }

  function playError(){
    if (!dom.errorAudio) return;
    try{
      dom.errorAudio.pause();
      dom.errorAudio.currentTime = 0;
      dom.errorAudio.volume = .82;
      const started = dom.errorAudio.play();
      if (started && typeof started.catch === 'function') started.catch(() => {});
    }catch(error){}
  }

  function showFeatureAlert(moduleName = 'PENDING'){
    if (dom.alertModule) dom.alertModule.textContent = String(moduleName || 'PENDING').toUpperCase();
    if (dom.alertBackdrop) dom.alertBackdrop.classList.remove('hidden');
    playError();
  }

  function closeFeatureAlert(){
    if (dom.alertBackdrop) dom.alertBackdrop.classList.add('hidden');
  }

  function bringFront(win){
    if (!win) return;
    state.z += 1;
    win.style.zIndex = state.z;
  }

  function syncWindowLayer(){
    const visible = dom.windows.some((win) => !win.classList.contains('hidden'));
    if (dom.windowLayer) dom.windowLayer.classList.toggle('has-window', visible);
  }

  function centerWindow(win){
    if (!win) return;
    if (window.matchMedia('(max-width: 720px)').matches){
      const body = win.querySelector('.window-body');
      if (body) body.scrollTop = 0;
      win.style.left = '';
      win.style.top = '';
      return;
    }

    const layer = dom.windowLayer.getBoundingClientRect();
    const rect = win.getBoundingClientRect();
    win.style.left = `${Math.max(12, Math.round((layer.width - rect.width) / 2))}px`;
    win.style.top = `${Math.max(22, Math.round((layer.height - rect.height) / 2) - 10)}px`;
  }

  function closeWindow(id){
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.add('hidden');
    syncWindowLayer();
  }

  function closeAllWindows(exceptId = ''){
    dom.windows.forEach((win) => {
      if (win.id !== exceptId) closeWindow(win.id);
    });
  }

  function openApp(appName){
    if (appName === 'specimen' || appName === 'pursue'){
      closeAllWindows();
      showFeatureAlert(appName);
      return;
    }

    closeFeatureAlert();

    const win = document.getElementById(`window-${appName}`);
    if (!win) return;

    closeAllWindows(win.id);
    win.classList.remove('hidden');
    syncWindowLayer();
    centerWindow(win);
    bringFront(win);

    if (appName === 'mail'){
      state.mailId = '';
      app.mail.renderInbox('');
    }

    if (appName === 'idcard'){
      const record = app.employee.getActiveEmployee();
      if (record){
        renderIdCard(record);
        app.employee.syncRemoteProfile(record).then((synced) => {
          if (synced) renderIdCard(synced);
        });
      }
    }

    if (appName === 'gallery') renderGallery();
    if (appName === 'evaluation') app.attendance.render();
  }

  function bindWindowDragging(win){
    const handle = win.querySelector('[data-drag-handle]');
    if (!handle) return;

    let active = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const mobile = () => window.matchMedia('(max-width: 720px)').matches;

    handle.addEventListener('mousedown', (event) => {
      if (mobile() || event.target.closest('button')) return;
      active = true;
      handle.style.cursor = 'grabbing';
      bringFront(win);
      startX = event.clientX;
      startY = event.clientY;
      startLeft = win.offsetLeft;
      startTop = win.offsetTop;
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (event) => {
      if (!active) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const maxLeft = Math.max(0, dom.windowLayer.clientWidth - win.offsetWidth);
      const maxTop = Math.max(0, dom.windowLayer.clientHeight - win.offsetHeight);
      win.style.left = `${Math.min(maxLeft, Math.max(0, startLeft + dx))}px`;
      win.style.top = `${Math.min(maxTop, Math.max(0, startTop + dy))}px`;
    });

    window.addEventListener('mouseup', () => {
      active = false;
      handle.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }

  function bindIntroDragging(){
    const popup = dom.introPopup;
    const handle = document.getElementById('introDragHandle');
    const bounds = dom.introScreen;
    if (!popup || !handle || !bounds) return;

    let active = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button') || bounds.classList.contains('hidden')) return;
      active = true;
      pointerId = event.pointerId;
      handle.setPointerCapture(pointerId);
      startX = event.clientX;
      startY = event.clientY;
      startLeft = popup.offsetLeft;
      startTop = popup.offsetTop;
      handle.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    });

    handle.addEventListener('pointermove', (event) => {
      if (!active || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      popup.style.left = `${Math.min(Math.max(0, bounds.clientWidth - popup.offsetWidth), Math.max(0, startLeft + dx))}px`;
      popup.style.top = `${Math.min(Math.max(0, bounds.clientHeight - popup.offsetHeight), Math.max(0, startTop + dy))}px`;
    });

    const stop = (event) => {
      if (!active || event.pointerId !== pointerId) return;
      active = false;
      handle.style.cursor = '';
      document.body.style.userSelect = '';
      try{ handle.releasePointerCapture(pointerId); }catch(error){}
      pointerId = null;
    };

    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function centerIntro(){
    if (!dom.introPopup || !dom.introScreen || dom.introScreen.classList.contains('hidden')) return;
    const bounds = dom.introScreen.getBoundingClientRect();
    const rect = dom.introPopup.getBoundingClientRect();
    dom.introPopup.style.left = `${Math.max(10, Math.round((bounds.width - rect.width) / 2))}px`;
    dom.introPopup.style.top = `${Math.max(18, Math.round((bounds.height - rect.height) / 2))}px`;
  }

  function bindWindows(){
    setInterval(updateClock, 1000);
    updateClock();

    if (dom.soundToggle){
      dom.soundToggle.addEventListener('click', async () => {
        const on = localStorage.getItem(keys.sound) === 'on';
        if (on){
          dom.bgAudio.pause();
          dom.bgAudio.currentTime = 0;
          setSound(false);
          return;
        }

        try{
          await dom.bgAudio.play();
          setSound(true);
        }catch(error){
          setSound(false);
        }
      });
    }

    if (dom.alertClose) dom.alertClose.addEventListener('click', closeFeatureAlert);
    if (dom.alertBackdrop){
      dom.alertBackdrop.addEventListener('click', (event) => {
        if (event.target === dom.alertBackdrop) closeFeatureAlert();
      });
    }

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeFeatureAlert();
    });

    dom.desktopIcons.forEach((button) => {
      button.addEventListener('click', () => {
        const url = button.dataset.url;
        if (url){
          window.location.assign(url);
          return;
        }
        openApp(button.dataset.app);
      });
    });

    dom.windows.forEach((win) => {
      bindWindowDragging(win);
      win.addEventListener('mousedown', () => bringFront(win));
    });

    document.querySelectorAll('.window-close').forEach((button) => {
      button.addEventListener('click', () => closeWindow(button.dataset.close));
    });

    if (dom.windowLayer){
      dom.windowLayer.addEventListener('click', (event) => {
        if (!window.matchMedia('(max-width: 720px)').matches) return;
        if (event.target !== dom.windowLayer) return;
        closeAllWindows();
        syncWindowLayer();
      });
    }

    bindIntroDragging();

    window.addEventListener('resize', () => {
      const visible = dom.windows.find((win) => !win.classList.contains('hidden'));
      syncWindowLayer();
      centerIntro();
      if (visible) centerWindow(visible);
    });
  }

  app.windows = {
    bind:bindWindows,
    restoreSound,
    openApp,
    closeWindow,
    closeAllWindows,
    centerIntro,
    sync:syncWindowLayer,
    showFeatureAlert
  };

  window.showToast = showToast;
  window.closeAllWindows = closeAllWindows;
})();
