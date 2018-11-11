function toggleNightMode (mode: boolean) {
  document.documentElement!.classList.toggle('lockpicker-nightmode', mode)
}

const nightModeObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) {
        continue
      }
      if (node.matches('link.coreCSSBundles')) {
        const css = node as HTMLLinkElement
        const nightMode = /nightmode/.test(css.href)
        toggleNightMode(nightMode)
      }
    }
  }
})

function updateDarkModeClass () {
  const htmlElem = document.documentElement!
  htmlElem.classList.add('lockpicker-mobile')
  if (isDarkMode) {
    htmlElem.classList.add('lockpicker-mobile-dark')
    htmlElem.classList.remove('lockpicker-mobile-light')
  } else {
    htmlElem.classList.add('lockpicker-mobile-light')
    htmlElem.classList.remove('lockpicker-mobile-dark')
  }
}

const isDarkMode = /\bnight_mode=1\b/.test(document.cookie)
toggleNightMode(isDarkMode)

if (document.getElementById('react-root')) {
  updateDarkModeClass()
  window.setInterval(updateDarkModeClass, 3000)
} else {
  nightModeObserver.observe(document.head!, {
    childList: true,
    subtree: true
  })
}

async function runLockPicker () {
  const lockpicker = new LockPicker()
  const users = await lockpicker.start()
  const count = users.length
  void sleep(200).then(() => window.alert(`완료! 프로텍트 팔로워를 총 ${count}명 찾았습니다.`))
}

function elemExists (qs: string): boolean {
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
