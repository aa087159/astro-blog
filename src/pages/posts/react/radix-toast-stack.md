---
layout: ../../../layouts/post-layout.astro
title: Radix Toast Stack
description: use radix and tailwind to build a toast stack UI
dateFormatted: June 3rd, 2024
link: /posts/react/radix-toast-stack
category: react
---

## 📝 Inspiration

Saw [radix toast stack codesandbox](https://codesandbox.io/p/sandbox/radix-toast-stack-dpfx5f?file=%2Fsrc%2FToast.jsx) on codesandbox.io

The biggest advantage of this toast stack, besides the beautiful UI, is that only one state is ever needed to store all toasts.

The idea is to use a Map object to store all toasts, and we render them all at once. We shuffle, remove, sort, and style them by passing ref to each toast element.

## 📝 Problems

In Radix toast, there's inner state and custom state. Things like `ToastPrimitive.Action`, `ToastPrimitive.Close`, and `duration`, they tell `onOpenChange` that state is updated. Therefore, in the original Codesandbox, when inner state is updated, we can accordingly update our custom state by calling:

```javascript
onOpenChange={(open) => {
    if (!open) {
        toastElementsMapRef.current.delete(key);
        sortToasts();
        if (!open) {
            setTimeout(() => {
                handleRemoveToast(key);
            }, ANIMATION_OUT_DURATION);
        }
    }
}}
```

However, in this Codesandbox, toast state is not controlled, meaning the open state of each toast is not passed in the radix `<ToastPrimitive.Root />`, which means we can't know for sure the current state of any toast.

Another drawback of this Codesandbox is that it uses React Context to pass down state and toasts' refs, which means its context provider needs to wrap around the entire app, which means it would cause unnecessary rerenders for some components.

## 📝 Solution

To fix this, I use Zustand and passing open state to `<ToastPrimitive.Root />`, here's the implementation of the toast provider:

```javascript
export const ANIMATION_OUT_DURATION = 350;

export interface ToastProviderProps extends React.ComponentProps<typeof ToastPrimitive.Provider> {
  children?: React.ReactNode;
}

export const ToastProvider2 = ({ children, ...props }: ToastProviderProps) => {
  // toasts store
  const toastsMap = useStore(state => state.toastsMap);
  const removeToast = useStore(state => state.removeToast);
  const setToastOpenState = useStore(state => state.setToastOpenState);

  // use ref to store toast dom elements
  const toastElementsMapRef = React.useRef(new Map());
  // use ref to store viewport dom element
  const viewportRef = React.useRef<HTMLOListElement | null>(null);

  const sortToasts = React.useCallback(() => {
    const toastElements = Array.from(toastElementsMapRef.current).reverse();
    const heights: number[] = [];

    // add attributes to each toast element
    toastElements.forEach(([, toast], index) => {
      if (!toast) return;
      const height = toast.clientHeight;
      heights.push(height);
      const frontToastHeight = heights[0];

      // determine if the toast is the front toast or hidden
      toast.setAttribute('data-front', index === 0);
      toast.setAttribute('data-hidden', index > 2);
      // set custom css properties
      toast.style.setProperty('--index', index);
      toast.style.setProperty('--height', `${height}px`);
      toast.style.setProperty('--front-height', `${frontToastHeight}px`);
      // set hover offset, so we can animate it afterwards
      const hoverOffsetY = heights.slice(0, index).reduce((res, next) => (res += next), 0);
      toast.style.setProperty('--hover-offset-y', `-${hoverOffsetY}px`);
    });
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport) {
      // setting data-hovering attribute when the viewport is hovered/unhovered
      const handleFocus = () => {
        toastElementsMapRef.current.forEach(toast => {
          toast.setAttribute('data-hovering', 'true');
        });
      };

      const handleBlur: (ev: PointerEvent | FocusEvent) => void = event => {
        if (!viewport.contains(event.target as Node) || viewport === event.target) {
          toastElementsMapRef.current.forEach(toast => {
            toast.setAttribute('data-hovering', 'false');
          });
        }
      };

      viewport.addEventListener('pointermove', handleFocus);
      viewport.addEventListener('pointerleave', handleBlur);
      viewport.addEventListener('focusin', handleFocus);
      viewport.addEventListener('focusout', handleBlur);
      return () => {
        viewport.removeEventListener('pointermove', handleFocus);
        viewport.removeEventListener('pointerleave', handleBlur);
        viewport.removeEventListener('focusin', handleFocus);
        viewport.removeEventListener('focusout', handleBlur);
      };
    }
  }, []);

  // this function will only be called when toast's inner state changes
  // e.g. when ToastPrimitive.Close or ToastPrimitive.Action is triggered
  const onOpenChange = React.useCallback(
    (open: boolean, key: string) => {
      if (!open) {
        setToastOpenState(key, false);
        toastElementsMapRef.current.delete(key);
        sortToasts();

        setTimeout(() => {
          removeToast(key);
        }, ANIMATION_OUT_DURATION);
      }
    },
    [removeToast, setToastOpenState, sortToasts],
  );

  return (
    <ToastPrimitive.Provider {...props}>
      {children}
      {Array.from(toastsMap).map(([key, toast]) => (
        <Toast2
          key={key}
          id={key}
          {...toast}
          onSortToasts={sortToasts}
          toastElementsMapRef={toastElementsMapRef}
          onOpenChange={open => onOpenChange(open, key)}
        />
      ))}
      <ToastPrimitive.Viewport
        ref={viewportRef}
        className={cn(
          'fixed bottom-8 left-8 transition-transform [--stack-gap:10px]',
          'z-[--toast-viewport-zindex] duration-[400ms] ease-[ease]',
        )}
      />
    </ToastPrimitive.Provider>
  );
};

```

The implementation of each toast:

```javascript
export interface ToastProps extends ToastInfo {
  onSortToasts: () => void;
  toastElementsMapRef: React.MutableRefObject<Map<string, HTMLElement>>;
  id: string;
}

const Toast2 = ({
  hasIcon = false,
  theme = "success",
  text,
  isClosable = false,
  onSortToasts,
  toastElementsMapRef,
  children,
  actionChildren,
  id,
  onOpenChange,
  open,
  ...restProps
}: ToastProps) => {
  const ref = (React.useRef < HTMLLIElement) | (null > null);
  const toastElementsMap = toastElementsMapRef?.current;

  // remove toast store
  const removeToast = useStore((state) => state.removeToast);

  React.useLayoutEffect(() => {
    if (ref.current && toastElementsMap) {
      toastElementsMap.set(id, ref.current);
      onSortToasts();
    }
  }, [id, onSortToasts, toastElementsMap]);

  // when outer state change, though the changed state is passed in radix Toast through the open prop,
  // it won't call onOpenChange, so we need to use this effect to manually remove toasts
  React.useEffect(() => {
    if (!open && toastElementsMap) {
      toastElementsMap.delete(id);
      onSortToasts();

      setTimeout(() => {
        removeToast(id);
      }, ANIMATION_OUT_DURATION);
    }
  }, [id, onSortToasts, open, removeToast, toastElementsMap]);

  return (
    <ToastPrimitive.Root
      {...restProps}
      ref={ref}
      // now toast is controlledby the store
      open={open}
      onOpenChange={onOpenChange}
      duration={restProps.duration || 10000}
      className={cn(
        "[--opacity:0]",
        "[--x:--radix-toast-swipe-move-x,0]",
        "[--y:calc(1px-(var(--stack-gap)*var(--index)))]",
        "[--scale:calc(1-0.05*var(--index))]",
        "absolute bottom-[15px] left-[15px] right-[15px] flex min-w-[276px] items-center rounded-md bg-gray-900 px-3 py-2.5 text-gray-100 shadow-xl",
        "translate-z-0 translate-x-[--x] translate-y-[85px] opacity-[--opacity]",
        "data-[hidden=false]:[--opacity:1] data-[hidden=true]:[--opacity:0]",
        'after:absolute after:left-0 after:right-0 after:top-[100%] after:h-[500px] after:w-[100%] after:bg-transparent after:content-[""]',
        "duration-[400ms] ease-[ease]",
        "data-[front=true]:translate-z-0 data-[front=true]:translate-x-[--x] data-[front=true]:translate-y-[--y,0]",
        "data-[front=false]:translate-z-0 data-[front=false]:translate-x-[--x] data-[front=false]:translate-y-[--y,0] data-[front=false]:scale-[--scale]",
        "data-[hovering=true]:duration-[350ms] data-[hovering=true]:[--scale:1] data-[hovering=true]:[--y:calc(var(--hover-offset-y)-var(--stack-gap)*var(--index))]",
        "data-[swipe=move]:duration-[0ms]",
        "data-[swipe=cancel]:[--x:0]",
        "data-[state=closed]:animate-slideDown",
        "data-[swipe-direction=right][data-swipe=end]:animate-slideRight"
      )}
    >
      <div className="mr-4 flex flex-1 gap-3">
        {/* leading icon */}
        {hasIcon && theme === "success" && (
          <FeaturedIconSquare color="teal" theme="dark">
            <CheckSVG />
          </FeaturedIconSquare>
        )}
        {hasIcon && theme === "error" && (
          <FeaturedIconSquare color="red" theme="dark">
            <CloseXsSVG />
          </FeaturedIconSquare>
        )}
        {/* text */}
        <ToastPrimitive.Description>{text}</ToastPrimitive.Description>
      </div>

      {/* children */}
      {children && <>{children}</>}

      {/* action button */}
      {actionChildren && (
        <ToastPrimitive.Action altText="action" asChild>
          {children}
        </ToastPrimitive.Action>
      )}

      {/* close button */}
      {isClosable && (
        <ToastPrimitive.Close aria-label="Close">
          <CloseSmSVG />
        </ToastPrimitive.Close>
      )}
    </ToastPrimitive.Root>
  );
};

export { Toast2 };
```

Toast store:

```javascript
export interface ToastInfo
  extends React.ComponentProps<typeof ToastPrimitive.Root> {
  hasIcon?: boolean;
  theme?: "success" | "error";
  text: string;
  isClosable?: boolean;
  actionChildren?: React.ReactNode;
  children?: React.ReactNode;
}

type ToastsSlice = {
  toastsMap: Map<string, ToastInfo>,
  addToast: (toastKey: string, toast: ToastInfo) => void,
  setToastOpenState: (key: string, open: boolean) => void,
  removeToast: (key: string) => void,
  resetToastsMapState: () => void,
};

const initialState = {
  toastsMap: new Map(),
};

const createToastsSlice: StateCreator<ToastsSlice, [], [], ToastsSlice> = (
  set
) => {
  return {
    ..._cloneDeep(initialState),
    addToast: (toastKey: string, toast: ToastInfo) => {
      set(
        produce((state: ToastsSlice) => {
          state.toastsMap.set(toastKey, { ...toast, open: true });
        })
      );
    },
    setToastOpenState: (key: string, open: boolean) => {
      set(
        produce((state: ToastsSlice) => {
          const toast = state.toastsMap.get(key);
          if (toast) {
            state.toastsMap.set(key, { ...toast, open });
          }
        })
      );
    },
    removeToast: (key: string) => {
      set(
        produce((state: ToastsSlice) => {
          state.toastsMap.delete(key);
        })
      );
    },
    resetToastsMapState: () => set(initialState),
  };
};
```

Now in the new version, each toast's state is controlled by the custom state.
In the toast zustand store, we store the `toastsMap`, `addToast` func, `setToastOpenState` func, and `removeToast` func where `addToast`and `setToastOpenState` are used when we need to update toast in other components, and `removeToast` is used when we sync customed state with inner state of radix toast.

Note that when our customed state changes, though the changed state is passed in radix Toast through the open prop, it won't call onOpenChange so we use a `useEffect` to sync states.

\*We use Tailwind in the new version.
