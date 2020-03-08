<template>
  <div id="title" @click="sayHello">hello</div>
</template>

<script>
export default {
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