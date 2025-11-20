// src/boot/socket.ts
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

	s.on('chat:created', (chat: Chat) => {
		console.log('[ws] chat:created', chat)
		chatsStore.upsertChat(chat)
	})
})
