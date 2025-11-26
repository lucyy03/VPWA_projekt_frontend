import { defineBoot } from '#q-app/wrappers'
import { io, type Socket } from 'socket.io-client'
import { watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useChatsStore } from 'src/stores/chats'
import type { Chat } from 'src/stores/chats'

let socket: Socket | null = null

export function getSocket(): Socket | null {
	return socket
}

export default defineBoot(({ store }) => {
	const authStore = useAuthStore(store)
	const chatsStore = useChatsStore(store)

	const baseUrl =
		import.meta.env.VITE_WS_URL ??
		import.meta.env.VITE_API_URL

	const s = io(baseUrl, {
		transports: ['websocket'],
		withCredentials: true,
	})

	socket = s

	s.on('connect', () => {
		console.log('[ws] connected', s.id)
		const id = authStore.user?.id
		if (id) {
			s.emit('register', id)
		}
	})

	s.on('disconnect', () => {
		console.log('[ws] disconnected')
	})

	watch(
		() => authStore.user?.id,
		id => {
			if (!id) return
			if (socket && socket.connected) {
                //socket is checked for null here so ts is happy
				socket.emit('register', id)
			}
		},
		{ immediate: true },
	)

	watch(
		() => authStore.user?.status,
		status => {
			const s = socket
			if (!s) return

			const user = authStore.user
			const normalized = (status ?? 'online').toLowerCase()

			//no logged-in user - ensure socket disconnected
			if (!user) {
				if (s.connected) {
					console.log('[ws] disconnecting socket, no user')
					s.disconnect()
				}
				return
			}

			//offline - stay disconnected
			if (normalized === 'offline') {
				if (s.connected) {
					console.log('[ws] disconnecting socket due to offline status')
					s.disconnect()
				}
				return
			}

			//online or dnd - ensure connected
			if (!s.connected) {
				console.log('[ws] reconnecting socket for status', normalized)
				s.connect()
			}
		},
		{ immediate: true },
	)

	s.on('chat:created', (chat: Chat) => {
		console.log('[ws] chat:created', chat)
		chatsStore.upsertChat(chat)
	})

	s.on('user:status', (payload: { chatId: number | null; userId: number; status: string | null }) => {
		console.log('[ws] user:status', payload)

		const chatId = payload.chatId
		const userId = payload.userId
		const status = payload.status ?? null

		//chat-specific update
		if (chatId !== null && Number.isFinite(Number(chatId))) {
			chatsStore.setMemberStatus(Number(chatId), userId, status)
		} else {
			//if we ever need to update across all chats for that user
			chatsStore.chats.forEach(c => {
				chatsStore.setMemberStatus(c.id, userId, status)
			})
		}
	})

    // s.on('message:new', (payload: WsMessagePayload) => {
    //     console.log('[ws] message:new received in boot', payload)

    //     const chatId = Number(payload.chatId)
    //     if (!Number.isFinite(chatId)) return

    //     const msg: Message = {
    //         id: payload.id,
    //         authorId: payload.authorId,
    //         text: payload.text,
    //         createdAt: payload.createdAt,
    //     }

    //     const messagesByChat = chatsStore.messagesByChat

    //     if (!messagesByChat[chatId]) {
    //         messagesByChat[chatId] = []
    //     }

    //     const exists = messagesByChat[chatId].some(m => m.id === msg.id)
    //     if (!exists) {
    //         messagesByChat[chatId].push(msg)
    //     }

    //     const chat = chatsStore.chats.find(c => c.id === chatId)
    //     if (chat) {
    //         chat.lastPreview = msg.text
    //         chat.lastStamp = msg.createdAt
    //     }
    // })
})