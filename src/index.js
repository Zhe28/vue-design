let activeEffect;
const effectStack = [];
let bucket = new WeakMap();

/**
 * activity bucket trigger
 * @param target
 * @param key
 */
function trigger(target, key) {
  let depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }

  const effects = depsMap.get(key);
  if (!effects) {
    return;
  }
  new Set(effects).forEach((effectFn) => {
    // avoid maximum call stack size exceeded
    if (activeEffect !== effectFn) {
      if (effectFn.options.scheduler) {
        return effectFn.options.scheduler(effectFn);
      } else {
        effectFn();
      }
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
      const result = Reflect.set(target, p, newValue, receiver);
      trigger(target, p);
      return result;
    },
    get(target, p, receiver) {
      track(target, p);
      return Reflect.get(target, p, receiver);
    },
  },
);

export function createProxy(obj) {
  return new Proxy(obj, {
    set(target, p, newValue, receiver) {
      const result = Reflect.set(target, p, newValue, receiver);
      trigger(target, p);
      return result;
    },
    get(target, p, receiver) {
      track(target, p);
      return Reflect.get(target, p, receiver);
    },
  });
}

function cleanup(effectFn) {
  effectFn.deps.forEach((effects) => {
    effects.delete(effectFn);
  });
  effectFn.deps.length = 0;
}

function effect(fn, options = { lazy: false }) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.options = options;
  effectFn.deps = [];

  if (!options.lazy) {
    effectFn();
  }

  return effectFn;
}

function computed(getter) {
  let value;
  let dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 副作用函数重新执行后dirty值变脏
      dirty = true;
      trigger(obj, value);
    },
  });

  const obj = {
    get value() {
      if (dirty) {
        // 重新获取值，dirty取消脏值
        dirty = false;
        value = effectFn();
      }
      track(obj, value);
      return value;
    },
  };

  return obj;
}

export function watch(source, cb) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source);
  }
  let newValue, oldValue;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      newValue = effectFn();
      cb(newValue, oldValue);
      oldValue = newValue;
    },
  });
  oldValue = effectFn();

  // 遍历属性节点， 建立联接
  function traverse(source, seen = new Set()) {
    // 判断是否是基础类型
    if (typeof source !== "object" || source === null || source === undefined || seen.has(source)) {
      return;
    }

    seen.add(source);
    for (const key in source) {
      traverse(source[key], seen);
    }
    return source;
  }
}

export { effect, computed, objProxy };
