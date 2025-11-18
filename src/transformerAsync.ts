import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { parseAsync } from 'rs-module-lexer';
import { TransformerParams, UpdatedLine } from './types';
import { transform } from './transformer';

export default async function transformer(params: TransformerParams) {
  const { autoCSSModules, transformImports, sourceMap } = params;
  let { source, map } = params;

  const { imports } = (
    await parseAsync({
      input: [{ filename: '', code: source }],
    })
  ).output[0];

  const transformResult = transform(source, imports, {
    autoCSSModules,
    transformImports,
  });

  if (transformResult.source !== source) {
    source = source = transformResult.source;
    // regenerate sourcemap when source content has been updated
    if (sourceMap && map && transformResult.updatedLines.length > 0) {
      map = await reGenerateSourceMap(map, transformResult.updatedLines);
    }
  }

  return {
    source,
    map,
  };
}

/**
 * regenerate sourcemap by updated lines
 */
async function reGenerateSourceMap(originMap: RawSourceMap, updatedLines: UpdatedLine[]) {
  const newMap = await SourceMapConsumer.with(originMap, undefined, (consumer) => {
    const generator = new SourceMapGenerator();
    generator.setSourceContent(
      originMap.sources[0],
      originMap.sourcesContent ? originMap.sourcesContent[0] : '',
    );
    consumer.eachMapping(
      ({ source, name, generatedLine, generatedColumn, originalLine, originalColumn }) => {
        const newMapping = {
          source,
          name,
          generated: { line: generatedLine, column: generatedColumn },
          original: { line: originalLine, column: originalColumn },
        };
        let replaced = false;
        let addCount = 0;
        // update generated line number
        updatedLines.forEach((item) => {
          if (
            newMapping.generated.line >= item.sourceStartLine &&
            newMapping.generated.line <= item.sourceEndLine
          ) {
            replaced = true;
          } else if (newMapping.generated.line > item.sourceEndLine) {
            addCount += item.addCount;
          }
        });
        // do not generate sourcemap of updated content
        if (!replaced) {
          newMapping.generated.line += addCount;
          generator.addMapping(newMapping);
        }
      },
    );
    return generator.toJSON();
  });

  // for debugger
  if (process.env.NODE_ENV !== 'production') {
    const newMappings: any[] = [];
    await SourceMapConsumer.with(newMap, undefined, (consumer) => {
      consumer.eachMapping(({ generatedLine, generatedColumn, originalLine, originalColumn }) =>
        newMappings.push({
          generatedLine,
          generatedColumn,
          originalLine,
          originalColumn,
        }),
      );
    });
  }

  return newMap;
}
