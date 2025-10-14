<template>
  <q-page class="column bg-grey-1">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" :to="'/chats'" />
        <q-toolbar-title>{{ chat?.name ?? 'Chat' }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container class="col">
      <div v-if="!chat" class="column items-center justify-center q-pa-xl">
        <q-icon name="chat_bubble_outline" size="48px" class="q-mb-md" />
        <div class="text-subtitle1">chat not found</div>
        <q-btn class="q-mt-md" color="primary" label="back to chats" :to="'/chats'" />
      </div>

      <div v-else class="column fit">
        <q-scroll-area class="col">
          <div class="q-pa-md">
            <q-chat-message
              v-for="m in chat.messages"
              :key="m.id"
              :name="nameOf(m.authorId)"
              :avatar="avatarOf(m.authorId)"
              :text="[m.text]"
              :sent="m.authorId === me.id"
              :stamp="fmt(m.createdAt)"
            />
          </div>
        </q-scroll-area>

        <div class="q-pa-sm bg-white">
          <q-input
            v-model="draft"
            placeholder="Message"
            dense
            outlined
            @keyup.enter="send"
          >
            <template #after>
              <q-btn round dense icon="send" color="primary" @click="send" :disable="!draft.trim()" />
            </template>
          </q-input>
        </div>
      </div>
    </q-page-container>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { chats, getChatById, me, avatarFor, type Member } from 'src/mock/chats'

//assumption: route param is :id
defineOptions({ name: 'ChatPage' })

const route = useRoute()
const chatRef = getChatById(String(route.params.id))
const chat = computed(() => chatRef.value)
const draft = ref('')

function nameOf(authorId: string) {
  const m = chat.value?.members.find(n => n.id === authorId)
  return m?.name || 'user'
}
function avatarOf(authorId: string) {
  const m = chat.value?.members.find(n => n.id === authorId) as Member | undefined
  const a = m ? avatarFor(m) : undefined
  return a?.img ?? undefined
}
function fmt(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}
function send() {
  if (!chat.value) return
  const text = draft.value.trim()
  if (!text) return
  chat.value.messages.push({
    id: String(Math.random()).slice(2),
    authorId: me.id,
    text,
    createdAt: new Date().toISOString()
  })
  draft.value = ''
}
</script>