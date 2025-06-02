export function createRendererConfig() {
  switch (import.meta.env.MODE) {
    case "html":
      return htmlMode();
    case "production":
      break;
  }
//   默认 html 模式
  return htmlMode();
}

function htmlMode() {
  return {
    mountElement: (vnode: VNode, container: Container) => {
      console.log(`current is mount element`);
      
      const el = document.createElement(vnode.tag);
      if (typeof vnode.children === "string") {
        el.textContent = vnode.children;
      }
      container.appendChild(el);
    },
    clearNode: (container: Container) => {
      console.log(`current is clear node`);
      
      container.innerHTML = "";
    },
  };
}