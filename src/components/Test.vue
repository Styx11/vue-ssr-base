<template>
  <div>
    <div>we're in route: {{ path }}</div>
  </div>
</template>

<script>
export default {
  data: () => ({
    path: '',
  }),
  mounted () {
    this.path = this.$route.path;
  },
}
</script>