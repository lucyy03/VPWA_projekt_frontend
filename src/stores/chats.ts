import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const API_URL = import.meta.env.VITE_API_URL

export type ChatVisibility = 'public' | 'private'

export interface Member {
	id: number
	name: string
	avatar?: string
	color?: string
}

export interface Message {
	id: number
	authorId: number
	text: string
	createdAt: string
}

export interface Chat {
	id: number
	name: string
	isGroup: boolean
	visibility: ChatVisibility
	adminId: number | null
	members: Member[]
	lastPreview?: string
	lastStamp?: string
	unread?: number
}

function fmt(iso: string) {
	try {
		return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	} catch {
		return ''
	}
}

function escapeRe(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const useChatsStore = defineStore('chats', () => {
	const chats = ref<Chat[]>([])
	const messagesByChat = ref<Record<string, Message[]>>({})

	const authStore = useAuthStore()
	const me = computed(() => authStore.user)

	function getAuthHeaders() {
		if (!authStore.token) return {}
		return {
			Authorization: `Bearer ${authStore.token}`,
		}
	}

	async function fetchChats() {
        try {
            const res = await fetch(`${API_URL}/chats`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
            })
            if (!res.ok) {
                console.error('[chatsStore] fetchChats failed', res.status)
                return
            }
            const data: Chat[] = await res.json()
            chats.value = data
        } catch (err) {
            console.error('[chatsStore] fetchChats error', err)
        }
    }


	async function fetchChat(chatId: number) {
		try {
			const res = await fetch(`${API_URL}/chats/${chatId}`, {
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})
			if (!res.ok) {
				console.error('[chatsStore] fetchChat failed', res.status)
				return
			}
			const data: Chat = await res.json()
			const idx = chats.value.findIndex(c => c.id === data.id)
			if (idx === -1) {
				chats.value.push(data)
			} else {
				chats.value[idx] = data
			}
		} catch (err) {
			console.error('[chatsStore] fetchChat error', err)
		}
	}

	async function fetchMessages(chatId: number) {
		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})
			if (!res.ok) {
				console.error('[chatsStore] fetchMessages failed', res.status)
				return
			}
			const data: Message[] = await res.json()
			messagesByChat.value[chatId] = data
		} catch (err) {
			console.error('[chatsStore] fetchMessages error', err)
		}
	}

	async function sendMessage(chatId: number, text: string): Promise<Message | null> {
		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({ text }),
			})
			if (!res.ok) {
				console.error('[chatsStore] sendMessage failed', res.status)
				return null
			}
			const msg: Message = await res.json()
			if (!messagesByChat.value[chatId]) {
				messagesByChat.value[chatId] = []
			}
			messagesByChat.value[chatId].push(msg)
			return msg
		} catch (err) {
			console.error('[chatsStore] sendMessage error', err)
			return null
		}
	}

	function getMessages(chatId: number): Message[] {
		return messagesByChat.value[chatId] ?? []
	}

    //helpers
	function nameOf(chatId: number, authorId: number) {
        const c = chats.value.find(c => c.id === chatId)
        const m = c?.members.find(n => n.id === authorId)
        return m?.name || 'user'
    }

    function avatarOf(chatId: number, authorId: number) {
        const c = chats.value.find(c => c.id === chatId)
        const m = c?.members.find(n => n.id === authorId)
        if (!m || !me.value) return undefined
        if (m.id === me.value.id) return undefined
        if (m.avatar) return m.avatar
        return undefined
    }

    function isMention(chatId: number, m: Message): boolean {
        const c = chats.value.find(c => c.id === chatId)
        if (!c || !me.value) return false
        if (m.authorId === me.value.id) return false
        const handle = '@' + me.value.fullName
        const re = new RegExp(`(^|\\s)${escapeRe(handle)}(\\b|\\s|$)`, 'i')
        return re.test(m.text)
    }

	function isNew(chat: Chat | number): boolean {
        const id = typeof chat === 'number' ? chat : chat.id
        return !!chats.value.find(c => c.id === id && c.unread && c.unread > 0)
    }

	function getPeer(chat: Chat): Member | undefined {
        const currentUser = me.value
        if (!currentUser) return undefined
        if (chat.isGroup) return undefined
        return chat.members.find(m => m.id !== currentUser.id)
    }


	function getPeerImg(chat: Chat): string | undefined {
		return getPeer(chat)?.avatar ?? undefined
	}

	function getPeerLetter(chat: Chat): string {
		const name = getPeer(chat)?.name ?? '?'
		return name.charAt(0).toUpperCase()
	}

	function getPeerColor(chat: Chat): string {
		return getPeer(chat)?.color ?? 'grey-6'
	}

	function addMember(chatId: number): void {
		console.log('[chatsStore] addMember requested for chat:', chatId)
	}

	function deleteChat(chatId: number): void {
		console.log('[chatsStore] deleteChat requested for chat:', chatId)
	}

	function kickMember(chatId: number): void {
		console.log('[chatsStore] kickMember called for chat:', chatId)
	}

	function banMember(chatId: number): void {
		console.log('[chatsStore] banMember called for chat:', chatId)
	}

	return {
		chats,
		messagesByChat,
		fmt,
		nameOf,
		avatarOf,
		isMention,
		isNew,
		getPeer,
		getPeerImg,
		getPeerLetter,
		getPeerColor,
		addMember,
		deleteChat,
		kickMember,
		banMember,
		fetchChats,
		fetchChat,
		fetchMessages,
		sendMessage,
		getMessages,
	}
})