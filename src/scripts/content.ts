async function runLockPicker () {
  const lockpicker = new LockPicker()
  await lockpicker.start()
  void sleep(200).then(() => window.alert('완료!'))
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
