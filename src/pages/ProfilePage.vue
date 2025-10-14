<!-- src/pages/ProfilePage.vue -->
<template>
  <q-page padding class="bg-grey-1">
    <div class="row justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <q-card flat bordered class="q-pa-lg">

          <!-- avatar + basic info -->
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto">
              <q-avatar size="100px">
                <img src="https://randomgif.durzumzhumog.workers.dev/" alt="User avatar">
              </q-avatar>
            </div>
            <div class="col">
              <div class="text-h5">Jim Halpert</div>
              <div class="text-subtitle2 text-grey-7">@bigtuna42</div>
              <div class="text-caption text-grey-7">jim.halpert@office.com</div>
            </div>
          </div>

          <q-separator spaced />

          <!-- info section -->
          <div class="q-gutter-sm">

            <div>
              <div class="text-subtitle1 text-bold">Bio</div>
              <div class="text-body2 text-grey-8">
                  Bears. Beets. Battlestar Galactica.
              </div>
            </div>

            <div>
              <div class="text-subtitle1 text-bold">Joined</div>
              <div class="text-body2 text-grey-8">October, 2025</div>
            </div>
          </div>

          <q-separator spaced />

          <div class="text-center q-mt-md">
            <q-btn color="primary" label="Edit profile" icon="edit" unelevated />
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/* no script logic needed; static page only */
defineOptions({ name: 'ProfilePage' })
</script>

<style scoped>
.text-bold { font-weight: 600; }
</style>