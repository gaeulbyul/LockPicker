type HTTPMethods = 'get' | 'delete' | 'post' | 'put'
type URLParamsObj = { [key: string]: string | number | boolean }

interface TwitterUser {
  id_str: string
  screen_name: string
  name: string
  blocked_by: boolean
  blocking: boolean
  muting: boolean
  followed_by: boolean
  // 2019년 5월부로 .followings 속성이 사라진다
  // following?: boolean
  follow_request_sent?: boolean
  friends_count: number
  followers_count: number
  protected: boolean
  verified: boolean
  created_at: string // datetime example: 'Sun Jun 29 05:52:09 +0000 2014'
  description: string
}

interface FollowsListResponse {
  next_cursor_str: string
  users: TwitterUser[]
}

interface FollowsIdsResponse {
  next_cursor_str: string
  ids: string[]
}

interface FollowsScraperOptions {
  delay: number
}

type ConnectionType =
  | 'following'
  | 'following_requested'
  | 'followed_by'
  | 'blocking'
  | 'blocked_by'
  | 'muting'
  | 'none'

interface Friendship {
  name: string
  screen_name: string
  id_str: string
  connections: ConnectionType[]
}

type FriendshipResponse = Friendship[]

interface Limit {
  limit: number
  remaining: number
  reset: number
}

interface LimitStatus {
  application: {
    '/application/rate_limit_status': Limit
  }
  blocks: {
    // note: POST API (create, destroy) not exists.
    '/blocks/list': Limit
    '/blocks/ids': Limit
  }
  followers: {
    '/followers/ids': Limit
    '/followers/list': Limit
  }
  friends: {
    '/friends/list': Limit
    '/friends/ids': Limit
  }
}

type LPStartMessage = {
  action: 'LockPicker/Start'
}

type LPMessage = LPStartMessage

interface EventStore {
  [eventName: string]: Function[]
}

interface BlockAllParameter {
  ids: string[]
}
