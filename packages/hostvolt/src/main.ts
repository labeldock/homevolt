import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "/shared/assets/neumorph.scss";

createApp(App)
  .use(router)
  .mount("#app");
