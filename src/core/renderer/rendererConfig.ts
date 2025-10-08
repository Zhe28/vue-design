export function createRendererConfig(): Config {
  switch (import.meta.env.MODE) {
    case "html":
      return htmlMode();
    case "production":
      break;
  }
  return htmlMode();
}

function htmlMode(): Config {
  /**
   * 挂载元素
   * @param vnode 虚拟节点
   * @param container 容器
   */
  function mountElement(vnode: VNode, container: Container) {
    console.log(`current mount element`);

    const el = document.createElement(vnode.tag);
    // 根据对应的类型添加子节点
    if (typeof vnode.children === "string") {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      for (const child of vnode.children) {
        mountElement(child, el);
      }
    }

    // 为元素添加属性
    vnode.props &&
      Object.keys(vnode.props).forEach((key) => {
        const value = vnode.props[key];
        const valueType = typeof value;
        // 如果 props 是 el 的 属性值， 那么优先确定属性值里面的内容
        /**
         * 为了解决 el.disabled = false， 用户希望禁用按钮，而 el.disabled = false 则是不禁用的意思。
         */
        if (key in el) {
          if (valueType === "boolean" && value === "") {
            el[key] = true;
          } else {
            el[key] = value;
          }
        } else {
          el.setAttribute(key, value);
        }
      });

    function showSetHTMLProps() {
      console.log(`current show set html props`);
    }
    container.appendChild(el);
  }

  /**
   * 插入子节点
   * @param child 子节点
   * @param parent 父节点
   * @param anchor 锚点
   */
  function insertChild(child: Node, parent: Node, anchor: Node | null) {
    console.log(`current insert child`);
    parent.insertBefore(child, anchor);
  }

  /**
   * 设置元素文本
   * @param el 元素
   * @param text 文本
   */
  function setElementText(el: Element, text: string) {
    console.log(`current set element text`);

    el.textContent = text;
  }

  /**
   * 清空节点
   * @param container 容器
   */
  function clearNode(container: Container) {
    console.log(`current clear node`);
    container.innerHTML = "";
  }

  return {
    mountElement,
    insertChild,
    setElementText,
    clearNode,
  };
}
