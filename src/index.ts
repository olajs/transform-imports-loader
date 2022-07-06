import type * as webpack from 'webpack';
import MagicString from 'magic-string';
import { init, parse } from 'es-module-lexer';

type LoaderOptions = {
  autoCSSModules?: boolean;
  transformImports?: {
    [key: string]: {
      transform: ((importName: string, matches: RegExpMatchArray) => string) | string;
      preventFullImport?: boolean;
    };
  };
};

async function transformImportsLoader(this: webpack.LoaderContext<LoaderOptions>, source: string) {
  const done = this.async();
  const { autoCSSModules, transformImports } = this.getOptions();
  await init;

  try {
    const [imports] = parse(source);
    const ms = new MagicString(source);
    imports.forEach((item) => {
      if (!item.n) return;

      const moduleName = item.n;

      // deal with css files
      if (/\.(css|less|scss)$/.test(moduleName)) {
        // auto add css modules query string, e.g.
        // transform
        //   import styles from 'a.less';
        // into
        //   import styles from 'a.less?modules';
        // then, you can use "resourceQuery: /modules/" to set css-loader's modules to true
        autoCSSModules &&
          source.substring(item.ss, item.se).indexOf(' from ') > 0 &&
          ms.overwrite(item.s, item.e, moduleName + '?modules');
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

          const { transform, preventFullImport } = transformImports[key];
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
              typeof transform === 'string'
                ? transform.replace(new RegExp('\\$\\{member\\}', 'g'), origin)
                : transform(origin, matches);
            results.push(`import ${alias} from "${newFrom}";`);
          });

          ms.overwrite(
            item.ss,
            source.charAt(item.se) === ';' ? item.se + 1 : item.se,
            results.join('\n'),
          );
        });
      }
    });

    done(null, ms.toString());
  } catch (e: any) {
    done(e);
  }
}

export { LoaderOptions };

export default transformImportsLoader;
