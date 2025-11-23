import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { getSocket } from 'boot/socket'
import { useQuasar } from 'quasar'

const API_URL = import.meta.env.VITE_API_URL

export type ChatVisibility = 'public' | 'private'

export interface WsMessagePayload {
	id: number
	chatId: number
	authorId: number
	text: string
	createdAt: string
}

export interface WsSendAck {
	ok: boolean
	error?: string
	message?: WsMessagePayload
}

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
	invitationStatus?: 'pending' | 'accepted' | 'declined'
}

export interface TypingState {
	chatId: number
	userId: number
	draft: string
	isTyping: boolean
	updatedAt: number
}

export type WsNotificationPayload =
	| {
			type: 'channel-invite'
			chatId: number
			chatName: string
			fromUserId: number
			fromNickname: string
	  }
	| {
			type: 'message'
			chatId: number
			chatName: string
			msgId: number
			fromUserId: number
			fromNickname: string
			preview: string
	  }
	| {
			type: 'mention'
			chatId: number
			chatName: string
			msgId: number
			fromUserId: number
			fromNickname: string
			preview: string
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
	const messagesByChat = ref<Record<number, Message[]>>({})
	const typingByChat = ref<Record<number, TypingState | null>>({})

	const authStore = useAuthStore()
	const me = computed(() => authStore.user)
	const $q = useQuasar()

	const joinedChats = ref<Set<number>>(new Set())

	//track if ws listeners were attached
	let wsReady = false

	//get socket safely
	function ensureSocket() {
		const s = getSocket()
		if (!s) {
			console.warn('[chatsStore] socket not available yet')
			return null
		}
		return s
	}

	function clearTypingFor(chatId: number, userId: number) {
		const ts = typingByChat.value[chatId]
		if (ts && ts.userId === userId) {
			delete typingByChat.value[chatId]
		}
	}

	//handle a single incoming message payload from ws
	function handleIncomingMessage(payload: WsMessagePayload) {
		console.log('[chatsStore] message:new received', payload)

		const chatId = Number(payload.chatId)
		if (!Number.isFinite(chatId)) return

		const msg: Message = {
			id: payload.id,
			authorId: payload.authorId,
			text: payload.text,
			createdAt: payload.createdAt,
		}

		const current = messagesByChat.value[chatId] ?? []

		const exists = current.some(m => m.id === msg.id)
		if (!exists) {
			//create a new array so watchers see a new reference so its reactive and so i dont waste an entire day trying to figure out this fuckass bullshit
			messagesByChat.value[chatId] = [...current, msg]
		}

		const chat = chats.value.find(c => c.id === chatId)
		if (chat) {
			chat.lastPreview = msg.text
			chat.lastStamp = msg.createdAt
		}
	}

	function handleNotification(payload: WsNotificationPayload) {
		console.log('[chatsStore] notification', payload)

		if (payload.type === 'message') {
			$q.notify({
				icon: 'chat',
				color: 'secondary',
				position: 'bottom-right',
				timeout: 5000,
				message: `new message in #${payload.chatName}`,
				caption: `from @${payload.fromNickname}: ${payload.preview}`,
			})
		}

		if (payload.type === 'mention') {
			$q.notify({
				icon: 'alternate_email',
				color: 'accent',
				position: 'bottom-right',
				timeout: 10000,
				message: `mentioned by @${payload.fromNickname}`,
				caption: payload.preview,
			})
		}

		if (payload.type === 'channel-invite') {
			$q.notify({
				icon: 'group_add',
				color: 'primary',
				position: 'bottom-right',
				timeout: 10000,
				message: 'channel invite',
				caption: `you were invited to #${payload.chatName} by @${payload.fromNickname}`,
				actions: [
					{
						label: 'Open',
						color: 'white',
						handler: () => {
							//todo: navigate to channel by id (use router in component)
						},
					},
				],
			})
		}
		
	}

	//attach listeners only once
	function setupSocketListeners() {
		if (wsReady) return

		const socket = ensureSocket()
		if (!socket) return

		socket.on('message:new', handleIncomingMessage)
		socket.on('notification', handleNotification)

		socket.on('typing', (payload: { chatId: number; userId: number; draft: string; isTyping: boolean }) => {
			console.log('[chatsStore] typing event', payload)

			const user = me.value
			if (!user) return

			//ignore our own typing echoed back
			if (payload.userId === user.id) return

			const chatId = Number(payload.chatId)
			if (!Number.isFinite(chatId)) return

			if (!payload.isTyping) {
				//stop typing
				delete typingByChat.value[chatId]
				return
			}

			typingByChat.value[chatId] = {
				chatId,
				userId: payload.userId,
				draft: payload.draft ?? '',
				isTyping: true,
				updatedAt: Date.now(),
			}
		})

		socket.on('chat:removed', (payload: { chatId: number; reason?: string }) => {
			console.log('[chatsStore] chat:removed', payload)

			const id = payload.chatId
			chats.value = chats.value.filter(c => c.id !== id)
			delete messagesByChat.value[id]
			delete typingByChat.value[id]
			joinedChats.value.delete(id)
		})

		socket.on('chat:memberAccepted', (payload: { chatId: number; member: Member }) => {
			console.log('[chatsStore] chat:memberAccepted', payload)

			const chat = chats.value.find(c => c.id === payload.chatId)
			if (!chat) return

			const alreadyIn = chat.members.some(m => m.id === payload.member.id)
			if (!alreadyIn) {
				chat.members.push(payload.member)
			}
		})

		socket.on('chat:memberKicked', (payload: { chatId: number; userId: number; by?: string }) => {
			console.log('[chatsStore] chat:memberKicked', payload)
			const chat = chats.value.find(c => c.id === payload.chatId)
			if (!chat) return
			chat.members = chat.members.filter(m => m.id !== payload.userId)
			clearTypingFor(payload.chatId, payload.userId)
		})

		socket.on('chat:left', (payload: { chatId: number, userId: number }) => {
			console.log('[chatsStore] chat:left', payload)

			const chat = chats.value.find(c => c.id === payload.chatId)
			if (!chat) return

			chat.members = chat.members.filter(m => m.id !== payload.userId)
			clearTypingFor(payload.chatId, payload.userId)
		})
		socket.on('chat:memberBanned', (payload: { chatId: number; userId: number }) => {
			console.log('[chatsStore] chat:memberBanned', payload)
			const chat = chats.value.find(c => c.id === payload.chatId)
			if (!chat) return

			chat.members = chat.members.filter(m => m.id !== payload.userId)
			clearTypingFor(payload.chatId, payload.userId)
		})


		wsReady = true
		console.log('[chatsStore] websocket listeners attached')
	}

	function sendTyping(chatId: number, draft: string) {
		const user = authStore.user
		if (!user) return

		const socket = ensureSocket()
		if (!socket || !socket.connected) return

		//attach listeners just in case
		setupSocketListeners()

		const isTyping = draft.trim().length > 0

		socket.emit('typing', {
			chatId,
			userId: user.id,
			draft,
			isTyping,
		})
	}

	function getTyping(chatId: number): TypingState | null {
		return typingByChat.value[chatId] ?? null
	}

	//public initializer so boot file can force attaching listeners
	function initWs() {
		console.log('[chatsStore] initWs called')
		setupSocketListeners()
	}

	function joinChatRoom(chatId: number) {
		if (joinedChats.value.has(chatId)) return

		const socket = ensureSocket()
		if (!socket) return

		//attach listeners when first joining any chat as a backup
		setupSocketListeners()

		if (!socket.connected) {
			console.warn('[chatsStore] joinChatRoom: waiting for connection')
			socket.once('connect', () => {
				socket.emit('joinChannel', chatId)
				joinedChats.value.add(chatId)
				console.log('[chatsStore] joined chat after connect:', chatId)
			})
			return
		}

		socket.emit('joinChannel', chatId)
		joinedChats.value.add(chatId)
		console.log('[chatsStore] joined chat:', chatId)
	}

	function getAuthHeaders() {
		if (!authStore.token) return {}
		return {
			Authorization: `Bearer ${authStore.token}`,
		}
	}

	function upsertChat(chat: Chat) {
		const idx = chats.value.findIndex(c => c.id === chat.id)
		if (idx === -1) {
			chats.value.push(chat)
		} else {
			chats.value[idx] = chat
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
			console.log('[chatsStore] fetchChats data:', data)
			chats.value = data

			//join only chats where invitation is not pending
			for (const chat of data) {
				if (chat.invitationStatus === 'pending') {
					continue
				}
				joinChatRoom(chat.id)
			}
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

			//update preview + timestamp based on last message
			const last = data[data.length - 1]
			if (last) {
				const chat = chats.value.find(c => c.id === chatId)
				if (chat) {
					chat.lastPreview = last.text
					chat.lastStamp = last.createdAt
				}
			}
		} catch (err) {
			console.error('[chatsStore] fetchMessages error', err)
		}
	}

	async function createChat(payload: {
		name: string
		isGroup: boolean
		visibility?: ChatVisibility
		memberIds?: number[]
		nicknames?: string | string[]
	}): Promise<Chat | null> {
		try {
			const memberIds: number[] = payload.memberIds ? [...payload.memberIds] : []

			const rawNicknames = payload.nicknames
			if (rawNicknames) {
				const list = Array.isArray(rawNicknames)
					? rawNicknames
					: rawNicknames.split(',').map(n => n.trim())

				for (const nickname of list) {
					if (!nickname) continue

					const resUser = await fetch(
						`${API_URL}/users/by-nickname/${encodeURIComponent(nickname)}`,
						{
							headers: {
								'Content-Type': 'application/json',
								...getAuthHeaders(),
							},
						},
					)

					if (resUser.status === 404) {
						console.warn('[chatsStore] nickname not found:', nickname)
						continue
					}

					if (!resUser.ok) {
						console.error('[chatsStore] user lookup failed', nickname, resUser.status)
						continue
					}

					const user: { id: number } = await resUser.json()
					if (!memberIds.includes(user.id)) {
						memberIds.push(user.id)
					}
				}
			}

			const res = await fetch(`${API_URL}/chats`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({
					name: payload.name,
					isGroup: payload.isGroup,
					visibility: payload.visibility ?? 'private',
					memberIds,
				}),
			})

			if (!res.ok) {
				console.error('[chatsStore] createChat failed', res.status)
				return null
			}

			const chat: Chat = await res.json()
			chats.value.push(chat)
			return chat
		} catch (err) {
			console.error('[chatsStore] createChat error', err)
			return null
		}
	}

	async function joinOrCreateByName(
		name: string,
		visibility: ChatVisibility,
	): Promise<Chat | null> {
		try {
			const res = await fetch(
				`${API_URL}/chats/join`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
					body: JSON.stringify({ name, visibility }),
				},
			)

			if (!res.ok) {
				console.error('[chatsStore] joinOrCreateByName failed', res.status)
				return null
			}

			const chat: Chat = await res.json()

			//this ensures the chats array is updated reactively
			upsertChat(chat)

			return chat
		} catch (err) {
			console.error('[chatsStore] joinOrCreateByName error', err)
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

		const u = me.value

		const nick =
			u.nickname ??
			u.fullName ??
			u.email

		if (!nick) return false

		const handle = '@' + nick
		const re = new RegExp(`(^|\\s)${escapeRe(handle)}(\\b|\\s|$)`, 'i')
		return re.test(m.text)
	}

	function isNew(chat: Chat | number): boolean {
		const id = typeof chat === 'number' ? chat : chat.id
		const c = chats.value.find(c => c.id === id)
		if (!c) return false

		//pending invitations are always highlighted as "new"
		if (c.invitationStatus === 'pending') return true

		return !!(c.unread && c.unread > 0)
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

	async function addMember(chatId: number, userIds: number[]): Promise<void> {
		console.log('[chatsStore] addMember', chatId, userIds)

		if (!userIds.length) return

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/members`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({ memberIds: userIds }),
			})

			if (!res.ok) {
				console.error('[chatsStore] addMember failed', res.status)
				return
			}

			console.log('[chatsStore] addMember success')
		} catch (err) {
			console.error('[chatsStore] addMember error', err)
		}
	}
	async function addMembersByNickname(
		chatId: number,
		rawNicknames: string | string[],
	): Promise<number> {
		const memberIds: number[] = []

		const list = Array.isArray(rawNicknames)
			? rawNicknames
			: rawNicknames.split(',').map(n => n.trim())

		for (const nickname of list) {
			if (!nickname) continue

			try {
				const resUser = await fetch(
					`${API_URL}/users/by-nickname/${encodeURIComponent(nickname)}`,
					{
						headers: {
							'Content-Type': 'application/json',
							...getAuthHeaders(),
						},
					},
				)

				if (resUser.status === 404) {
					console.warn('[chatsStore] nickname not found when adding member:', nickname)
					continue
				}

				if (!resUser.ok) {
					console.error(
						'[chatsStore] user lookup failed when adding member',
						nickname,
						resUser.status,
					)
					continue
				}

				const user: { id: number } = await resUser.json()
				if (!memberIds.includes(user.id)) {
					memberIds.push(user.id)
				}
			} catch (err) {
				console.error('[chatsStore] addMembersByNickname lookup error', nickname, err)
			}
		}

		if (memberIds.length === 0) {
			return 0
		}

		await addMember(chatId, memberIds)
		return memberIds.length
	}

	async function deleteChat(chatId: number): Promise<void> {
		console.log('[chatsStore] deleteChat', chatId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})

			if (!res.ok) {
				console.error('[chatsStore] deleteChat failed', res.status)
				return
			}

			//optimistically remove from local store
			chats.value = chats.value.filter(c => c.id !== chatId)
			delete messagesByChat.value[chatId]
			delete typingByChat.value[chatId]
			joinedChats.value.delete(chatId)

			console.log('[chatsStore] deleteChat success', chatId)
		} catch (err) {
			console.error('[chatsStore] deleteChat error', err)
		}
	}

	async function kickMember(chatId: number, userId: number): Promise<void> {
		console.log('[chatsStore] kickMember', chatId, userId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/kick`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({ userId }),
			})

			if (!res.ok) {
				console.error('[chatsStore] kickMember failed', res.status)
				return
			}

			//update local members list
			const chat = chats.value.find(c => c.id === chatId)
			if (chat) {
				chat.members = chat.members.filter(m => m.id !== userId)
			}
		} catch (err) {
			console.error('[chatsStore] kickMember error', err)
		}
	}

	async function banMember(chatId: number, userId: number): Promise<void> {
		console.log('[chatsStore] banMember', chatId, userId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/ban`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({ userId }),
			})

			if (!res.ok) {
				console.error('[chatsStore] banMember failed', res.status)
				return
			}

			//update local members list
			const chat = chats.value.find(c => c.id === chatId)
			if (chat) {
				chat.members = chat.members.filter(m => m.id !== userId)
			}
		} catch (err) {
			console.error('[chatsStore] banMember error', err)
		}
	}

	async function sendMessageWs(chatId: number, text: string) {
		const user = authStore.user
		if (!user) return null

		const socket = ensureSocket()
		if (!socket || !socket.connected) {
			console.error('[chatsStore] sendMessageWs: socket not connected')
			return null
		}

		//make sure listeners exist before sending
		setupSocketListeners()

		return await new Promise<Message | null>((resolve) => {
			socket.emit(
				'message:send',
				{
					chatId,
					text: text,
					authorId: user.id,
				},
				(response: WsSendAck) => {
					if (!response || !response.ok) {
						console.error('[chatsStore] sendMessageWs failed', response?.error)
						resolve(null)
						return
					}
					const p = response.message as WsMessagePayload
					const msg: Message = {
						id: p.id,
						authorId: p.authorId,
						text: p.text,
						createdAt: p.createdAt,
					}
					//message:new listener will also handle it, but we can resolve here for caller
					resolve(msg)
				},
			)
		})
	}

	async function leaveChat(chatId: number): Promise<void> {
		console.log('[chatsStore] leaveChat requested for chat:', chatId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/leave`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})

			if (!res.ok) {
				console.error('[chatsStore] leaveChat failed', res.status)
				return
			}

			//remove from local store
			chats.value = chats.value.filter((c) => c.id !== chatId)
			delete messagesByChat.value[chatId]
			delete typingByChat.value[chatId]
			joinedChats.value.delete(chatId)

			console.log('[chatsStore] left chat:', chatId)
		} catch (err) {
			console.error('[chatsStore] leaveChat error', err)
		}
	}

	async function acceptInvitation(chatId: number): Promise<Chat | null> {
		console.log('[chatsStore] acceptInvitation', chatId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/accept`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})

			if (!res.ok) {
				console.error('[chatsStore] acceptInvitation failed', res.status)
				return null
			}

			const chat: Chat = await res.json()
			chat.invitationStatus = 'accepted'

			//insert or update chat
			const idx = chats.value.findIndex(c => c.id === chat.id)
			if (idx === -1) {
				chats.value.push(chat)
			} else {
				chats.value[idx] = chat
			}

			//now we can join the chat room
			joinChatRoom(chat.id)

			return chat
		} catch (err) {
			console.error('[chatsStore] acceptInvitation error', err)
			return null
		}
	}

	async function declineInvitation(chatId: number): Promise<void> {
		console.log('[chatsStore] declineInvitation', chatId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/decline`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
			})

			if (!res.ok) {
				console.error('[chatsStore] declineInvitation failed', res.status)
				return
			}

			//remove from local list
			chats.value = chats.value.filter(c => c.id !== chatId)
		} catch (err) {
			console.error('[chatsStore] declineInvitation error', err)
		}
	}

	async function voteKick(chatId: number, targetId: number): Promise<void> {
		console.log('[chatsStore] voteKick', chatId, targetId)

		try {
			const res = await fetch(`${API_URL}/chats/${chatId}/vote-kick`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders(),
				},
				body: JSON.stringify({ targetId }),
			})

			if (!res.ok) {
				console.error('[chatsStore] voteKick failed', res.status)
				return
			}
		} catch (err) {
			console.error('[chatsStore] voteKick error', err)
		}
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
		getMessages,
		createChat,
		upsertChat,
		sendMessageWs,
		joinChatRoom,
		initWs,
		getTyping,
		sendTyping,
		leaveChat,
		acceptInvitation,
		declineInvitation,
		addMembersByNickname,
		voteKick,
		joinOrCreateByName
	}
})
