import type * as webpack from 'webpack';
import { RawSourceMap } from 'source-map';
import transformer, { Params } from './transformer';

type LoaderOptions = {
  /**
   * 是否开启自动识别 cssModules
   */
  autoCSSModules?: boolean;
  /**
   * transformImports 的转换规则配置
   */
  transformImports?: Params['transformImports'];
};

async function transformImportsLoader(
  this: webpack.LoaderContext<LoaderOptions>,
  source: string,
  map: RawSourceMap,
) {
  const done = this.async();
  const { autoCSSModules, transformImports } = this.getOptions();

  try {
    const { source: newSource, map: newMap } = await transformer({
      source,
      transformImports,
      autoCSSModules,
      sourceMap: this.sourceMap,
      map,
    });
    done(null, newSource, newMap);
  } catch (e: any) {
    done(e);
  }
}

export { LoaderOptions };

export default transformImportsLoader;
