    function currentDateKey(){
      const d = new Date();
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    function formatDateKey(dateKey){
      return String(dateKey || currentDateKey()).replaceAll('-', '.');
    }

    function createUid(){
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function getEventSession(){
      let value = localStorage.getItem(EVENT_SESSION_KEY);
      if (!value){
        value = createUid();
        localStorage.setItem(EVENT_SESSION_KEY, value);
      }
      return value;
    }

    function recordPortalLogin(employee){
      if (!employee || isAdminEmployee(employee)) return;
      sendEmployeeEvent('LOGIN', employee, { source:'portal_login' });
    }

    function renderContentsHub(){
      setContentsShellMode();
      const body = document.querySelector('#window-contents .window-body');
      if (body) body.scrollTop = 0;
    }

    function bindContentsHub(){
      contentsCards.forEach((card) => {
        if (card.dataset.bound === 'true') return;
        card.dataset.bound = 'true';
        card.addEventListener('click', () => {
          const url = card.getAttribute('data-contents-url');
          if (url) window.location.assign(url);
        });
      });
    }

    function showToast(message){
      if (loginStatus) loginStatus.textContent = '';
      const old = document.getElementById('voxtekToast');
      if (old) old.remove();
      const toast = document.createElement('div');
      toast.id = 'voxtekToast';
      toast.textContent = message;
      toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:120;border:1px solid rgba(124,205,255,.26);border-radius:999px;padding:11px 15px;background:rgba(5,10,18,.96);box-shadow:0 12px 34px rgba(0,0,0,.42);font-size:14px;color:#e9f7ff;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1600);
    }

    
    const EVALUATION_YEAR = 2026;
    const EVALUATION_MONTH = 6;
    const EVALUATION_PREVIEW_MODE = false; 
    const EVALUATION_STORAGE_PREFIX = 'voxtek_june_evaluation_v1_';
    const JUNE_DAILY_ORDERS = [
      { day:1, difficulty:'EASY', text:'복스테크 사내 송출망 점검일입니다. 기본 신호를 안정권에 맞추고, 불필요한 잡음을 제거하십시오. 첫날부터 실수하면 기록이 꽤 보기 흉할 겁니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:2, difficulty:'NORMAL', text:'발렌티노 님의 심기를 건드리지 마십시오. 주변에 계시다면 대피하시고, 피해를 관찰하셨다면 보고서를 제출하시길 바랍니다.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:3, difficulty:'EASY', text:'벨벳 님의 트렌드 피드가 갱신되었습니다. 뒤처진 감각은 사내 품질 저하로 간주됩니다. 유행 신호를 정상 범위에 맞추십시오.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:4, difficulty:'NORMAL', text:'복스 님의 방송 회선이 미세하게 흔들리고 있습니다. 원인은 장비가 아니라 직원의 집중력일 가능성이 높습니다. 즉시 보정하십시오.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:5, difficulty:'HARD', text:'브이-타워 내부 채널에 과부하가 감지되었습니다. 세 대표님의 회선이 동시에 열려 있습니다. 우선순위를 착각하지 말고 신호를 고정하십시오.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:6, difficulty:'HARD', text:'금일 업무 태도 점검이 있습니다. 당황하지 말고, 평소보다 덜 무능해 보이도록 행동하십시오. 기본 시스템 안정화가 필요합니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:7, difficulty:'NORMAL', text:'발렌티노 님의 스튜디오 주변 소음이 기준치를 초과했습니다. 비명인지 환호인지 구분할 필요는 없습니다. 송출 가능한 수준으로 정리하십시오.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:8, difficulty:'HARD', text:'알 수 없는 라디오 잡음이 유입되었습니다. 낡은 주파수는 복스테크 시스템에 어울리지 않습니다. 즉시 차단하고 화면 신호를 복구하십시오.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:9, difficulty:'EASY', text:'벨벳 님의 승인 대기 콘텐츠가 쌓여 있습니다. 구린 것은 걸러내고, 쓸 만한 것만 살려두십시오. 판단이 느리면 그것도 기록됩니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:10, difficulty:'NORMAL', text:'사내 메신저 응답 속도 점검일입니다. 읽씹은 권장되지 않으며, 상급자의 메시지는 즉시 반응하는 편이 신상에 좋습니다.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:11, difficulty:'HARD', text:'복스 님의 생방송 예비 송출이 시작됩니다. 화면 지연, 음성 깨짐, 라디오 간섭을 동시에 억제하십시오. 실패 시 변명은 받아들여지지 않습니다.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:12, difficulty:'NORMAL', text:'발렌티노 님의 스튜디오 콜시트가 변경되었습니다. 혼선이 발생하지 않도록 내부 알림 신호를 재정렬하십시오. 실수하면 직접 설명하게 될 겁니다.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:13, difficulty:'EASY', text:'사원 기록 동기화가 필요합니다. 이름, 소속, 직책이 시스템과 일치하는지 확인하십시오. 본인이 누구 소속인지 모르는 직원은 처분될 수 있습니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:14, difficulty:'EXTREME', text:'비인가 라디오 주파수가 복스테크 송출망을 침범했습니다. 구식 잡음을 완전히 밀어내고 화면 신호를 장악하십시오. 복스 님이 보고 있습니다.', game:{ requiredHits:5, zoneWidth:15, speed:1.75 } },
      { day:15, difficulty:'NORMAL', text:'월중 평가 중간 점검일입니다. 지금까지의 근속 태도가 평가 시스템에 반영됩니다. 늦었더라도 지금부터라도 쓸모를 증명하십시오.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:16, difficulty:'HARD', text:'벨벳 님의 트렌드 알림이 폭주 중입니다. 인기 있는 것과 역겨운 것을 구분하십시오. 둘을 헷갈리는 순간 사내 평판은 끝입니다.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:17, difficulty:'EASY', text:'복스테크 기본 보안 점검입니다. 화면 잠금, 회선 잠금, 입 조심. 세 가지 중 하나라도 놓치면 귀찮은 일이 생깁니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:18, difficulty:'NORMAL', text:'발렌티노 님 근처의 분위기가 좋지 않습니다. 감정을 자극하지 않도록 거리 유지 및 상황 보고를 수행하십시오. 가까이 갈 필요는 없습니다.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:19, difficulty:'HARD', text:'복스 님의 시청률이 불안정합니다. 수치가 떨어지는 것처럼 보이게 만들지 마십시오. 그래프 신호를 정상 범위로 고정하십시오.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:20, difficulty:'NORMAL', text:'사내 VOC 회선 점검일입니다. 접수된 문의 중 헛소리와 실제 건의를 분리하십시오.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:21, difficulty:'EASY', text:'근속 기록 백업이 진행됩니다. 출석 기록이 누락되지 않도록 사원 신호를 확인하십시오. 존재감이 희미한 직원은 시스템도 놓치기 쉽습니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:22, difficulty:'HARD', text:'브이즈 공동 회의 송출 준비 중입니다. 세 대표님의 회선을 동시에 안정화하십시오. 어느 한쪽도 끊기게 만들지 마십시오. 감각이 필요합니다.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:23, difficulty:'NORMAL', text:'벨벳 님이 오늘의 금지 키워드를 갱신했습니다. 구린 표현이 송출되지 않도록 필터를 조정하십시오. 본인 감각을 믿지 마십시오.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:24, difficulty:'EXTREME', text:'복스테크 중앙 송출망에 대규모 글리치가 발생했습니다. 화면, 음성, 영향력 수치를 동시에 복구하십시오. 실패하면 아주 눈에 띌 겁니다.', game:{ requiredHits:5, zoneWidth:15, speed:1.75 } },
      { day:25, difficulty:'EASY', text:'발렌티노 님의 대기실 주변 정숙 지시가 내려왔습니다. 괜히 눈에 띄지 말고, 조용히 신호만 정돈하십시오. 살아남는 것도 능력입니다.', game:{ requiredHits:2, zoneWidth:34, speed:.9 } },
      { day:26, difficulty:'NORMAL', text:'복스 님의 내부 공지가 예약 송출됩니다. 문장 깨짐, 자막 지연, 불필요한 감정 표현을 제거하십시오. 완벽한 전달만 허용됩니다.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:27, difficulty:'HARD', text:'라디오성 잡음이 사내 스피커에서 감지되었습니다. 웃음소리처럼 들리더라도 반응하지 마십시오.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:28, difficulty:'NORMAL', text:'평가 종료 전 사원 태도 재점검입니다. 지금이라도 성실하게 구십시오. 시스템은 속지 않습니다.', game:{ requiredHits:3, zoneWidth:26, speed:1.15 } },
      { day:29, difficulty:'HARD', text:'최종 평가 데이터가 집계 중입니다. 출석, 지시 수행, 보정 정확도를 다시 확인하십시오. 마지막에 실수하는 직원은 오래 기억됩니다.', game:{ requiredHits:4, zoneWidth:20, speed:1.45 } },
      { day:30, difficulty:'EXTREME', text:'6월 인사 평가 최종 송출일입니다. 모든 평가 신호를 안정권에 맞추고 최종 랭킹 등록을 완료하십시오. 축하합니다. 아직 폐기되진 않았군요.', game:{ requiredHits:5, zoneWidth:15, speed:1.75 } }
    ];

    let evaluationGameState = null;
