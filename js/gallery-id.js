(function(){
  const app = window.Voxtek;
  const { dom, data, state, u, employee } = app;

  function renderGallery(){
    if (!dom.galleryImage || !dom.galleryIndex) return;

    const item = data.gallery[state.galleryIndex];
    dom.galleryImage.style.display = 'block';
    dom.galleryFallback.style.display = 'none';
    dom.galleryImage.src = item.src;
    dom.galleryImage.alt = `Voxtagram 앨범 이미지 ${state.galleryIndex + 1}`;
    dom.galleryFallback.textContent = item.label;
    dom.galleryImage.onerror = function(){
      dom.galleryImage.style.display = 'none';
      dom.galleryFallback.style.display = 'flex';
    };
    dom.galleryIndex.textContent = `${u.pad(state.galleryIndex + 1)} / ${u.pad(data.gallery.length)}`;
  }

  function moveGallery(step){
    state.galleryIndex = (state.galleryIndex + step + data.gallery.length) % data.gallery.length;
    renderGallery();
  }

  function renderIdCard(record){
    if (!record) return;

    const rowLabels = Array.from(document.querySelectorAll('.id-row dt'));
    const admin = employee.isAdminEmployee(record);
    const card = document.querySelector('.id-card');
    if (card) card.classList.toggle('admin-id-card', admin);

    if (admin){
      const profile = employee.getAdminProfile(record.adminKey);
      if (!profile) return;

      ['접속 권한','대표명','기준일','근속','권한','역할'].forEach((label, index) => {
        if (rowLabels[index]) rowLabels[index].textContent = label;
      });

      dom.cardGreeting.textContent = `${profile.greeting} 승인`;
      dom.cardName.textContent = profile.name;
      dom.editNameBtn.classList.add('hidden');
      dom.cardJoin.textContent = u.formatDate(profile.joinedAt);
      dom.cardDays.textContent = `누적 ${u.pad(u.daysSince(profile.joinedAt))}일`;
      dom.cardTeam.textContent = profile.authority;
      dom.cardGrade.textContent = profile.position;
      setBadge(profile.badge, `${profile.name} 관리자 카드`);
      return;
    }

    const normalized = employee.getStoredEmployee() || record;
    const role = employee.displayRole(normalized);

    ['환영 문구','이름','입사일','근속','팀','직급'].forEach((label, index) => {
      if (rowLabels[index]) rowLabels[index].textContent = label;
    });

    dom.cardGreeting.textContent = `${normalized.name}님 환영합니다.`;
    dom.cardName.textContent = normalized.name;
    dom.editNameBtn.classList.remove('hidden');
    dom.cardJoin.textContent = u.formatDate(normalized.joinedAt);
    dom.cardDays.textContent = `입사 ${u.pad(u.daysSince(normalized.joinedAt))}일`;
    dom.cardTeam.textContent = role.team || role.employment || '-';
    dom.cardGrade.textContent = role.grade || role.position || '-';
    setBadge(normalized.badge, `${normalized.badge.label} 사원증 마크`);
  }

  function setBadge(badge, alt){
    dom.cardBadge.style.display = 'block';
    dom.cardBadgeFallback.style.display = 'none';
    dom.cardBadge.src = badge.src;
    dom.cardBadge.alt = alt;
    dom.cardBadgeFallback.textContent = badge.label;
    dom.cardBadge.onerror = function(){
      dom.cardBadge.style.display = 'none';
      dom.cardBadgeFallback.style.display = 'flex';
    };
  }

  if (dom.galleryPrev) dom.galleryPrev.addEventListener('click', () => moveGallery(-1));
  if (dom.galleryNext) dom.galleryNext.addEventListener('click', () => moveGallery(1));

  app.gallery = { render:renderGallery };
  app.idcard = { render:renderIdCard };

  window.renderGallery = renderGallery;
  window.renderIdCard = renderIdCard;
})();
