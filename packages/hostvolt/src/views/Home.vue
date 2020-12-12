<template>
  <div class="home-wrapper">
    <div class="infobox neu-rect">
      <div>
        <TextIcon type="loader" size="24px" />
      </div>
      <div>
        안녕하세요 호스트 서버입니다.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home"
});
</script>

<style lang="scss">
@import "~/shared/assets/mixin";
.home-wrapper {
  position: relative;
  min-height: 60vh;
  .infobox {
    @include translate-center;
    padding: 40px;
  }
  .hostbox {
    @include flow(row, wrap, center);
    > .host-item {
      flex: 0 0 auto;
      width: 240px;
      height: 240px;
      position: relative;
      padding: 10px;
      > header {
        @include absolute(left, 10px, 10px);
      }
      > small {
        font-size: 10px;
      }
      > p {
        margin-top: 12px;
      }
      > footer {
        @include absolute(bottom, 10px, full);
      }
    }
  }
}
</style>
