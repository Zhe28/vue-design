let activeEffect;
const effectStack = [];
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

  const effects = depsMap.get(key);
  if (!effects) {
    return;
  }
  new Set(effects).forEach((fn) => {
    // avoid maximum call stack size exceeded
    if (activeEffect !== fn) {
      fn();
    }
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
  activeEffect.deps.push(deps);
}

const objProxy = new Proxy(
  { ok: true },
  {
    set(target, p, newValue, receiver) {
      trigger(target, p, newValue);
      const result = Reflect.set(target, p, newValue, receiver);
      return result;
    },
    get(target, p, receiver) {
      track(target, p);
      return Reflect.get(target, p, receiver);
    },
  },
);

function cleanup(effectFn) {
  effectFn.deps.forEach((effects) => {
    effects.delete(effectFn);
  });
  effectFn.deps.length = 0;
}

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };
  effectFn.deps = [];
  effectFn();
}

// effect(function () {
// objProxy.ok ? objProxy.text : "not set";
// });
// setTimeout(function () {
// objProxy.ok = false;
// }, 3000);

effect(function () {
  console.log("this is effecfFn1.");
  effect(function () {
    console.log("this is effectFn2.");
    let tmp2 = objProxy.ok;
  });
  let tmp = objProxy.ok;
});

// objProxy.ok = false;

effect(() => {
  objProxy.ok = objProxy.ok - 1;
});
