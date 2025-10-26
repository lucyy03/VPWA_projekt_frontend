import { defineStore } from 'pinia'
import { chats, me, type Message, type Chat, type Member } from 'src/mock/chats'

function fmt(iso: string) {
	try { 
		return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
	} catch { 
		return '' 
	}
}

function escapeRe(s: string) {
	//escapes special regex chars
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const useChatsStore = defineStore('chats', () => {
	//helpers we had in .vue
	function nameOf(chatId: string, authorId: string) {
		const c = chats.value.find(c => c.id === chatId)
		return c?.members.find(n => n.id === authorId)?.name || 'user'
	}

	function avatarOf(chatId: string, authorId: string) {
		const c = chats.value.find(c => c.id === chatId)
		const m = c?.members.find(n => n.id === authorId)
		if (!m) return undefined
		if (m.id === me.id) return undefined
		if (m.avatar) return m.avatar
		return undefined
	}

	function isMention(chatId: string, m: Message): boolean {
		const c = chats.value.find(c => c.id === chatId)
		if (!c) return false
		if (m.authorId === me.id) return false
		const handle = '@' + me.name
		const re = new RegExp(`(^|\\s)${escapeRe(handle)}(\\b|\\s|$)`, 'i')
		return re.test(m.text)
	}

	//marks a chat as visually new, currently simulates lucia as new
	function isNew(chat: Chat | string): boolean {
		//accepts chat object or id to be flexible in templates
		const id = typeof chat === 'string' ? chat : chat.id
		return id === 'lucia'
	}

	//message creation: keep behavior, but return the msg so the component can update its local window
	function createAndPushMessage(chatId: string, authorId: string, text: string): Message | null {
		const c = chats.value.find(c => c.id === chatId)
		if (!c) return null
		const msg: Message = {
			id: String(Math.random()).slice(2),
			authorId,
			text,
			createdAt: new Date().toISOString()
		}
		c.messages.push(msg)
		return msg
	}

	//command system
	type CmdHandler = (args: string[], ctx: { chat: Chat; appendEphemeral: (text: string) => Promise<void> | void }) => Promise<void> | void

	const commands: Record<string, CmdHandler> = {
		async list(_args, { chat, appendEphemeral }) {
			const names = chat.members.map(m => (m.id === me.id ? 'You' : m.name)).join(', ')
			await appendEphemeral(`members: ${names}`)
		},
		async help(_args, { appendEphemeral }) {
			await appendEphemeral([
				'available commands:',
				'/list - list chat members',
				'/help - show this help'
			].join('\n'))
		}
	}

	async function tryRunCommand(chatId: string, raw: string, appendEphemeral: (text: string) => Promise<void> | void): Promise<boolean> {
		if (!raw.startsWith('/')) return false
		const chat = chats.value.find(c => c.id === chatId)
		if (!chat) return true
		const parts = raw.trim().slice(1).split(/\s+/)
		const name = parts[0]?.toLowerCase() || ''
		const args = parts.slice(1)
		const handler = commands[name]
		if (!handler) {
			await appendEphemeral(`unknown command: /${name} (try /help)`)
			return true
		}
		try {
			await handler(args, { chat, appendEphemeral })
		} catch (err) {
			await appendEphemeral(`error: ${(err as Error)?.message || 'command failed'}`)
		}
		return true
	}

	//peer helpers for header + chat list
	function getPeer(chat: Chat): Member | undefined {
		return chat.isGroup ? undefined : chat.members.find(m => m.id !== me.id)
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

	return {
		//pure helpers
		fmt,
		nameOf,
		avatarOf,
		isMention,
		isNew,
		//message ops
		createAndPushMessage,
		//commands
		tryRunCommand,
		//peer + list helpers
		getPeer,
		getPeerImg,
		getPeerLetter,
		getPeerColor
	}
})
