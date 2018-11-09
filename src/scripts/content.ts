/* TODO
block및 block-un-block 구현
UI 반영
(체크박스?)

 */


const LOCK_PICKER_UI_HTML = `
  <div class="lockpicker-dialog modal-content is-autoPosition">
    <progress class="lockpicker-progress"></progress>
    <div class="lockpicker-progress-text">
      내 팔로워
      <span class="lockpicker-total-followers">0</span>
      명 중 프로텍트 구독계는...
    </div>
    <div class="lockpicker-found-user-area">
      <ul class="lockpicker-found-user-list"></ul>
    </div>
    <div class="lockpicker-controls">
      <button disabled class="lockpicker-block-all small btn caution-btn">차단하기</button>
      <button disabled class="lockpicker-bnub-all small btn caution-btn">블언블하기</button>
      <button class="lockpicker-close small btn normal-btn">닫기</button>
    </div>
  </div>
`

// for debug
async function fakeBlock (user: TwitterUser) {
  console.info('blocking user %s', user.screen_name)
  await sleep(250)
  return true
}

async function fakeBnUB(user: TwitterUser) {
  console.info('b-n-ubing user %s', user.screen_name)
  await fakeBlock(user)
  await sleep(150)
  return true
}

function formatTime (date: Date): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit'
  })
  return formatter.format(date)
}

class LockPickerUI extends EventEmitter {
  private rootElem = document.createElement('div')
  private addedItems = new Set<string>()
  constructor () {
    super()
    this.rootElem.className = 'lockpicker-bg'
    this.rootElem.innerHTML = LOCK_PICKER_UI_HTML
    this.attachEvents()
    document.body.appendChild(this.rootElem)
  }
  private attachEvents () {
    this.rootElem.addEventListener('click', event => {
      if (!event.target) {
        return
      }
      const target = event.target as HTMLElement
      if (target.matches('.lockpicker-close')) {
        event.preventDefault()
        this.emit('ui:close')
        return
      } else if (target.matches('.lockpicker-block-all')) {
        event.preventDefault()
        const confirmMessage = '정말로 위 사용자들을 모두 차단하시겠습니까?'
        if (!window.confirm(confirmMessage)) {
          return
        }
        this.emit('ui:do-block-all')
      } else if (target.matches('.lockpicker-bnub-all')) {
        event.preventDefault()
        const confirmMessage = '정말로 위 사용자들을 모두 블언블하시겠습니까?'
        if (!window.confirm(confirmMessage)) {
          return
        }
        this.emit('ui:do-bnub-all')
      }
    })
  }
  public close () {
    this.rootElem.remove()
  }
  public incrementCounter() {
    ++this.rootElem.querySelector<HTMLProgressElement>('.lockpicker-progress')!.value
  }
  public updateMyInfo (me: TwitterUser) {
    this.rootElem.querySelector('.lockpicker-total-followers')!.textContent = me.followers_count.toString()
    this.rootElem.querySelector<HTMLProgressElement>('.lockpicker-progress')!.max = me.followers_count
  }
  public updateUsers (users: TwitterUser[]) {
    const userList = this.rootElem.querySelector('.lockpicker-found-user-list')!
    const addUserItem = (user: TwitterUser): HTMLElement => {
      const templ = `
        <span class="nickname"></span>
        <a href="https://twitter.com/" target="_blank" rel="noopener noreferer"></a>
        <span class="extra" style="font-size:small"></span>
      `.trim()
      const item = document.createElement('li')
      item.innerHTML = templ
      const createAt = new Date(user.created_at).toLocaleDateString()
      item.title = `${user.name} (@${user.screen_name})
계정생성일: ${createAt}
프로필: ${user.description}
`.trim()
      const text = item.querySelector('span.nickname')!
      const link = item.querySelector('a')!
      item.setAttribute('data-user-id', user.id_str)
      text.textContent = user.name
      link.pathname = `/${user.screen_name}`
      link.textContent = `(@${user.screen_name})`
      const extra = item.querySelector('span.extra')!
      if (user.follow_request_sent) {
        extra.textContent = '(팔로우 요청 대기 중)'
      }
      this.addedItems.add(user.id_str)
      return item
    }
    const hasUserItem = (user: TwitterUser) => {
      return this.addedItems.has(user.id_str)
      // return userList.querySelector(`li[data-user-id="${user.id_str}"]`) !== null
    }
    for (const user of users) {
      if (hasUserItem(user)) {
        continue
      }
      const item = addUserItem(user)
      userList.appendChild(item)
    }
  }
  public complete () {
    this.rootElem.querySelectorAll<HTMLButtonElement>('.lockpicker-controls button.btn').forEach(btn => {
      btn.disabled = false
    })
  }
}

class LockPicker {
  private ui = new LockPickerUI
  private isRunning = false
  constructor () {
    //
  }
  handleEvents () {
    this.ui.on('ui:close', () => {
      if (this.isRunning) {
        const confirmed = window.confirm('LockPicker가 아직 실행중입니다. 그래도 중단하고 닫으시겠습니까?')
        if (confirmed) {
          this.ui.close()
        }
      } else {
        this.ui.close()
      }
    })
  }
  async start () {
    const me = await TwitterAPI.getMyself()
    this.ui.updateMyInfo(me)
    const foundUsers: TwitterUser[] = []
    this.isRunning = true
    try {
      for await (const follower of TwitterAPI.getAllFollowers(me)) {
        this.ui.incrementCounter()
        if (follower.following) {
          continue
        }
        if (follower.protected) {
          foundUsers.push(follower)
        }
        this.ui.updateUsers(Array.from(foundUsers))
      }
      this.ui.complete()
    } catch (err) {
      if (err instanceof TwitterAPI.RateLimitError) {
        /* TODO
        const limits = await TwitterAPI.getRateLimitStatus()
        const flimit = limits.followers['/followers/list']
        const resetTime = new Date(flimit.reset * 1000)
        */
        window.alert(`리밋에러 발생! 20~3분 뒤에 다시 시도해주세요. (예상 리셋시간:)`)
      } else {
        window.alert(`오류 발생! (메시지:${err.toString()})`)
        throw err
      }
    } finally {
      this.isRunning = false
    }
  }
}

async function runLockPicker () {
  const lockpicker = new LockPicker()
  await lockpicker.start()
  window.alert('완료!')
}

browser.runtime.onMessage.addListener((msgobj: object) => {
  const message = msgobj as LPMessage
  switch (message.action) {
    case 'LockPicker/Start':
      if (document.querySelector('.mobcb-bg') != null) {
        window.alert('Mirror Of Block 작동중엔 사용할 수 없습니다.')
        return
      }
      void runLockPicker()
      break
  }
})
