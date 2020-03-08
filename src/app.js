import Vue from 'vue';

import Hello from './components/Hello.vue';

export default () => {
  const app = new Vue({
    render: h => h(Hello)
  });
  
  return app;
};