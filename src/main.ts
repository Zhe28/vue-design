import { ref, effect } from "vue";
import "./assets/main.css";
import { createRenderer } from "./core/renderer";

const node: VNode = {
  tag: "div",
  props: {},
  children: [
    {
      tag: "span",
      props: {id: 'foo'},
      children: "hello",
    },
    {
      tag: "span",
      props: {id: 'bar'},
      children: "world",
    },
  ],
};
const app = document.querySelector("#app") as Container;
// 创建渲染器
const renderer = createRenderer();
renderer.render(node, app);

// 2秒后清空
setTimeout(() => {
  renderer.render(null, app);
}, 10000);
