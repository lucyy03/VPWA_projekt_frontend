<template>
	<q-dialog v-model="localOpen" persistent>
		<q-card style="min-width:400px;max-width:90vw">
			<q-card-section class="row items-center">
				<div class="text-h6">create new channel</div>
				<q-space />
				<q-btn flat round dense icon="close" @click="close" />
			</q-card-section>

			<q-card-section class="q-gutter-md">
                <q-input
                    v-model="name"
                    label="channel name"
                    dense
                    filled
                    autofocus
                />
                <q-input
                    v-model="nickname"
                    label="invite user by nickname (separate by commas)"
                    dense
                    filled
                />

                <q-toggle
                    v-model="isGroup"
                    label="group channel"
                />

                <q-toggle
                    v-model="isPublic"
                    :disable="!isGroup"
                    label="public channel (only for groups)"
                />
            </q-card-section>

			<q-card-actions align="right">
				<q-btn flat label="cancel" color="primary" @click="close" />
				<q-btn
					:loading="creating"
					unelevated
					color="primary"
					label="create"
					@click="onCreate"
				/>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useChatsStore } from 'src/stores/chats'
import type { Chat } from 'src/stores/chats'

const props = defineProps<{
	modelValue: boolean
}>()

const emit = defineEmits<{
	(e:'update:modelValue', value:boolean): void
	(e:'created', chat:Chat): void
}>()

const $q = useQuasar()
const chatsStore = useChatsStore()

const localOpen = ref(props.modelValue)
const name = ref('')
const nickname = ref('')
const isGroup = ref(false)
const creating = ref(false)
const isPublic = ref(false)

//sync internal dialog state with v-model
watch(
	() => props.modelValue,
	(v) => {
		localOpen.value = v
		if (v) {
			name.value = ''
			nickname.value = ''
			isGroup.value = false
            isPublic.value = false
		}
	}
)

watch(isGroup, (v) => {
	if (!v) {
		isPublic.value = false
	}
})

watch(localOpen, (v) => {
	emit('update:modelValue', v)
})

function close() {
	localOpen.value = false
}

async function onCreate() {
	if (!name.value.trim()) {
		$q.notify({ type: 'negative', message: 'please enter a channel name' })
		return
	}

	creating.value = true
	try {
		const trimmedName = name.value.trim()
		const trimmedNick = nickname.value.trim()

		const chat = await chatsStore.createChat({
			name: trimmedName,
			isGroup: isGroup.value,
            visibility: isGroup.value && isPublic.value ? 'public' : 'private',
			//single nickname or comma-separated list, store func handles splitting
			nicknames: trimmedNick,
		})

		if (!chat) {
			$q.notify({ type: 'negative', message: 'failed to create channel' })
			return
		}

		if (trimmedNick && chat.members.length <= 1) {
			$q.notify({
				type: 'warning',
				message: 'no users with these nicknames were found, channel was created with you only',
			})
		}

		emit('created', chat)
		close()
	} catch (err) {
		console.error('create channel error', err)
		$q.notify({ type: 'negative', message: 'failed to create channel' })
	} finally {
		creating.value = false
	}
}
</script>