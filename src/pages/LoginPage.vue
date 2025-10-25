<template>
  <q-page class="flex flex-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <q-card style="width:360px;max-width:90vw">
      <q-card-section class="text-h6 text-center" style="background-color: black; color: white;">✩°｡⋆ Welcome to Daze ⋆｡°✩</q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="email"
          type="email"
          label="E-mail"
          autocomplete="email"
          dense
          outlined
        />
        <q-input
          v-model="password"
          type="password"
          label="Password"
          autocomplete="current-password"
          dense
          outlined
          @keyup.enter="onSubmit"
        />

        <div class="flex column items-center q-gutter-md q-mx-none">
          <q-btn
            :loading="loading"
            label="Log In"
            color="black"
            style="width: 280px"
            @click="onSubmit"
          />

          <q-btn
            :loading="loading"
            label="Sign Up"
            color="black"
            style="width: 280px"
            @click="onSignUp"
          />
        </div>

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

function onSignUp() {
  

  loading.value = true
  error.value = ''

  loading.value = false

  void router.push('/signup')
}
</script>