import { execFileSync, spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const checkerPath = path.resolve(process.cwd(), 'scripts/check-jwt-openapi.js');

const fixture = (source: string, operations: string) => {
  const root = mkdtempSync(path.join(tmpdir(), 'jwt-openapi-check-'));
  const sourceRoot = path.join(root, 'src');
  mkdirSync(sourceRoot);
  writeFileSync(path.join(sourceRoot, 'client.ts'), source);
  const specPath = path.join(root, 'jwt.yaml');
  writeFileSync(specPath, `openapi: 3.0.3\ninfo:\n  title: Test\n  version: 1.0.0\npaths:\n${operations}components:\n  schemas: {}\n`);
  return { sourceRoot, specPath };
};

describe('JWT OpenAPI contract checker', () => {
  it('matches literal, templated and locally composed JWT operations', () => {
    const { sourceRoot, specPath } = fixture(
      `
        declare const api: { get: (url: string) => void; post: (url: string) => void };
        declare const letterName: string;
        const letterId = 42;
        const detailsUrl = letterId > 0
          ? \`/jwt/editor/letters/\${letterId}\`
          : \`/jwt/editor/letters/by_name/\${letterName}\`;
        api.get(detailsUrl);
        api.post('/jwt/editor/letters');
      `,
      `  /jwt/editor/letters:\n    post:\n      responses: {}\n  /jwt/editor/letters/{id}:\n    get:\n      responses: {}\n  /jwt/editor/letters/by_name/{name}:\n    get:\n      responses: {}\n`,
    );

    const output = execFileSync(process.execPath, [checkerPath, '--spec', specPath, '--source', sourceRoot], {
      encoding: 'utf8',
    });

    expect(output).toContain('3 frontend operations matched 3 documented operations');
  });

  it('rejects undocumented methods and paths', () => {
    const { sourceRoot, specPath } = fixture(
      `declare const api: { delete: (url: string) => void }; api.delete('/jwt/editor/letters/42');`,
      `  /jwt/editor/letters/{id}:\n    get:\n      responses: {}\n`,
    );

    const result = spawnSync(process.execPath, [checkerPath, '--spec', specPath, '--source', sourceRoot], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('operation is missing from OpenAPI: DELETE /jwt/editor/letters/42');
  });

  it('rejects JWT URLs without a leading slash', () => {
    const { sourceRoot, specPath } = fixture(
      `declare const api: { get: (url: string) => void }; api.get('jwt/editor/letters');`,
      `  /jwt/editor/letters:\n    get:\n      responses: {}\n`,
    );

    const result = spawnSync(process.execPath, [checkerPath, '--spec', specPath, '--source', sourceRoot], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('non-canonical JWT URL');
  });
});
