const enum Action {
  Start = 'LockPicker/Start',
}

function sleep(time: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, time))
}

function copyFrozenObject<T extends object>(obj: T): Readonly<T> {
  return Object.freeze(Object.assign({}, obj))
}

function formatTime(time: Date): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  })
  return formatter.format(time)
}

abstract class EventEmitter {
  protected events: EventStore = new Proxy(
    {},
    {
      get(target: EventStore, name: string) {
        const originalValue = Reflect.get(target, name)
        if (Array.isArray(originalValue)) {
          return originalValue
        }
        Reflect.set(target, name, [])
        return Reflect.get(target, name)
      },
    }
  )
  on<T>(eventName: string, handler: (t: T) => any) {
    this.events[eventName].push(handler)
    return this
  }
  emit<T>(eventName: string, eventHandlerParameter?: T) {
    const handlers = [...this.events[eventName], ...this.events['*']]
    // console.info('EventEmitter: emit "%s" with %o', eventName, eventHandlerParameter)
    handlers.forEach(handler => handler(eventHandlerParameter))
    return this
  }
}

interface TwitterUserEntities {
  [userId: string]: TwitterUser
}
class TwitterUserMap extends Map<string, TwitterUser> {
  public addUser(user: TwitterUser) {
    this.set(user.id_str, user)
  }
  public toUserArray(): TwitterUser[] {
    return Array.from(this.values())
  }
  public toUserObject(): TwitterUserEntities {
    const usersObj: TwitterUserEntities = {}
    for (const [userId, user] of this) {
      usersObj[userId] = user
    }
    return usersObj
  }
  public static fromUsersArray(users: TwitterUser[]): TwitterUserMap {
    return new TwitterUserMap(
      users.map((user): [string, TwitterUser] => [user.id_str, user])
    )
  }
  public filter(fn: (user: TwitterUser) => boolean): TwitterUserMap {
    return TwitterUserMap.fromUsersArray(this.toUserArray().filter(fn))
  }
}
