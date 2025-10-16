<template>
  <q-page class="flex column bg-grey-1">
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
      <!-- use plain <div> instead of q-scroll-area for a quick sanity check -->
      <div class="col q-pa-md" style="overflow:auto">
        <!--
        <div v-for="m in chat.messages" :key="m.id" class="q-mb-sm">
          <strong>{{ nameOf(m.authorId) }}:</strong> {{ m.text }} <em>({{ fmt(m.createdAt) }})</em>
        </div>
        -->

        <QChatMessage
          v-for="m in chat.messages"
          :key="m.id"
          :name="nameOf(m.authorId)"
          :avatar="avatarOf(m.authorId)"
          :text="[m.text]"
          :sent="m.authorId === me.id"
          :stamp="fmt(m.createdAt)"
        />
      </div>

      <!-- typing indicator (click to toggle live preview) -->
      <div
        v-if="remoteTyping"
        class="row items-center q-pa-sm text-grey-7 cursor-pointer"
        @click="showTypingPreview = !showTypingPreview"
        title="click to preview"
      >
        <q-avatar v-if="headerAvatarUrl" size="24px"><img :src="headerAvatarUrl" alt="" /></q-avatar>
        <div class="q-ml-sm">{{ peerName }} is typing</div>
        <QSpinnerDots class="q-ml-xs" size="16px" />
      </div>

      <!-- live preview of what peer is typing -->
      <div v-if="remoteTyping && showTypingPreview" class="q-pa-sm">
        <q-chip square color="grey-3" text-color="black" class="q-ma-none">
          {{ remoteDraft }}<span class="text-grey-6">▌</span>
        </q-chip>
      </div>


      <div class="q-pa-sm bg-white">
        <q-input v-model="draft" placeholder="Message" dense outlined @keyup.enter="send">
          <template #after>
            <q-btn round dense icon="send" color="primary" @click="send" :disable="!draft.trim()" />
          </template>
        </q-input>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
/* no backend; all data comes from src/mock/chats.ts */
import { ref, computed, onBeforeUnmount  } from 'vue'
import { useRoute } from 'vue-router'
import { QChatMessage, QSpinnerDots } from 'quasar'
import { chats, me, type Member } from 'src/mock/chats'

defineOptions({ name: 'ChatPage' })

const route = useRoute()

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
  c.messages.push({
    id: String(Math.random()).slice(2),
    authorId: me.id,
    text,
    createdAt: new Date().toISOString()
  })
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
    'ok',
    'sounds good',
    'see you!',
    '👍',
    'nice',
    'give me 10 mins',
    'on my way',
    'yup, got it',
    'let me check'
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
    c.messages.push({
      id: String(Math.random()).slice(2),
      authorId,
      text: fullText,
      createdAt: new Date().toISOString()
    })
    remoteDraft.value = ''
  }, typingMs)
}

onBeforeUnmount(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (typingInterval) clearInterval(typingInterval)
})

</script>