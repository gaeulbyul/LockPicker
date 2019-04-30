class LockPicker {
  private ui = new LockPickerUI()
  private isRunning = false
  private foundUsers = new TwitterUserMap()
  constructor() {
    this.handleEvents()
  }
  private handleEvents() {
    this.ui.on('ui:close', () => {
      if (this.isRunning) {
        const confirmed = window.confirm(
          'LockPicker가 아직 실행중입니다. 그래도 중단하고 닫으시겠습니까?'
        )
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
  public async blockAll(users: TwitterUser[]) {
    return Promise.all(
      users.map(async user => {
        const blockResult = await TwitterAPI.blockUser(user)
        this.ui.blocked(user, blockResult)
        return blockResult
      })
    )
    // return TwitterAPI.blockUser
  }
  public async blockAndUnblockAll(users: TwitterUser[]) {
    return Promise.all(
      users.map(async user => {
        const blockResult = await TwitterAPI.blockUser(user)
        const unblockResult = await TwitterAPI.unblockUser(user)
        const bnubResult = blockResult && unblockResult
        this.ui.blockAndUnblocked(user, bnubResult)
        return bnubResult
      })
    )
  }
  // 2019년 5월부로 .followings 속성이 사라진다
  // 따라서, 대체제로 friendships/lookup API를 사용하는 방식으로
  // 변경함
  public async start(): Promise<TwitterUser[]> {
    const me = await TwitterAPI.getMyself()
    this.ui.updateMyInfo(me)
    this.isRunning = true
    try {
      const protectedFollowers = new TwitterUserMap()
      let counter = 0
      for await (const follower of TwitterAPI.getAllFollowers(me)) {
        console.dir(
          `user #${counter}: @${follower.screen_name} <ID:${follower.id_str}>`
        )
        this.ui.setCounter(++counter)
        if (follower.protected) {
          protectedFollowers.addUser(follower)
        }
        if (protectedFollowers.size >= 100) {
          const usersArray = protectedFollowers.toUserArray()
          const friendships = await TwitterAPI.getFriendships(usersArray).catch(
            error => {
              console.error(error)
              return []
            }
          )
          for (const fship of friendships) {
            const { id_str, connections } = fship
            if (connections.includes('following')) {
              continue
            }
            const thatUser = protectedFollowers.get(id_str)!
            this.foundUsers.addUser(thatUser)
            this.ui.updateUsers(this.foundUsers.toUserArray())
          }
          protectedFollowers.clear()
        }
      }
      this.ui.complete(this.foundUsers.toUserArray())
    } catch (err) {
      if (err instanceof TwitterAPI.RateLimitError) {
        const limits = await TwitterAPI.getRateLimitStatus()
        const flimit = limits.followers['/followers/list']
        const resetTime = new Date(flimit.reset * 1000)
        const timestr = formatTime(resetTime)
        window.alert(
          `리밋에러 발생! 20~3분 뒤에 다시 시도해주세요. (예상 리셋시간: ${timestr})`
        )
      } else {
        window.alert(`오류 발생! (메시지:${err.toString()})`)
        throw err
      }
    } finally {
      this.isRunning = false
    }
    return Array.from(this.foundUsers.values())
  }
}
