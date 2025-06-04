type Container = Element & { _vnode?: VNode };
type Config = {
  mountElement: (vnode: VNode, container: Container) => void;
  clearNode: (container: Container) => void;
  setElementText: (el: Element, text: string) => void;
  insertChild: (child: Node, parent: Node, anchor: Node | null) => void;
};