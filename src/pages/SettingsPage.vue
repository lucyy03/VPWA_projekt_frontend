<template>
  <q-page padding class="bg-grey-1">
    <div class="row justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <q-card flat bordered class="q-pa-lg">

          <div class="text-h5 q-mb-md">Settings</div>
          <q-separator spaced />

          <!-- dark mode -->
          <div class="row items-center justify-between q-py-sm">
            <div class="col">
              <div class="text-subtitle1">Dark Mode</div>
            </div>
            <div class="col-auto">
              <q-toggle
                v-model="darkMode"
                color="primary"
                checked-icon="dark_mode"
                unchecked-icon="light_mode"
              />
            </div>
          </div>

          <q-separator spaced />

          <!-- notifications -->
          <div class="row items-center justify-between q-py-sm">
            <div class="col">
              <div class="text-subtitle1">Notifications</div>
            </div>
            <div class="col-auto">
              <q-toggle
                v-model="notifications"
                color="primary"
                label="On / Off"
                left-label
              />
            </div>
          </div>

          <q-separator spaced />

          <!-- notifications for only mentions -->
          <div class="row items-center justify-between q-py-sm">
            <div class="col">
              <div class="text-subtitle1">Notifications for only mentions</div>
            </div>
            <div class="col-auto">
              <q-toggle
                v-model="mentions"
                color="primary"
                label="On / Off"
                left-label
              />
            </div>
          </div>

          <q-separator spaced />

          <!-- visibility -->
          <div class="row items-center justify-between q-py-sm">
            <div class="col">
              <div class="text-subtitle1">Visibility</div>
            </div>
            <div class="col-auto">
              <q-toggle
                v-model="visibility"
                color="primary"
                label="On / Off"
                left-label
              />
            </div>
          </div>

          <q-separator spaced />

          <div class="text-center q-mt-md">
            <q-btn label="Save Settings" color="primary" unelevated @click="onSave" />
          </div>

        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

//assumption: quasar dark mode plugin is enabled
const $q = useQuasar()

const darkMode = ref(false)
const notifications = ref(true)
const mentions = ref(true)
const visibility = ref(true)

function onSave() {
  $q.notify({
    type: 'positive',
    message: 'Settings saved (frontend only)'
  })
}
</script>

<style scoped>
.text-subtitle1 {
  font-weight: 500;
}
</style>