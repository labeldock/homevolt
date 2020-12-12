<template>
  <i :class="className" :style="`font-size:${fontSize};fontColor:${color}`"></i>
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
export default defineComponent({
  props: {
    type: String,
    size: [String, Number],
    color: [String]
  },
  setup(props) {
    const className = computed(() => `ri-${props.type}-line`);
    const fontSize = computed(() => (props.size ? props.size : "inherit"));
    const fontColor = computed(() => (props.color ? props.color : "inherit"));
    return {
      className,
      fontSize,
      fontColor
    };
  }
});
</script>
