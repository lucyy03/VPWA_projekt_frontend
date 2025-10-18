<template>
  <q-dialog v-model="open" transition-show="scale" transition-hide="scale" persistent>
    <q-card style="min-width:680px;max-width:90vw">
      <q-card-section class="row items-center">
        <q-icon name="terminal" class="q-mr-sm" />
        <div class="text-subtitle1">command palette</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="open = false" />
      </q-card-section>

      <q-card-section>
        <q-input
          ref="inp"
          v-model="input"
          autofocus
          dense
          filled
          placeholder="type a command, e.g. /help"
          @keyup.enter="exec"
          @keyup.up.prevent="nav('up')"
          @keyup.down.prevent="nav('down')"
        />
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height:40vh;overflow:auto;white-space:pre-wrap">
        <div v-if="history.length === 0" class="text-grey">try /help</div>
        <div v-for="h in history" :key="h.id" class="q-mb-sm">
          <div :class="levelClass(h.level)">{{ h.text }}</div>
          <div class="text-caption text-grey-6">{{ fmt(h.ts) }}</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/*minimal, focused overlay; uses a local key listener and simple in-memory history*/
import type { QInput } from 'quasar'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chats, me } from 'src/mock/chats'


type Level = 'info'|'warn'|'error'
type Entry = { id:string; text:string; ts:string; level?:Level }

const open = ref(false)
const input = ref('')
const history = ref<Entry[]>([])
let histPtr = -1
const inp = ref<QInput | null>(null)

function fmt(iso:string) { try { return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) } catch { return '' } }
function levelClass(level?:Level) { if (level==='warn') return 'text-orange-8'; if (level==='error') return 'text-negative'; return '' }
function isTypingContext() {
  const ae = document.activeElement as HTMLElement|null
  if (!ae) return false
  const tag = ae.tagName.toLowerCase()
  if (tag==='input' || tag==='textarea') return true
  if (ae.isContentEditable) return true
  return false
}

async function openCli(prefill='') {
  input.value = prefill
  open.value = true
  await nextTick()
  inp.value?.focus()
}
function closeCli() { open.value = false }

function onKey(e:KeyboardEvent) {
  if (e.key==='`' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    if (isTypingContext()) return
    e.preventDefault()
    void openCli()
  }
  if (e.key==='Escape' && open.value) { e.preventDefault(); closeCli() }
}

onMounted(() => window.addEventListener('keydown', onKey, { capture: true }))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, { capture: true }))

function nav(dir:'up'|'down') {
  const inputs = history.value.filter(h=>h.text.startsWith('> ')).map(h=>h.text.slice(2))
  if (!inputs.length) return
  if (dir==='up') histPtr = histPtr<0 ? inputs.length-1 : Math.max(0, histPtr-1)
  else histPtr = histPtr<0 ? -1 : Math.min(inputs.length-1, histPtr+1)
  input.value = histPtr>=0 ? (inputs[histPtr] ?? '') : ''
}

function push(text:string, level:Level='info') {
  history.value.push({ id:Math.random().toString(36).slice(2), text, ts:new Date().toISOString(), level })
}
function pushIn(text:string) {
  history.value.push({ id:Math.random().toString(36).slice(2), text:`> ${text}`, ts:new Date().toISOString(), level:'info' })
  histPtr = -1
}

function emitToChat(chatId:string, text:string) {
  window.dispatchEvent(new CustomEvent('cli:ephemeral', { detail:{ chatId, text } }))
}

async function exec() {
  const raw = input.value.trim()
  input.value = ''
  if (!raw) return
  pushIn(raw)

  const route = useRoute()
  const router = useRouter()

  if (!raw.startsWith('/')) { push('tip: commands start with "/" (try /help)'); return }

  //robust parsing: remove the leading slash, trim, split, and drop empties
  const tokens = raw.slice(1).trim().split(/\s+/).filter(Boolean)
  const cmd = (tokens.shift() ?? '').toLowerCase()
  const args = tokens
  
  if (!cmd) { push('empty command (try /help)'); return }

  switch (cmd.toLowerCase()) {
    case 'help':
      push(['available commands:',
        '/help               show this help',
        '/list               list chat members (if on chat)',
        '/goto chats         go to chats list',
        '/goto chat <id>     open chat by id',
        '/clear              clear console'
      ].join('\n'))
      break
    case 'clear':
      history.value = []
      break
    case 'goto': {
      const sub = (args[0]||'').toLowerCase()
      if (sub==='chats') { await router.push('/chats'); push('navigated to /chats') }
      else if (sub==='chat' && args[1]) { await router.push(`/chats/${args[1]}`); push(`navigated to /chats/${args[1]}`) }
      else push('usage: /goto chats | /goto chat <id>', 'warn')
      break
    }
    case 'list': {
      const c = route.params.id ? chats.value.find(x=>x.id===String(route.params.id)) : undefined
      if (!c) { push('not on a chat page', 'warn'); break }
      const names = c.members.map(mm=> mm.id===me.id ? 'You' : mm.name).join(', ')
      const out = `members: ${names}`
      push(out)
      emitToChat(c.id, out)
      break
    }
    default:
      push(`unknown command: /${cmd} (try /help)`, 'warn')
  }
}
</script>
