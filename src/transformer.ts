import MagicString from 'magic-string';
import { ImportSpecifier, parse } from 'rs-module-lexer';
import { TransformerParams, UpdatedLine } from './types';

export function transform(
  source: string,
  imports: ImportSpecifier[],
  config: {
    autoCSSModules: TransformerParams['autoCSSModules'];
    transformImports: TransformerParams['transformImports'];
  },
) {
  const { autoCSSModules, transformImports } = config;

  const ms = new MagicString(source);
  const updatedLines: UpdatedLine[] = [];

  let contentUpdated = false;
  imports.forEach((item) => {
    if (!item.n) return;

    const moduleName = item.n;

    // deal with css files
    if (/\.(css|less|scss|sass|styl)$/.test(moduleName)) {
      // auto add css modules query string, e.g.
      // transform
      //   import styles from 'a.less';
      // into
      //   import styles from 'a.less?modules';
      // then, you can use "resourceQuery: /modules/" to set css-loader's modules to true
      if (autoCSSModules && source.substring(item.ss, item.se).indexOf(' from ') > 0) {
        ms.update(item.s, item.e, moduleName + '?modules');
        contentUpdated = true;
      }
    }
    // deal with other files
    else if (transformImports) {
      // transformImports
      Object.keys(transformImports).forEach((key) => {
        let regStr = key;
        if (!key.startsWith('^')) {
          regStr = '^' + regStr;
        }
        if (!key.endsWith('$')) {
          regStr += '$';
        }
        const reg = new RegExp(regStr);
        const matches = reg.exec(moduleName);

        if (!matches) return;

        const { transform: transformFn, preventFullImport } = transformImports[key];
        const statement = source.substring(item.ss, item.se);

        // remove "import" and "from xxx", e.g.
        // transform this:
        //   import name, { a, b } from 'xxx';
        // into:
        //   name, { a, b }
        let imported = statement
          .replace(/import\s+/, '')
          .replace(new RegExp(`(\\s+from\\s+)?(['"])${moduleName}\\2\\.*`), '');

        // get fullImportName, e.g.
        //   name, { a, b } -> name
        //   name -> name
        let fullImportName = imported.split(',')[0].trim();
        if (fullImportName.indexOf('{') > -1) {
          fullImportName = '';
        }

        // get member names, e.g.
        //   name, { a, b } -> [a, b]
        //   { a, b as c } -> [a, b as c]
        const members = imported
          .substring(imported.indexOf('{') + 1, imported.indexOf('}') - 1)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        // Throw full import error when preventFullImport is true, e.g.
        //   import * as name from 'module';
        //   import name from 'module';
        //   import name, { a, b } from 'module';
        if (preventFullImport && (members.length === 0 || fullImportName)) {
          throw new Error(
            `[transform-imports-loader] import of entire module ${moduleName} not allowed due to preventFullImport setting`,
          );
        }

        // No need to transform if has full import or binding members is empty
        if (fullImportName || members.length === 0) return;

        const results: string[] = [];
        members.forEach((item) => {
          let origin = item;
          let alias = item;
          if (item.indexOf(' as ') > 0) {
            const pair = item.split(/\s+as\s+/);
            origin = pair[0];
            alias = pair[1];
          }
          const newFrom =
            typeof transformFn === 'string'
              ? transformFn.replace(new RegExp('\\$\\{member\\}', 'g'), origin)
              : transformFn(origin, matches);
          results.push(`import ${alias} from "${newFrom}";`);
        });
        const resultsString = results.join('\n');
        // end position of updated content
        const updatedEnd = source.charAt(item.se) === ';' ? item.se + 1 : item.se;

        // start line number of updated content
        const sourceStartLine = source.slice(0, item.ss).split('\n').length;
        // end line number of updated content
        const sourceEndLine =
          sourceStartLine + source.slice(item.ss, updatedEnd).split('\n').length - 1;

        updatedLines.push({
          sourceStartLine,
          sourceEndLine,
          addCount: results.length - (sourceEndLine - sourceStartLine + 1),
        });

        ms.update(item.ss, updatedEnd, resultsString);
        contentUpdated = true;
      });
    }
  });

  if (contentUpdated) {
    source = ms.toString();
  }

  return {
    source,
    updatedLines,
  };
}

export default function transformer(params: TransformerParams) {
  const { autoCSSModules, transformImports } = params;
  let { source, map } = params;

  const { imports } = parse({
    input: [{ filename: '', code: source }],
  }).output[0];

  const transformResult = transform(source, imports, {
    autoCSSModules,
    transformImports,
  });

  if (transformResult.source !== source) {
    source = transformResult.source;
    // todo：source-map is not support sync task, do not regenerate sourceMap
  }

  return {
    source,
    map,
  };
}
