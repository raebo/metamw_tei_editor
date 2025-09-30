// src/MonacoSetup.ts

(self as any).MonacoEnvironment = {
  getWorker: (moduleId: string, label: string) => {
    // For XML, just return the default editor worker
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url), {
      type: 'module',
    });
    // switch (label) {
    //   case 'json':
    //     return new Worker(
    //       new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
    //       { type: 'module' },
    //     );
    //   case 'typescript':
    //   case 'javascript':
    //     return new Worker(
    //       new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url),
    //       { type: 'module' },
    //     );
    //   default:
    //     return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url), {
    //       type: 'module',
    //     });
    // }
  },
};
