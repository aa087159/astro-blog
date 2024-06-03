---
layout: ../../../layouts/post-layout.astro
title: proxy state valtio
description: the implementation of proxy state
dateFormatted: May 31th, 2024
link: /posts/react/proxy-state-valtio
category: react
---

## Valtio Example

Valtio can do something like:

```javascript
import { proxy, useSnapshot } from "valtio";

const state = proxy({ count: 0, text: "hello" });

// This will re-render on `state.count` change
// but not on `state.text` change
function Counter() {
  const snap = useSnapshot(state);
  return (
    <div>
      {snap.count}
      <button onClick={() => ++state.count}>+1</button>
    </div>
  );
}

// you can mutate the state from anywhere
setInterval(() => {
  ++state.count;
}, 1000);
```

## Basic Implementation

```javascript
import React from 'react'

export function proxy<T extends object>(initialValue: T): T {

  // keep track of the keys of the object that are being used in the component
  let rendered = new Set<keyof T>()
  // this force update function would update the component where state is used
  // need to make this an array if there're multiple components using proxy state
  let forceUpdateFn: (()=>void)

  return new Proxy(initialValue,{
    get(target, prop) {
      // whenever state is being used in a component, this function would be called
      // and we add the used key to the rendered set
      // so that we know whether we need to update components
      rendered.add(prop as keyof T)
      return Reflect.get(target, prop);
    },
    set(target, prop, value){
      // if prop is 'forceUpdate', we assign the prop to forceUpdateFn
      if(prop === 'forceUpdate'){
        forceUpdateFn = value
        return false
      }
      // no change do not update
      if(Reflect.get(target, prop) === value){
        return true
      }
      // update state
      const result = Reflect.set(target, prop, value);
      // re-render components where state is used
      if(result && rendered.has(prop as keyof T) && forceUpdateFn){
        // recalculate rendered
        rendered.clear();
        forceUpdateFn()
      }
      return result
    }
  })
}
```

\*This proxy component is just a simple implementation, it only considers the scenario where only one state exists, so when you have more than one state, this proxy component would update all components that use any state.

```javascript
export function useSnapshot<T extends object>(proxy: T): T {
  const [_, updateFunc] = React.useState(0)
  // setting forceUpdateFn in proxy
  Reflect.set(proxy, 'forceUpdate', ()=>updateFunc((prev)=>prev+1))
  return proxy
}
```

Whenever `useSnapshot` is called in a component, an `updateFunc` would be stored in the proxy component. In this way, when a state value is updated, we can update all components where the state is called inside the proxy component.

## The Usage

```javascript
const state = proxy({ count: 100, text: "hello", mode: "count" });

export function App() {
  const snap = useSnapshot(state);
  return <div>{snap.mode === "count" ? snap.count : snap.text}</div>;
}
```
