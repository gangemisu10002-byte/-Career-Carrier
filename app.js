'use strict';
const config = window.CAREER_CONFIG || {};
const $ = (id) => document.getElementById(id);
function setCopy(element, text) {
  element.replaceChildren();
  const english = (window.CAREER_EN || {})[text];
  if (!english) { element.textContent = text; return; }
  const pair = document.createElement('span'); pair.className = 'ko-en';
  const korean = document.createElement('span'); korean.lang = 'ko'; korean.textContent = text;
  const translated = document.createElement('span'); translated.className = 'en'; translated.lang = 'en'; translated.textContent = english;
  pair.append(korean, translated); element.append(pair);
}
const localKey = 'career-carrier-guestbook-v1';
let entries = [], shown = 4, storageReadable = true;
const shared = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const endpoint = shared ? `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/guestbook` : '';
const headers = shared ? { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } : {};
function toast(message) { setCopy($('toast'), message); $('toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').classList.remove('visible'), 3600); }
function validUrl(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol); } catch { return false; } }
if (config.surveyUrl && validUrl(config.surveyUrl)) { $('survey-link').href = config.surveyUrl; $('survey-link').target = '_blank'; $('survey-link').rel = 'noopener noreferrer'; setCopy($('survey-status'), '작품 투표 설문조사 참여하기'); }
else { $('survey-link').addEventListener('click', event => { event.preventDefault(); toast('작품 투표 설문조사는 준비 중입니다. 곧 만나요!'); }); }
const scenes = {
  present: { label: 'CHAPTER 01 · 현재', title: ['미래의 시작은,', '지금의 우리에게.'], description: '연세대학교에서 수업을 듣고 공부하며, 생명공학자라는 꿈을 준비하는 우리. 다양한 경험과 지식을 쌓는 오늘의 시간이 커리어의 첫걸음이 됩니다.', keywords: ['배움', '경험', '가능성'], icon: '▤', place: 'YONSEI UNIVERSITY', color: '#e5e8d9' },
  future: { label: 'CHAPTER 02 · 미래', title: ['오늘의 질문이,', '내일의 발견으로.'], description: '생명공학 연구실에서 연구자로 성장한 미래의 우리. 암과 유전 질병의 진단과 치료, 인간의 건강 증진을 위한 기술을 연구하며 오늘의 노력을 전문성으로 이어갑니다.', keywords: ['생명공학', '질병 연구', '발견'], icon: '⚗', place: 'BIOTECHNOLOGY LAB', color: '#e4e8e2' },
  impact: { label: 'CHAPTER 03 · 기술의 적용', title: ['연구실의 가능성이,', '누군가의 일상으로.'], description: '연구실에서 개발한 기술이 실제 병원과 의료 현장에서 환자의 진단과 치료를 돕습니다. 우리의 커리어가 사회에 기여하고, 사람들의 더 건강한 삶으로 이어지는 장면입니다.', keywords: ['의료 현장', '건강한 삶', '사회적 가치'], icon: '✚', place: 'BETTER HEALTH, BETTER LIFE', color: '#efe2d3' }
};
const tabs = [...document.querySelectorAll('[data-scene]')];
function selectScene(tab) { const scene = scenes[tab.dataset.scene]; tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; }); $('scene-panel').setAttribute('aria-labelledby', tab.id); setCopy($('scene-label'), scene.label); setCopy($('scene-title'), scene.title.join('\n')); setCopy($('scene-description'), scene.description); setCopy($('scene-icon'), scene.icon); setCopy($('scene-place'), scene.place); $('scene-visual').style.backgroundColor = scene.color; $('scene-keywords').replaceChildren(...scene.keywords.map(word => { const span = document.createElement('span'); setCopy(span, word); return span; })); }
tabs.forEach((tab, index) => { tab.addEventListener('click', () => selectScene(tab)); tab.addEventListener('keydown', event => { let next; if (event.key === 'ArrowRight') next = (index + 1) % tabs.length; if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length; if (event.key === 'Home') next = 0; if (event.key === 'End') next = tabs.length - 1; if (next !== undefined) { event.preventDefault(); tabs[next].focus(); selectScene(tabs[next]); } }); });
function renderEntries() {
  setCopy($('entry-count'), String(entries.length).padStart(2, '0'));
  if (!entries.length) return;
  $('entry-list').replaceChildren(...entries.slice(0, shown).map(entry => {
    const article = document.createElement('article'); article.className = 'entry';
    const heading = document.createElement('div'); heading.className = 'entry-header';
    const avatar = document.createElement('span'); avatar.className = 'entry-avatar'; avatar.textContent = [...entry.name][0]; avatar.setAttribute('aria-hidden', 'true');
    const name = document.createElement('b'); name.textContent = entry.name;
    const time = document.createElement('time'); const date = new Date(entry.created_at); if (!Number.isNaN(date.getTime())) { time.dateTime = date.toISOString(); time.textContent = new Intl.DateTimeFormat('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Seoul'}).format(date); }
    heading.append(avatar, name, time); const message = document.createElement('p'); message.textContent = entry.message; article.append(heading, message); return article;
  }));
  $('load-more').hidden = entries.length <= shown;
}
$('load-more').addEventListener('click', () => { shown += 4; renderEntries(); });
function validEntry(entry) { return entry && typeof entry.name === 'string' && entry.name.trim() && entry.name.length <= 20 && typeof entry.message === 'string' && entry.message.trim() && entry.message.length <= 300 && !Number.isNaN(Date.parse(entry.created_at)); }
async function loadEntries() {
  if (shared) {
    setCopy($('storage-note'), '관람객 모두가 함께 보는 공개 방명록입니다. 개인정보는 적지 말아 주세요.');
    try { const response = await fetch(`${endpoint}?select=name,message,created_at&order=created_at.desc&limit=100`, { headers }); if (!response.ok) throw new Error('load'); const data = await response.json(); if (!Array.isArray(data)) throw new Error('format'); entries = data.filter(validEntry); renderEntries(); }
    catch { setCopy($('form-status'), '방명록을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'); }
  } else {
    try { const data = JSON.parse(localStorage.getItem(localKey) || '[]'); if (!Array.isArray(data) || !data.every(validEntry)) throw new Error('format'); entries = data; renderEntries(); }
    catch { storageReadable = false; setCopy($('form-status'), '저장된 기록을 읽을 수 없어 방명록 저장을 잠시 사용할 수 없습니다. 브라우저 저장소 설정을 확인해 주세요.'); $('guest-form').querySelector('button[type=submit]').disabled = true; }
  }
}
const loading = loadEntries();
$('guest-message').addEventListener('input', () => { setCopy($('character-count'), `${$('guest-message').value.length} / 300`); });
$('guest-form').addEventListener('submit', async event => {
  event.preventDefault(); const name = $('guest-name').value.trim(), message = $('guest-message').value.trim();
  if (!name || !message) { setCopy($('form-status'), '이름과 메시지를 공백 없이 입력해 주세요.'); return; }
  const button = event.submitter || $('guest-form').querySelector('button[type=submit]'); button.disabled = true; setCopy($('form-status'), '기록을 남기는 중입니다…');
  try {
    await loading;
    const entry = { name, message, created_at: new Date().toISOString() };
    if (shared) { const response = await fetch(endpoint, { method:'POST', headers: {...headers, Prefer:'return=minimal'}, body:JSON.stringify({name,message}) }); if (!response.ok) throw new Error('save'); }
    else { if (!storageReadable) throw new Error('storage'); localStorage.setItem(localKey, JSON.stringify([entry, ...entries].slice(0, 100))); }
    entries = [entry,...entries].slice(0,100); shown = Math.max(4,shown); renderEntries(); $('guest-form').reset(); setCopy($('character-count'), '0 / 300'); setCopy($('form-status'), shared ? '미래를 향한 메시지가 등록되었습니다.' : '이 브라우저에 메시지를 저장했습니다. 다른 기기에는 표시되지 않습니다.'); toast('미래로 향하는 발자취를 남겼어요.');
  } catch { setCopy($('form-status'), '저장하지 못했습니다. 입력 내용은 유지됩니다. 연결 또는 브라우저 저장소를 확인해 주세요.'); }
  finally { if (storageReadable) button.disabled = false; }
});
const news = $('news-dialog'); $('secret-trigger').addEventListener('click', () => news.showModal()); news.querySelector('.dialog-close').addEventListener('click', () => news.close()); news.addEventListener('click', event => { if (event.target === news) { const rect = news.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) news.close(); } });
