<template>
  <q-page class="flex column bg-grey-1" style="height:100vh">
    <q-toolbar style="background-color: #2F2F2F; color: white;">
      <q-btn flat round dense icon="arrow_back" :to="'/chats'" />
      <q-avatar v-if="headerAvatarUrl || headerLetter" size="32px" class="q-ml-sm q-mr-sm">
        <img v-if="headerAvatarUrl" :src="headerAvatarUrl" alt="avatar" />
        <div v-else class="flex items-center justify-center"
             style="width:32px;height:32px;border-radius:50%;color:#fff;background:#607D8B;">
          {{ headerLetter }}
        </div>
      </q-avatar>
      <q-toolbar-title>
        <div class="row items-center no-wrap">
          <span>{{ chat?.name ?? 'Chat' }}</span>
          <q-chip
            v-if="chat?.isGroup"
            dense
            square
            outline
            class="q-ml-sm"
            :color="chipColor"
            :label="(chat?.visibility ?? 'private').toUpperCase()"
          />
        </div>
      </q-toolbar-title>
      <!-- 3-dot menu button -->
      <q-btn flat round dense icon="more_vert" aria-label="More options">
        <q-menu anchor="bottom right" self="top right">
          <q-list style="min-width: 200px">
            <q-item
              v-if="chat?.isGroup && (chat?.visibility === 'public' || chat?.adminId === me.id)" clickable v-close-popup @click="addMember(chat!.id)">
              <q-item-section avatar><q-icon name="person_add" /></q-item-section>
              <q-item-section>Add member</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section avatar><q-icon name="group" /></q-item-section>
              <q-item-section>Members</q-item-section>
            </q-item>
            <!-- admin kick and ban -->
            <q-item v-if="chat?.isGroup && chat?.adminId === me.id" clickable v-close-popup @click="kickMember(chat!.id)">
              <q-item-section avatar><q-icon name="remove_circle" /></q-item-section>
              <q-item-section>Kick member</q-item-section>
            </q-item>

            <q-item v-if="chat?.isGroup && chat?.adminId === me.id" clickable v-close-popup @click="banMember(chat!.id)">
              <q-item-section avatar><q-icon name="block" /></q-item-section>
              <q-item-section>Ban member</q-item-section>
            </q-item>

            <!-- non-admin group members vote kick -->
            <q-item
              v-if="chat?.isGroup && chat?.adminId !== me.id" clickable v-close-popup @click="console.log('[ui] vote kick requested for', chat!.id)">
              <q-item-section avatar><q-icon name="how_to_vote" /></q-item-section>
              <q-item-section>Vote kick</q-item-section>
            </q-item>

            <q-separator />

            <q-item v-if="chat?.isGroup && chat?.adminId === me.id" clickable v-close-popup @click="deleteChat(chat!.id)">
              <q-item-section avatar><q-icon name="delete" /></q-item-section>
              <q-item-section class="text-negative">Delete chat</q-item-section>
            </q-item>

            <q-item v-else clickable v-close-popup>
              <q-item-section avatar><q-icon name="logout" /></q-item-section>
              <q-item-section class="text-negative">Leave chat</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>

    <div v-if="!chat" class="column items-center justify-center q-pa-xl">
      <q-icon name="chat_bubble_outline" size="48px" class="q-mb-md" />
      <div class="text-subtitle1">chat not found</div>
      <q-btn class="q-mt-md" color="primary" label="back to chats" :to="'/chats'" />
    </div>

    <template v-else>
      <!-- chat area: single flex column with min-height:0 -->
       <div class="col column no-wrap" style="min-height:0">
        <!--scrollable container that QInfiniteScroll-->
        <div ref="scrollEl" class="col scroll chat-scroll" :style="{ minHeight: '0', flex: '1 1 auto', overflowY: 'auto', paddingBottom: composerH + 'px', background: 'linear-gradient(to bottom, #e0eafc 0%, #cfdef3 100%)' }">
          <q-infinite-scroll
            :key="chat?.id"
            ref="inf"
            :offset="40"
            :debounce="120"
            :disable="isLoading"
            reverse
            :scroll-target="scrollEl || undefined"
            @load="loadMore"
          >
            <div class="q-pa-md">
              <QChatMessage
                v-for="m in visible"
                :key="m.id"
                :name="nameOf(m.authorId)"
                :avatar="avatarOf(m.authorId)"
                :text="[m.text]"
                :sent="m.authorId === me.id"
                :stamp="fmt(m.createdAt)"
                :bg-color="m.authorId === me.id ? 'primary' : isMention(m) ? 'amber-3' : 'grey-4'"
                :text-color="m.authorId === me.id ? 'white' : 'black'"
              />

              <!-- ephemeral (local-only) command outputs -->
              <QChatMessage
                v-for="e in ephemerals[chat.id] || []"
                :key="e.id"
                :text="[e.text]"
                :sent="true"
                :stamp="fmt(e.createdAt)"
                bg-color="grey-3"
                text-color="black"
              >
                <template #name>
                  <div class="row items-center no-wrap">
                    <span class="cmd-chip">private - command output</span>
                  </div>
                </template>
              </QChatMessage>

            </div>

            <!-- spinner while loading older -->
            <template #loading>
              <div class="row justify-center q-pa-sm">
                <QSpinnerDots size="24px" />
              </div>
            </template>
          </q-infinite-scroll>

        
        </div>

        <div ref="composerEl" class="composer q-pa-sm" style="position:sticky; bottom:0; flex:0 0 auto; z-index:1; border-top:1px solid rgba(0,0,0,.06); background-color: #696969;">
          <!-- typing indicator (only when typing) -->
          <div
            v-if="remoteTyping"
            class="row items-center q-pa-sm text-grey-7"
            style="border-bottom:1px dashed rgba(0,0,0,.1); margin-bottom:8px; background-color: white;"
            @click="toggleTypingPreview"
            title="click to preview"
          >
            <q-avatar v-if="headerAvatarUrl" size="24px"><img :src="headerAvatarUrl" alt="" /></q-avatar>
            <div class="q-ml-sm">{{ peerName }} is typing</div>
            <QSpinnerDots class="q-ml-xs" size="16px" />
          </div>

          <div v-if="remoteTyping && showTypingPreview" class="q-pa-sm">
            <q-chip square color="grey-3" text-color="black" class="q-ma-none">
              {{ remoteDraft }}<span class="text-grey-6">▌</span>
            </q-chip>
          </div>


        
          <q-input v-model="draft" placeholder="Message" dense outlined style="background-color: white;" @keyup.enter="send">
            <template #after>
              <q-btn round dense icon="send" color="negative" @click="send" :disable="!draft.trim()" />
            </template>
          </q-input>
        </div>
      </div>
    </template>
  </q-page>
</template>

<style scoped>
.chat-grid {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  height: 100vh;
  overflow: hidden;
}

.chat-scroll {
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
</style>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { QChatMessage, QSpinnerDots, QInfiniteScroll } from 'quasar'
import { useChatsStore, type Message, type Member } from 'src/stores/chats'
import { useAuthStore } from 'src/stores/auth'

defineOptions({ name: 'ChatPage' })

const route = useRoute()
const chatsStore = useChatsStore()
const authStore = useAuthStore()

const me = computed(() => authStore.user!)

//types for private, local-only command output
type EphemeralMsg = { id: string; text: string; createdAt: string }
const ephemerals = ref<Record<string, EphemeralMsg[]>>({})

const composerEl = ref<HTMLElement | null>(null)
const composerH = ref(72)
let ro: ResizeObserver | null = null

//disable page scrolling while this view is active
onMounted(async () => {
	document.body.classList.add('no-scroll')
	const update = () => {
		composerH.value = composerEl.value?.offsetHeight ?? 72
	}
	update()
	ro = new ResizeObserver(update)
	if (composerEl.value) ro.observe(composerEl.value)

	//initial fetch for chat + messages
	const id = Number(route.params.id)
	await chatsStore.fetchChat(id)
	await chatsStore.fetchMessages(id)

	//update on typing preview toggles as well
	watch(
		[() => remoteTyping.value, () => showTypingPreview.value],
		async () => {
			await nextTick()
			update()
		},
		{ immediate: false }
	)
})

onBeforeUnmount(() => {
	document.body.classList.remove('no-scroll')
	if (typingTimer) clearTimeout(typingTimer)
	if (typingInterval) clearInterval(typingInterval)
	if (ro && composerEl.value) ro.unobserve(composerEl.value)
	ro = null
})

const currentChatId = computed(() => Number(route.params.id))

//look up the chat reactively based on :id
const chat = computed(() => {
	const id = Number(route.params.id)
	return chatsStore.chats.find(c => c.id === id)
})

const draft = ref('')

//header avatar logic uses peer from store
const peer = computed<Member | undefined>(() => (chat.value ? chatsStore.getPeer(chat.value) : undefined))
const headerAvatarUrl = computed(() => peer.value?.avatar)
const headerLetter = computed(() =>
	!peer.value?.avatar ? peer.value?.name?.charAt(0).toUpperCase() ?? '' : ''
)

//helpers now call the store
function nameOf(authorId: number) {
	if (!chat.value) return 'user'
	return chatsStore.nameOf(chat.value.id, authorId)
}
function avatarOf(authorId: number) {
	if (!chat.value) return undefined
	return chatsStore.avatarOf(chat.value.id, authorId)
}
function fmt(iso: string) {
	return chatsStore.fmt(iso)
}

async function send() {
	const c = chat.value
	const text = draft.value.trim()
	if (!c || !text) return

	await chatsStore.sendMessageWs(c.id, text)

	draft.value = ''
}

//typing simulation state kept so ui looks same but never toggled
const remoteTyping = ref(false)
const remoteDraft = ref('')
const showTypingPreview = ref(false)
const typingTimer: ReturnType<typeof setTimeout> | null = null
const typingInterval: ReturnType<typeof setInterval> | null = null

const peerName = computed(() => peer.value?.name ?? 'Someone')

async function toggleTypingPreview() {
	showTypingPreview.value = !showTypingPreview.value
	await nextTick()
	const el = scrollEl.value
	if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
}

function isNearBottom(el: HTMLElement | null, thresh = 40) {
	if (!el) return false
	const delta = el.scrollHeight - (el.scrollTop + el.clientHeight)
	return delta <= thresh
}

async function appendMessage(msg: Message, opts: { force?: boolean } = {}) {
	const c = chat.value
	if (!c) return
	const el = scrollEl.value
	const shouldStick = opts.force === true || isNearBottom(el)

	visible.value = [...visible.value, msg]
	await nextTick()
	if (shouldStick && el) {
		requestAnimationFrame(() => {
			el.scrollTop = el.scrollHeight
		})
	}
}

//infinite scroll stuff
const FAKE_LATENCY_MS = 450
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }
const CHUNK = 25
const visible = ref<Message[]>([])
const firstIndex = ref(0)
const inf = ref<InstanceType<typeof QInfiniteScroll> | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
let isLoading = false

const allMessages = computed<Message[]>(() => {
	const c = chat.value
	return c ? chatsStore.getMessages(c.id) : []
})

const initialMessagesLoaded = ref(false)

watch(
	currentChatId,
	async (id) => {
		initialMessagesLoaded.value = false
		visible.value = []
		firstIndex.value = 0

		if (!Number.isFinite(id)) return

		await chatsStore.fetchChat(id)
		await chatsStore.fetchMessages(id)
		chatsStore.joinChatRoom(id)

		const all = chatsStore.getMessages(id)
		const total = all.length
		firstIndex.value = Math.max(0, total - CHUNK)
		visible.value = all.slice(firstIndex.value)

		await nextTick()
		if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight

		inf.value?.reset()
		inf.value?.resume()

		initialMessagesLoaded.value = true
	},
	{ immediate: true },
)

watch(
	allMessages,
	async (newVal, oldVal) => {
		const c = chat.value
		if (!c) return
		if (!initialMessagesLoaded.value) return

		const oldLen = oldVal ? oldVal.length : 0
		if (newVal.length <= oldLen) return

		const added = newVal.slice(oldLen)
		for (const m of added) {
			await appendMessage(m)
		}
	},
	{ deep: true },
)

//load older when reaching the top
async function loadMore(_index: number, done: () => void) {
	if (isLoading) { done(); return }
	isLoading = true
	try {
		const c = chat.value
		if (!c) return

		const el = scrollEl.value
		const oldBottom = el ? (el.scrollHeight - el.scrollTop) : 0

		await nextTick()
		await sleep(FAKE_LATENCY_MS)

		const all = chatsStore.getMessages(c.id)

		if (firstIndex.value > 0) {
			const newFirst = Math.max(0, firstIndex.value - CHUNK)
			const prepend = all.slice(newFirst, firstIndex.value)
			visible.value = [...prepend, ...visible.value]
			firstIndex.value = newFirst

			await nextTick()
			if (el) {
				requestAnimationFrame(() => {
					el.scrollTop = el.scrollHeight - oldBottom
				})
			}
			if (firstIndex.value === 0) {
				inf.value?.stop()
			}
			return
		}

		inf.value?.stop()
	} finally {
		isLoading = false
		done()
	}
}

// async function appendEphemeral(text: string) {
// 	const c = chat.value
// 	if (!c) return
// 	const el = scrollEl.value
// 	const shouldStick = isNearBottom(el)

// 	const e: EphemeralMsg = {
// 		id: 'e' + String(Math.random()).slice(2),
// 		text,
// 		createdAt: new Date().toISOString(),
// 	}
// 	if (!ephemerals.value[c.id]) {
// 		ephemerals.value[c.id] = []
// 	}
// 	ephemerals.value[c.id]!.push(e)

// 	await nextTick()
// 	if (shouldStick && el) {
// 		requestAnimationFrame(() => {
// 			el.scrollTop = el.scrollHeight
// 		})
// 	}
// }

//reset ephemerals when switching chats (local-only)
watch(
	() => route.params.id,
	() => {
		const c = chat.value
		if (!c) return
		if (!ephemerals.value[c.id]) ephemerals.value[c.id] = []
	},
	{ immediate: true }
)

function isMention(m: Message): boolean {
	const c = chat.value
	if (!c) return false
	return chatsStore.isMention(c.id, m)
}

const chipColor = computed(() => {
	return chat.value?.visibility === 'public' ? 'positive' : 'grey-6'
})

//menu actions from store
const { addMember, deleteChat, kickMember, banMember } = chatsStore
</script>