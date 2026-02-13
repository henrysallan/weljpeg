/* ================================================================
   Shared leva-controlled config values
   ================================================================
   This module acts as a bridge: ImageSquiggle (which owns the Leva
   panel) writes these values, and other components like ScrollManager
   read them at runtime without needing React state coupling.
   ================================================================ */

export const transitionConfig = {
  duration: 1.8,
  easePower: 5,
};
