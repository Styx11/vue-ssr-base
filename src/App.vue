<template>
  <!-- ssr下因为mount方法调用时标签已被渲染，所以将app id放在这里-->
  <div id="app">
    <Hello/>
  </div>
</template>

<script>
import Hello from './components/Hello.vue';

export default {
  components: {
    Hello
  }  
}
</script>