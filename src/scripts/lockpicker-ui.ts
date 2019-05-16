const LOCK_PICKER_UI_HTML = `
  <div class="lockpicker-dialog modal-content is-autoPosition">
    <div class="lockpicker-title">
      &#128274; Lock Picker
    </div>
    <progress class="lockpicker-progress"></progress>
    <div class="lockpicker-progress-text">
      내 팔로워
      <span class="lockpicker-total-followers">0</span>
      명 중 프로텍트 구독계는...
    </div>
    <div class="lockpicker-found-user-area">
      <ul class="lockpicker-found-user-list"></ul>
    </div>
    <hr>
    <div class="lockpicker-controls">
      <button disabled class="lockpicker-block-all small btn action-btn caution-btn">차단하기</button>
      <button disabled class="lockpicker-bnub-all small btn action-btn caution-btn">블언블하기</button>
      <button class="lockpicker-close small btn normal-btn">닫기</button>
    </div>
  </div>
`

class LockPickerUI extends EventEmitter {
  private rootElem = document.createElement('div')
  private userItems = new Map<string, HTMLElement>()
  private progressBar!: HTMLProgressElement
  constructor() {
    super()
    this.rootElem.className = 'lockpicker-bg'
    this.rootElem.innerHTML = LOCK_PICKER_UI_HTML
    this.attachEvents()
    this.progressBar = this.rootElem.querySelector<HTMLProgressElement>(
      '.lockpicker-progress'
    )!
    document.body.appendChild(this.rootElem)
  }
  private attachEvents() {
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
        const ids = Array.from(
          this.rootElem.querySelectorAll<HTMLElement>(
            'li.lockpicker-user[data-user-id]'
          )
        ).map(elem => elem.getAttribute('data-user-id')!)
        this.emit<BlockAllParameter>('ui:block-all', { ids })
        this.setControlsAvaility('disable')
      } else if (target.matches('.lockpicker-bnub-all')) {
        event.preventDefault()
        const confirmMessage = '정말로 위 사용자들을 모두 블언블하시겠습니까?'
        if (!window.confirm(confirmMessage)) {
          return
        }
        const ids = Array.from(
          this.rootElem.querySelectorAll<HTMLElement>(
            'li.lockpicker-user[data-user-id]'
          )
        ).map(elem => elem.getAttribute('data-user-id')!)
        this.emit<BlockAllParameter>('ui:bnub-all', { ids })
        this.setControlsAvaility('disable')
      }
    })
  }
  public close() {
    this.rootElem.remove()
  }
  public setCounter(val: number) {
    this.progressBar.value = val
  }
  public blocked(user: TwitterUser, result: boolean) {
    const className = result ? 'blocked' : 'blockfailed'
    const item = this.userItems.get(user.id_str)!
    item.classList.add(className)
  }
  public blockAndUnblocked(user: TwitterUser, result: boolean) {
    const className = result ? 'bnubed' : 'blockfailed'
    const item = this.userItems.get(user.id_str)!
    item.classList.add(className)
  }
  public updateMyInfo(me: TwitterUser) {
    this.rootElem.querySelector(
      '.lockpicker-total-followers'
    )!.textContent = me.followers_count.toString()
    this.progressBar.max = me.followers_count
  }
  public updateUsers(users: TwitterUser[]) {
    const userList = this.rootElem.querySelector('.lockpicker-found-user-list')!
    const addUserItem = (user: TwitterUser): HTMLElement => {
      const templ = `
        <span class="nickname"></span>
        <a href="https://twitter.com/" target="_blank" rel="noopener noreferer"></a>
        <span class="extra" style="font-size:small"></span>
      `.trim()
      const item = document.createElement('li')
      item.className = 'lockpicker-user'
      item.innerHTML = templ
      const createAt = new Date(user.created_at).toLocaleDateString()
      let tooltip = `${user.name} (@${user.screen_name})
계정생성일: ${createAt}
      `.trim()
      if (user.description.trim().length > 0) {
        tooltip += '\n'
        tooltip += `프로필: ${user.description}`.trim()
      }
      item.title = tooltip
      const text = item.querySelector('span.nickname')!
      const link = item.querySelector('a')!
      item.setAttribute('data-user-id', user.id_str)
      text.textContent = user.name
      link.pathname = `/${user.screen_name}`
      link.textContent = `(@${user.screen_name})`
      // TODO
      // const extra = item.querySelector('span.extra')!
      // if (user.follow_request_sent) {
      //   extra.textContent = '(팔로우 요청 대기 중)'
      // }
      this.userItems.set(user.id_str, item)
      return item
    }
    const hasUserItem = (user: TwitterUser) => {
      return this.userItems.has(user.id_str)
    }
    for (const user of users) {
      if (hasUserItem(user)) {
        continue
      }
      const item = addUserItem(user)
      userList.appendChild(item)
    }
  }
  public setControlsAvaility(enabled: 'enable' | 'disable') {
    const disabled = enabled === 'disable'
    this.rootElem
      .querySelectorAll<HTMLButtonElement>(
        '.lockpicker-controls button.action-btn'
      )
      .forEach(btn => {
        btn.disabled = disabled
      })
  }
  public complete(users: TwitterUser[]) {
    this.progressBar.value = this.progressBar.max
    this.setControlsAvaility('enable')
    if (users.length <= 0) {
      this.close()
    }
  }
}
