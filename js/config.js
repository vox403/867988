(function(){
  const app = window.Voxtek = window.Voxtek || {};

  app.keys = {
    employee:'voxtek_employee_v1',
    adminSession:'voxtek_admin_session_v1',
    sound:'voxtek_sound_state_v1',
    mailRead:'voxtek_mail_read_ids_v1',
    birthdayPrompt:'voxtek_birthday_prompt_session_v1',
    eventSession:'voxtek_event_session_v1',
    attendance:'voxtek_attendance_v1_'
  };

  app.remote = {
    url:'https://gvuhbxpkmyiakyfhuish.supabase.co',
    key:'sb_publishable_uCymLmzy-3NR9JyOL-9DtA_HmkGb0-k'
  };

  app.db = (() => {
    try{
      if (!window.supabase || !app.remote.url || !app.remote.key) return null;
      return window.supabase.createClient(app.remote.url, app.remote.key);
    }catch(error){
      return null;
    }
  })();

  app.data = {
    admins:{
      vox:{
        key:'vox',
        name:'복스',
        handle:'@vox403_v',
        passcode:'@vox403_v',
        joinedAt:'1950-04-19T00:00:00+09:00',
        badge:{ src:'v2.png', label:'v2.png' },
        line:'VOX LINE',
        authority:'대표 권한 · VoxTek Founder Access',
        position:'전(前) VoxTek CEO · 미디어 오버로드 · 창립자',
        greeting:'VOX ADMIN SESSION'
      },
      valentino:{
        key:'valentino',
        name:'발렌티노',
        handle:'@pimplife_v',
        passcode:'@pimplife_v',
        joinedAt:'1970-11-20T00:00:00+09:00',
        badge:{ src:'v1.png', label:'v1.png' },
        line:'VALENTINO LINE',
        authority:'대표 권한 · V-Tower Executive Access',
        position:'현(現) VoxTek CEO · V-타워 스튜디오 디렉터',
        greeting:'VALENTINO ADMIN SESSION'
      },
      velvette:{
        key:'velvette',
        name:'벨벳',
        handle:'@Vel_spotlight_v',
        passcode:'@Vel_spotlight_v',
        joinedAt:'2000-12-07T00:00:00+09:00',
        badge:{ src:'v3.png', label:'v3.png' },
        line:'VELVETTE LINE',
        authority:'대표 권한 · Vees Trend Executive Access',
        position:'패션 오버로드 · 트렌드 디렉터 · Vees Executive',
        greeting:'VELVETTE ADMIN SESSION'
      }
    },
    badges:[
      { src:'v1.png', label:'v1.png' },
      { src:'v2.png', label:'v2.png' },
      { src:'v3.png', label:'v3.png' }
    ],
    grades:['인턴','계약직','정규직 5급','정규직 4급','정규직 3급','정규직 2급','정규직 1급','선임직','임원급'],
    teams:{
      vox:['인사평가팀','프로그램 제작팀','송출관리팀'],
      velvette:['디자인팀','트렌드기획팀','소셜미디어팀'],
      valentino:['촬영팀','캐스팅관리팀','스튜디오운영팀'],
      unknown:['미배정팀']
    },
    specialEmployees:{
      'VT-235341':{
        displayName:'VOX',
        departmentKey:'vox',
        departmentName:'복스',
        badgeSrc:'v2.png',
        team:'인■■□팀',
        grade:'C□■',
        topbarRoleLabel:'■□'
      },
      'VT-957413':{
        displayName:'투스데이',
        departmentKey:'vox',
        departmentName:'복스',
        badgeSrc:'v2.png',
        team:'인■■□팀',
        grade:'C□■',
        topbarRoleLabel:'■□'
      },
      'VT-561666':{
        displayName:'Vel',
        departmentKey:'velvette',
        departmentName:'벨벳',
        badgeSrc:'v3.png',
        team:'트■■□■팀',
        grade:'□E■',
        topbarRoleLabel:'■□'
      },
      'VT-670742':{
        displayName:'VAL',
        departmentKey:'valentino',
        departmentName:'발렌티노',
        badgeSrc:'v1.png',
        team:'□■팀',
        grade:'■■O',
        topbarRoleLabel:'■□'
      }
    },
    gallery:[
      { src:'01.png', label:'VOXTAGRAM 01' },
      { src:'02.png', label:'VOXTAGRAM 02' },
      { src:'03.png', label:'VOXTAGRAM 03' },
      { src:'04.png', label:'VOXTAGRAM 04' },
      { src:'05.png', label:'VOXTAGRAM 05' },
      { src:'06.png', label:'VOXTAGRAM 06' },
      { src:'07.png', label:'VOXTAGRAM 07' },
      { src:'08.png', label:'VOXTAGRAM 08' },
      { src:'09.avif', label:'VOXTAGRAM 09' },
      { src:'10.avif', label:'VOXTAGRAM 10' },
      { src:'11.avif', label:'VOXTAGRAM 11' },
      { src:'12.avif', label:'VOXTAGRAM 12' },
      { src:'13.avif', label:'VOXTAGRAM 13' },
      { src:'14.avif', label:'VOXTAGRAM 14' },
      { src:'15.avif', label:'VOXTAGRAM 15' }
    ]
  };

  app.state = {
    adminKey:'vox',
    activeEmployee:null,
    mailId:'',
    galleryIndex:0,
    z:20,
    booting:false,
    attendanceMonth:Math.min(12, Math.max(7, new Date().getMonth() + 1))
  };
})();
