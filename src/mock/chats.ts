//no backend; simple shared mock data for list + detail
import { ref, computed } from 'vue'

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
      { id: 'richard', name: 'Richard', color: 'teal' }
    ],
    messages: [
      { id: 'm1', authorId: 'richard', text: 'bro, you won’t believe this dota match...', createdAt: '2025-04-01T07:14:00Z' }
    ],
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
      { id: 'lucia', name: 'Lucia', avatar: 'https://media.karousell.com/media/photos/products/2021/8/29/pet_commissions_updated_1630236394_c862862b_progressive.jpg' }
    ],
    messages: [
      { id: 'm1', authorId: 'lucia', text: 'see you later at the café ☕', createdAt: '2025-03-31T16:10:00Z' }
    ],
    unread: 0,
    lastStamp: 'Yesterday',
    lastPreview: 'see you later at the café ☕'
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
      { id: 'm1', authorId: 'g1', text: 'let’s meet at 5!', createdAt: '2025-03-30T12:00:00Z' }
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