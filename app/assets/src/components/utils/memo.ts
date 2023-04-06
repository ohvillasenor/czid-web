import React, { ComponentType, PropsWithChildren } from "react";

export const memo = <P extends Record<string, unknown>>(
  Component: ComponentType<any>,
  propsAreEqual?: (
    prevProps: Readonly<PropsWithChildren<P>>,
    nextProps: Readonly<PropsWithChildren<P>>,
  ) => boolean,
) => {
  const memoized = React.memo(Component, propsAreEqual);

  Object.defineProperty(memoized, "displayName", {
    set(name) {
      Component.displayName = name;
    },
    get() {
      return Component.displayName;
    },
  });

  return memoized;
};
