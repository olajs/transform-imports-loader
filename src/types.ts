import { RawSourceMap } from 'source-map';

/**
 * transformer 的参数类型
 */
export type TransformerParams = {
  /**
   * 代码文件内容
   */
  source: string;
  /**
   * transformImports 的转换规则配置
   */
  transformImports?: {
    [key: string]: {
      transform: ((importName: string, matches: RegExpMatchArray) => string) | string;
      preventFullImport?: boolean;
    };
  };
  /**
   * 是否开启自动识别 cssModules
   */
  autoCSSModules?: boolean;
  /**
   * 是否生成 sourceMap
   */
  sourceMap?: boolean;
  /**
   * 现有 sourceMap
   */
  map?: RawSourceMap;
};

export type UpdatedLine = {
  sourceStartLine: number;
  sourceEndLine: number;
  addCount: number;
};

export type LoaderOptions = {
  /**
   * 是否开启自动识别 cssModules
   */
  autoCSSModules?: boolean;
  /**
   * transformImports 的转换规则配置
   */
  transformImports?: TransformerParams['transformImports'];
};
