<template>
  <q-page class="flex flex-center">
    <q-card style="width:360px;max-width:90vw">
      <q-card-section class="text-h6">welcome</q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="email"
          type="email"
          label="email"
          autocomplete="email"
          dense
          outlined
        />
        <q-input
          v-model="password"
          type="password"
          label="password"
          autocomplete="current-password"
          dense
          outlined
          @keyup.enter="onSubmit"
        />

        <q-btn
          :loading="loading"
          label="log in"
          color="primary"
          class="full-width"
          @click="onSubmit"
        />

        <div v-if="error" class="text-negative text-caption">{{ error }}</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function onSubmit() {
  

  loading.value = true
  error.value = ''

  loading.value = false

  void router.push('/chats')
}
</script>
