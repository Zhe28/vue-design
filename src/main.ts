import { ref, effect } from "vue";
import "./assets/main.css";

import { createRenderer } from "./core/renderer";

let count = ref(1);
effect(() => {
  // renderer(
  //   `<div>hello world ${count.value}</div>`,
  //   document.getElementById("app")
  // );
});
// 自动更新
setTimeout(() => {
  count.value++;
}, 2000);
