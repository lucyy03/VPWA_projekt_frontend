//no api; static mock data for demo
import { ref, computed } from 'vue'

export type Message = {
  id: string
  authorId: string
  text: string
  createdAt: string // iso string
}

export type Chat = {
  id: string
  name: string
  isGroup: boolean
  members: Array<{ id: string; name: string; avatar: string }>
  messages: Message[]
  unread: number
}

const me = { id: 'me', name: 'You', avatar: 'https://cdn.quasar.dev/img/boy-avatar.png' }

const chats = ref<Chat[]>([
  {
    id: 'team-core',
    name: 'Core Devs',
    isGroup: true,
    members: [
      me,
      { id: 'a1', name: 'Kai', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' },
      { id: 'a2', name: 'Nova', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' }
    ],
    messages: [
      { id: 'm1', authorId: 'a1', text: 'standup at 10?', createdAt: '2025-04-01T09:05:00Z' },
      { id: 'm2', authorId: 'me', text: 'works for me', createdAt: '2025-04-01T09:06:00Z' }
    ],
    unread: 2
  },
  {
    id: 'soren',
    name: 'Soren Wilde',
    isGroup: false,
    members: [me, { id: 'soren', name: 'Soren Wilde', avatar: 'https://cdn.quasar.dev/img/avatar6.jpg' }],
    messages: [
      { id: 'm1', authorId: 'soren', text: 'yo, push the branch?', createdAt: '2025-04-01T08:10:00Z' },
      { id: 'm2', authorId: 'me', text: 'just did', createdAt: '2025-04-01T08:12:00Z' }
    ],
    unread: 0
  },
  {
    id: 'design-squad',
    name: 'Design Squad',
    isGroup: true,
    members: [
      me,
      { id: 'd1', name: 'Kira', avatar: 'https://cdn.quasar.dev/img/avatar4.jpg' },
      { id: 'd2', name: 'Iris', avatar: 'https://cdn.quasar.dev/img/avatar5.jpg' },
      { id: 'd3', name: 'Ren', avatar: 'https://cdn.quasar.dev/img/avatar.png' }
    ],
    messages: [
      { id: 'm1', authorId: 'd2', text: 'new icons are ready', createdAt: '2025-04-01T07:40:00Z' }
    ],
    unread: 1
  }
])

export function useMockChats() {
  //helper: return chat by id
  const getChatById = (id: string) => computed(() => chats.value.find(c => c.id === id))
  //helper: last message text for preview
  const lastMessageOf = (chat: Chat) => chat.messages.at(-1)?.text ?? ''
  return { me, chats, getChatById, lastMessageOf }
}