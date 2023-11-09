<template>
  <header class="header">
    <img src="/src/assets/logo.svg" alt="FormKit Logo" class="logo" />
    <Navigation />
  </header>
  <div class="wrapper">
    <router-view />
  </div>
  <VueGriddle />
</template>

<script lang="ts" setup>
import Navigation from './Navigation.vue'
import { VueGriddle } from '@braid/griddle'
</script>

<style lang="scss">
.header {
  @include container();
  padding: 1em 0;

  @media (min-width: bp(s)) {
    padding: 2em 0;
  }
}

.logo {
  width: span(6);

  @media (min-width: bp(xs)) {
    width: span(4);
  }
  @media (min-width: bp(s)) {
    width: span(3);
  }
  @media (min-width: bp(m)) {
    width: span(2);
  }
}

.container {
  @include container();
}

.wrapper {
  padding: 3em;
}
</style>
