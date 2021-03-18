/**
 * We declare this module manually instead of using the @types/webpack-bundle-analyzer
 * because it relies on the old @types/webpack for v4 that cause incompatibilities with v5
 * because v5 ships its own definitions.
 */
declare module 'webpack-bundle-analyzer' {
  import { Compiler, WebpackPluginInstance } from 'webpack'

  export class BundleAnalyzerPlugin implements WebpackPluginInstance {
    constructor(options?: any)
    apply(compiler: Compiler): void
  }
}
