// signals-local-transform.js
// Automatically injects useSignals() at the top of every React component that
// contains JSX, so component authors never need to call it manually.
//
// Wiring (Vite project via @vitejs/plugin-react):
//
//   import { defineConfig } from 'vite'
//   import react from '@vitejs/plugin-react'
//   import path from 'path'
//
//   const signalsTransformer = path.resolve(__dirname, './lib/babel-signals-transformer/index.js')
//
//   export default defineConfig({
//     plugins: [
//       react({
//         babel: {
//           plugins: [[signalsTransformer, {}]],
//         },
//       }),
//     ],
//   })
//
// The transformer is NOT applied in Vitest. Tests that render components must
// import useSignals manually or mock @preact/signals-react/runtime in vitest.setup.ts.

const nodePath = require('path');
const { addNamed } = require('@babel/helper-module-imports');

const LOG_PREFIX = '[signals-transform]';

function log(...args) {
  // console.log(LOG_PREFIX, ...args);
  // do nothing, only used for debugging
}

module.exports = function(babel) {
  const { types: t, template } = babel;

  const wrapTemplate = template.statements(`
    USE_SIGNALS();
    LOGGING
    BODY
  `);

  function getUseSignalsId(state) {
    const filename = state.file.opts.filename || "";
    const normalizedFilename = filename.replace(/\\/g, '/');

    // Resolve the absolute path to src/hooks/useSignals from the current file.
    const srcRoot = normalizedFilename.split('/src/')[0] + '/src';
    const targetHookPath = nodePath.join(srcRoot, 'hooks', 'useSignals');

    // Compute relative path from the current file to the hook.
    let relativeHookPath = nodePath.relative(
      nodePath.dirname(normalizedFilename),
      targetHookPath
    );

    // Ensure path starts with ./ or ../ for module resolver compatibility.
    if (!relativeHookPath.startsWith('.')) {
      relativeHookPath = './' + relativeHookPath;
    }
    // Strip extension - bundlers resolve it.
    relativeHookPath = relativeHookPath.replace(/\.(ts|tsx|js|jsx)$/, '');
    // Normalize slashes for Windows.
    relativeHookPath = relativeHookPath.replace(/\\/g, '/');

    const cacheKey = `local-useSignals-hook`;
    const added = !state.get(cacheKey);

    const id = addNamed(
      state.file.path,
      'useSignals',
      relativeHookPath,
      { nameHint: 'useSignals' }
    );

    state.set(cacheKey, id);
    return { id, added };
  }

  return {
    name: "signals-local-transform",
    pre() {
      this.fileComponents = [];
      this.importAdded = false;
      this.isTransformed = false;
    },
    visitor: {
      "FunctionDeclaration|ArrowFunctionExpression|FunctionExpression"(fnPath, state) {
        const filename = state.file.opts.filename || "";
        const normalizedPath = filename.replace(/\\/g, '/');

        // Only transform files inside src/; skip node_modules.
        if (!normalizedPath.includes('/src/') || normalizedPath.includes('node_modules')) return;
        // Skip files already processed in this pass.
        if (fnPath.getData('_transformedBySignals')) return;

        const shortFile = normalizedPath.split('/src/').pop();

        // --- COMPONENT IDENTIFICATION ---
        let name = null;

        // 1. Named function declaration: function Dashboard() {}
        if (fnPath.node.id) {
          name = fnPath.node.id.name;
        }

        // 2. Variable declarator: const Dashboard = () => {}
        if (!name) {
          const variableParent = fnPath.findParent(p => p.isVariableDeclarator());
          if (variableParent && variableParent.node.id.type === 'Identifier') {
            name = variableParent.node.id.name;
          }
        }

        // 3. Export default: export default function() {}
        if (!name && (
          fnPath.parentPath.isExportDefaultDeclaration() ||
          fnPath.parentPath.parentPath?.isExportDefaultDeclaration()
        )) {
          name = nodePath.parse(filename).name;
        }

        // 4. Assignment: Dashboard = () => {}
        if (!name && fnPath.parentPath.isAssignmentExpression()) {
          const left = fnPath.parentPath.node.left;
          if (left.type === 'Identifier') name = left.name;
        }

        // Only transform PascalCase names (React component convention).
        const isComponent = name && /^[A-Z]/.test(name);
        if (!isComponent) return;

        // --- JSX CHECK ---
        // Only inject useSignals into functions that actually return JSX.
        let hasJSX = false;
        fnPath.traverse({
          JSXElement(innerPath) { hasJSX = true; innerPath.stop(); },
          JSXFragment(innerPath) { hasJSX = true; innerPath.stop(); },
          Function(innerPath) { innerPath.skip(); }, // don't recurse into nested functions
        });

        if (!hasJSX) return;

        log(`  TRANSFORMING "${name}" in ${shortFile}`);

        try {
          fnPath.setData('_transformedBySignals', true);
          const useSignalsId = getUseSignalsId(state);
          if (useSignalsId.added) this.importAdded = true;

          const bodyPath = fnPath.get("body");
          const bodyNodes = bodyPath.isBlockStatement()
            ? bodyPath.node.body
            : [t.returnStatement(bodyPath.node)];

          const wrapped = wrapTemplate({
            USE_SIGNALS: useSignalsId.id,
            BODY: bodyNodes,
            LOGGING: t.expressionStatement(
              t.callExpression(
                t.memberExpression(t.identifier('console'), t.identifier('log')),
                [t.stringLiteral(
                  `${LOG_PREFIX} Tracking signals for component '${name}' with '${useSignalsId.id.name}()'`
                )]
              )
            ),
          });

          bodyPath.replaceWith(t.blockStatement(wrapped));
          this.fileComponents.push(name);
          this.isTransformed = true;
          log(`    OK - "${name}" transformed successfully`);
        } catch (err) {
          log(`    ERROR transforming "${name}" in ${shortFile}: ${err.message}`);
          log(`    Stack: ${err.stack}`);
        }
      }
    },
    post() {
      // Reserved for per-file summary logging if needed during debugging.
    }
  };
};
