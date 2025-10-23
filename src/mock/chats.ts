//no backend; simple shared mock data for list + detail
import { ref, computed } from 'vue'

let msgSeq = 1

export type Message = {
  id: string
  authorId: string
  text: string
  createdAt: string
}
export type Member = { id: string; name: string; avatar?: string; color?: string }
export type Chat = {
  id: string
  name: string
  isGroup: boolean
  members: Member[]
  messages: Message[]
  unread: number
  lastStamp: string
  lastPreview: string
}

export const me: Member = { id: 'me', name: 'You', avatar: 'https://cdn.quasar.dev/img/boy-avatar.png' }

function makeStaticHistory(authorId: string, meId: string, count: number, startIso = '2025-03-28T09:00:00Z'): Message[] {
  const out: Message[] = []
  let t = new Date(startIso).getTime()
  for (let i = 0; i < count; i++) {
    const fromPeer = i % 2 === 0
    out.push({
      id: 'r' + (msgSeq++),
      authorId: fromPeer ? authorId : meId,
      text: fromPeer ? `msg ${i + 1} from ${authorId}` : `reply ${i + 1}`,
      createdAt: new Date(t).toISOString()
    })
    //fixed +60 seconds between messages
    t += 60 * 1000
  }
  return out
}

export const chats = ref<Chat[]>([
  {
    id: 'jim',
    name: 'Jim Halpert',
    isGroup: false,
    members: [
      me,
      { id: 'jim', name: 'Jim Halpert', avatar: 'https://i.pinimg.com/1200x/28/b2/99/28b2999aee9c8bfd2a3e7d8a7ad55f88.jpg' }
    ],
    messages: [
      { id: 'm1', authorId: 'jim', text: 'hey, are we still on for tomorrow?', createdAt: '2025-04-01T10:30:00Z' },
      { id: 'm2', authorId: 'me', text: 'yep!', createdAt: '2025-04-01T10:31:00Z' }
    ],
    unread: 2,
    lastStamp: '12:30',
    lastPreview: 'hey, are we still on for tomorrow?'
  },
  {
    id: 'richard',
    name: 'Richard',
    isGroup: false,
    members: [
      me,
      { id: 'richard', name: 'Richard', avatar: 'https://media.discordapp.net/attachments/787479869339860995/1429086875842383992/image.png?ex=68f4dc5e&is=68f38ade&hm=139cd9c65e542a9e455d27c655c5837631b258ae51f1936d084498e5865970a0&=&format=webp&quality=lossless&width=464&height=386' }
    ],
    //prefill with a lot of messages, static history so infinite scroll has plenty to reveal
    messages: makeStaticHistory('richard', me.id, 250, '2025-03-28T09:00:00Z'),
    unread: 0,
    lastStamp: '09:14',
    lastPreview: '“bro, you won’t believe this dota match...”'
  },
  {
    id: 'lucia',
    name: 'Lucia',
    isGroup: false,
    members: [
      me,
      { id: 'lucia', name: 'Lucia', avatar: 'https://media.discordapp.net/attachments/787479869339860995/1429084887255875594/Screenshot_20251018-143233_Gallery.jpg?ex=68f4da84&is=68f38904&hm=14983b05f58d951adc8818aa67086474a1fe0e76c3f6092640fc0ec3f31d77ef&=&format=webp&width=918&height=912' }
    ],
    messages: [
      { id: 'm1', authorId: 'lucia', text: 'see you later at the café ☕', createdAt: '2025-03-31T16:10:00Z' }
    ],
    unread: 0,
    lastStamp: 'Yesterday',
    lastPreview: 'see you later at the café ☕'
  },
  {
    id: 'leo',
    name: 'Leo',
    isGroup: false,
    members: [
      me,
      { id: 'leo', name: 'Leo', avatar: 'https://media.discordapp.net/attachments/787479869339860995/1429088297027899403/image.png?ex=68f4ddb1&is=68f38c31&hm=86241581b0ccc1b3268e6b8bee1e700f30dcf088c232ae41e69cd61582be5947&=&format=webp&quality=lossless&width=654&height=600' }
    ],
    messages: [
      { id: 'm1', authorId: 'leo', text: '“Woof! ૮₍´｡ᵔ ꈊ ᵔ｡`₎ა”', createdAt: '2025-03-31T18:10:00Z' }
    ],
    unread: 0,
    lastStamp: '18:46',
    lastPreview: '“Woof! ૮₍´｡ᵔ ꈊ ᵔ｡`₎ა”'
  },
  {
    id: 'group-core',
    name: 'Group Chat',
    isGroup: true,
    members: [
      me,
      { id: 'g1', name: 'Alex', color: 'orange' },
      { id: 'g2', name: 'Kai', color: 'purple' }
    ],
    messages: [
      { id: 'm1', authorId: 'g1', text: 'let’s meet at 5!', createdAt: '2025-03-30T12:00:00Z' },
      { id: 'm1', authorId: 'g1', text: '@You', createdAt: '2025-03-30T12:00:00Z' },
      { id: 'm1', authorId: 'g1', text: '@someone_else', createdAt: '2025-03-30T12:00:00Z' }
    ],
    unread: 0,
    lastStamp: 'Mon',
    lastPreview: 'Alex: let’s meet at 5!'
  }
])

export function getChatById(id: string) {
  return computed(() => chats.value.find(c => c.id === id))
}
export function avatarFor(member: Member): { img?: string; letter?: string; color?: string } {
  if (member.avatar) return { img: member.avatar }
  return { letter: member.name.charAt(0).toUpperCase(), color: member.color || 'grey-6' }
}
