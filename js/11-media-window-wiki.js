    function updateClock(){
      const now = new Date();
      clockChip.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    }

    setInterval(updateClock, 1000);
    updateClock();

    function setSoundState(on){
      localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
      soundToggle.textContent = on ? 'SOUND ON' : 'SOUND OFF';
    }

    soundToggle.addEventListener('click', async () => {
      const isOn = localStorage.getItem(SOUND_KEY) === 'on';
      if (isOn){
        bgAudio.pause();
        bgAudio.currentTime = 0;
        setSoundState(false);
      } else {
        try{
          await bgAudio.play();
          setSoundState(true);
        } catch (e){
          setSoundState(false);
        }
      }
    });

    function restoreSound(){
      const isOn = localStorage.getItem(SOUND_KEY) === 'on';
      if (isOn){
        bgAudio.play().then(() => setSoundState(true)).catch(() => setSoundState(false));
      } else {
        setSoundState(false);
      }
    }

    function getYouTubeVideoId(url){
      try{
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes('youtu.be')) return parsedUrl.pathname.slice(1);
        if (parsedUrl.searchParams.get('v')) return parsedUrl.searchParams.get('v');
        if (parsedUrl.pathname.includes('/embed/')) return parsedUrl.pathname.split('/embed/')[1].split('?')[0];
        if (parsedUrl.pathname.includes('/shorts/')) return parsedUrl.pathname.split('/shorts/')[1].split('?')[0];
        return url;
      }catch(error){
        return url;
      }
    }

    function getYouTubePlaylistId(value){
      try{
        const parsedUrl = new URL(value);
        return parsedUrl.searchParams.get('list') || value;
      }catch(error){
        return value;
      }
    }

    function getYouTubeEmbedOrigin(){
      if (window.location && window.location.origin && /^https?:/i.test(window.location.origin)){
        return window.location.origin;
      }
      return 'https://vox403.github.io';
    }

    function makeYouTubeVideoEmbedUrl(url){
      const id = getYouTubeVideoId(url);
      const params = new URLSearchParams({
        autoplay:'1',
        playsinline:'1',
        rel:'0',
        enablejsapi:'1',
        origin:getYouTubeEmbedOrigin()
      });
      return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
    }

    function makeYouTubePlaylistEmbedUrl(value){
      const id = getYouTubePlaylistId(value);
      const params = new URLSearchParams({
        listType:'playlist',
        list:id,
        autoplay:'1',
        playsinline:'1',
        rel:'0',
        enablejsapi:'1',
        origin:getYouTubeEmbedOrigin()
      });
      return `https://www.youtube.com/embed?${params.toString()}`;
    }

    function resetBroadcastPlayback(showIntro = true){
      if (broadcastYoutube){
        broadcastYoutube.src = '';
        broadcastYoutube.style.display = 'none';
      }
      if (broadcastIntro) broadcastIntro.style.display = showIntro ? 'flex' : 'none';
      if (broadcastCurrentChannel) broadcastCurrentChannel.textContent = 'SIGNAL WAITING...';
    }

    function playBroadcastChannel(button){
      if (!button || !broadcastYoutube) return;
      const kind = button.dataset.kind || 'video';
      const channelName = button.dataset.name || 'BROADCAST';
      const src = kind === 'playlist'
        ? makeYouTubePlaylistEmbedUrl(button.dataset.playlist || '')
        : makeYouTubeVideoEmbedUrl(button.dataset.youtube || '');
      if (broadcastIntro) broadcastIntro.style.display = 'none';
      broadcastYoutube.style.display = 'block';
      broadcastYoutube.src = src;
      if (broadcastCurrentChannel) broadcastCurrentChannel.textContent = `NOW PLAYING :: ${channelName}`;
      const employee = getActiveEmployee();
      if (employee && !isAdminEmployee(employee)){
        sendEmployeeEvent('BROADCAST_CHANNEL_PLAYED', employee, {
          channel_name:channelName,
          channel_kind:kind,
          source:kind === 'playlist' ? (button.dataset.playlist || '') : (button.dataset.youtube || '')
        });
      }
    }

    function applyMusicVideoSource(){
      resetBroadcastPlayback(true);
    }

    broadcastChannelButtons.forEach((button) => {
      button.addEventListener('click', () => playBroadcastChannel(button));
    });

    function bringFront(win){
      if (!win) return;
      zCounter += 1;
      win.style.zIndex = zCounter;
    }

    function syncWindowLayerState(){
      const hasVisible = windows.some(win => !win.classList.contains('hidden'));
      windowLayer.classList.toggle('has-window', hasVisible);
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
      const layerRect = windowLayer.getBoundingClientRect();
      const winRect = win.getBoundingClientRect();
      const isSupportWindow = win.id === 'window-support';
      const left = Math.max(12, Math.round((layerRect.width - winRect.width) / 2));
      const top = isSupportWindow
        ? Math.max(8, Math.round((layerRect.height - winRect.height) / 2))
        : Math.max(22, Math.round((layerRect.height - winRect.height) / 2) - 10);
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    }

    function closeAllWindows(exceptId = ''){
      windows.forEach(win => {
        if (win.id !== exceptId){
          closeWindow(win.id);
        }
      });
    }

    function openApp(app){
      const win = document.getElementById(`window-${app}`);
      if (!win) return;
      closeAllWindows(win.id);
      win.classList.remove('hidden');
      syncWindowLayerState();
      centerWindow(win);
      bringFront(win);

      if (app === 'mail'){
        activeMailId = '';
        renderMailInbox('');
      }

      if (app === 'idcard'){
        const employee = getActiveEmployee();
        if (employee){
          renderIdCard(employee);
          syncEmployeeFromRemoteProfile(employee).then((syncedEmployee) => {
            if (syncedEmployee) renderIdCard(syncedEmployee);
          });
        }
      }

      if (app === 'gallery'){
        renderGallery();
      }

      if (app === 'contents'){
        renderContentsHub();
      }

      if (app === 'evaluation'){
        renderEvaluation();
      }

      if (app === 'support'){
        vocBegin();
        vocScrollToBottom(true);
      }

      if (app === 'music'){
        applyMusicVideoSource();
      }

      if (app === 'internet'){
        applyThemeMode('default');
        queueInternetStabilize();
      } else if (document.body.classList.contains('alastor-mode')){
        applyThemeMode('default');
      }
    }

    function closeWindow(id){
      const win = document.getElementById(id);
      if (!win) return;
      win.classList.add('hidden');
      syncWindowLayerState();
      if (id === 'window-internet'){
        applyThemeMode('default');
      }
      if (id === 'window-music'){
        resetBroadcastPlayback(true);
      }
    }

    desktopIcons.forEach(btn => {
      btn.addEventListener('click', () => openApp(btn.dataset.app));
    });

    document.querySelectorAll('.window').forEach(win => {
      win.addEventListener('mousedown', () => bringFront(win));
    });

    document.querySelectorAll('.window-close').forEach(btn => {
      btn.addEventListener('click', () => closeWindow(btn.dataset.close));
    });

    windowLayer.addEventListener('click', (e) => {
      if (!window.matchMedia('(max-width: 720px)').matches) return;
      if (e.target !== windowLayer) return;
      closeAllWindows();
      syncWindowLayerState();
      applyThemeMode('default');
    });

    function applyThemeMode(mode){
      if (mode === 'alastor'){
        document.body.classList.add('alastor-mode');
      } else {
        document.body.classList.remove('alastor-mode');
      }
    }

    function normalizeQuery(value){
      return value.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9가-힣]/g,'');
    }

    function findWikiEntry(query){
      const normalized = normalizeQuery(query);
      if (!normalized) return null;
      return Object.values(wikiData).find(item => item.aliases.some(alias => normalized.includes(normalizeQuery(alias))));
    }

    function buildProfileGrid(profile){
      return Object.entries(profile).map(([key, value]) => `
        <dt>${escapeHtml(key)}</dt>
        <dd>${escapeHtml(value)}</dd>
      `).join('');
    }

    function stabilizeInternetWindow(){
      if (!internetWindow || internetWindow.classList.contains('hidden')) return;
      if (internetWindowBody) internetWindowBody.scrollTop = 0;
      centerWindow(internetWindow);
    }

    function queueInternetStabilize(){
      stabilizeInternetWindow();
      requestAnimationFrame(stabilizeInternetWindow);
      setTimeout(stabilizeInternetWindow, 80);
      setTimeout(stabilizeInternetWindow, 220);
    }

    function bindInternetAssetStabilizers(){
      if (!searchResult) return;
      searchResult.querySelectorAll('img').forEach((img) => {
        img.addEventListener('load', stabilizeInternetWindow, { once:true });
        img.addEventListener('error', stabilizeInternetWindow, { once:true });
      });
    }

    function buildWiki(entry){
      searchResult.innerHTML = `
        <div class="wiki">
          <aside class="wiki-left">
            <div class="wiki-image">
              <img src="${entry.image}" alt="${escapeHtml(entry.ko)} 이미지" onerror="assetFail(this)" loading="lazy" decoding="async">
              <div class="asset-fallback">${escapeHtml(entry.image)}</div>
            </div>
            <div>
              <div class="name-ko">${escapeHtml(entry.ko)}</div>
              <div class="name-en">${escapeHtml(entry.en)}</div>
            </div>
          </aside>

          <div class="wiki-right">
            <section class="wiki-right-top">
              <dl class="profile-grid">
                ${buildProfileGrid(entry.profile)}
              </dl>
            </section>

            <section class="wiki-right-bottom">
              ${entry.description}
            </section>
          </div>
        </div>
      `;
      applyThemeMode(entry.theme === 'alastor' ? 'alastor' : 'default');
      bindInternetAssetStabilizers();
      queueInternetStabilize();
    }

    function runSearch(){
      const value = searchInput.value.trim();
      const entry = findWikiEntry(value);
      if (!value){
        searchResult.innerHTML = `
          <div class="search-empty">
            <strong>검색어가 비어 있습니다.</strong><br>
            적어도 이름 하나는 입력해. 그래야 보여줄 만한 자료를 꺼내오지.
          </div>
        `;
        applyThemeMode('default');
        queueInternetStabilize();
        return;
      }

      if (!entry){
        searchResult.innerHTML = `
          <div class="search-empty">
            <strong>검색 결과 없음</strong><br>
            입력한 키워드와 일치하는 데이터가 없습니다.<br>
            추천 검색어: 복스, 발렌티노, 벨벳, 알래스터, 엔젤 더스트, 샬럿 모닝스타, vees
            <div class="search-note">※ 버그 발견 시 제보 바랍니다.</div>
          </div>
        `;
        applyThemeMode('default');
        queueInternetStabilize();
        return;
      }

      buildWiki(entry);
    }

    searchBtn.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
    });
    document.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', () => {
        searchInput.value = tag.dataset.query;
        runSearch();
      });
    });
