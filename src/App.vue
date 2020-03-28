<template>
  <!-- ssr下因为mount方法调用时标签已被渲染，所以将app id放在这里-->
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {

}
</script>