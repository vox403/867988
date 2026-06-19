    function buildBirthdayMailItem(){
      const employee = getActiveEmployee();
      if (!employee || isAdminEmployee(employee)) return null;
      const monthDay = employee.birthdayMonthDay || birthdayMonthDayFromValue(employee.birthday);
      if (!monthDay || monthDay !== currentMonthDay()) return null;
      const year = currentYear();
      return {
        id:`birthday_${year}_${employee.employeeId || employee.name}`,
        date:`${year}.${currentMonthDay().replace('-', '.')}`,
        sender:'VoxTek HR Celebration System',
        subject:`${employee.name} 사원 생일 축하 메일`,
        badge:'BIRTHDAY',
        body:`<article class="memo-shell">
          <div class="memo-meta">
            <div class="memo-row"><div class="memo-key">제목</div><div class="memo-value">생일 축하 및 특별 안내</div></div>
            <div class="memo-row"><div class="memo-key">수신</div><div class="memo-value">${escapeHtml(employee.name)} 사원</div></div>
            <div class="memo-row"><div class="memo-key">발신</div><div class="memo-value">VoxTek HR Celebration System</div></div>
            <div class="memo-row"><div class="memo-key">등급</div><div class="memo-value">사내 축하 메일 (BIRTHDAY)</div></div>
          </div>
          <h2 class="memo-title-main">HAPPY BIRTHDAY, ${escapeHtml(employee.name)}</h2>
          <div class="memo-class">CLASSIFICATION: CELEBRATION NOTICE · PERSONAL MAIL</div>
          <div class="memo-content">
            <p>${escapeHtml(employee.name)} 사원.</p>
            <p>오늘은 사원 기록상 생일로 등록된 날입니다. 복스테크는 귀하의 생존과 근속을 확인했으며, 그 사실을 최소한의 축하 문서로 남깁니다.</p>
            <p><strong>축하합니다.</strong> 오늘 하루 정도는 자신이 조금 더 특별하다는 착각을 허용하겠습니다.</p>
            <p class="memo-muted">※ 금일 특별 휴가를 지급하오니 만끽하시길 바랍니다.</p>
            <div class="memo-sign">
              <strong>— VoxTek HR Celebration System</strong>
              Employee Life Event Division<br>
              STATUS: BIRTHDAY SIGNAL DETECTED
            </div>
          </div>
        </article>`
      };
    }

    function mailDateSortValue(item){
      const value = String((item && (item.sortDate || item.date || item.visibleFrom)) || '').trim();
      const match = value.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
      if (!match) return 0;
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
    }

    function sortMailItemsByDate(items){
      return (items || [])
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const diff = mailDateSortValue(b.item) - mailDateSortValue(a.item);
          if (diff) return diff;
          return a.index - b.index;
        })
        .map((entry) => entry.item);
    }

    function mailVisibleItems(){
      const today = currentDateKey ? currentDateKey() : new Date().toISOString().slice(0, 10);
      const items = MAIL_ITEMS.filter((item) => !item.visibleFrom || item.visibleFrom <= today);
      const birthdayMail = buildBirthdayMailItem();
      return sortMailItemsByDate(birthdayMail ? [birthdayMail, ...items] : items);
    }

    function getReadMailIds(){
      try{
        const raw = localStorage.getItem(MAIL_READ_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      }catch(error){
        return [];
      }
    }

    function setReadMailIds(ids){
      try{
        localStorage.setItem(MAIL_READ_KEY, JSON.stringify([...new Set(ids.filter(Boolean))]));
      }catch(error){
        console.warn('Mail read state save failed:', error);
      }
    }

    function markMailRead(id){
      if (!id) return;
      const ids = getReadMailIds();
      if (!ids.includes(id)){
        ids.push(id);
        setReadMailIds(ids);
      }
      updateMailUnreadIndicator();
    }

    function unreadMailCount(){
      const readIds = new Set(getReadMailIds());
      return mailVisibleItems().filter((item) => !readIds.has(item.id)).length;
    }

    function updateMailUnreadIndicator(){
      const count = unreadMailCount();
      if (mailUnreadBadge){
        mailUnreadBadge.textContent = String(count);
        mailUnreadBadge.classList.toggle('hidden', count <= 0);
      }
      if (mailDesktopIcon){
        mailDesktopIcon.classList.toggle('has-unread', count > 0);
        mailDesktopIcon.setAttribute('title', count > 0 ? `읽지 않은 메일 ${count}건` : '읽지 않은 메일 없음');
        mailDesktopIcon.setAttribute('aria-label', count > 0 ? `메일, 읽지 않은 메일 ${count}건` : '메일');
      }
    }

    function renderMailInbox(selectedId = activeMailId){
      if (!mailList || !mailDetail) return;
      const items = mailVisibleItems();
      if (!items.length){
        mailList.innerHTML = '<div class="mail-empty"><div><strong>수신 메일 없음</strong>표시할 내부 메일이 없습니다.</div></div>';
        mailDetail.innerHTML = '<div class="mail-empty"><div><strong>메일을 선택하세요.</strong>수신 메일이 없습니다.</div></div>';
        if (mailShell) mailShell.classList.remove('mail-selected');
        updateMailUnreadIndicator();
        return;
      }

      const selected = selectedId ? items.find((item) => item.id === selectedId) : null;
      activeMailId = selected ? selected.id : '';
      if (mailShell) mailShell.classList.toggle('mail-selected', !!selected);

      if (selected){
        markMailRead(selected.id);
      } else {
        updateMailUnreadIndicator();
      }

      const readIds = new Set(getReadMailIds());
      mailList.innerHTML = items.map((item) => {
        const unread = !readIds.has(item.id);
        return `
          <button class="mail-item ${item.id === activeMailId ? 'is-active' : ''} ${unread ? 'is-unread' : ''}" type="button" data-mail-id="${escapeHtml(item.id)}">
            <span class="mail-item-subject-row">
              <span class="mail-item-subject">${escapeHtml(item.subject)}</span>
              ${unread ? '<span class="mail-item-unread-chip">NEW</span>' : ''}
            </span>
            <span class="mail-item-meta">${escapeHtml(item.sender)} · ${escapeHtml(item.date)}</span>
            <span class="mail-item-badge">${escapeHtml(item.badge || 'MAIL')}</span>
          </button>
        `;
      }).join('');
      mailList.querySelectorAll('[data-mail-id]').forEach((button) => {
        button.addEventListener('click', () => renderMailInbox(button.dataset.mailId));
      });

      if (selected){
        mailDetail.innerHTML = `
          <div class="mail-mobile-detailbar">
            <button class="mail-mobile-back" type="button" data-mail-back>← 받은 메일함</button>
          </div>
          ${selected.body}
        `;
      } else {
        mailDetail.innerHTML = `
          <div class="mail-empty">
            <div>
              <strong>메일을 선택하세요.</strong>
              받은 메일 제목을 클릭하면 상세 내용이 표시됩니다.<br>
              읽지 않은 메일은 파란 표시로 강조됩니다.
            </div>
          </div>
        `;
      }
      const mailBackButton = mailDetail.querySelector('[data-mail-back]');
      if (mailBackButton){
        mailBackButton.addEventListener('click', () => renderMailInbox(''));
      }
      mailDetail.scrollTop = 0;
    }

    const wikiData = {
      vox: {
        aliases: ['복스', 'vox', '빈센트', 'vincent', '빈센트휘트먼', 'vincentwhittman'],
        theme: 'default',
        ko: '복스',
        en: 'Vox',
        image: 'Vox.png',
        profile: {
          '이름': '복스 Vox',
          '본명': '빈센트 휘트먼 Vincent Whittman',
          '별명': '미디어 군주(Media Overlord)',
          '출생': '1891년 ~ 1909년 (미국)'
        },
        description: `
          <p>복스테크의 CEO이자 창립자로, 펜타그램 시티 최고의 미디어/엔터테인먼트 제공자입니다.</p>
          <p>지옥에서 가장 강력한 오버로드이자 감독, 겸손한 기업가. 뿐만 아니라 화려한 경력의 프로듀서, 배우, 그리고 토크쇼 호스트이기도 합니다.</p>
          <p>‘그래 네 여동생과 잤다 어쩔래?’와 ‘복스와의 야심한 밤’ 등 50편 이상의 클래식 히트 쇼를 제작한 바 있죠.</p>
          <p>그러니 펜타그램 시티에선 당신의 돈과 신뢰를 반드시 복스테크 브랜드에 맡기도록 합시다. “여러분의 즐거움을 책임지겠습니다!”</p>
        `
      },
      valentino: {
        aliases: ['발렌티노', 'valentino'],
        theme: 'default',
        ko: '발렌티노',
        en: 'Valentino',
        image: 'Valentino.png',
        profile: {
          '이름': '발렌티노 Valentino',
          '본명': '불명',
          '출생': '1921년 ~ 1949년 (미국 플로리다주)'
        },
        description: `
          <p>지옥에서 가장 섹시한 오버로드이자, 다수의 수상 경력을 가진 포르노 영화 감독입니다.</p>
          <p>매우 수려한 외모와 단연코 최고의 패션 감각으로 유명하죠.</p>
          <p>밤이 되면 그와 벨벳, 그리고 아마도 복스가 함께 소유한 유흥가에서 직접 쇼를 진행하는 모습을 볼 수 있습니다.</p>
          <p>최근 흥행 차트를 점령한 최신작 ‘내게 가버려’는 지옥 최고의 남창 엔젤 더스트가 주연을 맡고 있답니다. 아주 좋은 시간을 보내고 싶나요? 발렌티노가 기다립니다. ;)</p>
        `
      },
      velvette: {
        aliases: ['벨벳', 'velvette'],
        theme: 'default',
        ko: '벨벳',
        en: 'Velvette',
        image: 'Velvette.png',
        profile: {
          '이름': '벨벳 Velvette',
          '본명': '불명',
          '출생': '1971년 ~ 1989년 (영국)'
        },
        description: `
          <p>그녀/여성 | 복스테크 인플루언서 | 골칫덩이 | 1억+ 구독자 | # 여장부</p>
          <p>펜타그램 시티에서 가장 젊고 반항기 넘치는 오버로드입니다.</p>
          <p>지옥을 선도하는 패션 대기업을 V-타워에서 운영하고 있으며, 그녀의 영향력은 나날이 불어나는 중이죠.</p>
          <p>유행을 손쉽게 따라가는 것처럼 보이지만, 어떻게 그렇게 하는 걸까요? 솔직히 무서울 정도입니다.</p>
          <p>발렌티노와 콜라보한 ‘러브 포션 #9’의 책임 개발자로도 알려졌는데, 이 포션은 달콤한 맛과 고객 만족도 100%를 자랑합니다. 최고의 매출을 기록하는 브랜드들과 상까지 받은 주술을 보유한 그녀는 귀여운 악동이랍니다.</p>
        `
      },
      alastor: {
        aliases: ['알래스터', 'alastor', '라디오악마'],
        theme: 'alastor',
        ko: '알래스터',
        en: 'Alastor',
        image: 'Alastor.png',
        profile: {
          '이름': '알래스터 Alastor',
          '본명': '알래스터 Alastor',
          '출생': '1884년 ~ 1903년 (미국 루이지애나주 뉴올리언스)'
        },
        description: `
          <p>알래스터에 대해서? 하. 저 구식 라디오 흉물을 알고 싶다고?</p>
          <p>지옥에서 제일 인기 있다느니 떠들어대는, 잡음이랑 웃음소리만 요란한 자칭 전설이지.</p>
          <p>펜타그램 시티에서 제일 믿음 가는 언론 매체라고? 글쎄, 적어도 1920년대에 아직 처박혀 사는 놈들한텐 그렇게 보일 수도 있겠네.</p>
          <p>잠깐의 공백이 있었다고는 하는데, 그냥 시대에 뒤처져서 처박혀 있던 걸 잘도 포장하고 앉았어.</p>
          <p>그런데도 이제 라디오가 돌아왔다느니, 전보다 훨씬 좋아졌다느니 하면서 또 기어나왔더군.</p>
          <p>최근엔 찰리의 귀여운 호텔 놀이를 도와주는 척하느라 게스트를 부를 시간도 없었나 본데. 뭐, 두고 볼 일이지.</p>
          <p>다음엔 당신이 웃음거리로 쓰일 수도 있으니까. 연락만 주시라고? 아하. 그러지 마. 그러면 저쪽이 아주 신나서 달려들 테니까.</p>
        `
      },
      angeldust: {
        aliases: ['엔젤더스트', '엔젤 더스트', '엔젤', 'angeldust', 'angel dust', 'angel'],
        theme: 'default',
        ko: '엔젤 더스트',
        en: 'Angel Dust',
        image: 'Angel.png',
        profile: {
          '이름': '엔젤 더스트 Angel Dust',
          '본명': '앤서니 Anthony',
          '출생': '1914년 ~ 1916년, 4월 1일 (미국 뉴욕)'
        },
        description: `
          <p>펜타그램 시의 유명한 성인 영화 배우이자 댄서, 가수입니다.</p>
          <p>엔젤은 발렌티노가 제작한 영화 ‘내 사촌과 나’로 스크린에 데뷔했죠.</p>
          <p>이후 ‘모닝 커피를 마시다 섹텐이’ ‘새아빠들 4’ ‘낯선 남자가 들어와... 너에게’ ‘보이스토리’ 등 수많은 작품에 출연했으며, 다가오는 작품 ‘순결한 소년’에도 등장할 예정입니다.</p>
          <p>엔젤은 여러 SE-XXX-Y 상을 수상했고, 그중에는 영화 ‘심문’으로 받은 상도 포함됩니다.</p>
          <p>자애로운 보스, 발렌티노가 선물해준 팻너겟이라는 돼지를 키우고 있습니다.</p>
        `
      },
      charlotte: {
        aliases: ['찰리', '찰리 모닝스타', '찰리모닝스타', 'charlie', 'charliemorningstar', 'charlie morningstar', '샬럿', '샬럿 모닝스타', '샬럿모닝스타', 'charlotte', 'charlottemorningstar', 'charlotte morningstar'],
        theme: 'default',
        ko: '찰리 모닝스타',
        en: 'Charlie Morningstar',
        image: 'Charlie.png',
        profile: {
          '이름': '찰리 모닝스타 Charlie Morningstar',
          '본명': '샬럿 모닝스타 Charlotte Morningstar',
          '별명': '지옥의 공주 (The Princess of Hell)',
          '출생': '지옥 출생 (연도 불명)'
        },
        description: `
          <p>지옥의 공주이자 해즈빈 호텔의 설립자. 포옹과 노래, 눈물 몇 방울이면 살인마든 사기꾼이든 다 새사람이 될 수 있다고 굳게 믿는 낙관주의 과다 복용자입니다.</p>
          <p>살인? 사기? 배신? 괜찮아요, 여러분! 다 같이 손잡고 노래 한 곡 부르면 죄도 상처도 싹 해결된다지요. 아주 감동적이라 눈물겨울 정도입니다. 토가 나올 만큼.</p>
          <p>현재는 각종 문제아들을 한데 끌어모아 해즈빈 호텔이라는 구원 실험장을 운영 중이며, 지옥에서도 사랑과 용서가 통할 거라는 망상 같은 이상론을 아직도 진심으로 밀고 있습니다.</p>
          <p>가장 성가신 점은 그 말도 안 되는 낙관주의를 단순한 쇼가 아니라 진심으로 믿고 있다는 것. 펜타그램 시 한복판에서 현실감각 없이 희망을 외치는 가장 집요하고 시끄러운 왕족쯤으로 이해하면 됩니다.</p>
        `
      },
      lucifer: {
  aliases: ['루시퍼', '루시퍼모닝스타', '루시퍼 모닝스타', 'lucifer', 'lucifermorningstar', 'lucifer morningstar', '루', 'lu'],
  theme: 'default',
  ko: '루시퍼 모닝스타',
  en: 'Lucifer Morningstar',
  image: 'Lucifer.png',
  profile: {
    '이름': '루시퍼 모닝스타 Lucifer Morningstar',
    '별명': '지옥의 왕 (King of Hell)',
    '출생': '지옥 출생 (연도 불명)'
  },
  description: `
    <p>지옥의 왕. 네, 일단 직함은 그렇습니다.</p>
    <p>압도적인 힘과 상징성을 지닌 존재인 건 부정할 수 없지만, 실제 통치 능력에 대해서는 별도의 검토가 필요합니다. 아주 길고 피곤한 검토가요.</p>
    <p>겉으로는 화려하고 유쾌하고, 본인만의 기묘한 취향으로 가득 차 있습니다. 오리, 사과, 과장된 제스처, 불필요하게 극적인 등장. 왕권의 위엄이라기보단 고장 난 장난감 공장의 최고 책임자에 가까운 인상입니다.</p>
    <p>찰리 모닝스타의 아버지이며, 딸을 향한 애정만큼은 진심으로 보입니다. 문제는 그 진심이 늘 제대로 작동하느냐는 별개의 이야기라는 점이죠.</p>
    <p>다만 착각하지 않는 편이 좋습니다. 아무리 우스꽝스럽게 굴어도 그는 여전히 지옥 최상위 존재 중 하나입니다. 웃기다고 해서 만만한 건 아닙니다. 그 부분만큼은, 안타깝게도 사실입니다.</p>
  `
},
husk: {
  aliases: ['허스크', '허스커', 'husk', 'husker'],
  theme: 'default',
  ko: '허스크',
  en: 'Husk',
  image: 'Husk.png',
  profile: {
    '이름': '허스크 Husk',
    '본명': '불명',
    '별명': '허스커 (Husker)',
    '출생': '연도 불명 (미국 네바다주 라스베이거스)'
  },
  description: `
    <p>해즈빈 호텔의 바텐더. 전직 오버로드. 현직 알래스터 소유의 불평 많은 인력.</p>
    <p>술, 도박, 카드, 냉소, 한숨. 허스크를 설명하는 데 필요한 키워드는 대체로 이 정도면 충분합니다. 본인은 아마 더 줄이라고 하겠지만, 안타깝게도 기록은 그렇게 친절하지 않습니다.</p>
    <p>한때는 권력을 쥐었던 인물이지만, 지금은 호텔 바 뒤에서 술을 따르고 있습니다. 몰락의 표본으로는 꽤 우수한 사례죠. 교육 자료로 쓰기에도 나쁘지 않습니다.</p>
    <p>다만 완전히 무가치하다고 보긴 어렵습니다. 허세를 싫어하고, 남의 자기기만을 빠르게 알아보며, 듣기 싫은 진실을 불필요할 정도로 정확하게 찌르는 재주가 있습니다.</p>
    <p>즉, 태도는 최악이고 생산성은 의심스럽지만 관찰 가치는 있습니다.</p>
  `
},
vaggi: {
  aliases: ['배기', 'vaggi', 'vaggie'],
  theme: 'default',
  ko: '배기',
  en: 'Vaggi',
  image: 'Vaggi.png',
  profile: {
    '이름': '배기 Vaggi',
    '출생': '천국 출생 (연도 불명)'
  },
  description: `
    <p>해즈빈 호텔의 실질적인 관리 담당. 다시 말해, 찰리 모닝스타의 이상론이 현장에서 즉시 붕괴하지 않도록 옆에서 겨우 붙들고 있는 안전장치입니다.</p>
    <p>호텔 운영, 경계, 잔소리, 호위, 위기 대응, 감정적 수습까지. 직함 하나로 정리하기엔 맡은 일이 지나치게 많습니다. 인력 배치가 이 정도로 비효율적이라니, 참으로 호텔다운 운영 방식입니다.</p>
    <p>찰리가 모두를 믿는 쪽이라면, 배기는 모두를 의심하는 쪽입니다. 그나마 그 의심이 없었다면 호텔은 진작 누군가의 감상적인 발표회장이나 폭발 현장으로 전락했을 가능성이 높습니다.</p>
    <p>태도는 날카롭고, 경계심은 과하며, 찰리 관련 사안에서는 판단이 다소 감정적으로 흐르는 경향이 있습니다. 하지만 전투 능력과 충성심, 상황 판단력은 일정 수준 이상으로 평가됩니다.</p>
    <p>요약하자면, 해즈빈 호텔에서 드물게 현실을 보는 인물입니다. 문제는 그 현실 감각이 찰리의 꿈을 지키는 데 쓰이고 있다는 점이죠. 낭비입니다.</p>
  `
},
      vees: {
        aliases: ['vees', '브이스', '브이즈'],
        theme: 'default',
        ko: 'Vees',
        en: 'Vees',
        image: 'vees1.jpg',
        profile: {
          '구성원': 'Vox / Valentino / Velvette',
          '소속': 'V-타워 / VoxTek 연합',
          '분야': '미디어 · 유흥 · 패션 · 지배력'
        },
        description: `
          <p>Vees는 펜타그램 시티에서 가장 현대적이고, 가장 영향력 있으며, 가장 눈부신 브랜드 연합입니다.</p>
          <p>방송, 패션, 유흥, 트렌드, 여론, 소비 심리까지. 이 셋이 손대는 순간 시장은 곧장 방향을 바꾸죠.</p>
          <p>그 중심엔 언제나 최신 기술과 가장 빠른 감각, 그리고 압도적인 존재감이 있습니다.</p>
          <p>한마디로 말해, 지옥에서 시대를 만든다는 게 무슨 뜻인지 궁금하다면 그냥 Vees를 보면 됩니다.</p>
        `
      }
    };
