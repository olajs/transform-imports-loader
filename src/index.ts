import type * as webpack from 'webpack';
import { RawSourceMap } from 'source-map';
import transformer from './transformerAsync';
import { LoaderOptions } from './types';

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
