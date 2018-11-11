class LockPicker {
  private ui = new LockPickerUI()
  private isRunning = false
  private foundUsers: Map<string, TwitterUser> = new Map()
  constructor () {
    this.handleEvents()
  }
  private handleEvents () {
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
    this.ui.on('ui:block-all', ({ ids }: BlockAllParameter) => {
      const users = ids.map(id => {
        return this.foundUsers.get(id)!
      })
      void this.blockAll(users)
    })
    this.ui.on('ui:bnub-all', ({ ids }: BlockAllParameter) => {
      const users = ids.map(id => {
        return this.foundUsers.get(id)!
      })
      void this.blockAndUnblockAll(users)
    })
  }
  public async blockAll (users: TwitterUser[]) {
    return Promise.all(users.map(async user => {
      const blockResult = await TwitterAPI.blockUser(user)
      this.ui.blocked(user, blockResult)
      return blockResult
    }))
    // return TwitterAPI.blockUser
  }
  public async blockAndUnblockAll (users: TwitterUser[]) {
    return Promise.all(users.map(async user => {
      const blockResult = await TwitterAPI.blockUser(user)
      const unblockResult = await TwitterAPI.unblockUser(user)
      const bnubResult = blockResult && unblockResult
      this.ui.blockAndUnblocked(user, bnubResult)
      return bnubResult
    }))
  }
  public async start () {
    const me = await TwitterAPI.getMyself()
    this.ui.updateMyInfo(me)
    this.isRunning = true
    try {
      let counter = 0
      for await (const follower of TwitterAPI.getAllFollowers(me)) {
        this.ui.setCounter(++counter)
        if (follower.following) {
          continue
        }
        if (follower.protected) {
          this.foundUsers.set(follower.id_str, follower)
        }
        this.ui.updateUsers(Array.from(this.foundUsers.values()))
      }
      this.ui.complete()
    } catch (err) {
      if (err instanceof TwitterAPI.RateLimitError) {
        const limits = await TwitterAPI.getRateLimitStatus()
        const flimit = limits.followers['/followers/list']
        const resetTime = new Date(flimit.reset * 1000)
        const timestr = formatTime(resetTime)
        window.alert(`리밋에러 발생! 20~3분 뒤에 다시 시도해주세요. (예상 리셋시간: ${timestr})`)
      } else {
        window.alert(`오류 발생! (메시지:${err.toString()})`)
        throw err
      }
    } finally {
      this.isRunning = false
    }
  }
}
