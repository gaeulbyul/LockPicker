// @flow

async function executeLockPicker() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  const currentTab = tabs[0]
  if (!currentTab) {
    return
  }
  void browser.tabs.sendMessage<LPStartMessage>(currentTab.id as number, {
    action: 'LockPicker/Start',
  })
  window.close()
}

document.addEventListener('DOMContentLoaded', () => {
  document
    .querySelector('.menu-item.run-lock-picker')!
    .addEventListener('click', event => {
      event.preventDefault()
      void executeLockPicker()
    })
  const manifest = browser.runtime.getManifest()
  const currentVersion = document.querySelector<HTMLElement>('.currentVersion')
  currentVersion!.textContent = `버전: ${manifest.version}`
  currentVersion!.title = `Lock Picker 버전 ${
    manifest.version
  }을(를) 사용하고 있습니다.`
})
