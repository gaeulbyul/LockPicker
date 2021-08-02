function isDark(colorThemeElem: HTMLMetaElement) {
  return colorThemeElem.content.toUpperCase() !== '#FFFFFF'
}

function toggleNightMode(dark: boolean): void {
  document.documentElement.classList.toggle('lockpicker-mobile-dark', dark)
  document.documentElement.classList.toggle('lockpicker-mobile-light', !dark)
}

function handleDarkMode() {
  const colorThemeTag = document.querySelector('meta[name=theme-color]')
  if (colorThemeTag instanceof HTMLMetaElement) {
    const nightModeObserver = new MutationObserver(() => {
      toggleNightMode(isDark(colorThemeTag))
    })

    nightModeObserver.observe(colorThemeTag, {
      attributeFilter: ['content'],
      attributes: true,
    })

    toggleNightMode(isDark(colorThemeTag))
  }
}

async function runLockPicker() {
  const lockpicker = new LockPicker()
  const users = await lockpicker.start()
  const count = users.length
  await sleep(100)
  window.alert(`완료! 프로텍트 팔로워를 총 ${count}명 찾았습니다.`)
}

function elemExists(qs: string): boolean {
  return document.querySelector(qs) !== null
}

browser.runtime.onMessage.addListener((msgobj: object) => {
  const message = msgobj as LPMessage
  switch (message.action) {
    case 'LockPicker/Start':
      if (elemExists('.mobcb-bg')) {
        window.alert('Mirror Of Block 작동중엔 사용할 수 없습니다.')
        return
      }
      if (elemExists('.redblock-dialog')) {
        window.alert('Red Block 작동중엔 사용할 수 없습니다.')
        return
      }
      if (elemExists('.lockpicker-dialog')) {
        window.alert('Lock Picker가 이미 실행중입니다.')
        return
      }
      void runLockPicker()
      break
  }
})

handleDarkMode()
