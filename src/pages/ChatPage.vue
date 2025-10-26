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
            <q-item v-if="chat?.isGroup && (chat?.visibility === 'public' || chat?.adminId === me.id)" clickable v-close-popup @click="addMember(chat!.id)">
              <q-item-section avatar><q-icon name="person_add" /></q-item-section>
              <q-item-section>Add member</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section avatar><q-icon name="group" /></q-item-section>
              <q-item-section>Members</q-item-section>
            </q-item>

            <q-separator />

            <q-item v-if="chat?.isGroup && chat?.adminId === me.id" clickable v-close-popup @click="chatsStore.deleteChat(chat!.id)">
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
/* no backend; all data comes from src/mock/chats.ts */
import { ref, computed, onBeforeUnmount, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { QChatMessage, QSpinnerDots, QInfiniteScroll } from 'quasar'
import { chats, me, type Member, type Message } from 'src/mock/chats'
import { useChatsStore } from 'src/stores/chats'

defineOptions({ name: 'ChatPage' })

const route = useRoute()
const chatsStore = useChatsStore()
const { addMember } = chatsStore

//types for private, local-only command output
type EphemeralMsg = { id: string; text: string; createdAt: string }
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

//look up the chat reactively based on :id
const chat = computed(() => {
  const id = String(route.params.id)
  return chats.value.find(c => c.id === id)
})

const draft = ref('')

//header avatar logic now uses the thin store helper for peer
const peer = computed<Member | undefined>(() => chat.value ? chatsStore.getPeer(chat.value) : undefined)
const headerAvatarUrl = computed(() => peer.value?.avatar)
const headerLetter = computed(() => !peer.value?.avatar ? (peer.value?.name?.charAt(0).toUpperCase() ?? '') : '')

//helpers now call the store
function nameOf(authorId: string) {
  if (!chat.value) return 'user'
  return chatsStore.nameOf(chat.value.id, authorId)
}
function avatarOf(authorId: string) {
  if (!chat.value) return undefined
  return chatsStore.avatarOf(chat.value.id, authorId)
}
function fmt(iso: string) {
  return chatsStore.fmt(iso)
}

//send now delegates message creation to the store, then the page appends to its local window/scroll
function send() {
  const c = chat.value
  const text = draft.value.trim()
  if (!c || !text) return

  //commands handled by store; we inject our local appendEphemeral
  if (text.startsWith('/')) {
    void chatsStore.tryRunCommand(c.id, text, appendEphemeral)
    draft.value = ''
    return
  }

  const msg = chatsStore.createAndPushMessage(c.id, me.id, text)
  if (msg) {
    void appendMessage(msg, { force: true })
  }
  draft.value = ''
  simulatePeerTypingAndReply() //unchanged
}

//typing simulation state unchanged...
const remoteTyping = ref(false)
const remoteDraft = ref('')
const showTypingPreview = ref(false)
let typingTimer: ReturnType<typeof setTimeout> | null = null
let typingInterval: ReturnType<typeof setInterval> | null = null

const peerName = computed(() => peer.value?.name ?? 'Someone')

//simulatePeerTypingAndReply stays here (ui timing/intervals/dom) and still uses appendMessage
function simulatePeerTypingAndReply() {
  const c = chat.value
  if (!c) return

  // choose a reply text up front so we can stream it char by char
  const replies: string[] = [
    'sounds good, i will see you there',
    'give me 10 mins and i will be there',
    'on my way, i will be there soon',
    'yup, got it, on the way already',
    'let me check the bus schedule',
    'hey hey 👋 what’s up? you doing alrigth?',
    'ohhh gotcha, that makes sense now',
    'yeah, I totally get what you mean',
    'wait seriously?? no way, I can’t believe this',
    'lol no way that actually cracked me up',
    'brb grabbing a snack gimme a second or two',
    'just chillin, what about you? how you going on with your day?',
    'that’s actually kinda awesome tho, I like that idea',
    'haha okay that’s fair, classic move, you won’t get me next time',
    'ahhh okay I see what you did there, you really got me with that one',
    'yo that’s wild! how did you even come up with that?',
    'thanks, appreciate that, I owe you one',
    'that’s so random but I love it, you’re really funny mate',
    'ok ok lemme think about that for a second...',
    'hold up, I gotta check something real quick, stay where you are',
    'wait I was *just* thinking that! great minds think alike huh?',
    'no but like… you’re right, I totally agree with you on that',
    'that’s lowkey kinda brilliant, you are full of ideas, I like that',
    'yeah no, I totally agree, you’re right about that',
    'honestly I didn’t expect that one but I’m not suprised at the same time',
    'not me rereading that three times, you really had a stroke writing that, didn’t ya?',
    'you’re kidding, right? I can’t believe that, let me see!',
    'wait what happened?? you sound so excited, tell me everything',
    'ohhh I thought you meant something else, nevermind haha',
    'i’m obsessed with that song, you wanna hear it? imma go listen to it right now',
    'can’t even argue with that tbh, you’re hilarious, I give up',
    'you did not just say that, how did you even come up with that? haha',
    'yeah sure, sounds good to me! you better not be late!',
    'let’s gooo man that’ so fire I love the vibes! 🔥',
    'that’s one way to put it, but actually...nevermind',
    'you’re onto something there but I’ll bear with it since it’s you',
    'i can’t tell if that’s genius or chaos...or both probably',
    'yeah but like… you’re not wrong but not exactly right at the same time',
    'yo that’s actually facts tho, I can’t even argue with you on that one',
    'bet, I’m down for that, I’m winning though, no chance for you',
    'alright say less, I’m already on it, you better hurry up',
    'ah yes, the classic move, next time I’ll get you so you better watch out',
    'why is this so funny tho, I’m not supposed to be laughing at that',
    'okay but now you got me curious, tell me every single detail, I’m seated',
    'alright I’m intrigued, give me your best ideas, I’m all ears',
    'lemme think on that for a sec...this might take me a while',
    'okay now you’re just showing off, not cool mate',
    'how did we even get here? how in the world is that possible? damn',
    'yeah I can work with that, just might need a second thought',
    'yeah bro trust the process, I know what I’m doing...sometimes',
    'bro that’s tough, I can’t believe that, better luck next time',
    'couldn’t have said it better myself, we’re on the same wavelength fr',
    'you’re a menace but I respect it...this time',
    'i feel personally attacked, why did you have to do me like that?',
    'i see what you did there, not sneaky at all, try better next time'
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
    if (i < chars.length) remoteDraft.value += chars[i++]
  }, 120)

  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    remoteTyping.value = false
    if (typingInterval) { clearInterval(typingInterval); typingInterval = null }
    const authorId = peer.value?.id ?? 'peer'
    const reply: Message = {
      id: String(Math.random()).slice(2),
      authorId,
      text: fullText,
      createdAt: new Date().toISOString()
    }
    //also push into the source of truth so history is correct
    c.messages.push(reply)
    void appendMessage(reply)
    remoteDraft.value = ''
  }, typingMs)
}

//helper: scroll to bottom when showing typing preview unchanged...
async function toggleTypingPreview() {
  showTypingPreview.value = !showTypingPreview.value
  await nextTick()
  const el = scrollEl.value
  if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
}

//near-bottom check unchanged...
function isNearBottom(el: HTMLElement | null, thresh = 40) {
  if (!el) return false
  const delta = el.scrollHeight - (el.scrollTop + el.clientHeight)
  return delta <= thresh
}

//appendMessage unchanged except the source push moved to store above for sends; here we keep window/scroll
async function appendMessage(msg: Message, opts: { force?: boolean } = {}) {
  const c = chat.value
  if (!c) return
  const el = scrollEl.value
  // scroll if user was near bottom OR if forced (for our own sends)
  const shouldStick = (opts.force === true) || isNearBottom(el)

  //the chat array was already updated by store (for sends) or here (for replies)
  visible.value = [...visible.value, msg]
  await nextTick()
  if (shouldStick && el) {
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
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

//init/refresh when chat changes
watch(
  () => route.params.id,
  async () => {
    const c = chat.value
    if (!c) { visible.value = []; return }
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
  if (isLoading) { done(); return }
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

//ephemerals now kept in the page, but commands come from the store and call this via injection
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

//mention highlight now calls the store
function isMention(m: Message): boolean {
  const c = chat.value
  if (!c) return false
  return chatsStore.isMention(c.id, m)
}

//public or private indicator
const chipColor = computed(() => {
  return chat.value?.visibility === 'public' ? 'positive' : 'grey-6'
})

</script>