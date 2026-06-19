    function renderGallery(){
      const item = galleryItems[currentGallery];
      galleryImage.style.display = 'block';
      galleryFallback.style.display = 'none';
      galleryImage.src = item.src;
      galleryImage.alt = `Voxtagram 앨범 이미지 ${currentGallery + 1}`;
      galleryFallback.textContent = item.label;
      galleryImage.onerror = function(){
        galleryImage.style.display = 'none';
        galleryFallback.style.display = 'flex';
      };
      galleryIndex.textContent = `${pad2(currentGallery + 1)} / ${pad2(galleryItems.length)}`;
    }

    galleryPrev.addEventListener('click', () => {
      currentGallery = (currentGallery - 1 + galleryItems.length) % galleryItems.length;
      renderGallery();
    });

    galleryNext.addEventListener('click', () => {
      currentGallery = (currentGallery + 1) % galleryItems.length;
      renderGallery();
    });

    function renderIdCard(employee){
      if (!employee) return;
      const card = document.querySelector('.id-card');
      const rowLabels = Array.from(document.querySelectorAll('.id-row dt'));
      const admin = isAdminEmployee(employee);
      if (card) card.classList.toggle('admin-id-card', admin);

      if (admin){
        const profile = getAdminProfile(employee.adminKey);
        const days = calculateDayCount(profile.joinedAt);
        const labels = ['접속 권한', '대표명', '기준일', '근속', '권한', '역할'];
        rowLabels.forEach((label, index) => { if (labels[index]) label.textContent = labels[index]; });
        cardGreeting.textContent = `${profile.greeting} 승인`;
        cardName.textContent = profile.name;
        if (editNameBtn) editNameBtn.classList.add('hidden');
        cardJoinDate.textContent = formatDate(profile.joinedAt);
        cardDayCount.textContent = `누적 ${pad2(days)}일`;
        cardEmployment.textContent = profile.authority;
        cardPosition.textContent = profile.position;
        cardBadgeImage.style.display = 'block';
        cardBadgeFallback.style.display = 'none';
        cardBadgeImage.src = profile.badge.src;
        cardBadgeImage.alt = `${profile.name} 관리자 카드`;
        cardBadgeFallback.textContent = profile.badge.label;
        cardBadgeImage.onerror = function(){
          cardBadgeImage.style.display = 'none';
          cardBadgeFallback.style.display = 'flex';
        };
        return;
      }

      const normalized = normalizeEmployeeRecord({ ...employee, role:{ ...(employee.role || {}) }, badge:{ ...(employee.badge || {}) } });
      if (!normalized) return;
      const role = displayRoleForEmployee(normalized);
      const days = calculateDayCount(normalized.joinedAt);
      const labels = ['환영 문구', '이름', '입사일', '근속', '팀', '직급'];
      rowLabels.forEach((label, index) => { if (labels[index]) label.textContent = labels[index]; });
      cardGreeting.textContent = `${normalized.name}님 환영합니다.`;
      cardName.textContent = normalized.name;
      if (editNameBtn) editNameBtn.classList.remove('hidden');
      cardJoinDate.textContent = formatDate(normalized.joinedAt);
      cardDayCount.textContent = `입사 ${pad2(days)}일`;
      cardEmployment.textContent = role.team || role.employment || '-';
      cardPosition.textContent = role.grade || role.position || '-';
      cardBadgeImage.style.display = 'block';
      cardBadgeFallback.style.display = 'none';
      cardBadgeImage.src = normalized.badge.src;
      cardBadgeImage.alt = `${normalized.badge.label} 사원증 마크`;
      cardBadgeFallback.textContent = normalized.badge.label;
      cardBadgeImage.onerror = function(){
        cardBadgeImage.style.display = 'none';
        cardBadgeFallback.style.display = 'flex';
      };
    }

    function makeDraggable(win){
      const handle = win.querySelector('[data-drag-handle]');
      if (!handle) return;

      let dragging = false;
      let startX = 0, startY = 0, startLeft = 0, startTop = 0;

      const isMobileLayout = () => window.matchMedia('(max-width: 720px)').matches;
      handle.addEventListener('mousedown', (e) => {
        if (isMobileLayout()) return;
        if (e.target.closest('button')) return;
        dragging = true;
        handle.style.cursor = 'grabbing';
        bringFront(win);
        startX = e.clientX;
        startY = e.clientY;
        startLeft = win.offsetLeft;
        startTop = win.offsetTop;
        document.body.style.userSelect = 'none';
      });

      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const maxLeft = Math.max(0, windowLayer.clientWidth - win.offsetWidth);
        const maxTop = Math.max(0, windowLayer.clientHeight - win.offsetHeight);
        const nextLeft = Math.min(maxLeft, Math.max(0, startLeft + dx));
        const nextTop = Math.min(maxTop, Math.max(0, startTop + dy));
        win.style.left = `${nextLeft}px`;
        win.style.top = `${nextTop}px`;
      });

      window.addEventListener('mouseup', () => {
        dragging = false;
        handle.style.cursor = '';
        document.body.style.userSelect = '';
      });
    }

    function makeFloatingPopupDraggable(popup, handle, boundsEl){
      if (!popup || !handle || !boundsEl) return;

      let dragging = false;
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      handle.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        if (introScreen.classList.contains('hidden')) return;
        dragging = true;
        pointerId = e.pointerId;
        handle.setPointerCapture(pointerId);
        startX = e.clientX;
        startY = e.clientY;
        startLeft = introPopup.offsetLeft;
        startTop = introPopup.offsetTop;
        handle.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      });

      handle.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const maxLeft = Math.max(0, boundsEl.clientWidth - popup.offsetWidth);
        const maxTop = Math.max(0, boundsEl.clientHeight - popup.offsetHeight);
        const nextLeft = Math.min(maxLeft, Math.max(0, startLeft + dx));
        const nextTop = Math.min(maxTop, Math.max(0, startTop + dy));
        popup.style.left = `${nextLeft}px`;
        popup.style.top = `${nextTop}px`;
      });

      function stopDrag(e){
        if (!dragging || e.pointerId !== pointerId) return;
        dragging = false;
        handle.style.cursor = '';
        document.body.style.userSelect = '';
        try{
          handle.releasePointerCapture(pointerId);
        } catch (err) {}
        pointerId = null;
      }

      handle.addEventListener('pointerup', stopDrag);
      handle.addEventListener('pointercancel', stopDrag);
    }

    makeFloatingPopupDraggable(introPopup, document.getElementById('introDragHandle'), introScreen);

    windows.forEach(makeDraggable);

    window.addEventListener('resize', () => {
      const visibleWindow = windows.find(win => !win.classList.contains('hidden'));
      syncWindowLayerState();
      if (!introScreen.classList.contains('hidden')){
        centerIntroPopup();
      }
      if (visibleWindow){
        centerWindow(visibleWindow);
      }
    });
