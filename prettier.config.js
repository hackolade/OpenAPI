/*
 * Copyright © 2016-2026 by IntegrIT S.A. dba Hackolade.  All rights reserved.
 *
 * The copyright to the computer software herein is the property of IntegrIT S.A.
 * The software may be used and/or copied only with the written permission of
 * IntegrIT S.A. or in accordance with the terms and conditions stipulated in
 * the agreement/contract under which the software has been supplied.
 */

module.exports = {
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  useTabs: false,
  semi: true,
  arrowParens: 'avoid',
  bracketSpacing: true,
  bracketSameLine: false,
  tabWidth: 2,
  endOfLine: 'lf',
  quoteProps: 'preserve',
  jsxSingleQuote: false,
  importOrder: ['', '<BUILTIN_MODULES>', '', '<THIRD_PARTY_MODULES>', '', '^[.]'],
  importOrderCaseSensitive: false,
  importOrderTypeScriptVersion: '5.0.0',
};
