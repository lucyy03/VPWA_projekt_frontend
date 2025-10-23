<!-- src/pages/ChatsPage.vue -->
<template>
  <q-page class="bg-grey-2">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Chats</q-toolbar-title>
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

    <q-list separator bordered class="bg-white q-mt-sm">
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
          <q-badge v-if="chat.unread" color="primary" :label="chat.unread" />
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