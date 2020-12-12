import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "/shared/assets/neumorph.scss";
import "shared/setup";

createApp(App)
  .use(router)
  .mount("#app");
