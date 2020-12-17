import type Bee from "../src";

declare global {
  interface Window {
    /**
     * initialize any new arbitrary bee instance
     */
    beeFactory: (...params: ConstructorParameters<typeof Bee>) => Bee
    /**
     * Globally reachable precompiled Bee client from browser
     */
    bee: Bee
  }

  /**
   * Placeholder for Bee connection URL for static lib (browser)
   */
  const __BEE_URL__: string
}
