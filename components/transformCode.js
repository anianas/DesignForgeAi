// Compile AI-generated React code (JSX + ESM) into a plain script that:
//   1. Resolves all `import` statements against window.__DF_M (cross-frame registry)
//   2. Captures the default export onto window.__DF_DEFAULT so the host can render it
//
// We use @babel/standalone with a tiny custom plugin. No CDN. No esm.sh.

import * as Babel from '@babel/standalone';

const importRewritePlugin = ({ types: t }) => ({
  visitor: {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const decls = [];

      for (const spec of path.node.specifiers) {
        if (t.isImportDefaultSpecifier(spec)) {
          // import Foo from 'pkg' →
          //   const Foo = (M['pkg'] && M['pkg'].default) || M['pkg'];
          decls.push(
            t.variableDeclarator(
              t.identifier(spec.local.name),
              t.logicalExpression(
                '||',
                t.memberExpression(
                  t.memberExpression(t.identifier('__DF_M'), t.stringLiteral(source), true),
                  t.identifier('default'),
                ),
                t.memberExpression(t.identifier('__DF_M'), t.stringLiteral(source), true),
              ),
            ),
          );
        } else if (t.isImportSpecifier(spec)) {
          // import { A, B as C } from 'pkg' →
          //   const A = M['pkg'].A;
          //   const C = M['pkg'].B;
          const importedName =
            spec.imported.type === 'StringLiteral' ? spec.imported.value : spec.imported.name;
          decls.push(
            t.variableDeclarator(
              t.identifier(spec.local.name),
              t.memberExpression(
                t.memberExpression(t.identifier('__DF_M'), t.stringLiteral(source), true),
                t.identifier(importedName),
              ),
            ),
          );
        } else if (t.isImportNamespaceSpecifier(spec)) {
          // import * as NS from 'pkg' → const NS = M['pkg'];
          decls.push(
            t.variableDeclarator(
              t.identifier(spec.local.name),
              t.memberExpression(t.identifier('__DF_M'), t.stringLiteral(source), true),
            ),
          );
        }
      }

      if (decls.length === 0) {
        path.remove();
      } else {
        path.replaceWith(t.variableDeclaration('const', decls));
      }
    },

    ExportDefaultDeclaration(path) {
      // export default function GeneratedApp() {...}
      //   →  function GeneratedApp() {...}; window.__DF_DEFAULT = GeneratedApp;
      // export default <expr>;
      //   →  window.__DF_DEFAULT = <expr>;
      const decl = path.node.declaration;
      const assignToDefault = (expr) =>
        t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(t.identifier('window'), t.identifier('__DF_DEFAULT')),
            expr,
          ),
        );

      if (t.isFunctionDeclaration(decl) && decl.id) {
        path.replaceWithMultiple([decl, assignToDefault(t.identifier(decl.id.name))]);
      } else if (t.isClassDeclaration(decl) && decl.id) {
        path.replaceWithMultiple([decl, assignToDefault(t.identifier(decl.id.name))]);
      } else {
        path.replaceWith(assignToDefault(decl));
      }
    },

    // Strip non-default exports — the host doesn't need them.
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        path.replaceWith(path.node.declaration);
      } else {
        path.remove();
      }
    },
  },
});

export const transformUserCode = (code) => {
  const result = Babel.transform(code, {
    presets: [['react', { runtime: 'classic' }]],
    plugins: [importRewritePlugin],
    filename: 'GeneratedApp.jsx',
    sourceType: 'module',
  });
  return result.code;
};
