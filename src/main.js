import './style.css'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim()
const model = 'gpt-5-mini'
const moods = [
  { id: 'anger', title: '분노', detail: '화가 나고 마음이 뜨거워요', colors: '빨강과 주황', swatch: 'anger' },
  { id: 'joy', title: '기쁨과 행복', detail: '좋은 일이 있어 마음이 환해요', colors: '노랑과 무지개', swatch: 'joy' },
  { id: 'sadness', title: '슬픔과 우울', detail: '마음이 가라앉고 무거워요', colors: '짙은 파랑과 회색', swatch: 'sadness' },
  { id: 'anxiety', title: '불안과 공포와 혼란', detail: '걱정이 많고 마음이 복잡해요', colors: '검정과 붉은 파편', swatch: 'anxiety' },
  { id: 'weight', title: '중압감과 삶의 무게', detail: '해야 할 일이 버겁게 느껴져요', colors: '갈색과 그라데이션', swatch: 'weight' },
  { id: 'calm', title: '평온과 치유', detail: '천천히 숨을 고르고 싶어요', colors: '연초록과 하늘색', swatch: 'calm' },
]

document.querySelector('#app').innerHTML = `
  <header class="topbar"><a class="wordmark" href="#top" aria-label="마음의 색 홈">마음의 색<span> / COLOR STUDY</span></a><div class="api-controls"><div class="api-state" id="api-state" role="status" aria-live="polite"><i></i><span>키 미설정</span></div><button id="check-api" class="check-api" type="button">API 연결 확인</button></div></header>
  <main id="top">
    <section class="intro" aria-labelledby="page-title"><div class="intro-copy"><p class="kicker">오늘의 감정 기록</p><h1 id="page-title">마음에도<br>색이 있다면</h1><p class="lede">지금 마음에 가까운 색을 골라보세요.<br>당신의 감정에 어울리는 응원의 말을 전할게요.</p></div><div class="color-study" data-mood="anger" aria-hidden="true"><div class="study-ring"></div><div class="study-disc"></div><span>01 — 06</span></div></section>
    <section class="workbench" aria-label="감정 선택과 응원 메시지">
      <div class="mood-panel"><div class="section-head"><div><p class="kicker">01 / 감정 선택</p><h2>어떤 마음인가요?</h2></div><span class="count">6가지 감정</span></div>
        <div class="mood-list">${moods.map((mood, index) => `<button class="mood-option${index === 0 ? ' is-selected' : ''}" type="button" data-mood="${mood.id}" aria-pressed="${index === 0}"><span class="swatch ${mood.swatch}" aria-hidden="true"></span><span class="mood-copy"><strong>${mood.title}</strong><small>${mood.detail}</small></span><span class="mood-colors">${mood.colors}</span><span class="selection-mark" aria-hidden="true"></span></button>`).join('')}</div>
        <label class="note-label" for="note">마음에 덧붙이고 싶은 말 <span>선택 사항</span></label><textarea id="note" maxlength="300" placeholder="무슨 일이 있었는지, 어떤 기분인지 적어도 좋아요."></textarea><div class="form-foot"><span id="char-count">0 / 300</span><button id="send-button" class="send-button" type="button"><span>응원 메시지 받기</span><span aria-hidden="true">↗</span></button></div>
      </div>
      <aside class="result-panel" data-mood="anger" aria-live="polite"><div class="result-top"><p class="kicker">02 / 마음의 응답</p><span class="spark" aria-hidden="true">✳</span></div><div id="result-content" class="result-content"><span class="result-index">A NOTE FOR YOU</span><h2>마음을 고르면<br>응원이 도착해요.</h2><p>어떤 감정이든 괜찮아요.<br>지금의 마음을 그대로 들여다봐요.</p></div><div class="result-bottom"><span>당신의 감정은 소중합니다.</span><span>COLOR STUDY · 2026</span></div></aside>
    </section>
    <p class="privacy-note">이 실습은 브라우저에서 OpenAI API를 직접 호출합니다. 입력한 내용은 메시지 생성 요청에 포함됩니다.</p>
  </main>
  <footer><span>마음의 색 — 작은 감정 기록</span><span>Responses API · ${model}</span></footer>
`

const state = document.querySelector('#api-state')
const sendButton = document.querySelector('#send-button')
const checkButton = document.querySelector('#check-api')
const result = document.querySelector('#result-content')
let selectedMood = moods[0]
let pending = false

function setState(label, kind = '') {
  state.className = `api-state${kind ? ` ${kind}` : ''}`
  state.querySelector('span').textContent = label
}

if (!apiKey) setState('키 미설정')
else setState('연결 미확인')

checkButton.addEventListener('click', async () => {
  if (pending) return
  if (!apiKey) {
    setState('키 미설정')
    result.innerHTML = '<span class="result-index">API KEY REQUIRED</span><h2>키를 먼저 설정해 주세요.</h2><p>프로젝트 루트의 .env.local에 API 키를 입력한 다음 개발 서버를 다시 시작해 주세요.</p>'
    return
  }

  pending = true
  checkButton.disabled = true
  checkButton.textContent = '연결 확인 중'
  setState('연결 미확인')
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: 'Reply with OK.', store: false, max_output_tokens: 16 }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw Object.assign(new Error(explainError(response.status, data.error?.message)), { status: response.status })
    setState('요청 성공', 'success')
    result.innerHTML = '<span class="result-index">API CONNECTION</span><h2>연결이 확인됐어요.</h2><p>Responses API 요청이 정상적으로 완료됐습니다. 감정을 골라 응원 메시지를 받아보세요.</p>'
  } catch (error) {
    setState(error.status ? '요청 실패' : '연결 오류', 'error')
    result.innerHTML = '<span class="result-index">REQUEST ISSUE</span><h2>연결을 확인하지 못했어요.</h2><p class="error-copy"></p>'
    result.querySelector('.error-copy').textContent = error.message || '네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
  } finally {
    pending = false
    checkButton.disabled = false
    checkButton.textContent = 'API 연결 확인'
  }
})

document.querySelectorAll('.mood-option').forEach((button) => {
  button.addEventListener('click', () => {
    if (pending) return
    selectedMood = moods.find((mood) => mood.id === button.dataset.mood)
    document.querySelectorAll('.mood-option').forEach((option) => {
      const active = option === button
      option.classList.toggle('is-selected', active)
      option.setAttribute('aria-pressed', String(active))
    })
    document.querySelector('.result-panel').dataset.mood = selectedMood.swatch
    document.querySelector('.color-study').dataset.mood = selectedMood.swatch
  })
})

document.querySelector('#note').addEventListener('input', (event) => {
  document.querySelector('#char-count').textContent = `${event.target.value.length} / 300`
})

function explainError(status, apiMessage) {
  if (status === 401) return 'API 키가 올바르지 않아요. .env.local의 키를 확인하고 개발 서버를 다시 시작해 주세요.'
  if (status === 403) return '이 키에 요청 권한이 없어요. 프로젝트 권한과 모델 접근을 확인해 주세요.'
  if (status === 429) return '요청 한도 또는 사용 가능 금액을 확인해 주세요. 잠시 후 다시 시도할 수 있어요.'
  if (status >= 500) return 'OpenAI 서비스에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
  if (apiMessage) return `요청을 처리하지 못했어요: ${apiMessage}`
  return '요청에 실패했어요. 네트워크와 API 설정을 확인해 주세요.'
}

sendButton.addEventListener('click', async () => {
  if (pending) return
  if (!apiKey) {
    setState('키 미설정')
    result.innerHTML = '<span class="result-index">API KEY REQUIRED</span><h2>키를 먼저 설정해 주세요.</h2><p>프로젝트 루트의 .env.local에 API 키를 입력한 다음 개발 서버를 다시 시작해 주세요.</p>'
    return
  }

  pending = true
  const requestedMood = selectedMood
  sendButton.disabled = true
  document.querySelectorAll('.mood-option').forEach((option) => { option.disabled = true })
  sendButton.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>마음을 살피는 중</span>'
  result.innerHTML = '<span class="result-index">A MOMENT, PLEASE</span><h2>응원할 말을<br>고르고 있어요.</h2><p class="loading-copy">잠시만 기다려 주세요.</p>'
  setState('연결 미확인')

  const note = document.querySelector('#note').value.trim()
  const input = `사용자의 감정: ${requestedMood.title}\n색의 이미지: ${requestedMood.colors}\n사용자가 덧붙인 말: ${note || '없음'}\n\n이 감정을 판단하거나 진단하지 말고, 감정을 인정하며 따뜻하고 구체적인 한국어 응원 메시지를 2~4문장으로 써 주세요. 사용자의 말을 존중하고 해결책을 강요하지 마세요. 위기 상황이 드러나지 않는 한 위기 대응 문구를 임의로 추가하지 마세요.`

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input, store: false, max_output_tokens: 180, safety_identifier: 'color-study-browser' }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw Object.assign(new Error(explainError(response.status, data.error?.message)), { status: response.status })

    setState('요청 성공', 'success')
    const message = (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim()
    if (!message) throw new Error('응답에 표시할 텍스트가 없어요. 다시 요청해 주세요.')
    result.innerHTML = `<span class="result-index">A NOTE FOR YOU</span><h2>${requestedMood.title}</h2><p class="message-text"></p>`
    result.querySelector('.message-text').textContent = message
  } catch (error) {
    if (error.status) setState('요청 실패', 'error')
    else if (!state.classList.contains('success')) setState('연결 오류', 'error')
    result.innerHTML = '<span class="result-index">REQUEST ISSUE</span><h2>응답을 가져오지 못했어요.</h2><p class="error-copy"></p>'
    result.querySelector('.error-copy').textContent = error.message || '네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
  } finally {
    pending = false
    sendButton.disabled = false
    document.querySelectorAll('.mood-option').forEach((option) => { option.disabled = false })
    sendButton.innerHTML = '<span>응원 메시지 받기</span><span aria-hidden="true">↗</span>'
  }
})
