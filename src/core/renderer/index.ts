import { createRendererConfig } from "./rendererConfig";

/**
 * 创建渲染器
 */
function createRenderer(config = createRendererConfig()) {
  const { clearNode, mountElement } = config;

  /**
   * 渲染器
   */
  function renderer() {
    
    /**
     * 渲染函数
     */
    function render(vnode: VNode | null, container: Container) {
      // 如果 vnode 存在， 那么进行打补丁
      if (vnode) patch(container._vnode as VNode, vnode, container);
      // 如果不存在， 就要进行清空
      else clearNode(container);
    }

    /**
     * 打补丁
     * @param oldNode 旧节点
     * @param newNode 新节点
     * @param container 容器
     */
    function patch(oldNode: VNode, newNode: VNode, container: Container) {
      // 如果没有旧节点， 那么进行挂载
      if (!oldNode) mountElement(newNode, container);
      else {
        // 如果有旧节点， 那么进行打补丁
      }
    }

    return {render};
  }

  return renderer();
}

export { createRenderer };
