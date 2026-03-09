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

export const logoAnimConfig = {
  expandDuration: 1.6,
  collapseDuration: 1.6,
  holdLogo: 2.0,
  holdDot: 1.0,
  /** Lower = smoother blobs (more path segments). Range ~0.1–4. */
  morphResolution: 0.5,
  /** Set by AnimatedWelcomeLogo, called by leva panel to restart loop */
  _onRestart: null as (() => void) | null,
  /** Called when morphResolution changes so interpolators can be rebuilt */
  _onResolutionChange: null as (() => void) | null,
};

export const imageRevealConfig = {
  blur: false,
  pixelate: true,
  pixelStart: 48,
  blurAmount: 0,
  duration: 800,
  travel: 12,
};
