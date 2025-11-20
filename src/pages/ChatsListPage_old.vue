<!-- src/pages/ChatsPage.vue -->
<template>
	<q-page padding>
		<q-toolbar color="dark" text-color="white">
			<q-toolbar-title>
				<q-avatar size="32px">
					<img src="https://media.discordapp.net/attachments/787479869339860995/1431612842498326560/1761393489701.png?ex=68fe0cdb&is=68fcbb5b&hm=1438a173dbdf890d128b8d96eb4aebd99136dff7b0358fd71e332c5af15b1b39&=&format=webp&quality=lossless&width=540&height=540" alt="Chats Logo" />
				</q-avatar>
				<span>Chats</span>
			</q-toolbar-title>

			<q-btn flat round icon="search" />

			<q-btn flat round dense icon="more_vert" aria-label="More options">
				<q-menu anchor="bottom right" self="top right" fit>
					<q-list>
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

		<q-list separator bordered>
			<q-item
				v-for="chat in chats"
				:key="chat.id"
				clickable
				v-ripple
				:to="`/chats_old/${chat.id}`"
				:style="isNew(chat) ? 'border-left:4px solid var(--q-primary);' : ''"
			>
				<q-item-section avatar>
					<!-- 1:1 avatar -->
					<template v-if="!chat.isGroup">
						<q-avatar v-if="getPeerImg(chat)">
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
					<q-item-label :class="{ 'text-weight-bold': isNew(chat) }">{{ chat.name }}</q-item-label>
					<q-item-label caption lines="1" :class="{ 'text-weight-bold': isNew(chat) }">{{ chat.lastPreview }}</q-item-label>
				</q-item-section>

				<q-item-section side top>
					<q-item-label caption>{{ chat.lastStamp }}</q-item-label>
					<!-- show NEW badge when Lucia is the new chat -->
					<q-badge v-if="isNew(chat)" color="primary" outline label="NEW" class="q-mt-xs" />
					<q-badge v-if="chat.unread" color="red" :label="chat.unread" />
				</q-item-section>
			</q-item>
		</q-list>
	</q-page>
</template>

<script setup lang="ts">
/* no backend; list pulls from shared mock data */
import { chats } from 'src/mock/chats_old'
import { useChatsStore } from 'src/stores/chats_old'

defineOptions({ name: 'ChatsPage' })

const chatsStore = useChatsStore()
const { getPeerImg, getPeerLetter, getPeerColor, isNew } = chatsStore

//helper for 3 dot menu
function noop() {
  // do nothing
}

</script>