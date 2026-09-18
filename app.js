/* =========================================================================
   PARALLAX 지휘통제 콘솔 - 졸업작품용 프로토타입
   -------------------------------------------------------------------------
   주의: 본 화면의 모든 사건/인물/위치/영상/통신 내용은 가상 데이터입니다.
        실제 경찰 시스템, 실제 사건, 실제 인물과 무관하며 연동되지 않습니다.
   구성: [1] 유틸  [2] 가상 데이터  [3] 상태/저장  [4] 창 관리자
        [5] 앱 정의  [6] 알림  [7] 화면 테마  [8] 입력/초기화
   ========================================================================= */
'use strict';

/* ===================== [1] 유틸 ===================== */
const CFG = {
  KEY: 'parallax.console.v2'    // 구성 재설계로 기본 배치가 바뀌어 새 키 사용
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd  = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[rint(0, arr.length - 1)];
const uid  = p => p + '-' + Math.random().toString(36).slice(2, 8);
const esc  = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const hhmmss = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const hhmm   = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const nowHM  = () => hhmm(new Date());
const nowHMS = () => hhmmss(new Date());
/** '20:41' 같은 시각 문자열과 현재 시각의 경과분 */
function minsAgo(hm) {
  const [h, m] = hm.split(':').map(Number);
  const n = new Date(); const t = new Date(); t.setHours(h, m, 0, 0);
  let d = Math.round((n - t) / 60000);
  if (d < 0) d += 1440;
  return d;
}
const agoText = hm => { const m = minsAgo(hm); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : `${Math.floor(m / 60)}시간 ${m % 60}분 전`; };
/** 우선순위 -> 배지 클래스 */
const prioCls = p => p === '긴급' ? 'badge-crit' : p === '주의' ? 'badge-warn' : 'badge-info';
const prioShape = p => p === '긴급' ? 'badge-tri' : p === '주의' ? 'badge-sq' : '';
const icon = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const badge = (text, cls = 'badge-idle', shape = '') => `<span class="badge ${cls} ${shape}">${esc(text)}</span>`;
const riskLabel = r => r >= 70 ? '높음' : r >= 40 ? '중간' : '낮음';
const riskCls   = r => r >= 70 ? 'badge-crit' : r >= 40 ? 'badge-warn' : 'badge-info';

/* ===================== [2] 가상 데이터 ===================== */
/* 모든 지명·인명·차량번호는 실재하지 않는 창작 데이터입니다. */

const DISTRICTS = ['하늘동', '새빛로', '중앙대로', '한들공원', '서강로', '미르동', '물결천'];

const INCIDENTS = [
  {
    id: 'A-102', type: '주택 침입 의심', place: '하늘동 12로 34 다세대주택 (가상)',
    priority: '긴급', risk: 82, reportedAt: '20:41', team: '강력1팀', status: '진행 중',
    updatedAt: '20:57', reporter: '인접 세대 주민(가상 신고자 A)',
    x: 250, y: 196,
    call: '"윗집에서 유리 깨지는 소리와 남성 고성이 들린다. 현관문이 열려 있는 것 같다."',
    summary: '다세대주택 3층 세대 침입 의심. 내부 인원 유무 미확인. 유리 파손음 청취 신고.',
    hazard: ['깨진 유리 파편', '3층 외부 비상계단 노후', '내부 조도 매우 낮음'],
    zones: [
      { kind: '확인', name: '1층 현관·계단참', pts: '196,150 300,150 300,206 196,206' },
      { kind: '미확인', name: '3층 세대 내부·옥상', pts: '196,206 300,206 300,262 196,262' },
      { kind: '통제', name: '12로 남측 진입 차단', pts: '168,262 330,262 330,300 168,300' }
    ],
    dangers: [
      { x: 288, y: 178, label: '유리 파손 구간', note: '보도 전면 유리 파편 다수 (신고자 진술)' },
      { x: 210, y: 236, label: '후면 비상계단', note: '난간 부식 확인, 2인 동시 진입 금지' }
    ],
    rally: { x: 330, y: 300, label: '후속 인력 집결' },
    suspect: { x: 300, y: 160, label: '용의자 최종 확인 지점', note: '20:52 CCTV C-02 기준' }
  },
  {
    id: 'A-104', type: '상가 흉기 위협 신고', place: '새빛로 27 상가 2층 (가상)',
    priority: '긴급', risk: 88, reportedAt: '20:49', team: '형사2팀', status: '진행 중',
    updatedAt: '20:58', reporter: '상가 종업원(가상 신고자 B)',
    x: 636, y: 148,
    call: '"손님끼리 시비 중 한 명이 흉기를 꺼냈다. 사람이 많다."',
    summary: '상가 2층 음식점 내 흉기 위협. 다중 이용시설로 대피 유도 필요. 부상자 여부 미확인.',
    hazard: ['다중 이용시설(체류 인원 다수)', '흉기 소지 추정', '계단 1개소 단일 통로'],
    zones: [
      { kind: '확인', name: '1층 로비·주출입구', pts: '588,110 700,110 700,152 588,152' },
      { kind: '미확인', name: '2층 영업장 내부', pts: '588,152 700,152 700,196 588,196' },
      { kind: '통제', name: '새빛로 보행 통제', pts: '560,196 728,196 728,228 560,228' }
    ],
    dangers: [{ x: 660, y: 168, label: '흉기 소지 추정 위치', note: '2층 카운터 부근 (신고자 진술)' }],
    rally: { x: 728, y: 228, label: '후속 인력 집결' },
    suspect: { x: 652, y: 160, label: '용의자 최종 확인 지점', note: '20:55 현장 경찰 확인' }
  },
  {
    id: 'A-107', type: '다중 추돌 교통사고', place: '중앙대로 3교차로 (가상)',
    priority: '주의', risk: 54, reportedAt: '20:22', team: '교통1팀', status: '진행 중',
    updatedAt: '20:53', reporter: '운전자(가상 신고자 C)',
    x: 540, y: 440,
    call: '"교차로에서 차량 4대가 연쇄 추돌했다. 기름이 흐르는 것 같다."',
    summary: '차량 4대 연쇄 추돌. 경상 2명 이송 완료. 노면 유류 유출로 2차 사고 우려.',
    hazard: ['노면 유류 유출', '정차 차량 후미 추돌 위험', '견인 작업 중'],
    zones: [
      { kind: '확인', name: '교차로 동측 2개 차로', pts: '540,406 660,406 660,452 540,452' },
      { kind: '미확인', name: '지하차도 진입부', pts: '446,452 540,452 540,500 446,500' },
      { kind: '통제', name: '중앙대로 서측 전면 통제', pts: '400,406 540,406 540,452 400,452' }
    ],
    dangers: [{ x: 512, y: 430, label: '유류 유출 구간', note: '소방 합동 방재 중' }],
    rally: { x: 660, y: 470, label: '후속 인력 집결' },
    suspect: null
  },
  {
    id: 'A-109', type: '아동 실종 신고', place: '한들공원 일대 (가상)',
    priority: '주의', risk: 61, reportedAt: '19:58', team: '여성청소년팀', status: '수색 중',
    updatedAt: '20:56', reporter: '보호자(가상 신고자 D)',
    x: 672, y: 352,
    call: '"9세 아동이 공원 놀이터에서 30분째 보이지 않는다."',
    summary: '9세 아동(가상) 실종. 최종 목격 놀이터 동측. 공원 4개 구역 분할 수색 진행.',
    hazard: ['공원 저수지 인접', '야간 조도 저하', '출입구 5개소 분산'],
    zones: [
      { kind: '확인', name: '공원 서측·놀이터', pts: '600,310 672,310 672,392 600,392' },
      { kind: '미확인', name: '공원 동측 수림대', pts: '672,310 748,310 748,392 672,392' },
      { kind: '미확인', name: '저수지 둘레길', pts: '672,392 748,392 748,424 600,424 600,392' }
    ],
    dangers: [{ x: 716, y: 404, label: '저수지 경계', note: '난간 없음, 야간 접근 주의' }],
    rally: { x: 596, y: 300, label: '후속 인력 집결' },
    suspect: null
  },
  {
    id: 'A-111', type: '차량 도난 추적', place: '서강로 지하주차장 B2 (가상)',
    priority: '주의', risk: 46, reportedAt: '20:11', team: '강력2팀', status: '확인 중',
    updatedAt: '20:44', reporter: '차주(가상 신고자 E)',
    x: 848, y: 512,
    call: '"주차해 둔 차량이 없어졌다. 유리 파편이 남아 있다."',
    summary: '승용차 1대 도난 신고(가상 번호 12가 3456). 출차 기록 대조 중. 인접 CCTV 4개소 확인 필요.',
    hazard: ['지하 통신 음영 구간', '차량 출입구 2개소'],
    zones: [
      { kind: '확인', name: 'B2 주차구역 A열', pts: '806,478 890,478 890,516 806,516' },
      { kind: '미확인', name: 'B2 주차구역 C열·출구램프', pts: '806,516 890,516 890,556 806,556' }
    ],
    dangers: [],
    rally: { x: 900, y: 470, label: '후속 인력 집결' },
    suspect: { x: 890, y: 540, label: '차량 최종 확인 지점', note: '20:19 출구 램프 CCTV' }
  },
  {
    id: 'A-113', type: '소음·소란 신고', place: '미르동 원룸촌 4길 (가상)',
    priority: '일반', risk: 22, reportedAt: '20:35', team: '지역2팀', status: '현장 도착',
    updatedAt: '20:51', reporter: '인근 거주자(가상 신고자 F)',
    x: 208, y: 540,
    call: '"옆 건물에서 새벽까지 큰 음악 소리가 난다."',
    summary: '반복 소음 신고(당월 3회차). 현장 계도 진행. 물리적 충돌 없음.',
    hazard: [],
    zones: [{ kind: '확인', name: '4길 전체', pts: '170,510 260,510 260,568 170,568' }],
    dangers: [],
    rally: { x: 268, y: 500, label: '후속 인력 집결' },
    suspect: null
  },
  {
    id: 'A-098', type: '주취자 보호조치', place: '중앙시장 앞 (가상)',
    priority: '일반', risk: 12, reportedAt: '18:20', team: '지역1팀', status: '종료',
    updatedAt: '19:05', reporter: '상인(가상 신고자 G)',
    x: 400, y: 300,
    call: '"길에 사람이 누워 있다."',
    summary: '보호조치 후 귀가 조치 완료. 추가 조치 없음.',
    hazard: [],
    zones: [], dangers: [], rally: { x: 420, y: 280, label: '집결 위치' }, suspect: null
  }
];

const OFFICERS = [
  { id: 'O-11', call: '한들-1', name: '김도현 경위', team: '강력1팀', inc: 'A-102', task: '전면 현관 진입로 확보', state: '현장 대응 중', ar: '연결', batt: 88, comm: '20:58', x: 262, y: 178, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-12', call: '한들-2', name: '박서준 경사', team: '강력1팀', inc: 'A-102', task: '후면 비상계단 감시', state: '이동 중', ar: '연결', batt: 61, comm: '20:57', x: 214, y: 232, sos: false, health: { label: '확인 필요', source: '센서 감지' } },
  { id: 'O-13', call: '순찰-7', name: '최유나 경장', team: '지역1팀', inc: 'A-102', task: '외곽 차단 및 주민 통제', state: '현장 도착', ar: '미연결', batt: 44, comm: '20:54', x: 316, y: 268, sos: false, health: { label: '상태 미확인', source: '상태 미확인' } },
  { id: 'O-21', call: '새빛-1', name: '정민석 경위', team: '형사2팀', inc: 'A-104', task: '2층 영업장 진입 준비', state: '현장 대응 중', ar: '연결', batt: 76, comm: '20:58', x: 640, y: 160, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-22', call: '새빛-4', name: '오세아 경사', team: '형사2팀', inc: 'A-104', task: '주출입구 통제·대피 유도', state: '현장 도착', ar: '불안정', batt: 53, comm: '20:56', x: 612, y: 132, sos: false, health: { label: '상태 미확인', source: '상태 미확인' } },
  { id: 'O-31', call: '교통-3', name: '한지훈 경사', team: '교통1팀', inc: 'A-107', task: '서측 차로 통제', state: '진행 중', ar: '미연결', batt: 92, comm: '20:53', x: 520, y: 424, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-41', call: '여청-2', name: '문가람 경위', team: '여성청소년팀', inc: 'A-109', task: '공원 동측 수림대 수색', state: '수색 중', ar: '연결', batt: 69, comm: '20:56', x: 700, y: 340, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-42', call: '순찰-12', name: '강태오 경장', team: '지역2팀', inc: 'A-109', task: '공원 서측 출입구 확인', state: '수색 중', ar: '연결', batt: 33, comm: '20:55', x: 628, y: 366, sos: false, health: { label: '상태 미확인', source: '상태 미확인' } },
  { id: 'O-51', call: '강력-5', name: '임하늘 경사', team: '강력2팀', inc: 'A-111', task: '주차장 출입 기록 확인', state: '확인 중', ar: '미연결', batt: 81, comm: '20:44', x: 838, y: 506, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-61', call: '지역-9', name: '서지오 경장', team: '지역2팀', inc: 'A-113', task: '현장 계도', state: '현장 도착', ar: '미연결', batt: 58, comm: '20:51', x: 214, y: 532, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } }
];
// 사건에 배정되지 않은 대기 인력 (통제실에서 사건에 배정했다가 뺄 수 있다)
OFFICERS.push(
  { id: 'O-71', call: '대기-1', name: '유시윤 경장', team: '지역3팀', inc: null, task: '대기 중', state: '대기', ar: '연결', batt: 97, comm: '20:58', x: 430, y: 236, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-72', call: '대기-2', name: '조하린 경사', team: '지역3팀', inc: null, task: '대기 중', state: '대기', ar: '연결', batt: 84, comm: '20:57', x: 476, y: 300, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } },
  { id: 'O-73', call: '기동-4', name: '남건우 경위', team: '기동1팀', inc: null, task: '대기 중', state: '대기', ar: '미연결', batt: 73, comm: '20:55', x: 760, y: 470, sos: false, health: { label: '상태 미확인', source: '상태 미확인' } },
  { id: 'O-74', call: '여청-5', name: '배수아 경장', team: '여성청소년팀', inc: null, task: '대기 중', state: '대기', ar: '연결', batt: 61, comm: '20:56', x: 330, y: 430, sos: false, health: { label: '이상 없음', source: '경찰관 직접 보고' } }
);
OFFICERS.forEach(o => { o.trail = [[o.x, o.y]]; });

const VEHICLES = [
  { id: 'V-31', label: '순찰차 31호', inc: 'A-102', x: 322, y: 292, crew: '순찰-7' },
  { id: 'V-08', label: '순찰차 08호', inc: 'A-104', x: 720, y: 214, crew: '새빛-4' },
  { id: 'V-45', label: '교통 45호', inc: 'A-107', x: 470, y: 452, crew: '교통-3' },
  { id: 'V-12', label: '순찰차 12호', inc: 'A-109', x: 590, y: 300, crew: '순찰-12' },
  { id: 'V-20', label: '순찰차 20호', inc: 'A-111', x: 896, y: 476, crew: '강력-5' },
  { id: 'V-27', label: '순찰차 27호', inc: 'A-113', x: 262, y: 502, crew: '지역-9' },
  // 대기 차량
  { id: 'V-60', label: '순찰차 60호', inc: null, x: 452, y: 268, crew: '대기-1' },
  { id: 'V-63', label: '순찰차 63호', inc: null, x: 706, y: 506, crew: '기동-4' },
  { id: 'V-77', label: '승합 77호', inc: null, x: 352, y: 412, crew: '여청-5' }
];

const CCTVS = [
  { id: 'C-01', name: '하늘동 12로 입구', inc: 'A-102', x: 196, y: 168, traffic: '원활', scene: 'street' },
  { id: 'C-02', name: '하늘동 주택가 골목', inc: 'A-102', x: 302, y: 152, traffic: '원활', scene: 'alley' },
  { id: 'C-03', name: '하늘동 교차로', inc: 'A-102', x: 340, y: 280, traffic: '서행', scene: 'cross' },
  { id: 'C-04', name: '새빛로 상가 전면', inc: 'A-104', x: 592, y: 120, traffic: '정체', scene: 'street' },
  { id: 'C-05', name: '새빛로 후면 주차장', inc: 'A-104', x: 706, y: 186, traffic: '서행', scene: 'park' },
  { id: 'C-06', name: '중앙대로 3교차로', inc: 'A-107', x: 540, y: 406, traffic: '통제', scene: 'cross' },
  { id: 'C-07', name: '한들공원 서문', inc: 'A-109', x: 596, y: 322, traffic: '원활', scene: 'park' },
  { id: 'C-08', name: '한들공원 저수지', inc: 'A-109', x: 740, y: 400, traffic: '원활', scene: 'park' },
  { id: 'C-09', name: '서강로 주차장 출구', inc: 'A-111', x: 888, y: 548, traffic: '서행', scene: 'alley' },
  { id: 'C-10', name: '미르동 원룸촌 4길', inc: 'A-113', x: 176, y: 512, traffic: '원활', scene: 'alley' }
];
CCTVS.forEach(c => { c.at = nowHM(); });

/* 사건 처리 8단계 */
const STAGE_NAMES = ['신고 접수', '출동 지령', '현장 도착', '상황 확인', '추가 지원', '진행 중', '인계', '종료'];

/* 사건별 처리 단계 (index = 현재 단계) */
const STAGE_STATE = {
  'A-102': { at: 5, log: ['20:41 · 112 접수 · 접수자 상황1팀 정하윤', '20:42 · 강력1팀·지역1팀 지령 · 상황1팀 정하윤', '20:49 · 한들-1 현장 도착 보고', '20:52 · 침입 흔적 확인 · 한들-1', '20:55 · 지역1팀 1개조 추가 투입 승인', '20:57 · 내부 진입 준비 · 진행 중'] },
  'A-104': { at: 4, log: ['20:49 · 112 접수 · 접수자 상황1팀 김재원', '20:50 · 형사2팀 지령', '20:54 · 새빛-1 현장 도착', '20:55 · 흉기 위협 정황 확인 · 새빛-1', '20:58 · 형사1팀 추가 지원 요청'] },
  'A-107': { at: 5, log: ['20:22 · 112 접수', '20:23 · 교통1팀 지령', '20:29 · 교통-3 현장 도착', '20:34 · 부상 정도 확인 · 경상 2명', '20:40 · 소방 합동 방재 요청', '20:53 · 견인 및 차로 정리 진행 중'] },
  'A-109': { at: 5, log: ['19:58 · 112 접수', '20:00 · 여청팀·지역2팀 지령', '20:07 · 여청-2 현장 도착', '20:15 · 최종 목격 지점 확인', '20:31 · 지역2팀 2개조 추가 투입', '20:56 · 4개 구역 분할 수색 진행 중'] },
  'A-111': { at: 3, log: ['20:11 · 112 접수', '20:13 · 강력2팀 지령', '20:20 · 강력-5 현장 도착', '20:44 · 출입 기록 대조 중'] },
  'A-113': { at: 2, log: ['20:35 · 112 접수', '20:36 · 지역2팀 지령', '20:51 · 지역-9 현장 도착'] },
  'A-098': { at: 7, log: ['18:20 · 112 접수', '18:21 · 지역1팀 지령', '18:28 · 현장 도착', '18:35 · 상황 확인', '18:40 · 추가 지원 없음', '18:44 · 보호조치 진행', '18:58 · 지역1팀 내부 인계', '19:05 · 종료 처리'] }
};

/* 사건 브리핑 - 정보마다 출처와 확실성 표기 */
const BRIEFINGS = {
  'A-102': [
    { k: '침입 경로', v: '3층 세대 현관문 강제 개방 흔적', src: '현장 경찰 확인', c: '확인', t: '20:52' },
    { k: '인상착의', v: '남성 1명 추정, 검정 후드·검정 바지, 170cm 중반, 백팩 착용', src: 'CCTV 확인', c: '추정', t: '20:52' },
    { k: '내부 인원', v: '거주자 재실 여부 확인되지 않음', src: '미확인', c: '미확인', t: '20:57' },
    { k: '위험 물체', v: '깨진 유리창 파편, 흉기 소지 여부 불명', src: '신고자 진술', c: '추정', t: '20:43' },
    { k: '도주 방향', v: '후면 비상계단 방향 이동 가능성', src: '지휘통제실 추정', c: '추정', t: '20:56' },
    { k: '변경 사항', v: '최초 신고의 "2명" 진술은 CCTV상 1명으로 정정됨', src: 'CCTV 확인', c: '확인', t: '20:53' }
  ],
  'A-104': [
    { k: '위협 수단', v: '주방용 칼로 추정되는 물체', src: '신고자 진술', c: '추정', t: '20:49' },
    { k: '인상착의', v: '남성 1명, 회색 재킷, 40대 추정', src: '현장 경찰 확인', c: '확인', t: '20:55' },
    { k: '체류 인원', v: '2층 영업장 내 약 20명 (정확 인원 미확인)', src: '현장 경찰 확인', c: '추정', t: '20:56' },
    { k: '부상자', v: '부상자 발생 여부 확인되지 않음', src: '미확인', c: '미확인', t: '20:58' },
    { k: '대피 경로', v: '계단 1개소만 사용 가능, 후면 비상구 잠김 상태', src: '현장 경찰 확인', c: '확인', t: '20:57' }
  ],
  'A-107': [
    { k: '차량 수', v: '승용차 3대, 승합차 1대', src: '현장 경찰 확인', c: '확인', t: '20:31' },
    { k: '부상자', v: '경상 2명 이송 완료, 추가 부상자 없음', src: '현장 경찰 확인', c: '확인', t: '20:40' },
    { k: '노면 상태', v: '유류 유출 약 8m 구간', src: '현장 경찰 확인', c: '확인', t: '20:38' },
    { k: '통제 계획', v: '견인 완료 후 21:20경 부분 해제 예정', src: '지휘통제실 추정', c: '추정', t: '20:53' }
  ],
  'A-109': [
    { k: '대상 아동', v: '9세, 노란색 점퍼·청바지 (가상 정보)', src: '신고자 진술', c: '확인', t: '19:58' },
    { k: '최종 목격', v: '놀이터 동측 벤치 부근, 19:30경', src: '신고자 진술', c: '추정', t: '20:02' },
    { k: 'CCTV 확인', v: '서문 CCTV 19:34 통과 영상 있음', src: 'CCTV 확인', c: '확인', t: '20:19' },
    { k: '동측 수림대', v: '수색 미완료 구역 잔존', src: '미확인', c: '미확인', t: '20:56' }
  ],
  'A-111': [
    { k: '차량', v: '흰색 승용차, 가상 번호 12가 3456', src: '신고자 진술', c: '확인', t: '20:11' },
    { k: '출차 시각', v: '20:19경 출구 램프 통과 추정', src: 'CCTV 확인', c: '추정', t: '20:33' },
    { k: '운전자', v: '식별 불가 (모자 착용)', src: '미확인', c: '미확인', t: '20:33' }
  ],
  'A-113': [
    { k: '민원 내용', v: '심야 음악 소음, 당월 3회차 반복 신고', src: '신고자 진술', c: '확인', t: '20:35' },
    { k: '현장 상황', v: '충돌 없음, 계도로 종결 가능', src: '현장 경찰 확인', c: '확인', t: '20:51' }
  ],
  'A-098': [{ k: '조치', v: '보호조치 후 귀가, 추가 사항 없음', src: '현장 경찰 확인', c: '확인', t: '19:05' }]
};

/* 인계 항목 */
const HANDOVER = {
  'A-102': [
    { id: 'H1', kind: '완료', text: '1층 현관·계단참 안전 확인', owner: '한들-1', area: '확인' },
    { id: 'H2', kind: '완료', text: '주민 대피 및 외곽 차단선 설정', owner: '순찰-7', area: '확인' },
    { id: 'H3', kind: '진행', text: '3층 세대 내부 진입 준비', owner: '한들-1', area: '미확인' },
    { id: 'H4', kind: '미확인', text: '옥상 출입문 개폐 여부 확인 필요', owner: '미지정', area: '미확인' },
    { id: 'H5', kind: '미확인', text: '후면 비상계단 하부 사각지대 확인 필요', owner: '미지정', area: '미확인' }
  ],
  'A-104': [
    { id: 'H1', kind: '완료', text: '1층 로비 대피 유도', owner: '새빛-4', area: '확인' },
    { id: 'H2', kind: '진행', text: '2층 영업장 진입 대기', owner: '새빛-1', area: '미확인' },
    { id: 'H3', kind: '미확인', text: '후면 비상구 개방 가능 여부', owner: '미지정', area: '미확인' }
  ],
  'A-107': [
    { id: 'H1', kind: '완료', text: '경상자 2명 이송', owner: '교통-3', area: '확인' },
    { id: 'H2', kind: '진행', text: '유류 방재 및 견인', owner: '교통-3', area: '확인' },
    { id: 'H3', kind: '미확인', text: '지하차도 진입부 정체 해소 확인', owner: '미지정', area: '미확인' }
  ],
  'A-109': [
    { id: 'H1', kind: '완료', text: '공원 서측·놀이터 수색', owner: '순찰-12', area: '확인' },
    { id: 'H2', kind: '진행', text: '동측 수림대 수색', owner: '여청-2', area: '미확인' },
    { id: 'H3', kind: '미확인', text: '저수지 둘레길 야간 수색 인력 필요', owner: '미지정', area: '미확인' }
  ],
  'A-111': [
    { id: 'H1', kind: '진행', text: '출입 기록 대조', owner: '강력-5', area: '확인' },
    { id: 'H2', kind: '미확인', text: '인접 CCTV 4개소 영상 확보', owner: '미지정', area: '미확인' }
  ],
  'A-113': [{ id: 'H1', kind: '완료', text: '현장 계도', owner: '지역-9', area: '확인' }],
  'A-098': [{ id: 'H1', kind: '완료', text: '보호조치 및 귀가', owner: '지역1팀', area: '확인' }]
};

/* 초기 메시지 (3방향: 지휘통제실 / 현장 경찰 / 후속 인력) */
const SEED_MSGS = [
  { inc: 'A-102', from: '지휘통제실', to: '현장 경찰', kind: '일반', text: '한들-1, 현장 도착 시 전면 상황 먼저 보고 바랍니다.', t: '20:48', read: true, mine: true },
  { inc: 'A-102', from: '한들-1', to: '지휘통제실', kind: '일반', text: '현장 도착. 3층 현관문 개방 상태 확인했습니다.', t: '20:49', read: true },
  { inc: 'A-102', from: '한들-1', to: '지휘통제실', kind: '일반', text: '음성 보고 전송합니다.', t: '20:52', read: true, att: { type: '음성', label: '음성 보고 00:14 (가상)' } },
  { inc: 'A-102', from: '지휘통제실', to: '후속 인력', kind: '중요', text: '지역1팀 1개조 12로 남측 집결 지점으로 이동하십시오.', t: '20:55', read: true, mine: true, att: { type: '위치', label: '집결 위치 (330, 300)' } },
  { inc: 'A-102', from: '순찰-7', to: '지휘통제실', kind: '일반', text: '외곽 차단선 설정 완료. 주민 4명 대피 유도했습니다.', t: '20:56', read: false },
  { inc: 'A-104', from: '새빛-1', to: '지휘통제실', kind: '긴급', text: '2층 흉기 위협 정황 확인. 체류 인원 다수, 추가 인력 요청합니다.', t: '20:58', read: false },
  { inc: 'A-104', from: '지휘통제실', to: '현장 경찰', kind: '일반', text: '형사1팀 지원 편성 중입니다. 단독 진입 보류하십시오.', t: '20:58', read: true, mine: true },
  { inc: 'A-109', from: '여청-2', to: '지휘통제실', kind: '일반', text: '동측 수림대 절반 수색 완료. 특이사항 없습니다.', t: '20:56', read: true },
  { inc: 'A-107', from: '교통-3', to: '지휘통제실', kind: '일반', text: '견인 2대 완료. 서측 차로 통제 유지 중입니다.', t: '20:53', read: true }
];

/* ===================== [3] 상태 / 저장 ===================== */
const S = {
  sel: 'A-102',              // 선택된 사건 (모든 앱이 이 값으로 동기화)
  theme: 'light',            // 화면 테마 (light | dark)
  sound: true,               // 긴급 알림음
  wins: [],                  // [{id,fx,fy,fw,fh,z,min,max}]
  focus: null,
  zTop: 10,
  mode: 'wide',
  lcW: 172,
  msgs: [],
  alerts: [],                // 알림 기록 (닫아도 남음)
  txs: [],                   // 현장 정보 전송 기록
  captures: [],              // CCTV/AR 캡처 목록
  stages: JSON.parse(JSON.stringify(STAGE_STATE)),
  handover: JSON.parse(JSON.stringify(HANDOVER)),
  ui: {
    listQ: '', listPrio: '전체', listStatus: '전체',
    cctvSel: 'C-01', arSel: 'O-11',
    chatTab: '전체', chatTo: '현장 경찰', chatKind: '일반', chatText: '', chatAtt: null,
    compose: { step: 1, items: [], note: '', targets: [], editing: null },
    hoTarget: '후속 인력(대기조)'
  }
};

const curInc = () => INCIDENTS.find(i => i.id === S.sel) || INCIDENTS[0];
const incOfficers = id => OFFICERS.filter(o => o.inc === id);
const incVehicles = id => VEHICLES.filter(v => v.inc === id);
const incCCTVs = id => CCTVS.filter(c => c.inc === id);
const activeIncidents = () => INCIDENTS.filter(i => i.status !== '종료');

function save() {
  try {
    localStorage.setItem(CFG.KEY, JSON.stringify({
      sel: S.sel, theme: S.theme, sound: S.sound, focus: S.focus, zTop: S.zTop, lcW: S.lcW,
      wins: S.wins.map(w => ({ id: w.id, fx: w.fx, fy: w.fy, fw: w.fw, fh: w.fh, z: w.z, min: w.min, max: w.max }))
    }));
  } catch (e) { /* 저장 불가 환경 무시 */ }
}
/** 사건 목록 앱이 전체 상황에 통합되기 전 저장된 배치를 새 구조로 옮긴다 */
const WIN_ALIAS = { incidents: 'overview', briefing: 'overview' };   // 통합된 앱의 예전 창 id
function migrateWins(wins) {
  const seen = new Set();
  return (wins || []).map(w => WIN_ALIAS[w.id] ? Object.assign({}, w, { id: WIN_ALIAS[w.id] }) : w)
    .filter(w => APPS.some(a => a.id === w.id) && !seen.has(w.id) && seen.add(w.id));
}
function load() {
  try {
    const raw = localStorage.getItem(CFG.KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.wins)) return false;
    S.sel = INCIDENTS.some(i => i.id === d.sel) ? d.sel : S.sel;
    S.sound = d.sound !== false;
    S.theme = d.theme === 'dark' ? 'dark' : 'light';
    S.zTop = d.zTop || 10;
    if (Number.isFinite(d.lcW)) S.lcW = clamp(d.lcW, LC_MIN, LC_MAX);
    S.wins = migrateWins(d.wins);
    const f = WIN_ALIAS[d.focus] || d.focus;
    S.focus = S.wins.some(w => w.id === f) ? f : (S.wins[0] && S.wins[0].id) || null;
    return S.wins.length > 0;
  } catch (e) { return false; }
}

/* ===================== [4] 창 관리자 ===================== */
const DESK = () => $('#desktop');
const MIN_W = 260, MIN_H = 150;
const GUTTER = 5;   // 창 사이 여백 (양쪽 합 10px)

/** 기본 화면 배치: 중앙 지도 / 왼쪽 사건 목록 / 오른쪽 위 AR / 오른쪽 아래 메시지 */
function defaultLayout() {
  return [
    // 왼쪽 사건 편집 열 / 위쪽 넓은 작전 지도 / 아래 넓은 AR 영상 + 좁은 메시지 (비대칭 구성)
    { id: 'overview',  fx: 0,     fy: 0,    fw: 0.25, fh: 1,    z: 11, min: false, max: false },
    { id: 'map',       fx: 0.25,  fy: 0,    fw: 0.75, fh: 0.62, z: 13, min: false, max: false },
    { id: 'ar',        fx: 0.25,  fy: 0.62, fw: 0.44, fh: 0.38, z: 12, min: false, max: false },
    { id: 'messages',  fx: 0.69,  fy: 0.62, fw: 0.31, fh: 0.38, z: 12, min: false, max: false }
  ];
}
function layoutMode() {
  const w = DESK().clientWidth;
  if (w < 780) return 'compact';
  if (w < 1500) return 'standard';
  return 'wide';
}
const winOf = id => S.wins.find(w => w.id === id);
const openWins = () => S.wins.filter(w => !w.min);

/**
 * 보이는 창들이 덮지 않은 빈 영역 중 가장 큰 사각형을 찾는다.
 * 창 경계선으로 격자를 만들어 계산하므로, 분할선으로 크기를 바꾼 뒤에도
 * 닫힌 창 자리에 이웃 창과 경계가 딱 맞게 들어간다.
 */
function findGap(opts = {}) {
  const d = DESK(), W = d.clientWidth, H = d.clientHeight;
  if (!W || !H || S.mode === 'compact') return null;
  const vis = S.wins.filter(w => !w.min);
  if (!vis.length || vis.some(w => w.max)) return null;
  const EPS = 0.004;
  const uniq = arr => arr.map(v => clamp(v, 0, 1)).sort((a, b) => a - b)
    .filter((v, i, a) => i === 0 || v - a[i - 1] > EPS);
  const xs = uniq([0, 1, ...vis.flatMap(w => [w.fx, w.fx + w.fw])]);
  const ys = uniq([0, 1, ...vis.flatMap(w => [w.fy, w.fy + w.fh])]);
  const nx = xs.length - 1, ny = ys.length - 1;
  // occ 누적합: 셀 중심이 어떤 창 안에 있으면 점유
  const P = Array.from({ length: ny + 1 }, () => new Array(nx + 1).fill(0));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
    const o = vis.some(w => cx > w.fx && cx < w.fx + w.fw && cy > w.fy && cy < w.fy + w.fh) ? 1 : 0;
    P[j + 1][i + 1] = o + P[j][i + 1] + P[j + 1][i] - P[j][i];
  }
  const occ = (i0, j0, i1, j1) => P[j1 + 1][i1 + 1] - P[j0][i1 + 1] - P[j1 + 1][i0] + P[j0][i0];
  // point 지정 시: 그 지점이 속한 셀을 포함하는 사각형만 후보
  let pi = -1, pj = -1;
  if (opts.point) {
    pi = xs.findIndex((x, i) => i < nx && opts.point.x >= x && opts.point.x <= xs[i + 1]);
    pj = ys.findIndex((y, j) => j < ny && opts.point.y >= y && opts.point.y <= ys[j + 1]);
    if (pi < 0 || pj < 0 || occ(pi, pj, pi, pj)) return null;
  }
  let best = null;
  for (let j0 = 0; j0 < ny; j0++) for (let i0 = 0; i0 < nx; i0++) {
    if (opts.point && (i0 > pi || j0 > pj)) continue;
    if (occ(i0, j0, i0, j0)) continue;
    for (let j1 = j0; j1 < ny; j1++) {
      if (occ(i0, j0, i0, j1)) break;
      for (let i1 = i0; i1 < nx; i1++) {
        if (occ(i0, j0, i1, j1)) break;
        if (opts.point && (i1 < pi || j1 < pj)) continue;
        const fw = xs[i1 + 1] - xs[i0], fh = ys[j1 + 1] - ys[j0];
        if (fw * W < MIN_W || fh * H < MIN_H) continue;
        const area = fw * fh;
        if (!best || area > best.area + 1e-6) best = { fx: xs[i0], fy: ys[j0], fw, fh, area };
      }
    }
  }
  if (!best) return null;
  const { area, ...rect } = best;
  return rect;
}
/**
 * 드래그 중 마우스가 가리키는 빈 영역.
 * 끌고 있는 창의 원래 자리는 점유된 것으로 취급해, 옆 빈칸과 합쳐지지 않고 빈 슬롯에만 딱 맞게 들어간다.
 * (원래 자리 위에서는 기존처럼 자유 이동)
 */
function gapAtPointer(winId, cx, cy) {
  if (!S.wins.some(w => !w.min && w.id !== winId)) return null;   // 다른 창이 없으면 맞춤 안 함
  const r = DESK().getBoundingClientRect();
  const x = (cx - r.left) / r.width, y = (cy - r.top) / r.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return findGap({ point: { x, y } });
}
function openApp(id, opts = {}) {
  const app = APPS.find(a => a.id === id);
  if (!app) return;
  let w = winOf(id);
  if (!w) {
    const n = S.wins.length;
    // 빈 영역이 있으면 그 자리에 딱 맞게, 없으면 계단식으로 연다
    const place = findGap() || {
      fx: clamp(0.14 + (n % 4) * 0.06, 0, .55), fy: clamp(0.08 + (n % 4) * 0.05, 0, .5),
      fw: app.defW || 0.42, fh: app.defH || 0.6
    };
    w = Object.assign({ id, z: ++S.zTop, min: false, max: false }, place);
    S.wins.push(w);
  }
  w.min = false;
  focusWin(id);
  renderWindows();
  if (!opts.silent) toast('info', app.name + ' 실행', '작업 표시줄에서 최소화·복원할 수 있습니다.');
  save();
}
function closeApp(id) {
  S.wins = S.wins.filter(w => w.id !== id);
  if (S.focus === id) S.focus = (openWins().slice(-1)[0] || {}).id || null;
  renderWindows(); save();
}
function toggleApp(id) { winOf(id) ? closeApp(id) : openApp(id); }
function minimizeWin(id) {
  const w = winOf(id); if (!w) return;
  w.min = true;
  if (S.focus === id) S.focus = (openWins().slice(-1)[0] || {}).id || null;
  renderWindows(); save();
}
function restoreWin(id) { const w = winOf(id); if (!w) return; w.min = false; focusWin(id); renderWindows(); save(); }
function maximizeWin(id) { const w = winOf(id); if (!w) return; w.max = !w.max; focusWin(id); renderWindows(); save(); }
function focusWin(id) {
  const w = winOf(id); if (!w) return;
  w.z = ++S.zTop; S.focus = id;
  const el = $('#win-' + id);
  if (el) { el.style.zIndex = w.z; $$('.win').forEach(x => x.classList.toggle('is-focus', x === el)); }
  paintTaskbar(); paintLauncher();
}
function snapWin(id, spot) {
  const w = winOf(id); if (!w) return;
  const M = { left: [0, 0, .5, 1], right: [.5, 0, .5, 1], top: [0, 0, 1, .5], bottom: [0, .5, 1, .5],
    q1: [0, 0, .5, .5], q2: [.5, 0, .5, .5], q3: [.5, .5, .5, .5], q4: [0, .5, .5, .5] }[spot];
  if (!M) return;
  w.max = false; [w.fx, w.fy, w.fw, w.fh] = M;
  focusWin(id); applyLayout(); save();
}
function cycleQuad(id) {
  const w = winOf(id); if (!w) return;
  const order = ['q1', 'q2', 'q3', 'q4'];
  const cur = order.findIndex(q => {
    const M = { q1: [0, 0], q2: [.5, 0], q3: [.5, .5], q4: [0, .5] }[q];
    return Math.abs(w.fx - M[0]) < .02 && Math.abs(w.fy - M[1]) < .02 && Math.abs(w.fw - .5) < .02;
  });
  snapWin(id, order[(cur + 1) % 4]);
}
/** 좌우 2분할: 앞의 두 창을 반씩, 나머지는 최소화 */
function tileHalves() {
  const list = openWins().sort((a, b) => b.z - a.z);
  if (!list.length) { toast('warn', '정리할 창 없음', '열린 앱이 없습니다.'); return; }
  const spots = [[0, 0, .5, 1], [.5, 0, .5, 1]];
  list.forEach((w, i) => {
    if (i < 2) { w.max = false; [w.fx, w.fy, w.fw, w.fh] = spots[i]; w.min = false; }
    else w.min = true;
  });
  renderWindows(); save();
  toast('ok', '2분할 배치', '가장 최근에 사용한 창 2개를 좌우로 배치했습니다.');
}
/** 4분할: 앞의 네 창을 사분면으로, 나머지는 최소화 */
function tileQuads() {
  const list = openWins().sort((a, b) => b.z - a.z);
  if (!list.length) { toast('warn', '정리할 창 없음', '열린 앱이 없습니다.'); return; }
  const spots = [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]];
  list.forEach((w, i) => {
    if (i < 4) { w.max = false; [w.fx, w.fy, w.fw, w.fh] = spots[i]; w.min = false; }
    else w.min = true;
  });
  renderWindows(); save();
  toast('ok', '4분할 배치', '가장 최근에 사용한 창 4개를 사분면에 배치했습니다.');
}
function resetLayout() {
  S.wins = defaultLayout(); S.focus = 'map'; S.zTop = 20;
  setLauncherWidth(LC_DEF);
  renderWindows(); save();
  toast('ok', '창 위치 초기화', '기본 화면 배치와 런처 너비로 되돌렸습니다.');
}

/* ---- 창 DOM 생성 / 갱신 ---- */
function winChrome(app) {
  const b = (act, ic, label, cls = '') =>
    `<button class="wb ${cls}" type="button" data-act="${act}" data-win="${app.id}" title="${label}" aria-label="${label}">${icon(ic)}</button>`;
  return `
  <header class="win-bar" data-drag data-win="${app.id}">
    ${icon(app.icon)}
    <span class="win-title">${esc(app.name)}</span>
    <span class="win-ctx" data-ctx="${app.id}"></span>
    <div class="win-btns">
      ${b('w-front', 'ic-front', '맨 앞으로 가져오기', 'wb-opt')}
      ${b('w-left', 'ic-split2', '화면 왼쪽 절반으로 (Alt+왼쪽)', 'wb-opt')}
      ${b('w-right', 'ic-split2', '화면 오른쪽 절반으로 (Alt+오른쪽)', 'wb-opt')}
      ${b('w-quad', 'ic-split4', '4분할 위치로 이동 (누를 때마다 사분면 변경)', 'wb-opt')}
      ${b('w-reset', 'ic-reset', '이 창 위치 초기화', 'wb-opt')}
      <span class="win-lights">
        ${b('w-close', 'ic-close', '닫기', 'wb-light wb-close')}
        ${b('w-min', 'ic-dash', '최소화', 'wb-light wb-min')}
        ${b('w-max', 'ic-expand', '최대화 / 복원 (Alt+위)', 'wb-light wb-max')}
      </span>
    </div>
  </header>
  <div class="win-body" data-body="${app.id}"></div>
  ${['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d =>
    `<div class="win-rz win-rz-${d}" data-rz="${d}" data-win="${app.id}"></div>`).join('')}`;
}

let RO = null;   // ResizeObserver: 창 크기에 따른 정보 접기
function renderWindows() {
  const host = $('#windows');
  const ids = S.wins.map(w => w.id);
  // 제거
  $$('.win', host).forEach(el => { if (!ids.includes(el.dataset.win)) el.remove(); });
  // 추가
  S.wins.forEach(w => {
    if ($('#win-' + w.id)) return;
    const app = APPS.find(a => a.id === w.id);
    const el = document.createElement('section');
    el.className = 'win'; el.id = 'win-' + w.id; el.dataset.win = w.id;
    el.tabIndex = 0; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', app.name + ' 창');
    el.innerHTML = winChrome(app);
    host.appendChild(el);
    if (RO) RO.observe(el);
    render(w.id);
  });
  applyLayout();
  paintTaskbar(); paintLauncher(); paintStatus();
  $('#desktopEmpty').hidden = S.wins.length > 0;
}
function applyLayout() {
  normalizeZ();
  layoutWindows();
  paintCompactSwitch();
  sizeClasses();
  renderSplitters();
  paintUrgent(false);
}
/** z 순서를 1..n 으로 재정렬 - 분할선이 항상 창 위에 오도록 유지 */
function normalizeZ() {
  S.wins.slice().sort((a, b) => a.z - b.z).forEach((w, i) => { w.z = 10 + i; });
  S.zTop = 10 + S.wins.length;
}
function layoutWindows() {
  const d = DESK(); const W = d.clientWidth, H = d.clientHeight;
  S.mode = layoutMode();
  document.body.dataset.mode = S.mode;
  const lf = $('#lfMode');   // 화면 모드 표시는 화면에서 뺐다 (남아 있으면 갱신)
  if (lf) lf.textContent = { wide: '넓은 화면 (다중 창)', standard: '일반 모니터 (분할 배치)', compact: '좁은 화면 (단일 앱)' }[S.mode];

  const compact = S.mode === 'compact';
  $('#compactSwitch').hidden = !compact;
  if (compact && !S.focus && openWins()[0]) S.focus = openWins()[0].id;

  S.wins.forEach(w => {
    const el = $('#win-' + w.id); if (!el) return;
    el.classList.toggle('is-min', w.min);
    el.classList.toggle('is-max', w.max);
    el.classList.toggle('is-focus', S.focus === w.id);
    if (compact) {
      // 좁은 화면: 선택한 앱 하나만 전체 영역에 표시
      const on = (S.focus === w.id) && !w.min;
      el.style.display = on ? '' : 'none';
      el.style.left = '0px'; el.style.top = '0px';
      el.style.width = W + 'px'; el.style.height = (H - 40) + 'px';
      el.style.zIndex = 5;
      return;
    }
    el.style.display = w.min ? 'none' : '';
    if (w.max) {
      el.style.left = GUTTER + 'px'; el.style.top = GUTTER + 'px';
      el.style.width = (W - GUTTER * 2) + 'px'; el.style.height = (H - GUTTER * 2) + 'px';
    } else {
      const ww = clamp(Math.round(w.fw * W), MIN_W, W);
      const hh = clamp(Math.round(w.fh * H), MIN_H, H);
      el.style.left = (clamp(Math.round(w.fx * W), 0, Math.max(0, W - ww)) + GUTTER) + 'px';
      el.style.top = (clamp(Math.round(w.fy * H), 0, Math.max(0, H - hh)) + GUTTER) + 'px';
      el.style.width = (ww - GUTTER * 2) + 'px'; el.style.height = (hh - GUTTER * 2) + 'px';
    }
    el.style.zIndex = w.z;
  });
}

/* ---- 창 사이 경계(스플리터): 끌어서 화면 분할 비율 조절 ---- */
let SEAMS = [];
/** 맞닿아 있는 창들의 공통 경계를 찾는다. 같은 경계를 공유하는 창은 함께 움직인다. */
function computeSeams() {
  const d = DESK(), W = d.clientWidth, H = d.clientHeight;
  if (S.mode === 'compact') return [];
  const boxes = S.wins.filter(w => !w.min && !w.max).map(w => {
    const bw = clamp(Math.round(w.fw * W), MIN_W, W), bh = clamp(Math.round(w.fh * H), MIN_H, H);
    return { win: w, x: clamp(Math.round(w.fx * W), 0, Math.max(0, W - bw)),
             y: clamp(Math.round(w.fy * H), 0, Math.max(0, H - bh)), w: bw, h: bh };
  });
  if (boxes.length < 2) return [];
  const EPS = 8, out = [];
  const add = (dir, pos, before, after) => {
    if (out.some(x => x.dir === dir && Math.abs(x.pos - pos) <= EPS)) return;
    const all = [...before, ...after];
    const s0 = dir === 'v' ? Math.min(...all.map(b => b.y)) : Math.min(...all.map(b => b.x));
    const s1 = dir === 'v' ? Math.max(...all.map(b => b.y + b.h)) : Math.max(...all.map(b => b.x + b.w));
    out.push({ dir, pos, before, after, s0, s1 });
  };
  [...new Set(boxes.map(b => b.x + b.w))].forEach(x => {
    if (x <= 4 || x >= W - 4) return;
    const before = boxes.filter(b => Math.abs(b.x + b.w - x) <= EPS);
    const after = boxes.filter(b => Math.abs(b.x - x) <= EPS);
    if (!before.length || !after.length) return;
    const touching = before.some(l => after.some(r => Math.min(l.y + l.h, r.y + r.h) - Math.max(l.y, r.y) > 32));
    if (touching) add('v', x, before, after);
  });
  [...new Set(boxes.map(b => b.y + b.h))].forEach(y => {
    if (y <= 4 || y >= H - 4) return;
    const before = boxes.filter(b => Math.abs(b.y + b.h - y) <= EPS);
    const after = boxes.filter(b => Math.abs(b.y - y) <= EPS);
    if (!before.length || !after.length) return;
    const touching = before.some(t => after.some(u => Math.min(t.x + t.w, u.x + u.w) - Math.max(t.x, u.x) > 32));
    if (touching) add('h', y, before, after);
  });
  return out;
}
function renderSplitters() {
  const host = $('#windows');
  $$('.splitter', host).forEach(e => e.remove());
  SEAMS = computeSeams();
  SEAMS.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'splitter splitter-' + s.dir;
    el.dataset.seam = String(i);
    el.tabIndex = 0;
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', s.dir === 'v' ? 'vertical' : 'horizontal');
    const names = [...new Set([...s.before, ...s.after].map(b => (APPS.find(a => a.id === b.win.id) || {}).name))];
    const t = `${s.dir === 'v' ? '좌우' : '위아래'} 분할 경계 - 드래그하여 크기 조절 (${names.join(' / ')}) · 방향키로도 조절`;
    el.title = t; el.setAttribute('aria-label', t);
    if (s.dir === 'v') { el.style.left = s.pos + 'px'; el.style.top = s.s0 + 'px'; el.style.height = (s.s1 - s.s0) + 'px'; }
    else { el.style.top = s.pos + 'px'; el.style.left = s.s0 + 'px'; el.style.width = (s.s1 - s.s0) + 'px'; }
    host.appendChild(el);
  });
  // 가로·세로 경계가 만나는 지점: 두 방향을 동시에 조절하는 핸들
  SEAMS.forEach((v, i) => {
    if (v.dir !== 'v') return;
    SEAMS.forEach((h, j) => {
      if (h.dir !== 'h') return;
      if (v.pos < h.s0 - 8 || v.pos > h.s1 + 8 || h.pos < v.s0 - 8 || h.pos > v.s1 + 8) return;
      const x = document.createElement('div');
      x.className = 'splitter splitter-x';
      x.dataset.seams = i + ',' + j;
      x.style.left = v.pos + 'px'; x.style.top = h.pos + 'px';
      x.title = '분할 교차점 - 드래그하면 가로·세로 비율을 함께 조절';
      x.setAttribute('aria-hidden', 'true');
      host.appendChild(x);
    });
  });
}
/** 경계를 dPx 만큼 이동. 양쪽 창이 최소 크기 아래로 내려가지 않게 제한하고 실제 이동량을 돌려준다. */
function moveSeam(seam, dPx) {
  const d = DESK(), T = seam.dir === 'v' ? d.clientWidth : d.clientHeight;
  const MIN = seam.dir === 'v' ? MIN_W : MIN_H;
  const size = b => seam.dir === 'v' ? b.w : b.h;
  const lo = MIN - Math.min(...seam.before.map(size));
  const hi = Math.min(...seam.after.map(size)) - MIN;
  const dx = clamp(dPx, Math.min(lo, 0), Math.max(hi, 0));
  seam.before.forEach(b => {
    if (seam.dir === 'v') b.win.fw = (b.w + dx) / T; else b.win.fh = (b.h + dx) / T;
  });
  seam.after.forEach(b => {
    if (seam.dir === 'v') { b.win.fx = (b.x + dx) / T; b.win.fw = (b.w - dx) / T; }
    else { b.win.fy = (b.y + dx) / T; b.win.fh = (b.h - dx) / T; }
  });
  return dx;
}
let seamDrag = null;
document.addEventListener('pointerdown', e => {
  const sp = e.target.closest('.splitter'); if (!sp) return;
  // 교차점 핸들은 가로·세로 경계를 동시에 잡는다
  const ids = (sp.dataset.seams || sp.dataset.seam).split(',').map(Number);
  const items = ids.map(i => SEAMS[i]).filter(Boolean).map(seam => ({ seam, pos0: seam.pos }));
  if (!items.length) return;
  seamDrag = { items, el: sp, sx: e.clientX, sy: e.clientY, left0: sp.offsetLeft, top0: sp.offsetTop };
  sp.classList.add('is-drag');
  document.body.classList.add('is-seam-resizing');
  if (sp.setPointerCapture) sp.setPointerCapture(e.pointerId);
  e.preventDefault(); e.stopPropagation();
});
document.addEventListener('pointermove', e => {
  if (!seamDrag) return;
  let mx = 0, my = 0;
  seamDrag.items.forEach(({ seam }) => {
    if (seam.dir === 'v') mx = moveSeam(seam, e.clientX - seamDrag.sx);
    else my = moveSeam(seam, e.clientY - seamDrag.sy);
  });
  layoutWindows(); sizeClasses();
  const el = seamDrag.el;
  if (el.classList.contains('splitter-x')) { el.style.left = (seamDrag.left0 + mx) + 'px'; el.style.top = (seamDrag.top0 + my) + 'px'; }
  else if (el.classList.contains('splitter-v')) el.style.left = (seamDrag.items[0].pos0 + mx) + 'px';
  else el.style.top = (seamDrag.items[0].pos0 + my) + 'px';
});
document.addEventListener('pointerup', () => {
  if (!seamDrag) return;
  seamDrag.el.classList.remove('is-drag');
  document.body.classList.remove('is-seam-resizing');
  seamDrag = null;
  applyLayout(); save();
});
document.addEventListener('keydown', e => {
  const sp = document.activeElement;
  if (!sp || !sp.classList || !sp.classList.contains('splitter')) return;
  const i = Number(sp.dataset.seam), seam = SEAMS[i]; if (!seam) return;
  const step = e.shiftKey ? 32 : 8;
  const dir = seam.dir === 'v'
    ? (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0)
    : (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0);
  if (!dir) return;
  e.preventDefault(); e.stopPropagation();
  moveSeam(seam, dir); applyLayout(); save();
  const again = $(`.splitter[data-seam="${i}"]`); if (again) again.focus();
});

/* ---- 왼쪽 앱 런처 너비 조절 ---- */
const LC_MIN = 56, LC_MAX = 340, LC_DEF = 76;   // 아이콘 + 작은 라벨 레일
function setLauncherWidth(px, persist) {
  S.lcW = clamp(Math.round(px), LC_MIN, LC_MAX);
  document.documentElement.style.setProperty('--lc-w', S.lcW + 'px');
  $('#launcher').classList.toggle('is-rail', S.lcW < 112);
  applyLayout();
  if (persist) save();
}
let lcDrag = null;
function initLauncherResize() {
  const h = $('#launcherRz');
  h.addEventListener('pointerdown', e => {
    lcDrag = { sx: e.clientX, w0: $('#launcher').offsetWidth };
    h.classList.add('is-drag'); document.body.classList.add('is-lc-resizing');
    if (h.setPointerCapture) h.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!lcDrag) return;
    setLauncherWidth(lcDrag.w0 + (e.clientX - lcDrag.sx));
  });
  document.addEventListener('pointerup', () => {
    if (!lcDrag) return;
    lcDrag = null; h.classList.remove('is-drag');
    document.body.classList.remove('is-lc-resizing'); save();
  });
  h.addEventListener('dblclick', () => {
    setLauncherWidth(LC_DEF, true);
    toast('info', '런처 너비 초기화', '앱 런처 너비를 기본값으로 되돌렸습니다.');
  });
  h.addEventListener('keydown', e => {
    const step = e.shiftKey ? 24 : 8;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setLauncherWidth($('#launcher').offsetWidth - step, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setLauncherWidth($('#launcher').offsetWidth + step, true); }
  });
}

function sizeClasses() {
  $$('.win').forEach(el => {
    el.classList.toggle('w-narrow', el.clientWidth < 460);
    el.classList.toggle('w-mid', el.clientWidth < 660);
    el.classList.toggle('w-short', el.clientHeight < 300);
  });
}
function paintCompactSwitch() {
  const host = $('#compactSwitch'); if (host.hidden) { host.innerHTML = ''; return; }
  host.innerHTML = S.wins.map(w => {
    const a = APPS.find(x => x.id === w.id);
    return `<button class="btn btn-sm ${S.focus === w.id ? 'btn-on' : ''}" type="button" data-act="focus" data-win="${w.id}">${esc(a.short)}</button>`;
  }).join('') || '<span class="dim" style="padding:4px 8px">열린 앱 없음</span>';
}

/* ---- 드래그 / 리사이즈 ---- */
let drag = null;
document.addEventListener('pointerdown', e => {
  const bar = e.target.closest('[data-drag]');
  const rz = e.target.closest('[data-rz]');
  if (!bar && !rz) return;
  if (e.target.closest('.wb')) return;
  const id = (bar || rz).dataset.win;
  const w = winOf(id); if (!w) return;
  focusWin(id);
  if (S.mode === 'compact' || w.max) return;
  const d = DESK(), el = $('#win-' + id);
  drag = {
    id, mode: rz ? 'rz' : 'mv', dir: rz ? rz.dataset.rz : '',
    sx: e.clientX, sy: e.clientY,
    ox: el.offsetLeft, oy: el.offsetTop, ow: el.offsetWidth, oh: el.offsetHeight,
    W: d.clientWidth, H: d.clientHeight
  };
  el.classList.add(rz ? 'is-resizing' : 'is-dragging');
  el.setPointerCapture && el.setPointerCapture(e.pointerId);
  e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  const el = $('#win-' + drag.id); if (!el) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (drag.mode === 'mv') {
    el.style.left = clamp(drag.ox + dx, -drag.ow + 90, drag.W - 60) + 'px';
    el.style.top = clamp(drag.oy + dy, 0, drag.H - 34) + 'px';
    showSnapGhost(e.clientX, e.clientY);
  } else {
    let { ox, oy, ow, oh } = drag;
    if (drag.dir.includes('e')) ow = Math.max(MIN_W, drag.ow + dx);
    if (drag.dir.includes('s')) oh = Math.max(MIN_H, drag.oh + dy);
    if (drag.dir.includes('w')) { const nw = Math.max(MIN_W, drag.ow - dx); ox = drag.ox + (drag.ow - nw); ow = nw; }
    if (drag.dir.includes('n')) { const nh = Math.max(MIN_H, drag.oh - dy); oy = drag.oy + (drag.oh - nh); oh = nh; }
    Object.assign(el.style, { left: ox + 'px', top: oy + 'px', width: ow + 'px', height: oh + 'px' });
  }
});
document.addEventListener('pointerup', e => {
  if (!drag) return;
  const el = $('#win-' + drag.id), w = winOf(drag.id);
  if (el && w) {
    el.classList.remove('is-dragging', 'is-resizing');
    const gap = drag.mode === 'mv' ? gapAtPointer(drag.id, e.clientX, e.clientY) : null;
    const zone = drag.mode === 'mv' && !gap ? snapZone(e.clientX, e.clientY) : null;
    if (gap) { Object.assign(w, gap, { max: false }); focusWin(drag.id); applyLayout(); }
    else if (zone) { snapWin(drag.id, zone); }
    else {
      w.fx = (el.offsetLeft - GUTTER) / drag.W; w.fy = (el.offsetTop - GUTTER) / drag.H;
      w.fw = (el.offsetWidth + GUTTER * 2) / drag.W; w.fh = (el.offsetHeight + GUTTER * 2) / drag.H;
    }
  }
  clearSnapGhost(); drag = null; sizeClasses(); save();
});
function snapZone(cx, cy) {
  const r = DESK().getBoundingClientRect();
  const x = cx - r.left, y = cy - r.top, E = 22;
  if (x < E && y < r.height * .35) return 'q1';
  if (x < E && y > r.height * .65) return 'q4';
  if (x > r.width - E && y < r.height * .35) return 'q2';
  if (x > r.width - E && y > r.height * .65) return 'q3';
  if (x < E) return 'left';
  if (x > r.width - E) return 'right';
  if (y < E) return 'top';
  return null;
}
function showSnapGhost(cx, cy) {
  clearSnapGhost();
  const gap = drag && gapAtPointer(drag.id, cx, cy);
  if (gap) {
    const d = DESK(), g = document.createElement('div');
    g.className = 'snap-ghost is-gap'; g.id = 'snapGhost';
    g.style.left = gap.fx * d.clientWidth + 'px'; g.style.top = gap.fy * d.clientHeight + 'px';
    g.style.width = gap.fw * d.clientWidth + 'px'; g.style.height = gap.fh * d.clientHeight + 'px';
    g.innerHTML = '<span class="snap-ghost-t">빈 공간에 맞춤</span>';
    d.appendChild(g);
    return;
  }
  const z = snapZone(cx, cy);
  if (!z) return;
  const M = { left: [0, 0, .5, 1], right: [.5, 0, .5, 1], top: [0, 0, 1, .5],
    q1: [0, 0, .5, .5], q2: [.5, 0, .5, .5], q3: [.5, .5, .5, .5], q4: [0, .5, .5, .5] }[z];
  const d = DESK(), g = document.createElement('div');
  g.className = 'snap-ghost'; g.id = 'snapGhost';
  g.style.left = M[0] * d.clientWidth + 'px'; g.style.top = M[1] * d.clientHeight + 'px';
  g.style.width = M[2] * d.clientWidth + 'px'; g.style.height = M[3] * d.clientHeight + 'px';
  d.appendChild(g);
}
function clearSnapGhost() { const g = $('#snapGhost'); if (g) g.remove(); }

/* ---- 런처 / 작업표시줄 / 상태바 ---- */
function paintLauncher() {
  $('#launcherList').innerHTML = APPS.map((a, i) => {
    const open = !!winOf(a.id);
    const key = i < 9 ? String(i + 1) : i === 9 ? '0' : '-';
    return `<li><button class="lc-btn ${open ? 'is-open' : ''} ${S.focus === a.id ? 'is-focus' : ''}" type="button" data-act="launch" data-app="${a.id}"
      title="${esc(a.name)} - ${esc(a.desc)} (Alt+${key})" aria-pressed="${open}">
      ${icon(a.icon)}<span class="lc-t">${esc(a.name)}</span></button></li>`;
  }).join('');
}
function paintTaskbar() {
  $('#tbApps').innerHTML = S.wins.length ? S.wins.map(w => {
    const a = APPS.find(x => x.id === w.id);
    return `<li class="tb-app ${S.focus === w.id ? 'is-focus' : ''} ${w.min ? 'is-min' : ''}">
      <button class="tb-app-btn" type="button" data-act="tb-toggle" data-win="${w.id}"
        title="${esc(a.name)} - ${w.min ? '복원' : '선택 / 최소화'}">
        <span class="tb-dot"></span><span class="tb-app-t">${esc(a.name)}</span></button>
      <button class="tb-x" type="button" data-act="w-close" data-win="${w.id}"
        title="${esc(a.name)} 닫기" aria-label="${esc(a.name)} 닫기">${icon('ic-close', 'ic-sm')}</button></li>`;
  }).join('') : '<li class="dim" style="font-size:12px;padding:4px 6px">실행 중인 앱 없음</li>';

  const n = S.alerts.filter(x => !x.seen && x.level === '긴급').length;
  $('#tbAlertCount').textContent = String(S.alerts.length);
  $('#tbAlert').classList.toggle('has-alert', n > 0);
}
function paintStatus() {
  const inc = curInc();
  $('#sbClockVal').textContent = nowHMS();
  $('#sbIncident').innerHTML = `<span class="sb-no">${esc(inc.id)}</span> ${esc(inc.type)}`;
  $('#sbIncident').title = `${inc.id} ${inc.type} · ${inc.place}`;
  const riskEl = $('#sbRisk');
  riskEl.className = 'sb-risk' + (inc.risk >= 70 ? ' is-crit' : '');
  riskEl.textContent = `위험도 ${riskLabel(inc.risk)} ${Math.round(inc.risk)}`;
  $('#sbActive').textContent = activeIncidents().length + '건';
  $('#sbStaff').textContent = OFFICERS.filter(o => activeIncidents().some(i => i.id === o.inc)).length + '명';
  const bad = OFFICERS.filter(o => o.ar === '불안정' || o.ar === '두절').length;
  const commEl = $('#sbComm');
  commEl.className = 'sb-comm' + (bad ? ' is-warn' : '');
  commEl.textContent = bad === 0 ? '통신 정상' : `통신 이상 ${bad}건`;
  const crit = S.alerts.filter(a => a.level === '긴급' && !a.seen).length;
  const alertEl = $('#sbAlerts');
  alertEl.className = crit ? 'is-crit' : '';
  alertEl.textContent = `긴급 알림 ${crit}건`;
  $$('[data-ctx]').forEach(el => {
    const a = APPS.find(x => x.id === el.dataset.ctx);
    // ctx: null 인 앱은 창 이름 옆에 아무것도 붙이지 않는다
    el.textContent = a && a.ctx === null ? '' : a && a.ctx ? a.ctx() : `${inc.id} ${inc.type}`;
  });
}

/* ===================== [6] 알림 ===================== */
let audioCtx = null;
function beep(kind) {
  if (!S.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = kind === '긴급' ? [[880, 0], [660, .16], [880, .32]] : [[620, 0]];
    seq.forEach(([f, t]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.06, audioCtx.currentTime + t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + t + .13);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .15);
    });
  } catch (e) { /* 사용자 상호작용 전이면 무시 */ }
}
/** level: 긴급 | 중요 | 일반 */
/** 메시지 창이 실제로 화면에 보이는지 (좁은 화면에서는 선택된 앱일 때만) */
function msgVisible() {
  const w = winOf('messages');
  if (!w || w.min) return false;
  return S.mode !== 'compact' || S.focus === 'messages';
}
const unseenCrit = () => S.alerts.filter(a => a.level === '긴급' && !a.seen);
let lastBeepAt = 0;
function beepThrottled(level) {
  const now = Date.now();
  if (now - lastBeepAt < 6000) return;      // 연속 알림음으로 인한 피로 방지
  lastBeepAt = now; beep(level);
}
/**
 * level: 긴급 | 중요 | 일반
 * - 메시지 창 열림: 상단 배너 없이 메시지 창 안에서 알림 (창 테두리 짧게 강조)
 * - 메시지 창 닫힘: 긴급은 상단 통합 배너 1개(최신 1건 + 외 N건), 중요는 자동으로 사라지는 토스트
 * 어떤 경우에도 작업 영역 크기는 바뀌지 않는다.
 */
function pushAlert(level, title, desc, opt = {}) {
  const a = { id: uid('AL'), level, title, desc, t: nowHMS(), inc: opt.inc || S.sel, app: opt.app || null, seen: level !== '긴급' };
  S.alerts.unshift(a);
  if (S.alerts.length > 120) S.alerts.pop();
  const open = msgVisible();
  if (level !== '일반') {
    // 긴급·중요는 메시지 창 대화 목록에 시스템 알림으로 남긴다 (열려 있으면 그 자리에서 바로 보임)
    S.msgs.push({ id: uid('M'), inc: a.inc, from: '시스템 알림', to: '지휘통제실', kind: level,
      title, text: desc, t: nowHM(), read: level !== '긴급', mine: false, system: true, alertId: a.id });
  }
  if (level === '일반') {
    if (!open) toast('info', title, desc);
  } else if (open) {
    // 메시지 창이 열려 있으면 화면 상단 배너 없이 메시지 창 안에서만 (긴급은 알림음)
    if (level === '긴급') beepThrottled(level);
  } else if (level === '긴급') {
    beepThrottled(level);
  } else {
    toast('warn', title, desc);
  }
  paintUrgent(true);
  paintTaskbar(); paintStatus();
  if (winOf('messages')) render('messages');
  return a;
}
/**
 * 긴급 알림 표시
 * - 메시지 창 열림: 화면 배너 없음, 메시지 창 대화 목록에 시스템 알림 카드로 표시
 * - 메시지 창 닫힘: 우상단 알림 카드 묶음. 확인 전까지 미확인 긴급 알림을 모두 보여주고,
 *   새 알림은 아래에 붙는다. 넘치면 목록 안에서 스크롤된다.
 */
function paintUrgent(isNew) {
  const host = $('#urgentStack');
  if (msgVisible()) { host.classList.remove('is-notify'); host.innerHTML = ''; return; }
  const list = unseenCrit().slice().reverse();          // 오래된 것 -> 최신 순
  if (!list.length) { host.classList.remove('is-notify'); host.innerHTML = ''; return; }
  if (!host.classList.contains('is-notify') || !host.querySelector('.nt-list')) {
    host.classList.add('is-notify');
    host.innerHTML = '<div class="nt-head"></div><div class="nt-list"></div>';
  }
  const head = host.querySelector('.nt-head'), body = host.querySelector('.nt-list');
  head.hidden = list.length < 2;
  head.innerHTML = `<span class="nt-count">긴급 알림 ${list.length}건</span><span class="spacer"></span>
    <button class="btn btn-sm" type="button" data-act="alert-inbox">알림 탭</button>
    <button class="btn btn-sm btn-crit" type="button" data-act="alert-ack-all">모두 확인</button>`;
  // 확인된 카드만 제거하고, 새 카드만 추가 (기존 카드는 다시 그리지 않아 움직이지 않음)
  const ids = new Set(list.map(a => a.id));
  body.querySelectorAll('.nt-card').forEach(c => { if (!ids.has(c.dataset.alert)) c.remove(); });
  let added = false;
  list.forEach(a => {
    if (body.querySelector(`[data-alert="${a.id}"]`)) return;
    body.insertAdjacentHTML('beforeend', `<div class="nt-card" data-alert="${a.id}">
      <div class="nt-top">
        <span class="badge badge-crit badge-tri">긴급</span>
        <span class="nt-inc">사건 ${esc(a.inc)}</span>
        <span class="nt-time mono">${esc(a.t)}</span>
        <button class="nt-x" type="button" data-act="alert-ack" data-alert="${a.id}" title="확인하고 닫기" aria-label="${esc(a.title)} 확인하고 닫기">${icon('ic-close', 'ic-sm')}</button>
      </div>
      <div class="nt-t">${esc(a.title)}</div>
      <div class="nt-d">${esc(a.desc)}</div>
      <div class="nt-acts">
        <button class="btn btn-sm btn-crit" type="button" data-act="alert-ack" data-alert="${a.id}">확인</button>
        ${a.app ? `<button class="btn btn-sm" type="button" data-act="alert-open" data-alert="${a.id}">해당 앱 열기</button>` : ''}
      </div>
    </div>`);
    added = true;
  });
  if (added) body.scrollTop = body.scrollHeight;
}
function ackAlert(id) {
  const a = S.alerts.find(x => x.id === id); if (a) a.seen = true;
  S.msgs.forEach(m => { if (m.alertId === id) m.read = true; });
  paintUrgent(false);
  paintTaskbar(); paintStatus(); if (winOf('messages')) render('messages');
}
function ackAllAlerts() {
  S.alerts.forEach(a => { a.seen = true; });
  S.msgs.forEach(m => { if (m.system) m.read = true; });
  paintUrgent(false);
  paintTaskbar(); paintStatus(); if (winOf('messages')) render('messages');
}
function toast(kind, title, desc) {
  const host = $('#toastStack');
  const el = document.createElement('div');
  el.className = 'toast t-' + kind;
  el.innerHTML = `<div><div class="toast-t">${esc(title)}</div>${desc ? `<div class="toast-d">${esc(desc)}</div>` : ''}</div>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
  while (host.children.length > 5) host.firstElementChild.remove();
}
function openModal(title, bodyHtml, footHtml) {
  const r = $('#modalRoot'); r.hidden = false;
  r.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-h">${icon('ic-briefing')}<span class="modal-t">${esc(title)}</span><span class="spacer"></span>
      <button class="wb" type="button" data-act="modal-close" aria-label="닫기" title="닫기 (Esc)">${icon('ic-close')}</button></div>
    <div class="modal-b">${bodyHtml}</div>
    <div class="modal-f">${footHtml || '<button class="btn" type="button" data-act="modal-close">닫기</button>'}</div></div>`;
  const f = r.querySelector('.modal button'); f && f.focus();
}
function closeModal() { const r = $('#modalRoot'); r.hidden = true; r.innerHTML = ''; }

/* ===================== [5] 앱 정의 ===================== */
const APPS = [];
const defApp = o => APPS.push(o);
Object.assign(S.ui, { fieldAll: false, cctvAll: false, arAll: false, hoTab: '현재', briefOpen: false });

/** 앱 본문 다시 그리기 (입력 중인 창은 건너뜀) */
function render(id) {
  const body = $(`[data-body="${id}"]`); if (!body) return;
  const app = APPS.find(a => a.id === id); if (!app) return;
  const ae = document.activeElement;
  const typing = ae && body.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
  if (typing) { body.dataset.dirty = '1'; return; }
  const st = body.scrollTop;
  body.innerHTML = app.render();
  body.scrollTop = st;
  body.dataset.dirty = '';
  if (app.after) app.after(body);
}
function renderAll() { S.wins.forEach(w => render(w.id)); paintStatus(); }
/** 입력 중에도 강제로 다시 그리고 포커스·캐럿을 복원 */
function renderForce(id) {
  const body = $(`[data-body="${id}"]`); if (!body) return;
  const app = APPS.find(a => a.id === id); if (!app) return;
  const ae = document.activeElement;
  const key = (ae && body.contains(ae) && ae.dataset) ? ae.dataset.model : null;
  const pos = key && ae.selectionStart != null ? ae.selectionStart : null;
  const st = body.scrollTop;
  body.innerHTML = app.render();
  body.scrollTop = st; body.dataset.dirty = '';
  if (app.after) app.after(body);
  if (key) {
    const n = body.querySelector(`[data-model="${key}"]`);
    if (n) { n.focus(); if (pos != null) { try { n.setSelectionRange(pos, pos); } catch (e) { } } }
  }
  paintStatus();
}

/** 사건 선택 - 모든 앱 동기화 */
function selectIncident(id, why) {
  if (!INCIDENTS.some(i => i.id === id) || S.sel === id) { if (S.sel === id) return; }
  S.sel = id;
  const inc = curInc();
  const c = incCCTVs(id)[0]; if (c) S.ui.cctvSel = c.id;
  const o = incOfficers(id).find(x => x.ar === '연결') || incOfficers(id)[0]; if (o) S.ui.arSel = o.id;
  S.ui.chatTab = '전체';
  renderAll(); save();
  toast('info', '사건 동기화', `${inc.id} ${inc.type} 기준으로 모든 앱을 전환했습니다.${why ? ' (' + why + ')' : ''}`);
}

/* ---- 공통 조각 ---- */
const srcChip = s => `<span class="src">${icon('ic-check', 'ic-sm')}출처: ${esc(s)}</span>`;
const certBadge = c => badge(c, c === '확인' ? 'badge-ok' : c === '추정' ? 'badge-warn' : 'badge-idle', c === '추정' ? 'badge-sq' : '');
const arBadge = s => badge('AR ' + s, s === '연결' ? 'badge-ok' : s === '불안정' ? 'badge-warn' : s === '두절' ? 'badge-crit' : 'badge-idle', s === '불안정' ? 'badge-sq' : s === '두절' ? 'badge-tri' : '');
function battHTML(b) {
  const cls = b < 20 ? 'crit' : b < 40 ? 'low' : '';
  return `<span class="batt ${cls}" title="배터리 ${b}%"><span class="batt-b"><i style="width:${clamp(b, 2, 100)}%"></i></span><span class="mono">${b}%</span></span>`;
}
function healthHTML(h) {
  const cls = h.label === '이상 없음' ? 'badge-ok' : h.label === '확인 필요' ? 'badge-warn' : 'badge-idle';
  return `${badge(h.label, cls, h.label === '확인 필요' ? 'badge-sq' : '')} <span class="src">확인 방식: ${esc(h.source)}</span>`;
}
/** 시드 데이터의 시각(기준 21:00)을 실행 시점 기준으로 이동시켜 '실시간'처럼 보이게 한다 */
function rebaseTimes() {
  const n = new Date();
  const delta = (n.getHours() * 60 + n.getMinutes()) - (21 * 60);
  const shift = hm => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hm); if (!m) return hm;
    let t = (Number(m[1]) * 60 + Number(m[2]) + delta) % 1440; if (t < 0) t += 1440;
    return pad2(Math.floor(t / 60)) + ':' + pad2(t % 60);
  };
  INCIDENTS.forEach(i => { i.reportedAt = shift(i.reportedAt); i.updatedAt = shift(i.updatedAt); });
  OFFICERS.forEach(o => { o.comm = shift(o.comm); });
  CCTVS.forEach(c => { c.at = nowHM(); });
  Object.values(STAGE_STATE).forEach(st => { st.log = st.log.map(l => l.replace(/^(\d{1,2}:\d{2})/, (_, t) => shift(t))); });
  Object.values(BRIEFINGS).forEach(arr => arr.forEach(x => { x.t = shift(x.t); }));
  SEED_MSGS.forEach(m => { m.t = shift(m.t); });
}

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

/** CCTV·AR 화면 플레이스홀더 (실제 영상 없음, CSS로 그린 가상 장면) */
function sceneHTML(scene, seed) {
  const h = hash(seed);
  const b = [0, 1, 2, 3].map(i => {
    const w = 16 + ((h >> (i * 3)) % 26), ht = 26 + ((h >> (i * 2 + 1)) % 44), l = 2 + i * 24 + ((h >> i) % 7);
    const win = [0, 1, 2, 3, 4, 5].map(j => ((h >> (i + j)) % 3 === 0)
      ? `<i style="left:${3 + (j % 3) * 5}px;top:${4 + Math.floor(j / 3) * 8}px"></i>` : '').join('');
    return `<div class="sc-bldg" style="left:${l}%;width:${w}%;height:${ht}%">${win}</div>`;
  }).join('');
  const cars = scene === 'cross' || scene === 'street'
    ? [0, 1, 2].map(i => `<div class="sc-car" style="left:${8 + ((h >> i) % 70)}%;bottom:${6 + i * 9}%;width:${9 + i * 3}%;height:${5 + i}%"></div>`).join('')
    : '';
  const ppl = [0, 1].map(i => ((h >> (i + 2)) % 2 === 0)
    ? `<div class="sc-person" style="left:${20 + ((h >> (i + 4)) % 60)}%;bottom:${10 + i * 6}%"></div>` : '').join('');
  return `<div class="screen-scene">
    <div class="sc-sky"></div><div class="sc-ground"></div>
    ${b}
    ${scene !== 'park' ? '<div class="sc-road"><div class="sc-lane"></div></div>' : ''}
    ${cars}${ppl}
    <div class="sc-noise"></div><div class="sc-scan"></div></div>`;
}
function screenHTML(o) {
  // o: {id, title, place, at, rec, lost, scene, tall}
  return `<div class="screen ${o.lost ? 'is-lost' : ''}" style="${o.style || ''}">
    ${sceneHTML(o.scene || 'street', o.id)}
    <div class="screen-osd">
      <span class="osd-tl">${esc(o.id)} ${esc(o.title || '')}</span>
      <span class="osd-tr">${o.rec ? '<span class="osd-rec"><i></i>REC</span>' : '대기'}</span>
      <span class="osd-bl">${esc(o.place || '')}</span>
      <span class="osd-br">${esc(o.at || nowHMS())}</span>
      <span class="osd-x"></span>
    </div>
    ${o.lost ? `<div class="screen-lost">${icon('ic-warning')}<span>영상 신호 없음</span><small class="dim">통신 재연결 시도 중 (가상)</small></div>` : ''}
  </div>`;
}

/** 전체 상황 안의 선택 사건 브리핑 (기본은 핵심만, [자세히 보기]로 전체) */
function briefHTML(inc) {
  const b = BRIEFINGS[inc.id] || [], open = !!S.ui.briefOpen, st = S.stages[inc.id];
  const byCert = c => b.filter(x => x.c === c).length;
  const fact = x => `<div class="fact c-${x.c}">
      <div class="fact-t"><strong>${esc(x.k)}</strong> · ${esc(x.v)}</div>
      <div class="fact-m">${certBadge(x.c)}${srcChip(x.src)}<span class="dim mono">확인 시각 ${esc(x.t)}</span></div></div>`;
  const reports = S.msgs.filter(m => m.inc === inc.id && !m.mine && !m.system).slice(-4).reverse();
  return `<div class="sect ov-brief" aria-label="${esc(inc.id)} 사건 브리핑">
    <div class="sect-h bf-head">사건 브리핑<span class="spacer"></span><span class="bf-stage">${esc(STAGE_NAMES[st.at])} ${st.at + 1}/8</span></div>
    <div class="sect-b">
      <div class="bf-id"><span class="bf-no">${esc(inc.id)}</span><span class="bf-name">${esc(inc.type)}</span></div>
      <div class="bf-meta">
        <span class="${inc.priority === '긴급' || inc.risk >= 70 ? 'bf-alert' : ''}">${esc(inc.priority)} · 위험도 ${esc(riskLabel(inc.risk))} ${Math.round(inc.risk)}</span>
        <span>담당 ${esc(inc.team)}</span>
        <span class="detail">${esc(inc.place)}</span>
      </div>
      <p class="brief-sum">${esc(inc.summary)}</p>
      ${b.length ? `<div class="cert-legend">
          <span><i class="lg seg-확인"></i>확인<b>${byCert('확인')}</b></span>
          <span><i class="lg seg-추정"></i>추정<b>${byCert('추정')}</b></span>
          <span><i class="lg seg-미확인"></i>미확인<b>${byCert('미확인')}</b></span>
        </div>
        <div class="cert-bar" role="img" aria-label="확인 ${byCert('확인')}건, 추정 ${byCert('추정')}건, 미확인 ${byCert('미확인')}건">
          ${['확인', '추정', '미확인'].filter(k => byCert(k)).map(k => `<i class="seg-${k}" style="flex:${byCert(k)}"></i>`).join('')}
        </div>` : ''}
      ${open ? `
        <div class="brief-sub">최초 신고 내용</div>
        <div class="brief-call">${esc(inc.call)}</div>
        <div class="fact-m">${srcChip('신고자 진술')}<span class="dim mono">접수 ${esc(inc.reportedAt)}</span><span class="dim">신고자: ${esc(inc.reporter)}</span></div>
        <div class="brief-sub">확인 정보 (출처·확인 시각 병기)</div>
        ${b.map(fact).join('') || '<span class="dim">등록된 정보 없음</span>'}
        <div class="brief-sub">현장 위험 요소</div>
        ${inc.hazard.length ? inc.hazard.map(h => `<div class="card-row brief-row">
          ${badge('주의', 'badge-warn', 'badge-sq')}<span>${esc(h)}</span><span class="spacer" style="flex:1"></span>
          <button class="btn btn-sm btn-warn" type="button" data-act="tx-hazard" data-label="${esc(h)}">현장 전송 후보로</button></div>`).join('')
          : '<span class="dim">등록된 위험 요소 없음</span>'}
        <div class="brief-sub">현장 경찰 보고 (최근)</div>
        ${reports.map(m => `<div class="card-row brief-row"><span class="person-c">${esc(m.from)}</span><span>${esc(m.text)}</span><span class="dim mono">${esc(m.t)}</span></div>`).join('')
          || '<span class="dim">보고 없음</span>'}
      ` : `
        ${b.slice(0, 3).map(fact).join('')}
        ${inc.hazard.length ? `<div class="card-row brief-row">${badge('위험 요소', 'badge-warn', 'badge-sq')}<span>${inc.hazard.map(esc).join(' · ')}</span></div>` : ''}
      `}
      <div class="card-acts brief-more">
        <button class="btn btn-sm ${open ? '' : 'btn-primary'}" type="button" data-act="brief-toggle" aria-expanded="${open}">
          ${open ? '간단히 보기' : `자세히 보기<span class="detail">&nbsp;· 확인 정보 ${b.length}건 · 신고 내용 · 현장 보고</span>`}</button>
        ${open ? '<button class="btn btn-sm" type="button" data-act="brief-print" title="후속 인력 전달용 요약본 생성">요약본 생성</button>' : ''}
      </div>
    </div></div>`;
}

/* ---------- 1. 전체 상황 (사건 목록 통합) ---------- */
defApp({
  id: 'overview', name: '전체 상황', short: '상황', icon: 'ic-overview', defW: .46, defH: .7,
  desc: '상황 요약, 선택 사건 브리핑, 사건 목록(검색·긴급도·상태 필터)을 한 화면에서 확인',
  ctx: () => `선택 ${S.sel} · 진행 ${activeIncidents().length}건 · 투입 ${OFFICERS.length}명`,
  render() {
    const u = S.ui;
    const sos = OFFICERS.filter(o => o.sos);
    const comm = OFFICERS.filter(o => o.ar === '불안정' || o.ar === '두절');
    const crit = activeIncidents().filter(i => i.priority === '긴급');
    const rows = INCIDENTS.filter(i => {
      if (u.listPrio !== '전체' && i.priority !== u.listPrio) return false;
      if (u.listStatus !== '전체' && i.status !== u.listStatus) return false;
      const q = u.listQ.trim();
      if (q && !(`${i.id} ${i.type} ${i.place} ${i.team}`.includes(q))) return false;
      return true;
    });
    const statuses = ['전체', ...new Set(INCIDENTS.map(i => i.status))];
    return `
    <div class="ov-strip" aria-label="상황 요약">
      ${[
        ['진행 중 사건', '진행', activeIncidents().length, ''],
        ['긴급 사건', '긴급', crit.length, crit.length ? 'is-crit' : ''],
        ['투입 인원', '인원', OFFICERS.length, ''],
        ['긴급 지원 요청', '지원 요청', sos.length, sos.length ? 'is-crit' : ''],
        ['통신 이상', '통신', comm.length, comm.length ? 'is-warn' : ''],
        ['AR 연결', 'AR', OFFICERS.filter(o => o.ar === '연결').length, 'detail']
      ].map(([full, short, n, cls]) => `<span class="ov-item ${cls}" title="${full} ${n}"><span class="ov-full">${full}</span><span class="ov-short">${short}</span><b>${n}</b></span>`).join('')}
    </div>

    ${sos.length ? `<div class="sect"><div class="sect-h">${icon('ic-warning', 'ic-sm')} 긴급 지원 요청</div><div class="sect-b" style="display:grid;gap:6px">
      ${sos.map(o => `<div class="card">
        <div class="card-h"><span class="person-c">${esc(o.call)}</span><span class="card-t">${esc(o.name)}</span>
          ${badge('긴급 지원', 'badge-crit', 'badge-tri')}</div>
        <div class="card-row"><span>${esc(o.team)}</span><span class="dim">·</span><span>${esc(o.task)}</span>
          <span class="dim">·</span><span>사건 ${esc(o.inc)}</span></div></div>`).join('')}
    </div></div>` : ''}

    ${briefHTML(curInc())}

    <section class="ovx-index" aria-label="사건 목록">
      <header class="ovx-index-h">
        <div class="ovx-index-title">사건 목록<span class="ovx-count">${rows.length} / ${INCIDENTS.length}건</span></div>
        <button class="btn btn-sm ovx-reset" type="button" data-act="list-reset" title="필터 초기화">초기화</button>
        <div class="ovx-filters">
          <label class="field ovx-search" title="사건번호·유형·위치·담당팀 검색">${icon('ic-search', 'ic-sm')}
            <input type="search" placeholder="사건 검색" value="${esc(u.listQ)}" data-model="listQ" aria-label="사건 검색"></label>
          <label class="field ovx-sel" title="긴급도 필터"><span class="dim">긴급도</span>
            <select data-model="listPrio" aria-label="긴급도 필터">
              ${['전체', '긴급', '주의', '일반'].map(v => `<option ${u.listPrio === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select></label>
          <label class="field ovx-sel" title="상태 필터"><span class="dim">상태</span>
            <select data-model="listStatus" aria-label="상태 필터">
              ${statuses.map(v => `<option ${u.listStatus === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select></label>
        </div>
        <p class="ovx-hint detail">행을 누르면 위 브리핑과 모든 앱이 해당 사건으로 바뀝니다</p>
      </header>
      ${rows.length ? `<ol class="ovx-list">
        ${rows.map(i => {
          const st = S.stages[i.id];
          return `<li class="ovx-row ${S.sel === i.id ? 'is-sel' : ''}" data-act="select-inc" data-id="${i.id}" tabindex="0" role="button"
              title="${esc(i.id)} ${esc(i.type)} · ${esc(i.place)} - 선택 시 모든 앱 동기화">
            <span class="ovx-id">${esc(i.id)}</span>
            <span class="ovx-main">
              <span class="ovx-type">${esc(i.type)}</span>
              <span class="ovx-place">${esc(i.place)} · 발생 ${esc(i.reportedAt)}</span>
            </span>
            <span class="ovx-state">
              <span class="ovx-prio ${i.priority === '긴급' ? 'is-crit' : ''}">${esc(i.priority)}</span>
              <span class="ovx-status">${esc(i.status)}</span>
            </span>
            <span class="ovx-meta">위험도 ${riskLabel(i.risk)} ${Math.round(i.risk)} · ${esc(STAGE_NAMES[st.at])} ${st.at + 1}/8 · 투입 ${incOfficers(i.id).length}명 · ${esc(i.team)} · 마지막 갱신 ${esc(i.updatedAt)} (${agoText(i.updatedAt)})</span>
          </li>`;
        }).join('')}
      </ol>` : '<div class="empty-note">조건에 맞는 사건이 없습니다. 필터를 확인하십시오.</div>'}
    </section>

    <div class="sect"><div class="sect-h">${icon('ic-radio', 'ic-sm')} 통신 상태</div><div class="sect-b">
      ${comm.length ? comm.map(o => `<div class="card-row" style="margin-bottom:4px">
        <span class="person-c">${esc(o.call)}</span>${arBadge(o.ar)}<span class="dim">마지막 통신 ${esc(o.comm)}</span>
        <span class="dim">(${agoText(o.comm)})</span></div>`).join('')
        : '<div class="dim">현재 통신 이상 없음. 전 인원 정상 연결.</div>'}
    </div></div>`;
  }
});

/* ---------- 3. 작전 지도 ---------- */
/* ===================== 작전 지도 (MapLibre GL) =====================
   지도 인스턴스는 한 번만 만들어 보관한다. 앱은 창 내용을 innerHTML 로 자주 다시 그리므로
   매번 같은 지도 요소를 새 자리에 다시 끼워 넣어 회전·기울기·확대 상태를 유지한다. */
const MAP_MODES = [
  { k: 'standard',  t: '기본', ic: 'ic-map' },
  { k: 'satellite', t: '위성', ic: 'ic-globe' },   // 위성 사진 + 도로명·지명
  { k: '3d',        t: '3D',   ic: 'ic-cube' }
];
const MAP_SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const MAP_LBL = 'https://basemaps.cartocdn.com/rastertiles/dark_only_labels';
const MAPV = {
  map: null, el: null, mode: 'standard', menu: false, me: null, busy: false,
  side: true,                                                   // 사이드바 펼침 여부
  q: '', results: [], hi: -1, status: 'idle', pin: null, abort: null, timer: 0,  // 장소 검색
  layers: {}, marks: new Map(), cam: null,                                       // 지도 레이어 표식 · CCTV 팝오버
  caseOpen: true, caseSel: null, rowSel: null, navDir: null, navScroll: 0, fmarks: [], umenu: null                      // 사건 목록 펼침 · 선택한 사건 · 사건 표식
};
const mapIsDark = () => document.documentElement.dataset.theme === 'dark';

function mapStyleFor(mode) {
  if (mode === 'standard') return `https://basemaps.cartocdn.com/gl/${mapIsDark() ? 'dark-matter' : 'voyager'}-gl-style/style.json`;
  // 위성·3D: 위성 사진 위에 도로명·지명을 얹는다
  return {
    version: 8,
    sources: {
      sat: { type: 'raster', tiles: [`${MAP_SAT}/{z}/{y}/{x}`], tileSize: 256, maxzoom: 19 },
      lbl: { type: 'raster', tiles: [`${MAP_LBL}/{z}/{x}/{y}.png`], tileSize: 256 }
    },
    layers: [{ id: 'sat', type: 'raster', source: 'sat' }, { id: 'lbl', type: 'raster', source: 'lbl' }]
  };
}
/** 선택지 미리보기: 서울 중심부의 실제 타일 한 장 */
// CARTO 래스터 바탕 타일은 키 없이 쓰면 워터마크가 찍히므로, 바탕은 Esri 타일을 쓰고 지명만 CARTO 에서 겹친다
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
function mapThumb(mode) {
  const z = 12, x = 3492, y = 1586;   // 서울시청 일대 타일 한 장
  if (mode === 'standard') {
    const dark = mapIsDark();
    const base = `${ESRI}/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_Base/MapServer/tile/${z}/${y}/${x}`;
    const lbl = `https://basemaps.cartocdn.com/rastertiles/${dark ? 'dark' : 'voyager'}_only_labels/${z}/${x}/${y}.png`;
    return `url(${lbl}), url(${base})`;
  }
  return `url(${MAP_LBL}/${z}/${x}/${y}.png), url(${MAP_SAT}/${z}/${y}/${x})`;
}
const COMPASS_SVG = (() => {
  let t = '';
  for (let i = 1; i < 24; i++) {            // 0번(북쪽) 자리는 빨간 삼각형
    const a = i * 15 * Math.PI / 180, long = i % 6 === 0, r1 = long ? 15 : 16.8, r2 = 19.4;
    const p = r => `${(22 + r * Math.sin(a)).toFixed(2)} ${(22 - r * Math.cos(a)).toFixed(2)}`;
    t += `<path class="mc-tick${long ? ' is-long' : ''}" d="M${p(r1)}L${p(r2)}"/>`;
  }
  return `<svg viewBox="0 0 44 44" aria-hidden="true">${t}<path class="mc-north" d="M22 2.4 25.2 8.4h-6.4z"/></svg>`;
})();

function initMap() {
  MAPV.map = new maplibregl.Map({
    container: MAPV.el, style: mapStyleFor(MAPV.mode),
    center: [126.978, 37.5665], zoom: 12, bearing: 0, pitch: 0, maxPitch: 70,
    attributionControl: false
  });
  MAPV.map.on('rotate', syncCompass);
  MAPV.map.on('moveend', paintMapLayers);   // 확대·축소가 끝나면 묶음을 다시 계산
  // 지도 종류·테마를 바꾸면 스타일과 함께 연결선이 지워지므로 다시 그린다
  // (스타일 교체 직후에는 아직 불러오는 중일 수 있어 첫 idle 에서도 확인한다)
  const relines = () => { if (MAPV.caseSel && !MAPV.map.getSource('case')) paintCaseLines(); };
  MAPV.map.on('styledata', relines);
  MAPV.map.on('idle', relines);
  new ResizeObserver(() => MAPV.map.resize()).observe(MAPV.el);
  // 지도 종류 선택지는 바깥을 누르거나 Esc 로 닫는다
  document.addEventListener('pointerdown', e => {
    if (MAPV.menu && !e.target.closest('#win-map .mmenu, #win-map [data-act="map-menu"]')) setMapMenu(false);
  });
  document.addEventListener('keydown', e => { if (MAPV.menu && e.key === 'Escape') setMapMenu(false); });
  // 작은 메뉴는 바깥을 누르거나 Esc, 화면이 움직이면 닫는다
  document.addEventListener('pointerdown', e => { if (MAPV.umenu && !e.target.closest('.umenu')) closeUMenu(); }, true);
  document.addEventListener('keydown', e => { if (MAPV.umenu && e.key === 'Escape') { e.stopPropagation(); closeUMenu(); } });
  MAPV.map.on('movestart', closeUMenu);
}
function syncCompass() {
  const dial = document.querySelector('#win-map .mc-dial');
  if (dial && MAPV.map) dial.style.transform = `rotate(${-MAPV.map.getBearing()}deg)`;
}
function setMapMenu(open) {
  MAPV.menu = open;
  const ctl = document.querySelector('#win-map .mctl'); if (!ctl) return;
  ctl.classList.toggle('is-menu', open);
  const b = ctl.querySelector('[data-act="map-menu"]'); if (b) b.setAttribute('aria-expanded', String(open));
}
function setMapMode(k) {
  if (!MAPV.map || !MAP_MODES.some(m => m.k === k)) return;
  const was = MAPV.mode;
  MAPV.mode = k; MAPV.menu = false;
  if (was !== k) MAPV.map.setStyle(mapStyleFor(k));
  if (k === '3d') MAPV.map.easeTo({ pitch: 60, duration: 1000 });   // 기울이기만 하고 방향(나침반)은 그대로 둔다
  else if (was === '3d') MAPV.map.easeTo({ pitch: 0, duration: 700 });
  render('map');
}
function syncMapTheme() {
  if (!MAPV.map) return;
  if (MAPV.mode === 'standard') MAPV.map.setStyle(mapStyleFor('standard'));
  render('map');   // 선택지 미리보기도 테마에 맞춘다
}
function paintLocate() {
  const b = document.querySelector('#win-map [data-act="map-locate"]'); if (!b) return;
  b.classList.toggle('is-busy', MAPV.busy);
  b.classList.toggle('is-active', !!MAPV.me);
}
function locateMe() {
  if (!MAPV.map || MAPV.busy) return;
  if (!navigator.geolocation) { toast('warn', '위치 사용 불가', '이 브라우저는 위치 정보를 지원하지 않습니다.'); return; }
  MAPV.busy = true; paintLocate();
  navigator.geolocation.getCurrentPosition(pos => {
    MAPV.busy = false;
    const ll = [pos.coords.longitude, pos.coords.latitude];
    if (!MAPV.me) {
      const el = document.createElement('div');
      el.className = 'me'; el.setAttribute('aria-label', '현재 위치');
      el.innerHTML = '<span class="me-halo"></span><span class="me-dot"></span>';
      MAPV.me = new maplibregl.Marker({ element: el }).setLngLat(ll).addTo(MAPV.map);
    } else MAPV.me.setLngLat(ll);
    MAPV.map.flyTo({ center: ll, zoom: Math.max(MAPV.map.getZoom(), 15), duration: 1400 });
    paintLocate();
  }, err => {
    MAPV.busy = false; paintLocate();
    toast('warn', '내 위치를 가져오지 못했습니다',
      err.code === 1 ? '위치 권한이 거부되었습니다. 주소창 왼쪽의 사이트 설정에서 위치를 허용해 주세요.'
        : err.code === 3 ? '위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.'
          : '현재 위치를 확인할 수 없습니다.');
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
}
/* ---- 지도 레이어: 사건 위치 · 인력·차량 · CCTV ----
   앱의 가상 좌표(1000×680)를 서울 도심(한강 북쪽) 범위에 고정 비율로 대응시킨다. 시연용 배치이며 실제 위치가 아니다.
   버튼을 켠 레이어만 지도에 찍고, 다시 누르면 지운다. */
const MAP_BOX = { lon0: 126.935, lon1: 127.065, lat0: 37.603, lat1: 37.537 };
const toLngLat = (x, y) => [
  MAP_BOX.lon0 + (x / 1000) * (MAP_BOX.lon1 - MAP_BOX.lon0),
  MAP_BOX.lat0 + (y / 680) * (MAP_BOX.lat1 - MAP_BOX.lat0)
];
const MAP_TABS = [
  { k: 'incident', t: '사건 위치', ic: 'ic-incident', cluster: true,
    points: () => INCIDENTS.filter(i => i.status !== '종료').map(i => ({ id: i.id, ll: toLngLat(i.x, i.y), glyph: 'ic-exclaim', label: `${i.id} ${i.type}` })) },
  { k: 'unit', t: '인력·차량', ic: 'ic-unit', cluster: true,
    points: () => [
      ...OFFICERS.map(o => ({ id: o.id, ll: toLngLat(o.x, o.y), glyph: 'ic-officer', label: `${o.call} ${o.name}` })),
      ...VEHICLES.map(v => ({ id: v.id, ll: toLngLat(v.x, v.y), glyph: 'ic-car', label: v.label }))
    ] },
  { k: 'space', t: '공간 상태', ic: 'ic-space' },     // 버튼만 (기능은 추후 구성)
  { k: 'cctv', t: 'CCTV', ic: 'ic-cctv',
    points: () => CCTVS.map(c => ({ id: c.id, ll: toLngLat(c.x, c.y), glyph: 'ic-cctv', label: `${c.id} ${c.name}` })) },
  { k: 'send', t: '전송·지시', ic: 'ic-plane' },       // 버튼만
  { k: 'history', t: '히스토리', ic: 'ic-history' }    // 버튼만
];
/** 사이드바에 가려지는 왼쪽 폭 (px) */
const sideOffset = () => MAPV.side ? (document.querySelector('#win-map .mside')?.offsetWidth || 0) + 20 : 0;

/** 화면에서 radius(px) 안에 모인 점들을 하나로 묶는다. 확대하면 거리가 벌어져 자연히 풀린다. */
function clusterPoints(points, radius) {
  const map = MAPV.map, groups = [];
  points.forEach(p => {
    const px = map.project(p.ll);
    let best = null, bd = radius;
    groups.forEach(g => { const d = Math.hypot(g.x - px.x, g.y - px.y); if (d < bd) { bd = d; best = g; } });
    if (best) { best.items.push(p); const n = best.items.length; best.x += (px.x - best.x) / n; best.y += (px.y - best.y) / n; }
    else groups.push({ x: px.x, y: px.y, items: [p] });
  });
  return groups.map(g => ({
    items: g.items,
    key: g.items.map(i => i.id).sort().join(','),
    ll: g.items.length === 1 ? g.items[0].ll : map.unproject([g.x, g.y]).toArray()
  }));
}
function mapMarkEl(tab, g) {
  const n = g.items.length, one = g.items[0];
  const wrap = document.createElement('div');   // 위치는 지도 라이브러리가 이 요소의 transform 으로 잡는다
  wrap.style.zIndex = { incident: 3, unit: 2, cctv: 1 }[tab.k] || 1;   // 겹치면 사건이 항상 맨 위
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `mk mk-${tab.k}${n > 1 ? ' is-cluster' + (n >= 10 ? ' is-lg' : n >= 5 ? ' is-md' : '') : ''}`;
  b.innerHTML = n > 1 ? `<span>${n}</span>` : icon(one.glyph);
  const label = n > 1 ? `${tab.t} ${n}건 · 눌러서 확대` : one.label;
  b.title = label; b.setAttribute('aria-label', label);
  b.addEventListener('click', e => { e.stopPropagation(); onMarkClick(tab, g); });
  if (tab.k === 'unit' && n === 1) b.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); openUnitMenu(one.id, e.clientX, e.clientY); });
  wrap.appendChild(b);
  return wrap;
}
function onMarkClick(tab, g) {
  const map = MAPV.map; if (!map) return;
  if (g.items.length > 1) {   // 묶음: 한 번에 1~2.5단계만 확대해 맥락을 잃지 않게 한다 (알바몬 지도 방식)
    const bounds = new maplibregl.LngLatBounds(g.items[0].ll, g.items[0].ll);
    g.items.forEach(i => bounds.extend(i.ll));
    const z0 = map.getZoom();
    const fit = map.cameraForBounds(bounds, { padding: { left: sideOffset() + 70, right: 90, top: 70, bottom: 70 } });
    const zoom = fit ? Math.min(Math.max(fit.zoom, z0 + 1), z0 + 2.5) : z0 + 2;
    map.easeTo({ center: g.ll, zoom, offset: [sideOffset() / 2, 0], duration: 700 });
    return;
  }
  // 사건에 속한 표식(신고·인력·차량·CCTV)을 누르면 사이드바에 그 사건 상세를 펼치고 해당 줄을 선택한다
  const id = g.items[0].id;
  const c = caseOfItem(id), opening = !!c && c.id !== MAPV.caseSel;
  if (opening) openCase(c.id, id, tab.k !== 'cctv');   // 새로 열 때는 사건 전체가 보이게 맞춘다 (CCTV는 영상 위치로)
  else if (c) { if (!MAPV.side) setMapSide(true); selectCaseRow(id); }
  if (tab.k === 'cctv') { openCam(id); return; }
  if (opening) return;
  map.flyTo({ center: g.items[0].ll, zoom: Math.max(map.getZoom() + 1.5, 15), offset: [sideOffset() / 2, 0], duration: 900 });
}
/** 켜진 레이어의 표식을 다시 계산해, 바뀐 것만 지우고 새로 붙인다 */
function paintMapLayers() {
  const map = MAPV.map; if (!map) return;
  const want = new Map();
  const focus = caseFocusIds();   // 사건을 연 동안: 그 사건 것은 사건 표식이 대신하고, 나머지는 흐리게
  MAP_TABS.forEach(tab => {
    if (!tab.points || !MAPV.layers[tab.k]) return;
    const pts = tab.points().filter(p => !focus || !focus.has(p.id));
    const groups = tab.cluster ? clusterPoints(pts, 48) : pts.map(p => ({ items: [p], key: p.id, ll: p.ll }));
    groups.forEach(g => want.set(`${tab.k}|${g.key}`, { tab, g }));
  });
  MAPV.marks.forEach((m, k) => { if (!want.has(k)) { m.remove(); MAPV.marks.delete(k); } });
  want.forEach(({ tab, g }, k) => {
    const m = MAPV.marks.get(k);
    if (m) m.setLngLat(g.ll);
    else MAPV.marks.set(k, new maplibregl.Marker({ element: mapMarkEl(tab, g) }).setLngLat(g.ll).addTo(map));
  });
  MAPV.marks.forEach(m => m.getElement().classList.toggle('is-dim', !!focus));
}
function toggleMapLayer(k) {
  const tab = MAP_TABS.find(t => t.k === k); if (!tab || !tab.points) return;
  MAPV.layers[k] = !MAPV.layers[k];
  if (k === 'cctv' && !MAPV.layers[k]) closeCam();
  const b = document.querySelector(`#win-map .mnav-btn[data-k="${k}"]`);
  if (b) { b.classList.toggle('is-on', MAPV.layers[k]); b.setAttribute('aria-pressed', String(MAPV.layers[k])); }
  paintMapLayers();
}
/** CCTV 표식을 누르면 그 자리에 영상 팝오버를 띄운다 */
function openCam(id) {
  const c = CCTVS.find(x => x.id === id); if (!c || !MAPV.map) return;
  closeCam();
  const tone = c.traffic === '통제' ? 'badge-crit' : c.traffic === '정체' ? 'badge-warn' : 'badge-ok';
  const html = `
    <div class="mcam">
      <div class="mcam-h">
        <div class="mcam-tt"><strong>${esc(c.name)}</strong><span>${esc(c.id)} · 실시간 (가상)</span></div>
        <button class="mcam-x" type="button" data-act="map-cam-close" aria-label="닫기" title="닫기">${icon('ic-close')}</button>
      </div>
      ${screenHTML({ id: c.id, title: '', place: '가상 CCTV 영상 (실영상 아님)', at: c.at, rec: true, scene: c.scene })}
      <div class="mcam-f">
        ${badge('교통 ' + c.traffic, tone)}
        <button class="btn btn-sm" type="button" data-act="map-cam-open" data-id="${esc(c.id)}">CCTV 앱에서 크게 보기</button>
      </div>
    </div>`;
  // 그 CCTV 위치로 이동한다. 영상 창은 항상 표식 위에 붙인다 (anchor 고정: 이동 중 화면 가장자리에서 위아래로 뒤집히며 깜빡이지 않게)
  MAPV.map.easeTo({ center: toLngLat(c.x, c.y), zoom: Math.max(MAPV.map.getZoom(), 15),
    offset: [sideOffset() / 2, 130], duration: 800 });
  const popup = new maplibregl.Popup({ className: 'mpop is-wait', anchor: 'bottom', closeButton: false, closeOnClick: true, maxWidth: 'none', offset: 24 })
    .setLngLat(toLngLat(c.x, c.y)).setHTML(html).addTo(MAPV.map);
  popup.on('close', () => { if (MAPV.cam === popup) MAPV.cam = null; });
  MAPV.cam = popup;
  // 지도가 다 움직인 뒤에 나타나게 한다 (이동 중에 창이 따라 미끄러지는 모습을 감춘다)
  let shown = false;
  const show = () => { if (shown) return; shown = true; popup.removeClassName('is-wait'); };
  MAPV.map.once('moveend', show);
  setTimeout(show, 1000);
}
function closeCam() {
  if (!MAPV.cam) return;
  const p = MAPV.cam; MAPV.cam = null; p.remove();
}

/* ---- 사건: 여러 신고 건을 하나로 묶은 단위 ----
   사이드바 [사건] 목록에서 사건을 고르면, 사이드바는 사건 상세로 넘어가고
   지도는 그 사건의 신고·배정 인력·차량·CCTV만 또렷하게 찍고 배정 관계를 선으로 잇는다.
   묶음 구성은 시연용 가상 데이터다. */
const CASES = [
  { id: 'K-01', title: '하늘동 주택 침입', reports: ['A-102'] },
  { id: 'K-02', title: '새빛로 상가 흉기 위협', reports: ['A-104'] },
  { id: 'K-03', title: '도난 차량 도주·추돌', reports: ['A-111', 'A-107'],
    note: '도난 차량이 교차로 추돌에 연루된 것으로 보여 묶음 (가상)' },
  { id: 'K-04', title: '한들공원 아동 실종', reports: ['A-109'] },
  { id: 'K-05', title: '미르동 소음 신고', reports: ['A-113'] }
];
const PRI_TONE = { 긴급: 'crit', 주의: 'warn', 일반: 'idle' };
const MOVE_KMH = 30;   // 이동 중 도착 예상 시간 계산용 평균 속도 (가상)

const caseOfReport = rid => CASES.find(c => c.reports.includes(rid));
/** 신고·경찰관·차량·CCTV id → 속한 사건 */
function caseOfItem(id) {
  if (INCIDENTS.some(i => i.id === id)) return caseOfReport(id);
  const u = [...OFFICERS, ...VEHICLES, ...CCTVS].find(x => x.id === id);
  return u ? caseOfReport(u.inc) : null;
}
function caseData(id) {
  const c = CASES.find(x => x.id === id); if (!c) return null;
  const reports = c.reports.map(r => INCIDENTS.find(i => i.id === r)).filter(Boolean);
  const mine = u => c.reports.includes(u.inc);
  const pri = reports.map(r => r.priority).sort((a, b) => Object.keys(PRI_TONE).indexOf(a) - Object.keys(PRI_TONE).indexOf(b))[0] || '일반';
  return { c, reports, pri, officers: OFFICERS.filter(mine), vehicles: VEHICLES.filter(mine), cams: CCTVS.filter(mine) };
}
function caseFocusIds() {
  const d = MAPV.caseSel && caseData(MAPV.caseSel); if (!d) return null;
  return new Set([...d.reports, ...d.officers, ...d.vehicles, ...d.cams].map(x => x.id));
}
function kmBetween(a, b) {
  const r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
/** 인력·차량 → 배정된 신고 위치. 이동 중이면 도착 예상 시간을 붙인다 (차량은 탑승 경찰관 상태를 따른다) */
function caseLinks(d) {
  const link = (u, state) => {
    const r = d.reports.find(x => x.id === u.inc);
    const from = toLngLat(u.x, u.y), to = toLngLat(r.x, r.y), km = kmBetween(from, to), moving = state === '이동 중';
    return { id: u.id, from, to, km, moving, eta: moving ? Math.max(1, Math.round(km / MOVE_KMH * 60)) : 0 };
  };
  return [
    ...d.officers.map(o => link(o, o.state)),
    ...d.vehicles.map(v => link(v, (OFFICERS.find(o => o.call === v.crew) || {}).state))
  ];
}
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/** 배정 관계선: 인력·차량 → 신고 위치는 파란 실선, 묶인 신고끼리는 빨간 실선 */
function paintCaseLines() {
  const map = MAPV.map; if (!map || !map.isStyleLoaded()) return;
  ['case-link', 'case-here', 'case-halo'].forEach(l => map.getLayer(l) && map.removeLayer(l));
  if (map.getSource('case')) map.removeSource('case');
  const d = MAPV.caseSel && caseData(MAPV.caseSel); if (!d) return;
  const line = (t, a, b) => ({ type: 'Feature', properties: { t }, geometry: { type: 'LineString', coordinates: [a, b] } });
  const features = [
    ...caseLinks(d).map(l => line('here', l.from, l.to)),
    ...d.reports.slice(1).map((r, i) => line('link', toLngLat(d.reports[i].x, d.reports[i].y), toLngLat(r.x, r.y)))
  ];
  map.addSource('case', { type: 'geojson', data: { type: 'FeatureCollection', features } });
  const round = { 'line-cap': 'round', 'line-join': 'round' };
  const unit = cssVar('--mk-unit') || '#007aff', inc = cssVar('--mk-incident') || '#ff3b30';
  const halo = MAPV.mode === 'standard' && !mapIsDark() ? 'rgba(255,255,255,.95)' : 'rgba(0,0,0,.5)';
  map.addLayer({ id: 'case-halo', type: 'line', source: 'case', layout: round, paint: { 'line-color': halo, 'line-width': 7 } });
  map.addLayer({ id: 'case-here', type: 'line', source: 'case', filter: ['==', ['get', 't'], 'here'], layout: round,
    paint: { 'line-color': unit, 'line-width': 3 } });
  map.addLayer({ id: 'case-link', type: 'line', source: 'case', filter: ['==', ['get', 't'], 'link'], layout: round,
    paint: { 'line-color': inc, 'line-width': 3 } });
}
/** 사건 표식 (묶지 않고 하나씩) + 연관 신고 표시 */
function paintCaseMarks() {
  MAPV.fmarks.forEach(m => m.remove()); MAPV.fmarks = [];
  const map = MAPV.map, ids = caseFocusIds(); if (!map || !ids) return;
  const d = caseData(MAPV.caseSel);
  MAP_TABS.forEach(tab => {
    if (!tab.points) return;
    tab.points().filter(p => ids.has(p.id)).forEach(p => {
      const el = mapMarkEl(tab, { items: [p], key: p.id, ll: p.ll });
      el.classList.add('is-focus'); el.dataset.fid = p.id;
      el.style.zIndex = +el.style.zIndex + 3;
      MAPV.fmarks.push(new maplibregl.Marker({ element: el }).setLngLat(p.ll).addTo(map));
    });
  });
  const chip = (ll, html, cls = '') => {
    const el = document.createElement('div');
    el.className = `mchip ${cls}`; el.innerHTML = html; el.style.zIndex = 3;
    MAPV.fmarks.push(new maplibregl.Marker({ element: el }).setLngLat(ll).addTo(map));
  };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  d.reports.slice(1).forEach((r, i) => chip(mid(toLngLat(d.reports[i].x, d.reports[i].y), toLngLat(r.x, r.y)), `${icon('ic-link')}연관 신고`, 'is-link'));
}
function hotMark(id) {
  const t = id || MAPV.rowSel;   // 가리키는 줄이 없으면 선택한 줄의 표식을 강조해 둔다
  MAPV.fmarks.forEach(m => { const el = m.getElement(); if (el.dataset.fid) el.classList.toggle('is-hot', el.dataset.fid === t); });
}
/** 사건 상세에서 한 줄을 선택 상태로 두고, 보이도록 스크롤하고, 지도 표식을 강조 */
function selectCaseRow(id) {
  MAPV.rowSel = id || null;
  document.querySelectorAll('#win-map .mcd-row').forEach(r => r.classList.toggle('is-sel', r.dataset.id === MAPV.rowSel));
  const row = MAPV.rowSel && document.querySelector(`#win-map .mcd-row[data-id="${MAPV.rowSel}"]`);
  if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  hotMark(null);
}
function fitCase() {
  const map = MAPV.map, d = MAPV.caseSel && caseData(MAPV.caseSel); if (!map || !d) return;
  const pts = [...d.reports, ...d.officers, ...d.vehicles, ...d.cams].map(u => toLngLat(u.x, u.y));
  const b = new maplibregl.LngLatBounds(pts[0], pts[0]); pts.forEach(p => b.extend(p));
  map.fitBounds(b, { padding: { left: sideOffset() + 60, right: 90, top: 70, bottom: 70 }, maxZoom: 16, duration: 900 });
}
/** 사건 상세 열기. rowId 를 주면 그 줄을 선택해 둔다 (지도 표식을 눌러 열 때) */
function openCase(id, rowId = null, fit = true) {
  if (!caseData(id)) return;
  closeCam();
  MAPV.caseSel = id; MAPV.navDir = 'in'; MAPV.side = true; MAPV.rowSel = null; MAPV.navScroll = 0;
  // 검색 결과가 사이드바를 덮고 있으면 걷어 낸다
  if (MAPV.results.length || MAPV.status !== 'idle') { MAPV.results = []; MAPV.status = 'idle'; MAPV.hi = -1; }
  render('map');
  paintCaseLines(); paintCaseMarks(); paintMapLayers();
  if (fit) fitCase();
  if (rowId) selectCaseRow(rowId);
}
function closeCase() {
  MAPV.caseSel = null; MAPV.navDir = 'out'; MAPV.rowSel = null; MAPV.navScroll = 0;
  render('map');
  paintCaseLines(); paintCaseMarks(); paintMapLayers();
}
/** 사건 상세에서 줄을 누르면: CCTV는 영상, 나머지는 그 위치로 이동 */
function goCaseItem(kind, id) {
  const map = MAPV.map; if (!map) return;
  selectCaseRow(id);
  if (kind === 'cctv') { openCam(id); return; }
  const u = [...INCIDENTS, ...OFFICERS, ...VEHICLES].find(x => x.id === id); if (!u) return;
  map.flyTo({ center: toLngLat(u.x, u.y), zoom: Math.max(map.getZoom(), 16), offset: [sideOffset() / 2, 0], duration: 900 });
}

/* ---- 배정 인력·차량 직접 붙이고 떼기 ----
   추가: 목록 아래 [+ 인력 추가] 버튼 → 대기 중인 대상 메뉴
   삭제: 목록 줄이나 지도 표식을 오른쪽 클릭 → 삭제 메뉴 (맥 컨텍스트 메뉴 방식) */
const UNIT_KINDS = {
  officer: { t: '인력', glyph: 'ic-officer', list: () => OFFICERS, name: o => `${o.call} ${o.name}`, sub: o => o.team },
  vehicle: { t: '차량', glyph: 'ic-car', list: () => VEHICLES, name: v => v.label, sub: v => `탑승 ${v.crew}` }
};
const unitKindOf = id => String(id).startsWith('V-') ? 'vehicle' : 'officer';
const findUnit = id => UNIT_KINDS[unitKindOf(id)].list().find(u => u.id === id);
/** 사건 상세·지도·다른 창을 한꺼번에 다시 그린다 */
function refreshCase() {
  renderAll();
  paintCaseLines(); paintCaseMarks(); paintMapLayers();
}
function assignUnit(id, caseId) {
  const u = findUnit(id), c = CASES.find(x => x.id === caseId); if (!u || !c) return;
  const K = UNIT_KINDS[unitKindOf(id)];
  u.inc = c.reports[0];
  MAPV.rowSel = id;
  refreshCase();
  selectCaseRow(id);
  toast('info', `${K.t} 배정`, `${K.name(u)} 을(를) ${c.title} 사건에 배정했습니다. (가상 배정)`);
}
function unassignUnit(id) {
  const u = findUnit(id); if (!u || !u.inc) return;
  const K = UNIT_KINDS[unitKindOf(id)];
  u.inc = null;
  if (MAPV.rowSel === id) MAPV.rowSel = null;
  refreshCase();
  toast('warn', `${K.t} 배정 해제`, `${K.name(u)} 을(를) 사건에서 제외했습니다. 대기 상태로 돌아갑니다. (가상 배정)`);
}

/* ---- 작은 메뉴 (맥 메뉴 방식: 유리 배경, 바깥을 누르거나 Esc 로 닫힘) ---- */
function closeUMenu() {
  if (!MAPV.umenu) return;
  MAPV.umenu.remove(); MAPV.umenu = null;
}
function openUMenu(items, x, y) {
  closeUMenu();
  const el = document.createElement('div');
  el.className = 'umenu'; el.setAttribute('role', 'menu');
  el.innerHTML = items.length ? items.map((it, i) => it.sep
    ? '<div class="umenu-sep" role="separator"></div>'
    : `<button class="umenu-it${it.danger ? ' is-danger' : ''}" type="button" role="menuitem" data-i="${i}">
         ${it.glyph ? icon(it.glyph) : '<i class="umenu-gap"></i>'}<span class="umenu-t">${esc(it.label)}</span>
         ${it.sub ? `<span class="umenu-s">${esc(it.sub)}</span>` : ''}</button>`).join('')
    : '<div class="umenu-empty">대기 중인 대상이 없습니다</div>';
  document.body.appendChild(el);
  const r = el.getBoundingClientRect();
  el.style.left = `${Math.max(8, Math.min(x, innerWidth - r.width - 8))}px`;
  el.style.top = `${Math.max(8, Math.min(y, innerHeight - r.height - 8))}px`;
  el.addEventListener('click', e => {
    const b = e.target.closest('.umenu-it'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const it = items[+b.dataset.i]; closeUMenu(); it.act && it.act();
  });
  MAPV.umenu = el;
  requestAnimationFrame(() => el.classList.add('is-in'));
}
/** [+ 인력/차량 추가] : 대기 중인 대상을 골라 이 사건에 배정 */
function openAddMenu(kind, ev) {
  const d = MAPV.caseSel && caseData(MAPV.caseSel); if (!d) return;
  const K = UNIT_KINDS[kind]; if (!K) return;
  const btn = ev && ev.target.closest('[data-act="case-add"]');
  const r = btn ? btn.getBoundingClientRect() : { left: 0, bottom: 0 };
  openUMenu(K.list().filter(u => !u.inc).map(u => ({
    label: K.name(u), sub: K.sub(u), glyph: K.glyph, act: () => assignUnit(u.id, d.c.id)
  })), r.left, r.bottom + 4);
}
/** 인력·차량 오른쪽 클릭 메뉴 */
function openUnitMenu(id, x, y) {
  const u = findUnit(id); if (!u) return;
  const K = UNIT_KINDS[unitKindOf(id)];
  const items = [{ label: '지도에서 보기', glyph: 'ic-map', act: () => goCaseItem('unit', id) }];
  if (u.inc) items.push({ sep: true }, { label: `사건에서 삭제 (${K.t})`, glyph: 'ic-dash', danger: true, act: () => unassignUnit(id) });
  else if (MAPV.caseSel) items.push({ sep: true }, { label: '이 사건에 배정', glyph: 'ic-plus', act: () => assignUnit(id, MAPV.caseSel) });
  openUMenu(items, x, y);
}

/* 사이드바 HTML: 사건 드롭다운 목록 / 사건 상세 */
function caseListHTML() {
  const items = CASES.map(c => {
    const d = caseData(c.id);
    return `
      <button class="mrow${MAPV.caseSel === c.id ? ' is-sel' : ''}" type="button" data-act="map-case" data-id="${c.id}" title="${esc(c.title)} · ${esc(d.pri)} · 자세히 보기">
        <i class="mrow-dot pri-${PRI_TONE[d.pri]}" aria-hidden="true"></i>
        <span class="mrow-tx">
          <span class="mrow-t">${esc(c.title)}<span class="sr"> · ${esc(d.pri)}</span></span>
          ${d.reports.length > 1 ? `<span class="mrow-s">신고 ${d.reports.length}건 묶음</span>` : ''}
        </span>
        ${icon('ic-chev-r', 'mrow-go')}
      </button>`;
  }).join('');
  return `
    <div class="mcase">
      <div class="mcase-list"><div class="mcase-in">
        <div class="mlist">${items}</div>
      </div></div>
    </div>`;
}
/** [사건 위치] 버튼: 줄을 누르면 지도에 사건 위치를 켜고 끄고, 오른쪽 화살표를 누르면 사건 목록을 펼치고 접는다 */
function caseHeadHTML(tab, n) {
  return `
    <div class="mcase-head">
      <button class="mnav-btn mnav-incident${MAPV.layers.incident ? ' is-on' : ''}" type="button" data-act="map-layer" data-k="incident"
        aria-pressed="${!!MAPV.layers.incident}" title="사건 위치 지도에 표시/숨기기">${icon(tab.ic)}<span class="mnav-t">${esc(tab.t)}</span><span class="mnav-n">${n}</span></button>
      <button class="mcase-fold" type="button" data-act="map-case-fold" aria-expanded="${MAPV.caseOpen}" title="사건 목록 펼치기/접기" aria-label="사건 목록">${icon('ic-chev-r')}</button>
    </div>`;
}
function caseDetailHTML(d) {
  const row = (kind, fid, glyph, title, sub, end = '') => `
    <button class="mcd-row mcd-${kind}${MAPV.rowSel === fid ? ' is-sel' : ''}" type="button" data-act="map-case-go" data-kind="${kind}" data-id="${fid}" data-fid="${fid}">
      <span class="mcd-ic">${icon(glyph)}</span>
      <span class="mcd-tx"><span class="mcd-t">${esc(title)}</span><span class="mcd-s">${esc(sub)}</span></span>${end}
    </button>`;
  const links = new Map(caseLinks(d).map(l => [l.id, l]));
  const eta = id => { const l = links.get(id); return l.moving ? `<span class="mcd-eta is-move">${l.eta}분</span>` : '<span class="mcd-eta">현장</span>'; };
  const sec = (title, n, body, add = '') => (n || add) ? `<div class="mcd-sec"><div class="mcd-h"><span>${title}</span><span>${n}</span></div>${body}${add}</div>` : '';
  const addBtn = (kind, label) => `<button class="mcd-add" type="button" data-act="case-add" data-kind="${kind}" title="대기 중인 ${esc(label)} 을(를) 이 사건에 배정">${icon('ic-plus')}<span>${esc(label)} 추가</span></button>`;
  return `
    <div class="mcd">
      <button class="mcd-back" type="button" data-act="map-case-back">${icon('ic-chev-l')}<span>사건 목록</span></button>
      <div class="mcd-head">
        <span class="mcd-pri pri-${PRI_TONE[d.pri]}">${esc(d.pri)}</span>
        <strong class="mcd-title">${esc(d.c.title)}</strong>
        <span class="mcd-place">${esc(d.reports[0].place)}</span>
        ${d.c.note ? `<span class="mcd-note">${icon('ic-link')}<span>${esc(d.c.note)}</span></span>` : ''}
      </div>
      ${sec(d.reports.length > 1 ? '묶인 신고' : '신고', d.reports.length, d.reports.map(r =>
        row('incident', r.id, 'ic-exclaim', r.type, `${r.id} · ${r.reportedAt} 접수 · ${r.status}`)).join(''))}
      ${sec('배정 인력', d.officers.length, d.officers.map(o =>
        row('unit', o.id, 'ic-officer', `${o.call} ${o.name}`, o.task, eta(o.id))).join(''), addBtn('officer', '인력'))}
      ${sec('차량', d.vehicles.length, d.vehicles.map(v =>
        row('unit', v.id, 'ic-car', v.label, `탑승 ${v.crew}`, eta(v.id))).join(''), addBtn('vehicle', '차량'))}
      ${sec('CCTV', d.cams.length, d.cams.map(c =>
        row('cctv', c.id, 'ic-cctv', c.name, `${c.id} · 교통 ${c.traffic}`)).join(''))}
    </div>`;
}

/* ---- 사이드바 ---- */
function setMapSide(open) {
  MAPV.side = open;
  const x = document.querySelector('#win-map .mapx'); if (!x) return;
  x.classList.toggle('is-side-closed', !open);
  const b = x.querySelector('[data-act="map-side"]');
  if (b) { b.setAttribute('aria-expanded', String(open)); b.title = open ? '사이드바 가리기' : '사이드바 보기'; }
  const input = x.querySelector('.msearch input');
  if (!open && input && document.activeElement === input) input.blur();
}

/* ---- 장소 검색: Photon (OpenStreetMap 데이터, 키 불필요, 입력 중 자동 검색 허용) ---- */
function placeSub(p) {
  const road = p.street ? p.street + (p.housenumber ? ' ' + p.housenumber : '') : '';
  return [p.city || p.state, p.district || p.locality, road]
    .filter((v, i, a) => v && a.indexOf(v) === i).join(' ');
}
function paintResults() {
  const box = document.querySelector('#win-map .mresults'); if (!box) return;
  const clear = document.querySelector('#win-map .msearch-clear'); if (clear) clear.hidden = !MAPV.q;
  // 검색하는 동안에는 결과가 사이드바 내용을 대신한다 (애플 지도 방식)
  const side = document.querySelector('#win-map .mside');
  if (side) side.classList.toggle('is-searching', !!MAPV.q.trim() && (MAPV.results.length > 0 || MAPV.status !== 'idle'));
  const input = document.querySelector('#win-map .msearch input');
  if (input) input.setAttribute('aria-expanded', String(MAPV.results.length > 0));
  if (!MAPV.q.trim()) { box.innerHTML = ''; return; }
  if (MAPV.status === 'error') { box.innerHTML = '<div class="mres-note">검색 서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.</div>'; return; }
  if (!MAPV.results.length) {
    box.innerHTML = `<div class="mres-note">${MAPV.status === 'loading' ? '검색 중…' : MAPV.status === 'done' ? '검색 결과가 없습니다.' : ''}</div>`;
    return;
  }
  box.innerHTML = MAPV.results.map((r, i) => `
    <button class="mres${i === MAPV.hi ? ' is-hi' : ''}" type="button" role="option" aria-selected="${i === MAPV.hi}" data-act="map-place" data-i="${i}">
      <span class="mres-t">${esc(r.name)}</span>${r.sub ? `<span class="mres-s">${esc(r.sub)}</span>` : ''}
    </button>`).join('');
}
function searchPlaces(q) {
  MAPV.q = q; MAPV.hi = -1;
  clearTimeout(MAPV.timer);
  if (MAPV.abort) MAPV.abort.abort();
  if (!q.trim()) { MAPV.results = []; MAPV.status = 'idle'; paintResults(); return; }
  MAPV.status = 'loading'; paintResults();
  MAPV.timer = setTimeout(async () => {
    const ctrl = MAPV.abort = new AbortController();
    const c = MAPV.map ? MAPV.map.getCenter() : { lat: 37.5665, lng: 126.978 };   // 지금 보고 있는 곳 근처를 우선
    // lang=default: 브라우저 언어와 상관없이 현지 표기(한글) 이름을 받는다
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q.trim())}&limit=8&lang=default&lat=${c.lat.toFixed(4)}&lon=${c.lng.toFixed(4)}`;
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const seen = new Set();
      MAPV.results = data.features.map(f => {
        const p = f.properties;
        return { name: p.name || p.street || p.city || '이름 없는 장소', sub: placeSub(p), ll: f.geometry.coordinates, ext: p.extent };
      }).filter(r => { const k = r.name + '|' + r.sub; if (seen.has(k)) return false; seen.add(k); return true; });
      MAPV.status = 'done';
    } catch (err) {
      if (err.name === 'AbortError') return;
      MAPV.results = []; MAPV.status = 'error';
    }
    paintResults();
  }, 300);
}
function pickPlace(i) {
  const r = MAPV.results[i]; if (!r || !MAPV.map) return;
  MAPV.q = r.name; MAPV.results = []; MAPV.status = 'idle'; MAPV.hi = -1;
  const input = document.querySelector('#win-map .msearch input');
  if (input) { input.value = r.name; input.blur(); }
  paintResults();
  if (!MAPV.pin) {
    const el = document.createElement('div');
    el.className = 'pin'; el.setAttribute('aria-label', '검색한 장소');
    el.innerHTML = '<svg viewBox="0 0 28 36" aria-hidden="true"><path d="M14 35s11-11.3 11-20.5A11 11 0 0 0 3 14.5C3 23.7 14 35 14 35z"/><circle cx="14" cy="14.5" r="4.2"/></svg>';
    MAPV.pin = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(r.ll).addTo(MAPV.map);
  } else MAPV.pin.setLngLat(r.ll);
  // 사이드바에 가리지 않도록, 보이는 영역의 가운데로 이동한다
  const side = sideOffset();
  if (r.ext) MAPV.map.fitBounds([[r.ext[0], r.ext[3]], [r.ext[2], r.ext[1]]], { padding: { left: side + 40, right: 80, top: 40, bottom: 40 }, maxZoom: 17, duration: 1200 });
  else MAPV.map.flyTo({ center: r.ll, zoom: Math.max(MAPV.map.getZoom(), 16), offset: [side / 2, 0], duration: 1200 });
}
function clearSearch() {
  if (MAPV.abort) MAPV.abort.abort();
  clearTimeout(MAPV.timer);
  MAPV.q = ''; MAPV.results = []; MAPV.status = 'idle'; MAPV.hi = -1;
  if (MAPV.pin) { MAPV.pin.remove(); MAPV.pin = null; }
  const input = document.querySelector('#win-map .msearch input');
  if (input) { input.value = ''; input.focus(); }
  paintResults();
}
function bindSearch(body) {
  const input = $('.msearch input', body); if (!input) return;
  input.addEventListener('input', () => searchPlaces(input.value));
  input.addEventListener('keydown', e => {
    const n = MAPV.results.length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); MAPV.hi = (MAPV.hi + 1) % n; paintResults(); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); MAPV.hi = (MAPV.hi - 1 + n) % n; paintResults(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (n) pickPlace(MAPV.hi >= 0 ? MAPV.hi : 0); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (MAPV.q) clearSearch(); else input.blur(); }
  });
}

/** 나침반: 누르면 북쪽 정렬, 끌면 지도 회전 */
function bindCompass(el) {
  if (!el) return;
  let drag = null;
  const angle = e => {
    const r = el.getBoundingClientRect();
    return Math.atan2(e.clientX - (r.left + r.width / 2), (r.top + r.height / 2) - e.clientY) * 180 / Math.PI;
  };
  const north = () => MAPV.map && MAPV.map.easeTo({ bearing: 0, pitch: MAPV.mode === '3d' ? MAPV.map.getPitch() : 0, duration: 600 });
  el.addEventListener('pointerdown', e => {
    if (!MAPV.map) return;
    drag = { a: angle(e), b: MAPV.map.getBearing(), x: e.clientX, y: e.clientY, moved: false };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;
    drag.moved = true; el.classList.add('is-dragging');
    MAPV.map.setBearing(drag.b - (angle(e) - drag.a));
  });
  el.addEventListener('pointerup', () => {
    if (!drag) return;
    const click = !drag.moved; drag = null; el.classList.remove('is-dragging');
    if (click) north();
  });
  el.addEventListener('pointercancel', () => { drag = null; el.classList.remove('is-dragging'); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); north(); } });
}

defApp({
  id: 'map', name: '작전 지도', short: '지도', icon: 'ic-map', defW: .5, defH: .72,
  desc: '실제 지도 화면 · 지도 종류, 내 위치, 확대·축소, 나침반',
  ctx: () => '서울',
  render() {
    const cur = MAP_MODES.find(m => m.k === MAPV.mode);
    const onImage = MAPV.mode !== 'standard';
    const caseSel = MAPV.caseSel && caseData(MAPV.caseSel);
    const counts = { incident: INCIDENTS.filter(i => i.status !== '종료').length, unit: OFFICERS.length + VEHICLES.length, cctv: CCTVS.length };
    const tabs = MAP_TABS.filter(t => t.k !== 'incident').map(t => t.points
      ? `<button class="mnav-btn mnav-${t.k}${MAPV.layers[t.k] ? ' is-on' : ''}" type="button" data-act="map-layer" data-k="${t.k}"
          aria-pressed="${!!MAPV.layers[t.k]}" title="${esc(t.t)} 지도에 표시/숨기기">${icon(t.ic)}<span class="mnav-t">${esc(t.t)}</span><span class="mnav-n">${counts[t.k]}</span></button>`
      : `<button class="mnav-btn" type="button" data-k="${t.k}">${icon(t.ic)}<span class="mnav-t">${esc(t.t)}</span></button>`).join('');
    const opts = MAP_MODES.map((m, i) => `
        <button class="mm-opt${m.k === MAPV.mode ? ' is-on' : ''}" type="button" role="menuitemradio"
          aria-checked="${m.k === MAPV.mode}" data-act="map-mode" data-mode="${m.k}" style="--i:${MAP_MODES.length - 1 - i}">
          <span class="mm-thumb${m.k === '3d' ? ' is-3d' : ''}"><i style="background-image:${mapThumb(m.k)}"></i></span>
          <span class="mm-t">${esc(m.t)}</span>
        </button>`).join('');
    return `
    <div class="mapx${MAPV.side ? '' : ' is-side-closed'}">
      <div class="map-stage" id="mapStage"></div>
      <aside class="mside${MAPV.caseOpen || caseSel ? ' is-case-open' : ''}${caseSel ? ' is-case-detail' : ''}" aria-label="지도 사이드바">
        <div class="mside-head" data-drag data-win="map"></div>
        <div class="msearch" role="search">
          ${icon('ic-search')}
          <input type="search" placeholder="장소, 주소 검색" value="${esc(MAPV.q)}" aria-label="장소 검색"
            autocomplete="off" spellcheck="false" role="combobox" aria-controls="mresults" aria-expanded="false">
          <button class="msearch-clear" type="button" data-act="map-search-clear" aria-label="검색어 지우기"${MAPV.q ? '' : ' hidden'}>${icon('ic-close')}</button>
        </div>
        <div class="mresults" id="mresults" role="listbox" aria-label="검색 결과"></div>
        <!-- 지도 버튼 6개가 한 스크롤 영역 안에 있다. [사건 위치] 바로 아래에 사건 목록(또는 사건 상세)이 펼쳐진다 -->
        <nav class="mnav" aria-label="지도 표시">
          <div class="mnav-h">지도</div>
          ${caseHeadHTML(MAP_TABS.find(t => t.k === 'incident'), counts.incident)}
          <div class="mcase-body${MAPV.navDir ? ' is-' + MAPV.navDir : ''}">${caseSel ? caseDetailHTML(caseSel) : caseListHTML()}</div>
          ${tabs}
        </nav>
      </aside>
      <button class="mside-toggle" type="button" data-act="map-side" aria-expanded="${MAPV.side}"
        title="${MAPV.side ? '사이드바 가리기' : '사이드바 보기'}" aria-label="사이드바">${icon('ic-sidebar')}</button>
      <div class="mctl${MAPV.menu ? ' is-menu' : ''}">
        <div class="mctl-group">
          <button class="mctl-btn" type="button" data-act="map-menu" aria-haspopup="menu" aria-expanded="${MAPV.menu}"
            title="지도 종류" aria-label="지도 종류 (현재: ${esc(cur.t)})">${icon(cur.ic)}</button>
          <span class="mctl-sep" aria-hidden="true"></span>
          <button class="mctl-btn${MAPV.me ? ' is-active' : ''}${MAPV.busy ? ' is-busy' : ''}" type="button" data-act="map-locate"
            title="내 위치" aria-label="내 위치로 이동">${icon('ic-locate')}</button>
        </div>
        <div class="mctl-group">
          <button class="mctl-btn" type="button" data-act="map-zoom-in" title="확대" aria-label="확대">${icon('ic-plus')}</button>
          <span class="mctl-sep" aria-hidden="true"></span>
          <button class="mctl-btn" type="button" data-act="map-zoom-out" title="축소" aria-label="축소">${icon('ic-minus')}</button>
        </div>
        <button class="mctl-compass" type="button" data-mctl="compass" title="누르기: 북쪽 맞추기 · 끌기: 지도 회전" aria-label="나침반">
          <span class="mc-dial">${COMPASS_SVG}</span><span class="mc-n" aria-hidden="true">북</span>
        </button>
        <div class="mmenu" role="menu" aria-label="지도 종류">${opts}</div>
      </div>
      <div class="map-attr${onImage ? ' on-image' : ''}">${onImage
        ? '© Esri, Maxar, Earthstar Geographics · © OpenStreetMap · © CARTO'
        : '© OpenStreetMap · © CARTO'}</div>
    </div>`;
  },
  after(body) {
    const stage = $('#mapStage', body); if (!stage || !window.maplibregl) return;
    if (!MAPV.el) { MAPV.el = document.createElement('div'); MAPV.el.className = 'map-canvas'; }
    stage.appendChild(MAPV.el);
    if (!MAPV.map) initMap(); else MAPV.map.resize();
    syncCompass();
    bindCompass($('[data-mctl="compass"]', body));
    bindSearch(body);
    paintResults();
    paintMapLayers();
    MAPV.navDir = null;   // 넘어가는 애니메이션은 사건을 열고 닫을 때 한 번만
    // 다른 창 때문에 지도 창이 다시 그려져도 사이드바 스크롤 위치를 유지한다
    const nav = $('.mnav', body);
    if (nav) {
      nav.scrollTop = MAPV.navScroll;
      nav.addEventListener('scroll', () => { MAPV.navScroll = nav.scrollTop; }, { passive: true });
    }
    // 사건 상세의 줄에 마우스를 올리면 지도의 해당 표식을 강조
    const side = $('.mside', body);
    if (side) {
      side.addEventListener('pointerover', e => hotMark(e.target.closest('[data-fid]')?.dataset.fid || null));
      side.addEventListener('pointerleave', () => hotMark(null));
      side.addEventListener('contextmenu', e => {
        const row = e.target.closest('.mcd-row[data-kind="unit"]'); if (!row) return;
        e.preventDefault(); openUnitMenu(row.dataset.id, e.clientX, e.clientY);
      });
    }
  }
});
/* ---------- 4. 현장 인력 ---------- */
defApp({
  id: 'field', name: '현장 인력', short: '인력', icon: 'ic-officer', defW: .36, defH: .66,
  desc: '경찰관 위치·임무·AR 연결·배터리·긴급 지원 여부',
  ctx: () => `${incOfficers(S.sel).length}명 투입 (현재 사건)`,
  render() {
    const list = S.ui.fieldAll ? OFFICERS : incOfficers(S.sel);
    return `
    <div class="toolbar">
      <button class="btn btn-sm ${!S.ui.fieldAll ? 'btn-on' : ''}" type="button" data-act="field-scope" data-v="0" title="현재 선택된 사건의 인력만 표시">현재 사건</button>
      <button class="btn btn-sm ${S.ui.fieldAll ? 'btn-on' : ''}" type="button" data-act="field-scope" data-v="1" title="전체 사건의 인력 표시">전체</button>
      <span class="spacer"></span><span class="dim">${list.length}명</span>
    </div>
    <div class="people">
      ${list.map(o => `<div class="person ${o.sos ? 'is-sos' : ''}">
        <div class="person-h">
          <span class="person-c">${esc(o.call)}</span><span class="person-n">${esc(o.name)}</span>
          ${badge(o.state, o.state.includes('대응') || o.state.includes('이동') ? 'badge-info' : 'badge-idle')}
          <span class="spacer"></span>
          ${o.sos ? badge('긴급 지원 요청', 'badge-crit', 'badge-tri') : ''}
          ${arBadge(o.ar)}
        </div>
        <div class="person-g">
          <div><span class="pg-k">소속 팀</span>${esc(o.team)}</div>
          <div><span class="pg-k">배속 사건</span>${esc(o.inc)}</div>
          <div><span class="pg-k">현재 위치</span><span class="mono">X ${Math.round(o.x)} · Y ${Math.round(o.y)}</span></div>
          <div class="detail"><span class="pg-k">담당 임무</span>${esc(o.task)}</div>
          <div><span class="pg-k">마지막 통신</span><span class="mono">${esc(o.comm)}</span> <span class="dim">(${agoText(o.comm)})</span></div>
          <div><span class="pg-k">배터리</span>${battHTML(o.batt)}</div>
          <div class="detail" style="grid-column:1/-1"><span class="pg-k">부상·건강 상태 (자동 확정 아님)</span>${healthHTML(o.health)}</div>
        </div>
        <div class="card-acts">
          <button class="btn btn-sm" type="button" data-act="open-ar-of" data-id="${o.id}" ${o.ar === '미연결' ? 'disabled title="AR 글래스 미연결"' : ''}>AR 영상</button>
          <button class="btn btn-sm" type="button" data-act="msg-to-officer" data-id="${o.id}">메시지</button>
          <button class="btn btn-sm btn-warn" type="button" data-act="tx-target" data-id="${o.id}">전송 대상 지정</button>
          <button class="btn btn-sm" type="button" data-act="health-ask" data-id="${o.id}" title="상태 확인 요청 메시지를 보냅니다">상태 확인 요청</button>
        </div>
      </div>`).join('') || '<div class="empty-note">해당 사건에 투입된 인력이 없습니다.</div>'}
    </div>`;
  }
});

/* ---------- 5. CCTV·교통 ---------- */
const TRAFFIC_ORDER = ['원활', '서행', '정체', '통제'];
const ROAD_CONTROL = {
  'A-102': [{ r: '하늘동 12로 남측', s: '차량 통제', by: '순찰-7' }],
  'A-104': [{ r: '새빛로 상가 전면 보도', s: '보행 통제', by: '새빛-4' }],
  'A-107': [{ r: '중앙대로 서측 2개 차로', s: '전면 통제', by: '교통-3' }, { r: '지하차도 진입부', s: '서행 유도', by: '교통-3' }],
  'A-109': [], 'A-111': [{ r: '서강로 주차장 출구', s: '출입 확인', by: '강력-5' }], 'A-113': [], 'A-098': []
};
const ROUTES = {
  'A-102': [{ n: '새빛로 → 12로 북측 진입', s: '가능', m: '약 3분' }, { n: '중앙대로 → 12로 남측', s: '통제 중', m: '우회 필요' }],
  'A-104': [{ n: '북단 교차로 → 새빛로', s: '가능', m: '약 4분' }, { n: '후면 주차장 진입', s: '가능', m: '약 5분' }],
  'A-107': [{ n: '중앙대로 동측 우회', s: '가능', m: '약 6분' }, { n: '지하차도', s: '통제 중', m: '진입 불가' }],
  'A-109': [{ n: '한들공원 서문', s: '가능', m: '약 2분' }, { n: '한들공원 동문', s: '가능', m: '약 4분' }],
  'A-111': [{ n: '서강로 → 주차장 입구', s: '가능', m: '약 3분' }],
  'A-113': [{ n: '미르동 4길 직진', s: '가능', m: '약 2분' }], 'A-098': []
};
defApp({
  id: 'cctv', name: 'CCTV·교통', short: 'CCTV', icon: 'ic-cctv', defW: .42, defH: .68,
  desc: '주변 CCTV 화면(가상), 교통 정체·도로 통제·접근 경로',
  ctx: () => `${incCCTVs(S.sel).length}개소 연결`,
  render() {
    const inc = curInc();
    const list = S.ui.cctvAll ? CCTVS : incCCTVs(inc.id);
    const sel = CCTVS.find(c => c.id === S.ui.cctvSel) || list[0] || CCTVS[0];
    const tIdx = TRAFFIC_ORDER.indexOf(sel ? sel.traffic : '원활');
    return `
    <div class="toolbar">
      <button class="btn btn-sm ${!S.ui.cctvAll ? 'btn-on' : ''}" type="button" data-act="cctv-scope" data-v="0" title="현재 사건 주변 CCTV만">주변 CCTV</button>
      <button class="btn btn-sm ${S.ui.cctvAll ? 'btn-on' : ''}" type="button" data-act="cctv-scope" data-v="1" title="전체 CCTV">전체</button>
      <span class="spacer"></span><span class="dim">${list.length}개소</span>
    </div>
    ${sel ? `<div class="viewer">
      ${screenHTML({ id: sel.id, title: sel.name, place: '가상 CCTV 영상 (실영상 아님)', at: sel.at, rec: true, scene: sel.scene })}
      <div class="viewer-meta">
        <strong>${esc(sel.id)} ${esc(sel.name)}</strong>
        ${badge('교통 ' + sel.traffic, tIdx >= 3 ? 'badge-crit' : tIdx === 2 ? 'badge-warn' : 'badge-ok', tIdx === 2 ? 'badge-sq' : tIdx >= 3 ? 'badge-tri' : '')}
        <span class="dim mono">촬영 ${esc(sel.at)}</span>
        <span class="dim detail">위치 X ${sel.x} · Y ${sel.y}</span>
      </div>
      <div class="card-acts">
        <button class="btn btn-sm" type="button" data-act="cctv-capture" data-id="${sel.id}">${icon('ic-capture', 'ic-sm')}<span class="btn-t">중요 장면 캡처</span></button>
        <button class="btn btn-sm btn-warn" type="button" data-act="cctv-tx" data-id="${sel.id}">현장 전송 후보로 추가</button>
      </div>
    </div>` : '<div class="empty-note">표시할 CCTV가 없습니다.</div>'}

    <div class="sect"><div class="sect-h">CCTV 목록</div>
      <div class="thumbs">
        ${list.map(c => `<button class="thumb ${sel && c.id === sel.id ? 'is-sel' : ''}" type="button" data-act="cctv-sel" data-id="${c.id}"
            title="${esc(c.id)} ${esc(c.name)} 확대">
          ${screenHTML({ id: c.id, title: '', place: '', at: c.at, rec: false, scene: c.scene })}
          <div class="thumb-c"><div class="thumb-t">${esc(c.id)} ${esc(c.name)}</div>
            <div class="thumb-s"><span class="mono">${esc(c.at)}</span>${badge(c.traffic, TRAFFIC_ORDER.indexOf(c.traffic) >= 3 ? 'badge-crit' : TRAFFIC_ORDER.indexOf(c.traffic) === 2 ? 'badge-warn' : 'badge-ok')}</div></div>
        </button>`).join('')}
      </div></div>

    <div class="sect detail"><div class="sect-h">교통 정체 단계</div><div class="sect-b" style="display:grid;gap:6px">
      ${list.map(c => { const i = TRAFFIC_ORDER.indexOf(c.traffic);
        return `<div><div class="card-row"><span style="min-width:150px">${esc(c.name)}</span>
          ${badge(c.traffic, i >= 3 ? 'badge-crit' : i === 2 ? 'badge-warn' : 'badge-ok', i === 2 ? 'badge-sq' : i >= 3 ? 'badge-tri' : '')}
          <span class="dim">${i + 1}단계 / 4단계</span></div>
          <div class="bar ${i >= 3 ? 'crit' : i === 2 ? 'warn' : 'ok'}"><i style="width:${(i + 1) * 25}%"></i></div></div>`; }).join('')}
    </div></div>

    <div class="sect detail"><div class="sect-h">도로 통제 정보</div><div class="sect-b">
      ${(ROAD_CONTROL[inc.id] || []).length ? (ROAD_CONTROL[inc.id]).map(x => `<div class="card-row" style="margin-bottom:4px">
        ${badge(x.s, x.s.includes('전면') || x.s.includes('차량') ? 'badge-crit' : 'badge-warn', 'badge-sq')}
        <span>${esc(x.r)}</span><span class="dim">담당 ${esc(x.by)}</span></div>`).join('')
        : '<span class="dim">현재 통제 중인 도로 없음</span>'}
    </div></div>

    <div class="sect detail"><div class="sect-h">현장 접근 가능 경로</div><div class="sect-b">
      ${(ROUTES[inc.id] || []).map(r => `<div class="card-row" style="margin-bottom:4px">
        ${badge(r.s, r.s === '가능' ? 'badge-ok' : 'badge-crit', r.s === '가능' ? '' : 'badge-tri')}
        <span>${esc(r.n)}</span><span class="dim">${esc(r.m)}</span></div>`).join('') || '<span class="dim">등록된 경로 없음</span>'}
    </div></div>

    <div class="sect"><div class="sect-h">캡처 목록 (${S.captures.filter(c => c.inc === inc.id).length}건)</div><div class="sect-b" style="display:grid;gap:5px">
      ${S.captures.filter(c => c.inc === inc.id).slice(0, 6).map(c => `<div class="card-row">
        ${badge(c.from, 'badge-info')}<span>${esc(c.label)}</span><span class="dim mono">${esc(c.t)}</span>
        <span class="spacer"></span>${c.tx ? badge('전송 후보', 'badge-warn', 'badge-sq') : `<button class="btn btn-sm" type="button" data-act="cap-tx" data-id="${c.id}">전송 후보로</button>`}
      </div>`).join('') || '<span class="dim">캡처된 장면이 없습니다.</span>'}
    </div></div>`;
  }
});

/* ---------- 7. 메시지·긴급 알림 ---------- */
const CHANNELS = ['지휘통제실', '현장 경찰', '후속 인력'];
defApp({
  id: 'messages', name: '메시지·긴급 알림', short: '메시지', icon: 'ic-message', defW: .3, defH: .5,
  desc: '지휘통제실·현장 경찰·후속 인력 3방향 통신 및 알림 기록',
  ctx: null,   // 창 이름 옆 사건 번호·미확인 건수는 쓰지 않는다
  render() {
    const u = S.ui, inc = curInc();
    const all = S.msgs.filter(m => m.inc === inc.id || m.system);
    const unread = c => all.filter(m => !m.read && (m.from === c || m.to === c)).length;
    let list;
    if (u.chatTab === '알림') list = [];
    else if (u.chatTab === '전체') list = all;
    else list = all.filter(m => !m.system && (m.from === u.chatTab || m.to === u.chatTab || (u.chatTab === '현장 경찰' && OFFICERS.some(o => o.call === m.from))));
    const pinned = all.filter(m => m.pin && !m.system);

    const tab = (t, n) => `<button class="chat-tab ${u.chatTab === t ? 'is-on' : ''}" type="button" data-act="chat-tab" data-v="${t}"
      title="${esc(t)} 대화 보기">${esc(t)}${n ? `<span class="cnt">${n}</span>` : ''}</button>`;

    const msgHTML = m => {
      if (m.system) {
        const al = S.alerts.find(x => x.id === m.alertId);
        const pending = m.kind === '긴급' && al && !al.seen;
        return `<div class="msg is-system ${m.kind === '긴급' ? 'is-crit' : 'is-warn'} ${pending ? 'is-pending' : ''}">
          <div class="msg-h">${badge(m.kind, m.kind === '긴급' ? 'badge-crit' : 'badge-warn', m.kind === '긴급' ? 'badge-tri' : 'badge-sq')}
            <span class="who">시스템 알림</span><span>사건 ${esc(m.inc)}</span></div>
          <div class="msg-b"><strong>${esc(m.title)}</strong> · ${esc(m.text)}</div>
          <div class="msg-f"><span class="mono">${esc(m.t)}</span>
            <span class="msg-state ${m.kind === '긴급' && !pending ? 'is-read' : ''}">${m.kind !== '긴급' ? '기록됨' : pending ? '미확인' : '확인'}</span>
            <span class="spacer" style="flex:1"></span>
            ${pending ? `<button class="btn btn-sm btn-crit" type="button" data-act="alert-ack" data-alert="${al.id}">확인</button>` : ''}
            ${al && al.app ? `<button class="btn btn-sm" type="button" data-act="alert-open" data-alert="${al.id}">해당 앱 열기</button>` : ''}
          </div></div>`;
      }
      const cls = m.kind === '긴급' ? 'is-crit' : m.kind === '중요' ? 'is-warn' : '';
      return `<div class="msg ${m.mine ? 'is-mine' : ''} ${cls} ${m.pin ? 'is-pin' : ''}">
        <div class="msg-h"><span class="who">${esc(m.from)}</span><span>→ ${esc(m.to)}</span>
          ${m.kind !== '일반' ? badge(m.kind, m.kind === '긴급' ? 'badge-crit' : 'badge-warn', m.kind === '긴급' ? 'badge-tri' : 'badge-sq') : ''}
          ${m.pin ? badge('고정', 'badge-warn', 'badge-sq') : ''}</div>
        <div class="msg-b">${esc(m.text)}</div>
        ${m.att ? (m.att.type === '음성'
          ? `<div class="msg-att voice" data-voice="${m.id}"><button class="btn btn-sm" type="button" data-act="voice-play" data-id="${m.id}">${icon('ic-play', 'ic-sm')}재생</button>
             <span class="voice-wave">${[6, 11, 16, 9, 13, 7, 12, 5].map(h => `<i style="height:${h}px"></i>`).join('')}</span>
             <span class="dim">${esc(m.att.label)}</span></div>`
          : `<div class="msg-att">${icon(m.att.type === '위치' ? 'ic-pin' : 'ic-capture', 'ic-sm')}${esc(m.att.label)}
             ${m.att.type === '이미지' ? '<span class="dim">(가상 이미지 첨부 모형)</span>' : ''}</div>`) : ''}
        <div class="msg-f"><span class="mono">${esc(m.t)}</span>
          <span class="msg-state ${m.read ? 'is-read' : ''}">${m.mine ? (m.read ? '읽음' : '전송됨 · 수신 확인 대기') : (m.read ? '확인' : '미확인')}</span>
          ${m.mine && m.delivered !== false ? '<span class="dim">수신 확인</span>' : ''}
          <span class="spacer" style="flex:1"></span>
          <button class="btn btn-sm" type="button" data-act="msg-pin" data-id="${m.id}" title="중요 메시지 고정/해제">${m.pin ? '고정 해제' : '고정'}</button>
          ${!m.read ? `<button class="btn btn-sm" type="button" data-act="msg-read" data-id="${m.id}" title="읽음 처리">읽음</button>` : ''}
        </div></div>`;
    };

    const alertsHTML = `<div class="pane" style="display:grid;gap:6px">
      <div class="dim">긴급 알림을 닫아도 아래 기록에는 남습니다. 총 ${S.alerts.length}건.</div>
      ${S.alerts.length ? S.alerts.map(a => `<div class="card" style="${a.level === '긴급' ? 'border-color:#f5a7a3' : a.level === '중요' ? 'border-color:#fdf7e8' : ''}">
        <div class="card-h">${badge(a.level, a.level === '긴급' ? 'badge-crit' : a.level === '중요' ? 'badge-warn' : 'badge-info', a.level === '긴급' ? 'badge-tri' : a.level === '중요' ? 'badge-sq' : '')}
          <span class="card-t">${esc(a.title)}</span><span class="spacer"></span><span class="dim mono">${esc(a.t)}</span></div>
        <div class="card-row">${esc(a.desc)}</div>
        <div class="card-row dim">사건 ${esc(a.inc)} · ${a.seen ? '확인' : '미확인'}</div>
      </div>`).join('') : '<div class="empty-note">알림 기록이 없습니다.</div>'}
      <button class="btn btn-sm" type="button" data-act="alert-clear">알림 기록 비우기</button>
    </div>`;

    return `<div class="chat">
      <div class="chat-tabs">
        ${tab('전체', all.filter(m => !m.read).length)}${tab('현장 경찰', unread('현장 경찰'))}${tab('후속 인력', unread('후속 인력'))}
        ${tab('알림', S.alerts.filter(a => !a.seen).length)}
      </div>
      ${u.chatTab === '알림' ? alertsHTML : `
      ${pinned.length ? `<div class="pinned" aria-label="고정된 메시지">
        ${pinned.map(m => `<div class="pin-row">
          <span class="person-c">${esc(m.from)}</span>
          <span class="pin-text" title="${esc(m.text)}">${esc(m.text)}</span>
          <span class="dim mono pin-time">${esc(m.t)}</span>
          <button class="pin-btn" type="button" data-act="msg-pin" data-id="${m.id}" title="고정 해제" aria-label="${esc(m.from)} 메시지 고정 해제">${icon('ic-pushpin', 'ic-sm')}</button>
        </div>`).join('')}
      </div>` : ''}
      <div class="chat-log" id="chatLog">
        ${list.length ? list.map(msgHTML).join('') : '<div class="empty-note">이 채널의 메시지가 없습니다.</div>'}
      </div>
      <div class="cmx">
        <div class="cmx-row">
          <label class="cmx-field"><span>대상</span>
            <select data-model="chatTo" aria-label="전달 대상 선택">
              ${['현장 경찰', '후속 인력', '전체 현장 인력', ...incOfficers(inc.id).map(o => o.call)].map(v =>
                `<option ${u.chatTo === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
            </select></label>
          <label class="cmx-field"><span>종류</span>
            <select data-model="chatKind" aria-label="메시지 종류">
              ${['일반', '중요', '긴급'].map(v => `<option ${u.chatKind === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
            </select></label>
          <span class="spacer"></span>
          <span class="cmx-att">${u.chatAtt ? '첨부: ' + esc(u.chatAtt) : '첨부 없음'}</span>
          <button class="btn btn-sm ${u.chatAtt === '위치' ? 'btn-on' : ''}" type="button" data-act="chat-att" data-v="위치" title="현재 사건 위치 첨부" aria-label="위치 첨부">${icon('ic-pin', 'ic-sm')}<span class="btn-t">위치</span></button>
          <button class="btn btn-sm ${u.chatAtt === '이미지' ? 'btn-on' : ''}" type="button" data-act="chat-att" data-v="이미지" title="가상 이미지 첨부 모형" aria-label="이미지 첨부">${icon('ic-capture', 'ic-sm')}<span class="btn-t">이미지</span></button>
        </div>
        <div class="cmx-row cmx-input">
          <textarea class="textarea" rows="1" placeholder="전달할 내용을 입력하십시오. 긴급 종류로 보내면 모든 앱 위에 알림이 표시됩니다."
            data-model="chatText" aria-label="메시지 입력">${esc(u.chatText)}</textarea>
          <button class="btn btn-sm ${u.chatKind === '긴급' ? 'btn-crit' : 'btn-primary'}" type="button" data-act="chat-send">
            ${icon('ic-send', 'ic-sm')}${u.chatKind === '긴급' ? '긴급 알림 전송' : '메시지 전송'}</button>
        </div>
      </div>`}
    </div>`;
  },
  after(body) { const l = $('#chatLog', body); if (l) l.scrollTop = l.scrollHeight; }
});

/* ---------- 8. 사건 처리 상태 ---------- */
defApp({
  id: 'progress', name: '사건 처리 상태', short: '처리', icon: 'ic-progress', defW: .32, defH: .6,
  desc: '신고 접수부터 종료까지 8단계 타임라인',
  ctx: () => { const s = S.stages[S.sel]; return `${STAGE_NAMES[s.at]} (${s.at + 1}/8)`; },
  render() {
    const inc = curInc(), st = S.stages[inc.id];
    return `
    <div class="toolbar">
      <span class="dim">현재 단계</span>${badge(STAGE_NAMES[st.at], st.at >= 7 ? 'badge-idle' : 'badge-info')}
      <span class="dim">${st.at + 1} / 8</span>
      <span class="spacer"></span>
      <button class="btn btn-sm" type="button" data-act="stage-prev" ${st.at <= 0 ? 'disabled' : ''} title="이전 단계로 되돌리기">이전 단계</button>
      <button class="btn btn-sm btn-primary" type="button" data-act="stage-next" ${st.at >= 7 ? 'disabled' : ''} title="다음 단계로 진행">다음 단계</button>
    </div>
    <div class="pane" style="padding-bottom:0">
      <div class="bar ${st.at >= 7 ? 'ok' : ''}"><i style="width:${((st.at + 1) / 8) * 100}%"></i></div>
    </div>
    <ul class="timeline">
      ${STAGE_NAMES.map((n, i) => {
        const cls = i < st.at ? 'is-done' : i === st.at ? 'is-now' : 'is-wait';
        const log = st.log[i] || '';
        const [t, ...rest] = log.split(' · ');
        return `<li class="tl-item ${cls}"><span class="tl-dot"></span>
          <div class="tl-h">${esc(n)}
            ${i === st.at ? badge('진행 중', 'badge-info') : i < st.at ? badge('완료', 'badge-ok') : badge('대기', 'badge-idle')}</div>
          <div class="tl-m">
            <span class="mono">기록 시각 ${log ? esc(t) : '-'}</span>
            <span>담당 ${log && rest.length > 1 ? esc(rest[rest.length - 1]) : (i <= st.at ? esc(inc.team) : '미지정')}</span>
          </div>
          ${log ? `<div class="tl-note detail">${esc(rest.join(' · ') || t)}</div>` : ''}
        </li>`;
      }).join('')}
    </ul>
    <div class="sect"><div class="sect-h">지령·응답 기록</div><div class="sect-b" style="display:grid;gap:4px">
      ${st.log.slice().reverse().map(l => `<div class="card-row"><span class="mono dim">${esc(l.split(' · ')[0])}</span>
        <span>${esc(l.split(' · ').slice(1).join(' · '))}</span></div>`).join('')}
    </div></div>`;
  }
});

/* ---------- 9. AR 실시간 영상 ---------- */
defApp({
  id: 'ar', name: 'AR 실시간 영상', short: 'AR', icon: 'ic-ar', defW: .3, defH: .5,
  desc: '현장 경찰 AR 글래스에서 지휘통제실로 들어오는 가상 영상',
  ctx: () => `현장 AR → 지휘통제실 · ${incOfficers(S.sel).filter(o => o.ar !== '미연결').length}회선`,
  render() {
    const inc = curInc();
    const pool = (S.ui.arAll ? OFFICERS : incOfficers(inc.id)).filter(o => o.ar !== '미연결');
    const sel = pool.find(o => o.id === S.ui.arSel) || pool[0];
    const caps = S.captures.filter(c => c.inc === inc.id && c.from.startsWith('AR'));
    return `
    <div class="arx">
      <div class="arx-main">
        ${sel ? `
        ${screenHTML({ id: sel.call, title: sel.name, place: `X ${Math.round(sel.x)} · Y ${Math.round(sel.y)} (가상 좌표)`,
          at: sel.comm + ':' + pad2(rint(10, 59)), rec: sel.ar === '연결', lost: sel.ar === '두절', scene: 'alley' })}
        <div class="arx-bar">
          <span class="arx-who">촬영자 ${esc(sel.call)} · ${esc(sel.name)}</span>
          <span class="arx-st">AR ${esc(sel.ar)}</span>
          <span class="arx-st ${sel.ar === '두절' ? 'is-crit' : ''}">${sel.ar === '두절' ? '녹화 중단' : '녹화 중'}</span>
          ${battHTML(sel.batt)}
          <span class="arx-st detail">촬영 시각 ${esc(sel.comm)}</span>
          <span class="arx-acts">
            <button class="btn btn-sm" type="button" data-act="ar-capture" data-id="${sel.id}">${icon('ic-capture', 'ic-sm')}<span class="btn-t">중요 장면 캡처</span></button>
            <button class="btn btn-sm btn-warn" type="button" data-act="ar-tx" data-id="${sel.id}">현장 전송 후보로 추가</button>
            <button class="btn btn-sm" type="button" data-act="msg-to-officer" data-id="${sel.id}">해당 경찰관에 메시지</button>
          </span>
        </div>` : '<div class="empty-note arx-empty">현재 사건에 AR 글래스 연결 인원이 없습니다.</div>'}
      </div>
      <aside class="arx-side" aria-label="경찰관별 영상">
        <div class="arx-side-h">
          <span class="arx-side-t">경찰관별 영상 ${pool.length}회선</span>
          <span class="arx-scope">
            <button class="btn btn-sm ${!S.ui.arAll ? 'btn-on' : ''}" type="button" data-act="ar-scope" data-v="0">현재 사건</button>
            <button class="btn btn-sm ${S.ui.arAll ? 'btn-on' : ''}" type="button" data-act="ar-scope" data-v="1">전체</button>
          </span>
        </div>
        <div class="arx-flow">데이터 흐름: 현장 경찰 AR 글래스 → 지휘통제실</div>
        <div class="arx-thumbs">
          ${pool.map(o => `<button class="thumb ${sel && o.id === sel.id ? 'is-sel' : ''}" type="button" data-act="ar-sel" data-id="${o.id}"
              title="${esc(o.call)} ${esc(o.name)} 영상 확대">
            ${screenHTML({ id: o.call, title: '', place: '', at: o.comm, rec: o.ar === '연결', lost: o.ar === '두절', scene: 'street' })}
            <div class="thumb-c"><div class="thumb-t">${esc(o.call)} ${esc(o.name)}</div>
              <div class="thumb-s">AR ${esc(o.ar)} · <span class="mono">${esc(o.comm)}</span></div></div>
          </button>`).join('') || '<div class="empty-note">연결된 회선 없음</div>'}
        </div>
        <div class="arx-caps">
          <div class="arx-k">AR 캡처 기록</div>
          ${caps.map(c => `<div class="arx-cap"><span>${esc(c.from)}</span> ${esc(c.label)} <span class="mono">${esc(c.t)}</span></div>`).join('')
            || '<div class="arx-cap dim">캡처 기록 없음</div>'}
        </div>
      </aside>
    </div>`;
  }
});

/* ---------- 10. 현장 정보 전송 ---------- */
const TX_KINDS = [
  { k: '위험 위치', d: '현장 경찰 AR 화면에 위험 표식으로 표시' },
  { k: '용의자 최종 확인 위치', d: '마지막 확인 좌표와 시각 전달' },
  { k: '진입 방향', d: '권장 진입 방향 화살표 표시' },
  { k: '접근 금지 구역', d: '진입 금지 영역 경계 표시' },
  { k: '확인 요청 구역', d: '확인이 필요한 미확인 영역 지정' },
  { k: '후속 인력 합류 위치', d: '집결 지점 좌표 전달' },
  { k: '간단한 지시 문구', d: '짧은 텍스트 지시 (AR 하단 표시)' },
  { k: 'CCTV 주요 장면', d: '캡처한 장면을 축소 이미지로 전달' }
];
const TX_STEPS = ['정보 선택', '문구 편집', '대상 선택', 'AR 미리보기', '전송', '수신 확인', '수정·회수'];
defApp({
  id: 'transmit', name: '현장 정보 전송', short: '전송', icon: 'ic-send', defW: .36, defH: .72,
  desc: '지휘통제실이 선별한 정보를 AR 글래스·폴더블폰으로 전달',
  ctx: () => `대기 ${S.txs.filter(t => t.inc === S.sel && t.state !== '확인').length}건 · 전체 ${S.txs.filter(t => t.inc === S.sel).length}건`,
  render() {
    const c = S.ui.compose, inc = curInc();
    const targets = ['전체 현장 인력', ...new Set(incOfficers(inc.id).map(o => o.team)), ...incOfficers(inc.id).map(o => o.call), '후속 인력(대기조)'];
    const step = n => `<span class="step ${c.step === n ? 'is-on' : c.step > n ? 'is-done' : ''}"><span class="n">${n}</span>${esc(TX_STEPS[n - 1])}</span>`;
    return `
    <div class="stepper">${[1, 2, 3, 4, 5, 6, 7].map(step).join('')}</div>

    <div class="sect"><div class="sect-h">1단계 · 전송할 정보 선택 (복수 선택 가능)</div><div class="sect-b">
      <div class="pick-grid">
        ${TX_KINDS.map(t => `<button class="pick ${c.items.includes(t.k) ? 'is-on' : ''}" type="button" data-act="tx-item" data-v="${esc(t.k)}"
          aria-pressed="${c.items.includes(t.k)}"><span class="pick-box"></span><span>
          <span class="pick-t">${esc(t.k)}</span><span class="pick-d detail">${esc(t.d)}</span></span></button>`).join('')}
      </div></div></div>

    <div class="sect"><div class="sect-h">2단계 · 전달 문구 편집</div><div class="sect-b">
      <textarea class="textarea" rows="2" data-model="txNote" aria-label="전달 문구"
        placeholder="예) 후면 비상계단 난간 부식. 2인 동시 진입 금지.">${esc(c.note)}</textarea>
      <div class="card-acts">
        ${['진입 시 2인 1조 유지', '해당 구역 접근 금지', '확인 후 즉시 보고', '후속 인력 합류까지 대기'].map(t =>
          `<button class="btn btn-sm" type="button" data-act="tx-quote" data-v="${esc(t)}">${esc(t)}</button>`).join('')}
      </div></div></div>

    <div class="sect"><div class="sect-h">3단계 · 전달 대상 선택</div><div class="sect-b">
      <div class="pick-grid">
        ${targets.map(t => `<button class="pick ${c.targets.includes(t) ? 'is-on' : ''}" type="button" data-act="tx-target-toggle" data-v="${esc(t)}"
          aria-pressed="${c.targets.includes(t)}"><span class="pick-box"></span><span class="pick-t">${esc(t)}</span></button>`).join('')}
      </div></div></div>

    <div class="sect"><div class="sect-h">4단계 · AR 글래스 화면 미리보기 (현장에 보이는 화면)</div><div class="sect-b">
      <div class="arglass">
        <div class="ar-hud">
          <span class="ar-corner" style="left:14px;top:12px">${esc(inc.id)} ${esc(inc.type)}</span>
          <span class="ar-corner" style="right:14px;top:12px">지휘통제실 송신</span>
          <span class="ar-corner" style="left:14px;bottom:12px">${esc(c.targets[0] || '대상 미지정')}</span>
          <span class="ar-corner mono" style="right:14px;bottom:12px">${nowHM()}</span>
          ${c.items.length ? c.items.slice(0, 3).map((k, i) => {
            const tone = k.includes('위험') || k.includes('금지') || k.includes('용의자') ? 'is-crit' : k.includes('확인') ? 'is-warn' : 'is-info';
            return `<span class="ar-pin ${tone}" style="left:${28 + i * 22}%;top:${44 + (i % 2) * 8}%">
              <span class="ap-dot"></span><span class="ap-t">${esc(k)}</span></span>`;
          }).join('') : '<span class="hud-c dim">전송할 정보를 선택하면 이 화면에 표식이 표시됩니다</span>'}
          ${c.note ? `<span class="ar-note">${esc(c.note)}</span>` : ''}
        </div>
      </div>
      <div class="dim detail" style="margin-top:6px">폴더블폰 전송 시 동일 내용이 목록 형태로 함께 전달됩니다 (프로토타입 모형).</div>
    </div></div>

    <div class="sect"><div class="sect-h">5단계 · 전송</div><div class="sect-b">
      <div class="card-acts">
        <button class="btn btn-primary" type="button" data-act="tx-send"
          ${(!c.items.length || !c.targets.length) ? 'disabled title="정보와 대상을 선택해야 전송할 수 있습니다"' : ''}>
          ${icon('ic-send', 'ic-sm')}현장으로 전송</button>
        <button class="btn" type="button" data-act="tx-clear">작성 내용 지우기</button>
      </div>
      ${(!c.items.length || !c.targets.length) ? '<div class="dim" style="margin-top:5px">1단계 정보와 3단계 대상을 선택하십시오.</div>' : ''}
    </div></div>

    <div class="sect"><div class="sect-h">6~7단계 · 전송 기록 / 수신 확인 / 수정·회수</div><div class="sect-b">
      <div class="sendlist">
      ${S.txs.filter(t => t.inc === inc.id).map(t => `<div class="sendrow ${t.kind.includes('위험') ? 'is-crit' : ''}">
        <div class="card-h"><span class="card-t">${esc(t.kind)}</span>
          <span class="spacer"></span><span class="dim mono">${esc(t.t)}</span></div>
        <div class="card-row">${esc(t.note || '(문구 없음)')}</div>
        <div class="card-row dim">대상: ${esc(t.targets.join(', '))}</div>
        <div class="flow">
          ${['전송 중', '수신', '확인'].map((s, i) => {
            const idx = ['전송 중', '수신', '확인'].indexOf(t.state);
            return `<span class="flow-s ${idx > i ? 'is-on' : idx === i ? 'is-live' : ''}">${s}</span>${i < 2 ? '<span class="flow-arw"></span>' : ''}`;
          }).join('')}
          <span class="spacer" style="flex:1"></span>
          ${t.state === '확인' ? badge('현장 확인 완료', 'badge-ok') : badge('대기', 'badge-warn', 'badge-sq')}
        </div>
        <div class="card-acts">
          <button class="btn btn-sm" type="button" data-act="tx-edit" data-id="${t.id}" ${t.state === '확인' ? 'disabled title="이미 확인된 정보는 수정 대신 새로 전송하십시오"' : ''}>정보 수정</button>
          <button class="btn btn-sm btn-crit" type="button" data-act="tx-recall" data-id="${t.id}">전송 회수</button>
        </div>
      </div>`).join('') || '<div class="empty-note">전송 기록이 없습니다.</div>'}
      </div></div></div>`;
  }
});

/* ---------- 11. 기록·인계 ---------- */
defApp({
  id: 'handover', name: '기록·인계', short: '인계', icon: 'ic-handover', defW: .36, defH: .64,
  desc: '완료·진행·미확인 조치와 후속 인력 인계 화면 생성',
  ctx: () => { const h = S.handover[S.sel] || []; return `미확인 ${h.filter(x => x.kind === '미확인').length}건`; },
  render() {
    const inc = curInc(), h = S.handover[inc.id] || [];
    const g = k => h.filter(x => x.kind === k);
    const item = x => `<li class="check ${x.kind === '완료' ? 'is-done' : ''} ${x.kind === '미확인' ? 'is-open' : ''}">
      <span>${badge(x.kind, x.kind === '완료' ? 'badge-ok' : x.kind === '진행' ? 'badge-info' : 'badge-idle', x.kind === '미확인' ? 'badge-sq' : '')}</span>
      <span style="flex:1">
        <div class="check-t">${esc(x.text)}</div>
        <div class="check-m"><span>담당 ${esc(x.owner)}</span>
          <span>${badge(x.area === '확인' ? '확인 영역' : '미확인 영역', x.area === '확인' ? 'badge-ok' : 'badge-idle')}</span>
          ${x.accepted ? badge('인계 수락됨 · ' + esc(x.accepted), 'badge-ok') : x.assigned ? badge('인계 요청 · ' + esc(x.assigned), 'badge-warn', 'badge-sq') : ''}
        </div></span>
      <span style="display:flex;gap:4px;flex-wrap:wrap">
        ${x.kind !== '완료' ? `<button class="btn btn-sm" type="button" data-act="ho-done" data-id="${x.id}">완료 처리</button>` : ''}
        ${!x.assigned ? `<button class="btn btn-sm btn-warn" type="button" data-act="ho-assign" data-id="${x.id}">후속 인력에 인계</button>`
          : !x.accepted ? `<button class="btn btn-sm" type="button" data-act="ho-accept" data-id="${x.id}">수락 처리(모형)</button>` : ''}
      </span></li>`;
    return `
    <div class="toolbar">
      <span class="dim">인계 대상</span>
      <label class="field"><select data-model="hoTarget" aria-label="인계 대상 선택">
        ${['후속 인력(대기조)', '지역1팀 교대조', '강력2팀 지원조', '형사1팀 지원조'].map(v =>
          `<option ${S.ui.hoTarget === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
      </select></label>
      <span class="spacer"></span>
      <button class="btn btn-sm btn-primary" type="button" data-act="ho-sheet">${icon('ic-briefing', 'ic-sm')}<span class="btn-t">인계 화면 생성</span></button>
    </div>

    <div class="metrics">
      <div class="metric is-ok"><div class="metric-k">완료된 조치</div><div class="metric-v">${g('완료').length}</div></div>
      <div class="metric"><div class="metric-k">진행 중 조치</div><div class="metric-v">${g('진행').length}</div></div>
      <div class="metric is-warn"><div class="metric-k">미확인 사항</div><div class="metric-v">${g('미확인').length}</div></div>
      <div class="metric"><div class="metric-k">인계 수락</div><div class="metric-v">${h.filter(x => x.accepted).length}</div></div>
    </div>

    <div class="sect"><div class="sect-h">완료된 조치</div><div class="sect-b"><ul class="checks">${g('완료').map(item).join('') || '<li class="dim">없음</li>'}</ul></div></div>
    <div class="sect"><div class="sect-h">진행 중인 조치</div><div class="sect-b"><ul class="checks">${g('진행').map(item).join('') || '<li class="dim">없음</li>'}</ul></div></div>
    <div class="sect"><div class="sect-h">미확인 사항 (후속 인력이 해야 할 일)</div><div class="sect-b"><ul class="checks">${g('미확인').map(item).join('') || '<li class="dim">없음</li>'}</ul></div></div>

    <div class="sect"><div class="sect-h">확인 / 미확인 영역</div><div class="sect-b" style="display:grid;gap:5px">
      ${inc.zones.map(z => `<div class="card-row">
        ${badge(z.kind, z.kind === '확인' ? 'badge-ok' : z.kind === '미확인' ? 'badge-idle' : 'badge-crit', z.kind === '통제' ? 'badge-tri' : '')}
        <span>${esc(z.name)}</span></div>`).join('') || '<span class="dim">지정된 영역 없음</span>'}
    </div></div>

    <div class="sect"><div class="sect-h">지령·응답 기록</div><div class="sect-b" style="display:grid;gap:4px">
      ${S.stages[inc.id].log.slice().reverse().slice(0, 6).map(l => `<div class="card-row dim mono" style="font-size:12px">${esc(l)}</div>`).join('')}
    </div></div>`;
  }
});

/* ===================== [7] 동작 처리 ===================== */
function findOfficer(id) { return OFFICERS.find(o => o.id === id); }
function ensureOpen(id) { if (!winOf(id)) openApp(id, { silent: true }); else { restoreWin(id); } }

function addMsg(m) {
  const msg = Object.assign({ id: uid('M'), inc: S.sel, t: nowHM(), read: false, mine: false, kind: '일반' }, m);
  S.msgs.push(msg);
  if (winOf('messages')) render('messages');
  if (winOf('overview')) render('overview');
  paintStatus();
  return msg;
}
function addCapture(from, label, txCandidate) {
  const c = { id: uid('CAP'), inc: S.sel, from, label, t: nowHMS(), tx: !!txCandidate };
  S.captures.unshift(c);
  return c;
}
function txCandidate(kind, note) {
  const c = S.ui.compose;
  if (!c.items.includes(kind)) c.items.push(kind);
  if (note && !c.note) c.note = note;
  ensureOpen('transmit');
  renderAll();
  toast('warn', '전송 후보 추가', `${kind} 항목이 현장 정보 전송 앱에 추가되었습니다.`);
}

const ACT = {
  /* --- 작전 지도 조작 --- */
  'map-menu': () => setMapMenu(!MAPV.menu),
  'map-mode': d => setMapMode(d.mode),
  'map-locate': () => locateMe(),
  'map-zoom-in': () => { if (MAPV.map) MAPV.map.zoomIn({ duration: 260 }); },
  'map-zoom-out': () => { if (MAPV.map) MAPV.map.zoomOut({ duration: 260 }); },
  'map-side': () => setMapSide(!MAPV.side),
  'map-place': d => pickPlace(Number(d.i)),
  'map-search-clear': () => clearSearch(),
  'map-layer': d => toggleMapLayer(d.k),
  'map-cam-close': () => closeCam(),
  'map-case-fold': () => {
    MAPV.caseOpen = !MAPV.caseOpen;
    const side = document.querySelector('#win-map .mside'); if (!side) return;
    side.classList.toggle('is-case-open', MAPV.caseOpen);
    side.querySelector('.mcase-fold').setAttribute('aria-expanded', String(MAPV.caseOpen));
  },
  'map-case': d => openCase(d.id),
  'map-case-back': () => closeCase(),
  'map-case-go': d => goCaseItem(d.kind, d.id),
  'case-add': (d, e) => openAddMenu(d.kind, e),
  'map-cam-open': d => { closeCam(); S.ui.cctvSel = d.id; ensureOpen('cctv'); render('cctv'); focusWin('cctv'); applyLayout(); },

  /* --- 런처 / 창 --- */
  'launch': d => toggleApp(d.app),
  'focus': d => { focusWin(d.win); applyLayout(); },
  'tb-toggle': d => { const w = winOf(d.win); if (!w) return; if (w.min) restoreWin(d.win); else if (S.focus === d.win && S.mode !== 'compact') minimizeWin(d.win); else { focusWin(d.win); applyLayout(); } },
  'w-close': d => closeApp(d.win),
  'w-min': d => minimizeWin(d.win),
  'w-max': d => maximizeWin(d.win),
  'w-front': d => { focusWin(d.win); applyLayout(); },
  'w-left': d => snapWin(d.win, 'left'),
  'w-right': d => snapWin(d.win, 'right'),
  'w-quad': d => cycleQuad(d.win),
  'w-reset': d => { const w = winOf(d.win); const def = defaultLayout().find(x => x.id === d.win) || { fx: .2, fy: .12, fw: .45, fh: .6 };
    Object.assign(w, { fx: def.fx, fy: def.fy, fw: def.fw, fh: def.fh, max: false }); applyLayout(); save(); },
  'tile-2': () => tileHalves(),
  'tile-4': () => tileQuads(),
  'reset-layout': () => resetLayout(),
  'restore-default': () => resetLayout(),

  /* --- 사건 선택 --- */
  'select-inc': d => selectIncident(d.id),

  /* --- 알림 --- */
  'alert-ack': d => ackAlert(d.alert),
  'alert-ack-all': () => ackAllAlerts(),
  'alert-inbox': () => { S.ui.chatTab = '알림'; ensureOpen('messages'); render('messages'); focusWin('messages'); applyLayout(); },
  'alert-open': d => { const a = S.alerts.find(x => x.id === d.alert); if (!a) return; ackAlert(a.id); if (a.inc !== S.sel) selectIncident(a.inc); if (a.app) ensureOpen(a.app); },
  'alert-clear': () => { S.alerts = []; paintTaskbar(); paintStatus(); render('messages'); toast('info', '알림 기록 삭제', '알림 기록을 비웠습니다.'); },
  'modal-close': () => closeModal(),

  'open-ar-of': d => { const o = findOfficer(d.id); if (!o) return; S.ui.arSel = o.id; ensureOpen('ar'); render('ar'); focusWin('ar'); applyLayout(); },
  'msg-to-officer': d => { const o = findOfficer(d.id); if (!o) return; S.ui.chatTo = o.call; S.ui.chatTab = '전체'; ensureOpen('messages'); render('messages'); focusWin('messages'); applyLayout(); },
  'tx-target': d => { const o = findOfficer(d.id); if (!o) return; const c = S.ui.compose; if (!c.targets.includes(o.call)) c.targets.push(o.call); ensureOpen('transmit'); renderAll(); toast('info', '전송 대상 지정', `${o.call} 을(를) 전달 대상에 추가했습니다.`); },
  'tx-hazard': d => txCandidate('위험 위치', d.label),

  /* --- 인력 --- */
  'field-scope': d => { S.ui.fieldAll = d.v === '1'; render('field'); },
  'health-ask': d => {
    const o = findOfficer(d.id); if (!o) return;
    addMsg({ inc: o.inc, from: '지휘통제실', to: o.call, kind: '중요', text: `${o.call}, 현재 신체 상태 직접 보고 바랍니다.`, mine: true, read: false });
    setTimeout(() => {
      o.health = { label: pick(['이상 없음', '이상 없음', '확인 필요']), source: '경찰관 직접 보고' };
      o.comm = nowHM();
      addMsg({ inc: o.inc, from: o.call, to: '지휘통제실', kind: '일반', text: `상태 보고: ${o.health.label}. 직접 확인했습니다.`, read: false });
      if (winOf('field')) render('field');
    }, 2600);
    toast('info', '상태 확인 요청', `${o.call} 에게 상태 확인 요청을 보냈습니다. 응답 대기 중.`);
  },

  /* --- CCTV --- */
  'cctv-scope': d => { S.ui.cctvAll = d.v === '1'; render('cctv'); },
  'cctv-sel': d => { S.ui.cctvSel = d.id; render('cctv'); },
  'cctv-capture': d => { const c = CCTVS.find(x => x.id === d.id); addCapture('CCTV ' + c.id, `${c.name} 장면 캡처`, false); render('cctv'); toast('ok', '장면 캡처 완료', `${c.id} ${c.name} 화면을 캡처했습니다.`); },
  'cctv-tx': d => { const c = CCTVS.find(x => x.id === d.id); addCapture('CCTV ' + c.id, `${c.name} 주요 장면`, true); txCandidate('CCTV 주요 장면', `${c.name} 주요 장면 확인 요망`); render('cctv'); },
  'cap-tx': d => { const c = S.captures.find(x => x.id === d.id); if (!c) return; c.tx = true; txCandidate('CCTV 주요 장면', c.label); render('cctv'); },

  /* --- 브리핑 --- */
  'brief-toggle': () => { S.ui.briefOpen = !S.ui.briefOpen; render('overview'); },
  'brief-print': () => {
    const inc = curInc(), b = BRIEFINGS[inc.id] || [];
    openModal(`${inc.id} 브리핑 요약본 (후속 인력 전달용)`, `
      <div class="kv" style="grid-template-columns:110px 1fr">
        <dt>사건</dt><dd>${esc(inc.id)} ${esc(inc.type)}</dd>
        <dt>신고 위치</dt><dd>${esc(inc.place)}</dd>
        <dt>발생/갱신</dt><dd class="mono">${esc(inc.reportedAt)} / ${esc(inc.updatedAt)}</dd>
        <dt>긴급도·위험도</dt><dd>${badge(inc.priority, prioCls(inc.priority), prioShape(inc.priority))} ${badge(riskLabel(inc.risk), riskCls(inc.risk))}</dd>
        <dt>핵심 요약</dt><dd>${esc(inc.summary)}</dd>
      </div>
      <div class="sect-h" style="margin-top:10px">확인 정보</div>
      ${b.map(x => `<div class="fact c-${x.c}"><div class="fact-t"><strong>${esc(x.k)}</strong> · ${esc(x.v)}</div>
        <div class="fact-m">${certBadge(x.c)}${srcChip(x.src)}<span class="dim mono">${esc(x.t)}</span></div></div>`).join('')}
      <div class="sect-h" style="margin-top:10px">현장 위험 요소</div>
      <ul style="margin:4px 0 0 16px">${inc.hazard.map(h => `<li>${esc(h)}</li>`).join('') || '<li class="dim">없음</li>'}</ul>
      <p class="dim" style="margin-top:12px">본 요약본은 졸업작품 프로토타입의 가상 데이터로 생성되었습니다.</p>`);
  },

  /* --- 메시지 --- */
  'chat-tab': d => { S.ui.chatTab = d.v; render('messages'); },
  'chat-att': d => { S.ui.chatAtt = S.ui.chatAtt === d.v ? null : d.v; render('messages'); },
  'chat-send': () => {
    const u = S.ui, text = u.chatText.trim();
    if (!text) { toast('warn', '내용 없음', '전달할 내용을 입력하십시오.'); return; }
    const att = u.chatAtt === '위치' ? { type: '위치', label: `사건 위치 (${curInc().x}, ${curInc().y})` }
      : u.chatAtt === '이미지' ? { type: '이미지', label: '현장 캡처 이미지 (가상)' } : null;
    const m = addMsg({ from: '지휘통제실', to: u.chatTo, kind: u.chatKind, text, mine: true, read: false, delivered: false, att });
    if (u.chatKind === '긴급') pushAlert('긴급', '긴급 지시 발신', `${u.chatTo} 대상: ${text}`, { app: 'messages' });
    else if (u.chatKind === '중요') pushAlert('중요', '중요 지시 발신', `${u.chatTo} 대상: ${text}`, { app: 'messages' });
    u.chatText = ''; u.chatAtt = null;
    render('messages');
    setTimeout(() => { m.delivered = true; m.read = true; if (winOf('messages')) render('messages'); }, 2200);
    setTimeout(() => {
      const who = OFFICERS.find(o => o.call === u.chatTo) || incOfficers(S.sel)[0];
      if (who) addMsg({ inc: who.inc, from: who.call, to: '지휘통제실', text: pick(['수신했습니다.', '확인했습니다. 조치하겠습니다.', '내용 확인. 진행 중입니다.']), read: false });
    }, 4200);
  },
  'msg-pin': d => { const m = S.msgs.find(x => x.id === d.id); if (m) m.pin = !m.pin; render('messages'); },
  'msg-read': d => { const m = S.msgs.find(x => x.id === d.id); if (m) m.read = true; render('messages'); paintStatus(); },
  'voice-play': d => {
    const el = document.querySelector(`[data-voice="${d.id}"]`); if (!el) return;
    el.classList.add('is-playing'); beep('일반');
    toast('info', '음성 메시지 재생', '가상 음성 보고 재생 모형 (실제 음성 없음)');
    setTimeout(() => el.classList.remove('is-playing'), 2500);
  },

  /* --- 처리 단계 --- */
  'stage-next': () => {
    const st = S.stages[S.sel]; if (st.at >= 7) return;
    st.at++; st.log[st.at] = `${nowHM()} · ${STAGE_NAMES[st.at]} · 상황1팀 정하윤`;
    const inc = curInc(); inc.updatedAt = nowHM();
    if (st.at === 7) { inc.status = '종료'; pushAlert('일반', '사건 종료 처리', `${inc.id} ${inc.type} 사건이 종료 처리되었습니다.`, { app: 'progress' }); }
    else if (st.at === 6) { inc.status = '인계'; pushAlert('일반', '인계 단계 진입', `${inc.id} 인계 절차를 시작합니다.`, { app: 'handover' }); }
    renderAll(); save();
  },
  'stage-prev': () => { const st = S.stages[S.sel]; if (st.at <= 0) return; st.at--; curInc().updatedAt = nowHM(); renderAll(); },

  /* --- AR --- */
  'ar-scope': d => { S.ui.arAll = d.v === '1'; render('ar'); },
  'ar-sel': d => { S.ui.arSel = d.id; render('ar'); },
  'ar-capture': d => { const o = findOfficer(d.id); addCapture('AR ' + o.call, `${o.call} 시점 중요 장면`, false); render('ar'); render('cctv'); toast('ok', '중요 장면 캡처', `${o.call} AR 영상 장면을 캡처했습니다.`); },
  'ar-tx': d => { const o = findOfficer(d.id); addCapture('AR ' + o.call, `${o.call} 시점 장면`, true); txCandidate('확인 요청 구역', `${o.call} 시점 장면 기준 확인 요망`); render('ar'); },

  /* --- 현장 정보 전송 --- */
  'tx-item': d => { const c = S.ui.compose; const i = c.items.indexOf(d.v); i >= 0 ? c.items.splice(i, 1) : c.items.push(d.v); c.step = Math.max(c.step, 2); render('transmit'); },
  'tx-target-toggle': d => { const c = S.ui.compose; const i = c.targets.indexOf(d.v); i >= 0 ? c.targets.splice(i, 1) : c.targets.push(d.v); c.step = Math.max(c.step, 4); render('transmit'); },
  'tx-quote': d => { const c = S.ui.compose; c.note = c.note ? c.note + ' ' + d.v : d.v; c.step = Math.max(c.step, 3); render('transmit'); },
  'tx-clear': () => { S.ui.compose = { step: 1, items: [], note: '', targets: [], editing: null }; renderAll(); },
  'tx-send': () => {
    const c = S.ui.compose;
    if (!c.items.length || !c.targets.length) return;
    const t = {
      id: uid('TX'), inc: S.sel, kind: c.items.join(' / '), note: c.note, targets: c.targets.slice(),
      state: '전송 중', t: nowHMS()
    };
    S.txs.unshift(t);
    c.step = 6;
    renderAll();
    toast('info', '전송 중', `${t.targets.join(', ')} 대상으로 정보를 전송하고 있습니다.`);
    setTimeout(() => { t.state = '수신'; if (winOf('transmit')) render('transmit'); paintStatus(); }, 1800);
    setTimeout(() => {
      t.state = '확인';
      const who = c.targets[0];
      addMsg({ from: OFFICERS.find(o => o.call === who) ? who : '현장 경찰', to: '지휘통제실', text: `전달 정보 확인했습니다: ${t.kind}`, read: false });
      pushAlert('일반', '현장 수신 확인', `${who} 이(가) 전달 정보를 확인했습니다.`, { app: 'transmit' });
      S.ui.compose = { step: 7, items: [], note: '', targets: [], editing: null };
      renderAll();
    }, 4600);
  },
  'tx-edit': d => {
    const t = S.txs.find(x => x.id === d.id); if (!t) return;
    S.ui.compose = { step: 2, items: t.kind.split(' / '), note: t.note, targets: t.targets.slice(), editing: t.id };
    S.txs = S.txs.filter(x => x.id !== t.id);
    renderAll(); toast('warn', '전송 정보 수정', '기존 전송을 회수하고 편집 상태로 불러왔습니다. 수정 후 다시 전송하십시오.');
  },
  'tx-recall': d => {
    const t = S.txs.find(x => x.id === d.id); if (!t) return;
    S.txs = S.txs.filter(x => x.id !== d.id);
    addMsg({ from: '지휘통제실', to: t.targets.join(', '), kind: '중요', text: `이전 전달 정보(${t.kind})를 회수합니다. 해당 표식을 무시하십시오.`, mine: true, read: false });
    renderAll(); toast('warn', '전송 회수', '전달했던 정보를 회수했습니다. 현장 AR 표식이 제거됩니다.');
  },

  /* --- 인계 --- */
  'ho-done': d => { const x = (S.handover[S.sel] || []).find(i => i.id === d.id); if (!x) return; x.kind = '완료'; x.area = '확인'; render('handover'); toast('ok', '조치 완료 처리', esc(x.text)); },
  'ho-assign': d => {
    const x = (S.handover[S.sel] || []).find(i => i.id === d.id); if (!x) return;
    x.assigned = S.ui.hoTarget; x.owner = S.ui.hoTarget;
    addMsg({ from: '지휘통제실', to: '후속 인력', kind: '중요', text: `[인계 요청] ${x.text} — 담당: ${S.ui.hoTarget}`, mine: true, read: false });
    render('handover'); pushAlert('중요', '인계 요청 발송', `${x.text} → ${S.ui.hoTarget}`, { app: 'handover' });
  },
  'ho-accept': d => { const x = (S.handover[S.sel] || []).find(i => i.id === d.id); if (!x) return; x.accepted = nowHM(); render('handover'); toast('ok', '인계 수락', `${x.assigned} 이(가) 인계를 수락했습니다. (모형)`); },
  'ho-sheet': () => {
    const inc = curInc(), h = S.handover[inc.id] || [];
    const grp = k => h.filter(x => x.kind === k);
    openModal(`${inc.id} 후속 인력 인계 화면`, `
      <div class="kv" style="grid-template-columns:110px 1fr">
        <dt>사건</dt><dd>${esc(inc.id)} ${esc(inc.type)} · ${esc(inc.place)}</dd>
        <dt>인계 대상</dt><dd>${esc(S.ui.hoTarget)}</dd>
        <dt>인계 시각</dt><dd class="mono">${nowHMS()}</dd>
        <dt>현재 단계</dt><dd>${esc(STAGE_NAMES[S.stages[inc.id].at])}</dd>
      </div>
      <div class="sect-h" style="margin-top:10px">완료된 조치</div>
      <ul style="margin:4px 0 0 16px">${grp('완료').map(x => `<li>${esc(x.text)} <span class="dim">(${esc(x.owner)})</span></li>`).join('') || '<li class="dim">없음</li>'}</ul>
      <div class="sect-h" style="margin-top:10px">진행 중인 조치</div>
      <ul style="margin:4px 0 0 16px">${grp('진행').map(x => `<li>${esc(x.text)} <span class="dim">(${esc(x.owner)})</span></li>`).join('') || '<li class="dim">없음</li>'}</ul>
      <div class="sect-h" style="margin-top:10px">후속 인력이 해야 할 일 (미확인 사항)</div>
      <ul style="margin:4px 0 0 16px">${grp('미확인').map(x => `<li><strong>${esc(x.text)}</strong> <span class="dim">(${esc(x.area)} 영역)</span></li>`).join('') || '<li class="dim">없음</li>'}</ul>
      <div class="sect-h" style="margin-top:10px">확인 / 미확인 영역</div>
      <ul style="margin:4px 0 0 16px">${inc.zones.map(z => `<li>${esc(z.kind)} — ${esc(z.name)}</li>`).join('') || '<li class="dim">없음</li>'}</ul>
      <p class="dim" style="margin-top:12px">가상 데이터로 생성된 인계 화면입니다.</p>`,
      `<button class="btn btn-primary" type="button" data-act="ho-send-sheet">인계 화면 전송</button>
       <button class="btn" type="button" data-act="modal-close">닫기</button>`);
  },
  'ho-send-sheet': () => {
    addMsg({ from: '지휘통제실', to: '후속 인력', kind: '중요', text: `[인계 화면 전송] ${curInc().id} 인계 문서를 전달했습니다.`, mine: true, read: false, att: { type: '이미지', label: '인계 화면 (가상 문서)' } });
    closeModal(); pushAlert('일반', '인계 화면 전송 완료', `${S.ui.hoTarget} 대상으로 인계 화면을 전송했습니다.`, { app: 'handover' });
  },

  /* --- 목록 --- */
  'list-reset': () => { Object.assign(S.ui, { listQ: '', listPrio: '전체', listStatus: '전체' }); render('overview'); }
};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (t) {
    const fn = ACT[t.dataset.act];
    if (fn) { e.preventDefault(); e.stopPropagation(); fn(t.dataset, e); return; }
  }
  const win = e.target.closest('.win');
  if (win && S.focus !== win.dataset.win) { focusWin(win.dataset.win); applyLayout(); }
});
document.addEventListener('keydown', e => {
  const t = e.target.closest && e.target.closest('[data-act],[data-mk]');
  if (t && (e.key === 'Enter' || e.key === ' ') && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) {
    e.preventDefault();
    // SVG 요소에는 click() 메서드가 없으므로 이벤트를 직접 발생시킨다
    t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
}, true);

/* 입력 바인딩 */
const MODEL_MAP = { txNote: () => S.ui.compose, default: () => S.ui };
document.addEventListener('input', e => {
  const el = e.target.closest('[data-model]'); if (!el) return;
  const k = el.dataset.model;
  if (k === 'txNote') { S.ui.compose.note = el.value; return; }
  S.ui[k] = el.value;
  if (['listQ', 'listPrio', 'listStatus'].includes(k)) renderForce('overview');
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-model]'); if (!el) return;
  const k = el.dataset.model;
  if (k === 'txNote') return;
  S.ui[k] = el.value;
  if (['listPrio', 'listStatus'].includes(k)) renderForce('overview');
  if (['chatTo', 'chatKind'].includes(k)) renderForce('messages');
  if (k === 'hoTarget') renderForce('handover');
});
document.addEventListener('focusout', e => {
  const body = e.target.closest && e.target.closest('[data-body]');
  if (body && body.dataset.dirty === '1') setTimeout(() => render(body.dataset.body), 0);
});

/* ===================== [8] 화면 테마 (라이트 / 다크) ===================== */
function applyTheme(theme, announce) {
  S.theme = theme === 'dark' ? 'dark' : 'light';
  const dark = S.theme === 'dark';
  document.documentElement.dataset.theme = S.theme;
  const btn = $('#btnTheme');
  if (btn) {
    btn.setAttribute('aria-pressed', String(dark));
    btn.querySelector('.sb-btn-t').textContent = dark ? '라이트 모드' : '다크 모드';
    btn.querySelector('use').setAttribute('href', dark ? '#ic-sun' : '#ic-moon');
    btn.title = (dark ? '라이트 모드로 전환' : '다크 모드로 전환') + ' (Alt+D)';
  }
  syncMapTheme();   // 기본 지도 스타일과 선택지 미리보기를 테마에 맞춘다
  save();
  if (announce) toast('info', dark ? '다크 모드' : '라이트 모드', dark ? '어두운 화면으로 전환했습니다.' : '밝은 화면으로 전환했습니다.');
}

/* ===================== [9] 키보드 / 초기화 ===================== */
function keyHelp() {
  const rows = [
    ['Alt + 1 ~ 9', '앱 런처 1~9번 앱 열기/닫기'],
    ['Ctrl + Alt + ← →', '실행 중인 창 순서대로 이동'],
    ['Alt + ← / →', '선택한 창을 화면 좌/우 절반으로'],
    ['Alt + ↑ / ↓', '선택한 창 최대화 / 최소화'],
    ['방향키', '선택한 창 이동 (창 테두리 선택 상태)'],
    ['Shift + 방향키', '선택한 창 크기 조절'],
    ['Ctrl + Alt + 2 / 4', '전체 창 2분할 / 4분할 정리'],
    ['Alt + R', '창 위치 초기화'],
    ['Alt + D', '다크 모드 / 라이트 모드 전환'],
    ['분할 경계 드래그', '맞닿은 창들의 분할 비율 조절 (경계 선택 후 방향키도 가능)'],
    ['런처 경계 드래그', '왼쪽 앱 런처 너비 조절 (더블클릭 시 기본값)'],
    ['Esc', '팝업·긴급 알림 닫기'],
    ['물음표 (Shift + /)', '이 단축키 안내 열기']
  ];
  openModal('키보드 단축키', `<div class="keys">${rows.map(([k, v]) =>
    `<div class="keyrow"><span class="kk">${k.split(' ').map(x => /^[+~]$/.test(x) ? x : `<kbd>${esc(x)}</kbd>`).join(' ')}</span><span>${esc(v)}</span></div>`).join('')}</div>
    <p class="dim" style="margin-top:10px">모든 아이콘 버튼에는 문자 라벨과 툴팁이 함께 제공됩니다. 상태는 색상 외에 문자와 도형으로도 구분됩니다.</p>`);
}
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (e.key === 'Escape') {
    if (!$('#modalRoot').hidden) { closeModal(); return; }
    const b = $$('#urgentStack .nt-card').pop() || $('#urgentStack .urgent');
    if (b) { ackAlert(b.dataset.alert); return; }
  }
  if (e.key === '?' && !typing) { e.preventDefault(); keyHelp(); return; }
  if (typing) return;

  if (e.altKey && !e.ctrlKey) {
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9, '-': 10 };
    if (map[e.key] !== undefined) { e.preventDefault(); const a = APPS[map[e.key]]; if (a) toggleApp(a.id); return; }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); resetLayout(); return; }
    if (e.key.toLowerCase() === 'd') { e.preventDefault(); applyTheme(S.theme === 'dark' ? 'light' : 'dark', true); return; }
    if (S.focus) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); snapWin(S.focus, 'left'); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); snapWin(S.focus, 'right'); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); maximizeWin(S.focus); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); minimizeWin(S.focus); return; }
    }
  }
  if (e.ctrlKey && e.altKey) {
    if (e.key === '2') { e.preventDefault(); tileHalves(); return; }
    if (e.key === '4') { e.preventDefault(); tileQuads(); return; }
    const list = openWins();
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && list.length) {
      e.preventDefault();
      const i = list.findIndex(w => w.id === S.focus);
      const n = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
      focusWin(n.id); applyLayout(); $('#win-' + n.id).focus();
      return;
    }
  }
  // 창 이동/크기 (창 자체에 포커스가 있을 때)
  const wEl = document.activeElement.closest && document.activeElement.closest('.win');
  if (wEl && document.activeElement === wEl && e.key.startsWith('Arrow')) {
    const w = winOf(wEl.dataset.win); if (!w || w.max) return;
    e.preventDefault();
    const s = .02, d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (e.shiftKey) { w.fw = clamp(w.fw + d[0], .16, 1); w.fh = clamp(w.fh + d[1], .16, 1); }
    else { w.fx = clamp(w.fx + d[0], 0, 1 - w.fw); w.fy = clamp(w.fy + d[1], 0, 1 - w.fh); }
    applyLayout(); save();
  }
});

/* ---- 초기화 ---- */
function init() {
  rebaseTimes();
  S.stages = JSON.parse(JSON.stringify(STAGE_STATE));
  S.msgs = SEED_MSGS.map(m => Object.assign({ id: uid('M'), pin: false, delivered: true }, m));
  S.alerts = [
    { id: uid('AL'), level: '중요', title: '작전 변경', desc: 'A-102 진입 방향을 후면에서 전면으로 변경했습니다.', t: '20:55:12', inc: 'A-102', app: 'map', seen: true },
    { id: uid('AL'), level: '일반', title: '기록 저장', desc: 'A-107 처리 기록이 저장되었습니다.', t: '20:53:40', inc: 'A-107', app: 'progress', seen: true }
  ];

  RO = new ResizeObserver(() => sizeClasses());

  paintLauncher();
  if (!load()) { S.wins = defaultLayout(); S.focus = 'map'; S.zTop = 20; }
  setLauncherWidth(S.lcW);
  initLauncherResize();
  new ResizeObserver(() => applyLayout()).observe($('#desktop'));
  renderWindows(); renderAll(); paintUrgent(false);

  $('#btnTheme').addEventListener('click', () => applyTheme(S.theme === 'dark' ? 'light' : 'dark', true));
  applyTheme(S.theme);
  $('#btnKeys').addEventListener('click', keyHelp);
  $('#btnSound').addEventListener('click', () => {
    S.sound = !S.sound;
    const b = $('#btnSound');
    b.setAttribute('aria-pressed', String(S.sound));
    b.querySelector('.sb-btn-t').textContent = S.sound ? '알림음 켜짐' : '알림음 꺼짐';
    b.querySelector('use').setAttribute('href', S.sound ? '#ic-sound' : '#ic-mute');
    save();
  });
  $('#tbAlert').addEventListener('click', () => { S.ui.chatTab = '알림'; ensureOpen('messages'); render('messages'); focusWin('messages'); applyLayout(); });

  setInterval(() => { $('#sbClockVal').textContent = nowHMS(); }, 1000);

  let rt = null;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { applyLayout(); }, 90); });

  paintStatus();
  toast('info', 'PARALLAX 지휘통제 콘솔', '가상 데이터 프로토타입입니다. 실제 경찰 시스템과 연결되지 않습니다.');
}
document.addEventListener('DOMContentLoaded', init);
