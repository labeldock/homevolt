<template>
  <span :style="`font-size:${fontSize};fontColor:${color}`">
    <template v-if="os">
      <i v-if="os.type" :class="`ri-${os.type}-fill`" />
      <small>{{ os.version }}</small>
    </template>
    <template v-if="browser">
      <i v-if="browser.type" :class="`ri-${browser.type}-fill`" />
      <span v-else>{{browser.name}}</span>
      <small>{{ browser.version }}</small>
    </template>
  </span>
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
export default defineComponent({
  name: "InfoIcon",
  props: {
    browser: Object,
    os: Object,
    size: [String, Number],
    color: [String]
  },
  setup(props) {
    const fontSize = computed(() => (props.size ? props.size : "inherit"));
    const fontColor = computed(() => (props.color ? props.color : "inherit"));
    return {
      browser:computed(()=>{
        const aBrowser = props.browser;
        if(!aBrowser) return null;

        const browser = {
          name:aBrowser.name,
          type:"",
          version:"0"
        };

        console.log(browser.name)

        switch(props.browser.name){
          case "Chrome":
            browser.type = "chrome"
            break;  
          case "SafariMobile":
            browser.type = "safari"
            break;
        }

        const majorVersionMatched = props.browser.version.match(/^\d+/)
        if(majorVersionMatched){
          browser.version = majorVersionMatched[0]
        } else {
          browser.version = aBrowser.version
        }

        return browser
      }),
      os:computed(()=>{
        const aOs = props.os;
        if(!aOs) return null;

        const os = {
          name:aOs.name,
          type:"",
          version:aOs.versionName === "n/a" ? aOs.name : aOs.versionName
        };

        switch(props.os.name){
          case "Windows":
            os.type = "windows"
            break;
          case "Linux":
            os.type = "coreos"
            break;
          case "iOS":
          case "macOS":
            os.type = "apple"
            break;
          case "Android":
            os.type = "android"
            os.version = "Android"
            break;
        }

        return os
      }),
      fontSize,
      fontColor
    };
  }
});
</script>
