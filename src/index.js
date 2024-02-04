let activeEffect;
let bucket = new WeakMap();

/**
 * activity bucket trigger
 * @param target
 * @param key
 * @param newValue
 */
function trigger(target, key, newValue) {
  let depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }

  const effectsFn = depsMap.get(key);
  if (!effectsFn) {
    return;
  }
  effectsFn.forEach((fn) => {
    fn();
  });
}

/**
 * activity bucket add track
 * @param target
 * @param key
 */
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
}

const objProxy = new Proxy(
  { ok: true },
  {
    set(target, p, newValue, receiver) {
      const result = Reflect.set(target, p, newValue, receiver);
      trigger(target, p, newValue);
      return result;
    },
    get(target, p, receiver) {
      track(target, p);
      return Reflect.get(target, p, receiver);
    },
  },
);

function effect(fn) {
  activeEffect = fn;
  fn();
}

effect(() => {
  console.log("the objProxy.ok value has change. -->", objProxy.ok);
});
setTimeout(() => {
  objProxy.ok = false;
}, 3000);
