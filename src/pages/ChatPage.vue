<template>
  <q-page class="flex column bg-grey-1" style="height:100vh">
    <q-toolbar class="bg-white q-pa-sm">
      <q-btn flat round dense icon="arrow_back" :to="'/chats'" />
      <q-avatar v-if="headerAvatarUrl || headerLetter" size="32px" class="q-ml-sm q-mr-sm">
        <img v-if="headerAvatarUrl" :src="headerAvatarUrl" alt="avatar" />
        <div v-else class="flex items-center justify-center"
             style="width:32px;height:32px;border-radius:50%;color:#fff;background:#607D8B;">
          {{ headerLetter }}
        </div>
      </q-avatar>
      <q-toolbar-title>{{ chat?.name ?? 'Chat' }}</q-toolbar-title>
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
        <div ref="scrollEl" class="col scroll chat-scroll" :style="{ minHeight: '0', flex: '1 1 auto', overflowY: 'auto', paddingBottom: composerH + 'px' }">
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
                :bg-color="isMention(m) ? 'amber-2' : undefined"
                :text-color="isMention(m) ? 'black' : undefined"
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

        <div ref="composerEl" class="composer q-pa-sm bg-white" style="position:sticky; bottom:0; flex:0 0 auto; z-index:1; border-top:1px solid rgba(0,0,0,.06)">
          <!-- typing indicator (only when typing) -->
          <div
            v-if="remoteTyping"
            class="row items-center q-pa-sm text-grey-7"
            style="border-bottom:1px dashed rgba(0,0,0,.1); margin-bottom:8px"
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


        
          <q-input v-model="draft" placeholder="Message" dense outlined @keyup.enter="send">
            <template #after>
              <q-btn round dense icon="send" color="primary" @click="send" :disable="!draft.trim()" />
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
/* no backend; all data comes from src/mock/chats.ts */
import { ref, computed, onBeforeUnmount, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { QChatMessage, QSpinnerDots, QInfiniteScroll } from 'quasar'
import { chats, me, type Member, type Message } from 'src/mock/chats'

defineOptions({ name: 'ChatPage' })

const route = useRoute()

//types for private, local-only command output
type EphemeralMsg = {
  id: string
  text: string
  createdAt: string
}
//per-chat local store (not persisted, not in src/mock/chats.ts)
const ephemerals = ref<Record<string, EphemeralMsg[]>>({})

const composerEl = ref<HTMLElement|null>(null)
const composerH = ref(72)
let ro: ResizeObserver | null = null

// disable page scrolling while this view is active
onMounted(() => {
  document.body.classList.add('no-scroll')
  const update = () => {
    composerH.value = (composerEl.value?.offsetHeight ?? 72)
  }
  update()
  ro = new ResizeObserver(update)
  if (composerEl.value) ro.observe(composerEl.value)

  //update on typing preview toggles as well
  watch([() => remoteTyping.value, () => showTypingPreview.value], async () => {
    await nextTick()
    update()
  })
})
onBeforeUnmount(() => {
  document.body.classList.remove('no-scroll')
  if (typingTimer) clearTimeout(typingTimer)
  if (typingInterval) clearInterval(typingInterval)
  if (ro && composerEl.value) ro.unobserve(composerEl.value)
  ro = null
})

// look up the chat reactively based on :id
const chat = computed(() => {
  const id = String(route.params.id)
  const found = chats.value.find(c => c.id === id)
  // console.log('[ChatPage] route id =', id, '| found chat id =', found?.id, '| messages =', found?.messages?.length)
  return found
})

const draft = ref('')

// header avatar logic
const peer = computed<Member | undefined>(() =>
  chat.value?.isGroup ? undefined : chat.value?.members.find(m => m.id !== me.id)
)
const headerAvatarUrl = computed(() => peer.value?.avatar)
const headerLetter = computed(() =>
  !peer.value?.avatar ? (peer.value?.name?.charAt(0).toUpperCase() ?? '') : ''
)

// helpers for bubbles
function nameOf(authorId: string) {
  return chat.value?.members.find(n => n.id === authorId)?.name || 'user'
}
function avatarOf(authorId: string) {
  const m = chat.value?.members.find(n => n.id === authorId)
  if (!m) return undefined
  // don't show avatar for 'me'
  if (m.id === me.id) return undefined
  // if user has avatar image, return it
  if (m.avatar) return m.avatar
  return undefined
}

function fmt(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

function send() {
  const c = chat.value
  const text = draft.value.trim()
  if (!c || !text) return

  //commands: do not send a message, run locally and return
  if (text.startsWith('/')) {
    void tryRunCommand(text)
    draft.value = ''
    return
  }

  const msg: Message = {
    id: String(Math.random()).slice(2),
    authorId: me.id,
    text,
    createdAt: new Date().toISOString()
  }
   void appendMessage(msg, { force: true })
  draft.value = ''
  simulatePeerTypingAndReply() // trigger fake typing + reply
}


// typing simulation state
const remoteTyping = ref(false)
const remoteDraft = ref('')           // live text being "typed"
const showTypingPreview = ref(false)  // toggled by clicking indicator
let typingTimer: ReturnType<typeof setTimeout> | null = null
let typingInterval: ReturnType<typeof setInterval> | null = null

const peerName = computed(() => peer.value?.name ?? 'Someone')

function simulatePeerTypingAndReply() {
  const c = chat.value
  if (!c) return

  // choose a reply text up front so we can stream it char by char
  const replies: string[] = [
    'sounds good, i will see you there',
    'give me 10 mins and i will be there',
    'on my way, i will be there soon',
    'yup, got it, on the way already',
    'let me check the bus schedule'
  ]
  const fullText: string = replies[Math.floor(Math.random() * replies.length)]!

  // make typing last longer; roughly proportional to text length
  const typingMs = Math.max(4000, Math.min(7000, fullText.length * 250))

  // start typing
  remoteTyping.value = true
  remoteDraft.value = ''
  showTypingPreview.value = false

  // stream characters at a steady cadence
  if (typingInterval) clearInterval(typingInterval)
  const chars = [...fullText]
  let i = 0
  typingInterval = setInterval(() => {
    // stop if chat changed or typing was cancelled
    if (!remoteTyping.value) return
    if (i < chars.length) {
      remoteDraft.value += chars[i++]
    }
  }, 120) // adjust speed here

  // finish typing, clear interval, then push the message
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    remoteTyping.value = false
    if (typingInterval) {
      clearInterval(typingInterval)
      typingInterval = null
    }
    const authorId = peer.value?.id ?? 'peer'
    const reply: Message = {
      id: String(Math.random()).slice(2),
      authorId,
      text: fullText,
      createdAt: new Date().toISOString()
    }
    void appendMessage(reply)
    remoteDraft.value = ''
  }, typingMs)
}

// helper: scroll to bottom when showing typing preview
async function toggleTypingPreview() {
  showTypingPreview.value = !showTypingPreview.value
  await nextTick()
  const el = scrollEl.value
  if (el) {
    // same logic as appendMessage: scroll if near bottom or forcing
    requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight
    })
  }
}


//helper: check if youre at the bottom when sending
function isNearBottom(el: HTMLElement | null, thresh = 40) {
  if (!el) return false
  const delta = el.scrollHeight - (el.scrollTop + el.clientHeight)
  return delta <= thresh
}

//helper: append a message to both source & visible, then scroll down
async function appendMessage(msg: Message, opts: { force?: boolean } = {}) {
  const c = chat.value
  if (!c) return
  const el = scrollEl.value
  // scroll if user was near bottom OR if forced (for our own sends)
  const shouldStick = (opts.force === true) || isNearBottom(el)

  c.messages.push(msg)
  visible.value = [...visible.value, msg]     // keep window in sync
  await nextTick()
  if (shouldStick && el) {
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }
}

//infinite scroll stuff
const FAKE_LATENCY_MS = 450
function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

const CHUNK = 25
// const VIRTUAL_CAP = 5000

//local window of messages shown
const visible = ref<Message[]>([])

//track how many messages from the bottom are already loaded
// const loadedFrom = ref(0)
const firstIndex = ref(0) //index in c.messages of visible[0]

const inf = ref<InstanceType<typeof QInfiniteScroll> | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
let isLoading = false

//init/refresh when chat changes
watch(
  () => route.params.id,
  async () => {
    const c = chat.value
    if (!c) {
      visible.value = []
      return
    }

    //start with the last CHUNK messages
    const total = c.messages.length
    firstIndex.value = Math.max(0, total - CHUNK)
    visible.value = c.messages.slice(firstIndex.value)

    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight

    //always reset+resume; loadMore will decide when to stop
    inf.value?.reset()
    inf.value?.resume()
  },
  { immediate: true }
)

//load older when reaching the top
async function loadMore(_index: number, done: () => void) {
  if (isLoading) { done(); return }  // prevent concurrent loads
  isLoading = true
  try {
    const c = chat.value
    if (!c) return

    const el = scrollEl.value
    // const prevH  = el?.scrollHeight ?? 0
    // const prevTop = el?.scrollTop ?? 0
    // preserve distance from bottom instead of using prev height + top
    const oldBottom = el ? (el.scrollHeight - el.scrollTop) : 0

    //give the loading slot a chance to mount
    await nextTick()
    await sleep(FAKE_LATENCY_MS)

    if (firstIndex.value > 0) {
      const newFirst = Math.max(0, firstIndex.value - CHUNK)
      const prepend = c.messages.slice(newFirst, firstIndex.value)
      visible.value = [...prepend, ...visible.value]
      firstIndex.value = newFirst

      await nextTick()
      if (el) {
        // restore same distance from bottom so the viewport doesn't move
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - oldBottom
        })
      }
      if (firstIndex.value === 0) {
        inf.value?.stop()
      }
      return
    }


    //no more preloaded items, just stop
    inf.value?.stop()
  } finally {
    isLoading = false
    done()
  }
}

///////////////////////////////////////////////////////////////////////////////////////////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////
//helper: push an ephemeral bubble and scroll if needed
async function appendEphemeral(text: string) {
  const c = chat.value
  if (!c) return
  const el = scrollEl.value
  const shouldStick = isNearBottom(el)

  const e: EphemeralMsg = {
    id: 'e' + String(Math.random()).slice(2),
    text,
    createdAt: new Date().toISOString()
  }
  if (!ephemerals.value[c.id]) {
    ephemerals.value[c.id] = [] 
  }
  ephemerals.value[c.id]!.push(e)

  await nextTick()
  if (shouldStick && el) {
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }
}

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

//simple command registry
type CmdHandler = (args: string[]) => Promise<void> | void

const commands: Record<string, CmdHandler> = {
  //lists members of the current chat
  async list() {
    const c = chat.value
    if (!c) return
    const names = c.members.map(m => (m.id === me.id ? 'You' : m.name)).join(', ')
    await appendEphemeral(`members: ${names}`)
  },

  //help about available commands
  async help() {
    await appendEphemeral([
      'available commands:',
      '/list - list chat members',
      '/help - show this help'
    ].join('\n'))
  }
}

//parses "/cmd arg1 arg2" and runs it
async function tryRunCommand(raw: string): Promise<boolean> {
  if (!raw.startsWith('/')) return false
  const parts = raw.trim().slice(1).split(/\s+/)
  const name = parts[0]?.toLowerCase() || ''
  const args = parts.slice(1)
  const handler = commands[name]
  if (!handler) {
    await appendEphemeral(`unknown command: /${name} (try /help)`)
    return true
  }
  try {
    await handler(args)
  } catch (err) {
    await appendEphemeral(`error: ${(err as Error)?.message || 'command failed'}`)
  }
  return true
}

// helper for highlighting mentions
function escapeRe(s: string) {
  /* escapes special regex chars */
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isMention(m: Message): boolean {
  const c = chat.value
  if (!c) return false
  if (m.authorId === me.id) return false
  const handle = '@' + me.name
  const re = new RegExp(`(^|\\s)${escapeRe(handle)}(\\b|\\s|$)`, 'i')
  return re.test(m.text)
}

</script>