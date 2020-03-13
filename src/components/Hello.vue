<template>
  <div id="title" @click="sayHello">hello</div>
</template>

<script>
export default {
  name: 'hello',
  serverCacheKey: prop => true,
  methods: {
    sayHello () {
      console.log('a Vue component');
    }
  }
}
</script>

<style scoped>
#title {
  color: red;
}
</style>