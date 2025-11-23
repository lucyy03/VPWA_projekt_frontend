<template>
	<q-dialog v-model="localOpen" persistent>
		<q-card style="min-width:400px;max-width:90vw">
			<q-card-section class="row items-center">
				<div class="text-h6">add members</div>
				<q-space />
				<q-btn flat round dense icon="close" @click="close" />
			</q-card-section>

			<q-card-section class="q-gutter-md">
				<q-input
					v-model="nicknames"
					label="add users by nickname (separate by commas)"
					dense
					filled
					autofocus
				/>
			</q-card-section>

			<q-card-actions align="right">
				<q-btn flat label="cancel" color="primary" @click="close" />
				<q-btn
					:loading="adding"
					unelevated
					color="primary"
					label="add"
					@click="onAdd"
				/>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useChatsStore } from 'src/stores/chats'

const props = defineProps<{
	modelValue: boolean
	chatId: number
}>()

const emit = defineEmits<{
	(e:'update:modelValue', value:boolean): void
}>()

const $q = useQuasar()
const chatsStore = useChatsStore()

const localOpen = ref(props.modelValue)
const nicknames = ref('')
const adding = ref(false)

//sync internal dialog state with v-model
watch(
	() => props.modelValue,
	(v) => {
		localOpen.value = v
		if (v) {
			nicknames.value = ''
		}
	},
)

watch(localOpen, (v) => {
	emit('update:modelValue', v)
})

function close() {
	localOpen.value = false
}

async function onAdd() {
	const trimmed = nicknames.value.trim()

	if (!trimmed) {
		$q.notify({ type: 'negative', message: 'please enter at least one nickname' })
		return
	}

	adding.value = true
	try {
		const addedCount = await chatsStore.addMembersByNickname(props.chatId, trimmed)

		if (addedCount === 0) {
			$q.notify({
				type: 'warning',
				message:
					'no users with these nicknames were found or they are already in the channel',
			})
			return
		}

		$q.notify({
			type: 'positive',
			message: `invited ${addedCount} user(s) to the channel`,
		})

		close()
	} catch (err) {
		console.error('[AddMemberDialog] onAdd error', err)
		$q.notify({
			type: 'negative',
			message: 'failed to add members',
		})
	} finally {
		adding.value = false
	}
}
</script>
