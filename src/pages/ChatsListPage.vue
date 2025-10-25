<!-- src/pages/ChatsPage.vue -->
<template>
  <q-page :style="{ background: 'linear-gradient(135deg, #a3bffa 0%, #c3aed6 100%)', color: '#222', backgroundAttachment: 'fixed' }">
    <q-toolbar class="bg-dark text-white">
      <q-toolbar-title>
        <img src="https://media.discordapp.net/attachments/787479869339860995/1431612842498326560/1761393489701.png?ex=68fe0cdb&is=68fcbb5b&hm=1438a173dbdf890d128b8d96eb4aebd99136dff7b0358fd71e332c5af15b1b39&=&format=webp&quality=lossless&width=540&height=540" alt="Chats Logo" style="height: 32px; vertical-align: middle; margin-right: 8px" />
        Chats</q-toolbar-title>
      <q-btn flat round icon="search" />
      
      <!-- 3-dot button with dropdown menu -->
      <q-btn flat round dense icon="more_vert" aria-label="More options">
        <q-menu anchor="bottom right" self="top right">
          <q-list style="min-width: 220px">
            <q-item clickable v-close-popup @click="noop()">
              <q-item-section avatar><q-icon name="add" /></q-item-section>
              <q-item-section>Create new channel</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="noop()">
              <q-item-section avatar><q-icon name="person_add" /></q-item-section>
              <q-item-section>New direct message</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="noop()">
              <q-item-section avatar><q-icon name="archive" /></q-item-section>
              <q-item-section>Archived chats</q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="noop()">
              <q-item-section avatar><q-icon name="settings" /></q-item-section>
              <q-item-section>Settings</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

    </q-toolbar>

    <q-list separator bordered class="bg-white">
      <q-item
        v-for="chat in chats"
        :key="chat.id"
        clickable
        v-ripple
        :to="`/chats/${chat.id}`"
      >
        <q-item-section avatar>
          <!-- 1:1 avatar -->
          <template v-if="!chat.isGroup">
            <q-avatar v-if="getPeerImg(chat)">
              <!-- src is always a string here -->
              <img :src="getPeerImg(chat)!" alt="User avatar" />
            </q-avatar>
            <q-avatar v-else :color="getPeerColor(chat)" text-color="white">
              {{ getPeerLetter(chat) }}
            </q-avatar>
          </template>

          <!-- group avatar -->
          <template v-else>
            <q-avatar color="orange" text-color="white">
              {{ chat.name.charAt(0).toUpperCase() }}
            </q-avatar>
          </template>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ chat.name }}</q-item-label>
          <q-item-label caption lines="1">{{ chat.lastPreview }}</q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-item-label caption class="text-grey">{{ chat.lastStamp }}</q-item-label>
          <q-badge v-if="chat.unread" color="red" :label="chat.unread" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
/* no backend; list pulls from shared mock data */
import { chats, me, type Chat, type Member } from 'src/mock/chats'

defineOptions({ name: 'ChatsPage' })

//helpers return safe primitives so templates never pass undefined
function getPeer(chat: Chat): Member | undefined {
  return chat.members.find(m => m.id !== me.id) ?? chat.members[0]
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

//helper for 3 dot menu
function noop() {
  // do nothing
}

</script>