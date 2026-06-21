function assetFail(img){
      const parent = img.parentElement;
      if (!parent) return;
      img.style.display = 'none';
      const fallback = parent.querySelector('.asset-fallback, .icon-fallback, .fallback');
      if (fallback) fallback.style.display = 'flex';
    }

    const STORAGE_KEY = 'voxtek_employee_v1';
    const ADMIN_SESSION_KEY = 'voxtek_admin_session_v1';
    const SOUND_KEY = 'voxtek_sound_state_v1';
    const MAIL_READ_KEY = 'voxtek_mail_read_ids_v1';
    const BIRTHDAY_PROMPT_SESSION_KEY = 'voxtek_birthday_prompt_session_v1';

    const ADMIN_PROFILES = {
      vox: {
        key:'vox',
        name:'복스',
        handle:'@vox403_v',
        passcode:'@vox403_v',
        joinedAt:'1950-04-19T00:00:00+09:00',
        badge:{ src:'v2.png', label:'v2.png' },
        line:'VOX LINE',
        authority:'대표 권한 · VoxTek Founder Access',
        position:'전(前) VoxTek CEO · 미디어 오버로드 · 창립자',
        greeting:'VOX ADMIN SESSION',
        vocCopy:'대표님, VOC 관리자 회선이 연결되었습니다. 공개 답변 기록을 확인하거나 운영 메모를 남길 수 있습니다.'
      },
      valentino: {
        key:'valentino',
        name:'발렌티노',
        handle:'@pimplife_v',
        passcode:'@pimplife_v',
        joinedAt:'1970-11-20T00:00:00+09:00',
        badge:{ src:'v1.png', label:'v1.png' },
        line:'VALENTINO LINE',
        authority:'대표 권한 · V-Tower Executive Access',
        position:'현(現) VoxTek CEO · V-타워 스튜디오 디렉터',
        greeting:'VALENTINO ADMIN SESSION',
        vocCopy:'발렌티노 님, VOC 관리자 회선입니다. 접수된 말들은 분류되어 있으며, 필요한 경우 운영 메모로 남길 수 있습니다.'
      },
      velvette: {
        key:'velvette',
        name:'벨벳',
        handle:'@Vel_spotlight_v',
        passcode:'@Vel_spotlight_v',
        joinedAt:'2000-12-07T00:00:00+09:00',
        badge:{ src:'v3.png', label:'v3.png' },
        line:'VELVETTE LINE',
        authority:'대표 권한 · Vees Trend Executive Access',
        position:'패션 오버로드 · 트렌드 디렉터 · Vees Executive',
        greeting:'VELVETTE ADMIN SESSION',
        vocCopy:'벨벳 님, VOC 관리자 회선입니다. 공개 답변 기록과 직원 반응을 확인할 수 있습니다. 구린 건 바로 걸러내면 됩니다.'
      }
    };

  
    const SUPABASE_URL = 'https://gvuhbxpkmyiakyfhuish.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_uCymLmzy-3NR9JyOL-9DtA_HmkGb0-k';
    const supabaseClient = (() => {
      try{
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
        if (!window.supabase || !window.supabase.createClient) return null;
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }catch(error){
        console.warn('Supabase init failed:', error);
        return null;
      }
    })();
    const EVENT_SESSION_KEY = 'voxtek_event_session_v1';

    const loginScreen = document.getElementById('loginScreen');
    const desktopScreen = document.getElementById('desktopScreen');
    const introScreen = document.getElementById('introScreen');
    const introPopup = document.getElementById('introPopup');
    const introCloseBtn = document.getElementById('introCloseBtn');
    const employeeNameInput = document.getElementById('employeeName');
    const loginBtn = document.getElementById('loginBtn');
    const quitBtn = document.getElementById('quitBtn');
    const adminLoginOpenBtn = document.getElementById('adminLoginOpenBtn');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminPasscodeInput = document.getElementById('adminPasscodeInput');
    const adminLoginStatus = document.getElementById('adminLoginStatus');
    const adminLoginConfirm = document.getElementById('adminLoginConfirm');
    const adminLoginCancel = document.getElementById('adminLoginCancel');
    const adminAccountButtons = Array.from(document.querySelectorAll('.admin-account-btn'));
    let selectedAdminKey = 'vox';
    const loginStatus = document.getElementById('loginStatus');
    const loginNote = document.getElementById('loginNote');
    const bootOverlay = document.getElementById('bootOverlay');
    const bootLines = Array.from(bootOverlay.querySelectorAll('.boot-line'));
    const quitModal = document.getElementById('quitModal');
    const confirmQuit = document.getElementById('confirmQuit');
    const cancelQuit = document.getElementById('cancelQuit');
    const birthdayModal = document.getElementById('birthdayModal');
    const birthdayInput = document.getElementById('birthdayInput');
    const birthdayStatus = document.getElementById('birthdayStatus');
    const birthdaySave = document.getElementById('birthdaySave');
    const birthdayLater = document.getElementById('birthdayLater');
    const nameEditModal = document.getElementById('nameEditModal');
    const nameEditInput = document.getElementById('nameEditInput');
    const nameEditStatus = document.getElementById('nameEditStatus');
    const nameEditSave = document.getElementById('nameEditSave');
    const nameEditCancel = document.getElementById('nameEditCancel');
    const topbarRoleLabel = document.getElementById('topbarRoleLabel');
    const topbarName = document.getElementById('topbarName');
    const clockChip = document.getElementById('clockChip');
    const soundToggle = document.getElementById('soundToggle');
    const bgAudio = document.getElementById('bgAudio');
    const broadcastYoutube = document.getElementById('broadcastYoutube');
    const broadcastIntro = document.getElementById('broadcastIntro');
    const broadcastCurrentChannel = document.getElementById('broadcastCurrentChannel');
    const broadcastChannelButtons = Array.from(document.querySelectorAll('.broadcast-channel-btn'));
    const windowLayer = document.getElementById('windowLayer');
    const mailList = document.getElementById('mailList');
    const mailDetail = document.getElementById('mailDetail');
    const mailShell = document.getElementById('mailShell');
    const mailDesktopIcon = document.getElementById('mailDesktopIcon');
    const mailUnreadBadge = document.getElementById('mailUnreadBadge');
    const evaluationStatus = document.getElementById('evaluationStatus');
    const evaluationBody = document.getElementById('evaluationBody');

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResult = document.getElementById('searchResult');
    const internetWindow = document.getElementById('window-internet');
    const internetWindowBody = internetWindow ? internetWindow.querySelector('.window-body') : null;

    const galleryImage = document.getElementById('galleryImage');
    const galleryFallback = document.getElementById('galleryFallback');
    const galleryIndex = document.getElementById('galleryIndex');
    const galleryPrev = document.getElementById('galleryPrev');
    const galleryNext = document.getElementById('galleryNext');

    const cardGreeting = document.getElementById('cardGreeting');
    const cardName = document.getElementById('cardName');
    const cardJoinDate = document.getElementById('cardJoinDate');
    const cardDayCount = document.getElementById('cardDayCount');
    const cardEmployment = document.getElementById('cardEmployment');
    const cardPosition = document.getElementById('cardPosition');
    const cardBadgeImage = document.getElementById('cardBadgeImage');
    const cardBadgeFallback = document.getElementById('cardBadgeFallback');
    const editNameBtn = document.getElementById('editNameBtn');

    const desktopIcons = Array.from(document.querySelectorAll('.desktop-icon'));
    const windows = Array.from(document.querySelectorAll('.window'));
    let zCounter = 20;
    let isBooting = false;
    let pendingEmployee = null;
    let activeEmployee = null;
    const contentsCards = Array.from(document.querySelectorAll('[data-contents-url]'));
    const vocRoom = document.getElementById('vocRoom');
    const vocActions = document.getElementById('vocActions');
    const vocStatus = document.getElementById('vocStatus');
    const vocPublicBoard = document.getElementById('vocPublicBoard');
    const vocPublicAnswers = document.getElementById('vocPublicAnswers');
    const vocPublicButtons = Array.from(document.querySelectorAll('[data-voc-lane]'));
    const vocAdminInboxToggle = document.getElementById('vocAdminInboxToggle');
    const vocAdminAffiliationToggle = document.getElementById('vocAdminAffiliationToggle');
    const vocPublicClose = document.getElementById('vocPublicClose');
    const vocPublicTitle = document.getElementById('vocPublicTitle');
    const vocPublicDesc = document.getElementById('vocPublicDesc');
    let vocFlowState = 'idle';
    let vocPublicActiveLane = '';

    const VOC_ANSWER_LANES = [
      { key:'valentino', title:'발렌티노', label:'VALENTINO LINE', empty:'발렌티노 님의 공개 답변이 없습니다.' },
      { key:'vox', title:'복스', label:'VOX LINE', empty:'복스 님의 공개 답변이 없습니다.' },
      { key:'velvette', title:'벨벳', label:'VELVETTE LINE', empty:'벨벳 님의 공개 답변이 없습니다.' }
    ];

    const VOC_PUBLIC_ANSWERS = {
      valentino: [
        {
          question:'발렌티노님 너무 귀여워요~~',
          answer:'나도 알아.',
          date:'PUBLIC LOG 001'
        },
        {
          question:'요즘 배가 너무 많이 고픕니다 밥 많이 주시면 좋겟스니다',
          answer:'모유를 왜 나한테서 찾아? 포옹은 해 줄 수 있어도.',
          date:'PUBLIC LOG 002'
        },
        {
          question:'사장님 두분 진짜 싸워요??',
          answer:'우린 매일 싸워. 놀랄 것도 없잖아.',
          date:'PUBLIC LOG 003'
        },
        {
          question:'복스님 파딱 뺏어주세요 더보기 나올 때마다 누르기가 두려워요',
          answer:'나도 뺏고 싶어.',
          date:'PUBLIC LOG 004'
        },   
        {
          question:'우우! 악덕기업 복스테크는 사과문과 보상을 줘라!!',
          answer:'뭘 사과하라는 건진 모르겠지만……. 후하게 대접받고 끝낼 생각은 없어? 복스, 쟤 내 방으로 불러.',
          date:'PUBLIC LOG 005'
        }              
      ],
      vox: [
        {
          question:'펩시 vs 코카콜라',
          answer:'코카콜라 미만 쓰레기. 펩시? 하. 탄산 빠진 패배자 브랜드지. 곧 북극곰 펀치 한 방에 캔째로 찌그러져서, 시장 점유율이랑 같이 바다 밑으로 가라앉을 거야.',
          date:'PUBLIC LOG 001'
        },
        {
          question:'저희는 연차 없나요? 과로사할 거 같아요....',
          answer:`연차는 있지. 네가 지금 쓸 수 있다는 뜻은 아니고. 복스테크가 이 꼴인데 휴가부터 찾는 배짱은 높이 사겠어. 참 훌륭해. 회사가 불타는 와중에도 자기 복지부터 챙기는 그 일관성 말이야. 하지만 반려야. 정 쉬고 싶으면 발의 전용 총알받이라도 해. 뒈지면 회복되는 동안은 쉬게 해주지. 단, 죽기 전에 업무 인수인계는 남겨. 네 일을 나한테 떠넘기는 순간, 그땐 네가 차라리 일하게 해달라고 빌게 만들어 줄 테니까.`,
          date:'PUBLIC LOG 002'
        },
        {
          question:'정규직 전환은 몇개월부터인가요?',
          answer:`인사평가 결과에 따라서 내달인 7월에 될 수도 있겠지.`,
          date:'PUBLIC LOG 003'
        },
        {
          question:'저희 연봉 협상은 따로 없나요?',
          answer:`연봉 협상? 좋은 질문이군. 네 성과가 협상 테이블에 올릴 만한 가치가 생기면 그때 검토하지. 복스테크는 감정 호소가 아니라 실적표로 말하는 곳이야. 그러니까 돈 얘기 전에, 네가 그 돈을 받을 만큼 쓸모 있다는 것부터 증명해.`,
          date:'PUBLIC LOG 004'
        },
        {
          question:'사장님, 벨벳 님이 너무 귀여워요. 사장님...벨벳 님이 너무 사랑스러워요!!~',
          answer:`당연한 말을 꽤 요란하게 하는군. 벨벳은 원래 눈에 띄고, 사랑스럽고, 영리하고, 그걸 자기 상품 가치로 바꿀 줄 아는 악마야. 그게 브이즈의 수준이지.`,
          date:'PUBLIC LOG 005'
        }                
      ],
      velvette: [
        {
          question:'벨벳님 벨벳님 오늘의 추천 패션은 어떤 건가요?',
          answer:`오늘 날씨 보면 답 안 나와? 질문이 깜찍해서 봐준다. 코티지 코어로 체크해. 이 간단한 용어 모르겠으면, 요즘 모리걸 모르는 년들 없지? 마침 비도 오고, 날씨도 덥고 꿉꿉하고. 이럴 때가 제일 깨끗하고 귀엽게 보일 수 있는 타이밍이란 말이야. 집에 캐미솔 원피스랑 청바지 하나쯤은 구비해둘 때가 왔다고, 자기야. 딱 붙는 것 말고 벌룬핏이나 A 핏, 스트레이트로 떨어질수록 좋아. 이 패션의 핵심은 귀엽고 깨끗하고, 숲속의 느낌이 나야 하는 거니까. 무슨 색이든 하나도 상관없어, puppet. 청바지 위에 화이트 캐미솔 원피스 하나 입고, 빈티지스러운 니트형 볼레로 있으면 입어줘. 얇은 카디건도 좋고. 갈색이나 연두색 계열일수록 좋아. 허리선 강조하고 싶으면 얇은 허리 끈 같은 거 바스트 셔링처럼 밑쪽으로 넣으면 예쁘겠네. 어울리는 앤티크 네크리스도 있으면 매치해 주고. 귀걸이는 생략해. 얼굴에는 최대한 힘 빼야 예쁘다. 대신 헤어 정도는 히피펌 연출할 수 있으면 해 보고. 하나도 안 어려워. 알겠지? 이 정도도 못 하는 멍청한 년은 아니라고 믿을게, 예쁜아.`,
          date:'PUBLIC LOG 001'
        },
        {
          question:'다른 사장님들이 괴롭혀요 ㅠ',
          answer:`복스랑 발? 자기네 애들이나 괴롭히지 왜 그런다니? 뭐, 견뎌. 그 정도도 못 견딜 깡으로 우리 회사에 들어온 건 아닐 것 아냐. 정도가 더 심해지면 그때 말해. 내 말 한마디면 해결 안 되는 건 없어.`,
          date:'PUBLIC LOG 002'
        },
        {
          question:'벨벳님 진짜 존재하시는 벨벳님이에요(??) 발렌티노님이랑 복스님은 알겠는데 벨벳님은..?',
          answer:`이건 무슨 황당한 문의야? 그러면 내가 없겠어? Fuck, 어떻게 된 게 직원이 상사 계정도 모르니? 넌 나랑 따로 면담 좀 하자. @Vel_spotlight_`,
          date:'PUBLIC LOG 003'
        },
        {
          question:'벨벳님 너무 예쁘세요 ㅠㅠ',
          answer:`어머. 당연한 소리를 해. 예쁜이는 나랑 따로 볼까?`,
          date:'PUBLIC LOG 004'
        }        
      ]
    };

    const galleryItems = [
      { src: '01.png', label: 'VOXTAGRAM 01' },
      { src: '02.png', label: 'VOXTAGRAM 02' },
      { src: '03.png', label: 'VOXTAGRAM 03' },
      { src: '04.png', label: 'VOXTAGRAM 04' },
      { src: '05.png', label: 'VOXTAGRAM 05' },
      { src: '06.png', label: 'VOXTAGRAM 06' },
      { src: '07.png', label: 'VOXTAGRAM 07' },
      { src: '08.png', label: 'VOXTAGRAM 08' }
    ];
    let currentGallery = 0;

    const HR_ROLE_VERSION = '2026-june-hr-v1';
    const DEFAULT_GRADE = '계약직';
    const SPECIAL_TEAM = 'V-PRIME 전략특임팀';
    const DIRECT_SECRETARY_TEAM = '직속비서팀';
    const DIRECT_SECRETARY_TEAM_BACKUP_KEY = 'voxtek_direct_secretary_team_backup_v1';
    const DIRECT_SECRETARY_STAFF_STORAGE_KEY = 'voxtek_direct_secretary_staff_v1';
    const DIRECT_SECRETARY_DEFAULT_STAFF = [];
    const HR_AWARD_SEASON = '2026-JUNE';
    const HR_AWARD_EFFECTIVE_DATE = '2026-07-01';
    const GRADE_ORDER = ['인턴', '계약직', '정규직', '선임직', '임원급'];
    const TEAM_POOL = {
      vox: ['인사평가팀', '프로그램 제작팀', '송출관리팀'],
      velvette: ['디자인팀', '트렌드기획팀', '소셜미디어팀'],
      valentino: ['촬영팀', '캐스팅관리팀', '스튜디오운영팀'],
      unknown: ['미배정팀']
    };
    const TEAM_NAME_SET = new Set([...Object.values(TEAM_POOL).flat(), SPECIAL_TEAM, DIRECT_SECRETARY_TEAM]);

     
    const SPECIAL_EMPLOYEE_LOCKS = {
      'VT-235341': {
        displayName:'VOX',
        departmentKey:'vox',
        departmentName:'복스',
        badgeSrc:'v2.png',
        team:'인■■□팀',
        grade:'C□■',
        topbarRoleLabel:'■□'
      },
      'VT-957413': {
        displayName:'투스데이',
        departmentKey:'vox',
        departmentName:'복스',
        badgeSrc:'v2.png',
        team:'인■■□팀',
        grade:'C□■',
        topbarRoleLabel:'■□'
      },
      'VT-561666': {
        displayName:'Vel',
        departmentKey:'velvette',
        departmentName:'벨벳',
        badgeSrc:'v3.png',
        team:'트■■□■팀',
        grade:'□E■',
        topbarRoleLabel:'■□'
      },
      'VT-670742': {
        displayName:'VAL',
        departmentKey:'valentino',
        departmentName:'발렌티노',
        badgeSrc:'v1.png',
        team:'□■팀',
        grade:'■■O',
        topbarRoleLabel:'■□'
      }
    };
