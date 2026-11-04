#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

const parseArguments = (argv) => {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== '--spec' && argument !== '--source') {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`Missing value for ${argument}`);
    values[argument.slice(2)] = value;
    index += 1;
  }
  return values;
};

const parseOpenApiOperations = (yaml) => {
  const operations = new Set();
  let inPaths = false;
  let currentPath = null;

  for (const line of yaml.split(/\r?\n/)) {
    if (line === 'paths:') {
      inPaths = true;
      continue;
    }
    if (!inPaths) continue;
    if (/^[^\s]/.test(line)) break;

    const pathMatch = line.match(/^ {2}(\/jwt\/[^:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }

    const methodMatch = line.match(/^ {4}(get|post|put|patch|delete):\s*$/);
    if (currentPath && methodMatch) {
      operations.add(`${methodMatch[1].toUpperCase()} ${normalizePath(currentPath)}`);
    }
  }

  return operations;
};

const normalizePath = (value) => {
  const jwtStart = value.indexOf('/jwt/');
  const withoutOrigin = jwtStart >= 0 ? value.slice(jwtStart) : value;
  return withoutOrigin
    .split('?')[0]
    .replace(/\{[^/}]+\}/g, '{}')
    .replace(/\/+/g, '/');
};

const sourceFiles = (directory) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(entryPath));
    } else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
};

const resolveSymbolInitializer = (node, checker) => {
  let symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return null;
  if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) symbol = checker.getAliasedSymbol(symbol);
  for (const declaration of symbol.declarations ?? []) {
    if ('initializer' in declaration && declaration.initializer) return declaration.initializer;
  }
  return null;
};

const combine = (left, right) => left.flatMap((prefix) => right.map((suffix) => prefix + suffix));

const evaluateStrings = (node, checker, seen = new Set()) => {
  if (!node || seen.has(node)) return [];
  const nextSeen = new Set(seen).add(node);

  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
    return evaluateStrings(node.expression, checker, nextSeen);
  }
  if (ts.isConditionalExpression(node)) {
    return [...evaluateStrings(node.whenTrue, checker, nextSeen), ...evaluateStrings(node.whenFalse, checker, nextSeen)];
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluateStrings(node.left, checker, nextSeen);
    const right = evaluateStrings(node.right, checker, nextSeen);
    return left.length > 0 && right.length > 0 ? combine(left, right) : [];
  }
  if (ts.isTemplateExpression(node)) {
    let values = [node.head.text];
    for (const span of node.templateSpans) {
      const expressionValues = evaluateStrings(span.expression, checker, nextSeen);
      values = combine(values, expressionValues.length > 0 ? expressionValues : ['{}']);
      values = values.map((value) => value + span.literal.text);
    }
    return values;
  }
  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const initializer = resolveSymbolInitializer(ts.isPropertyAccessExpression(node) ? node.name : node, checker);
    return initializer ? evaluateStrings(initializer, checker, nextSeen) : [];
  }
  if (ts.isCallExpression(node)) return ['{}'];

  return [];
};

const collectFrontendOperations = (sourceRoot) => {
  const files = sourceFiles(sourceRoot);
  const program = ts.createProgram(files, {
    allowJs: false,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
  });
  const checker = program.getTypeChecker();
  const operations = [];

  for (const sourceFile of program.getSourceFiles()) {
    if (!files.includes(sourceFile.fileName)) continue;

    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        HTTP_METHODS.has(node.expression.name.text) &&
        node.arguments.length > 0
      ) {
        const method = node.expression.name.text.toUpperCase();
        for (const candidate of evaluateStrings(node.arguments[0], checker)) {
          if (!candidate.includes('/jwt/') && !candidate.startsWith('jwt/')) continue;
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
          operations.push({
            key: `${method} ${normalizePath(candidate)}`,
            file: path.relative(process.cwd(), sourceFile.fileName),
            line,
            canonical: candidate.includes('/jwt/'),
          });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return operations;
};

const checkContract = ({ specPath, sourceRoot }) => {
  const contract = parseOpenApiOperations(fs.readFileSync(specPath, 'utf8'));
  const frontend = collectFrontendOperations(sourceRoot);
  const errors = [];

  for (const operation of frontend) {
    if (!operation.canonical) {
      errors.push(`${operation.file}:${operation.line}: non-canonical JWT URL in ${operation.key}`);
    } else if (!contract.has(operation.key)) {
      errors.push(`${operation.file}:${operation.line}: operation is missing from OpenAPI: ${operation.key}`);
    }
  }

  return {
    contractCount: contract.size,
    frontendCount: new Set(frontend.map((operation) => operation.key)).size,
    errors,
  };
};

const main = () => {
  const args = parseArguments(process.argv.slice(2));
  const specPath = path.resolve(args.spec ?? process.env.OPENAPI_SPEC_PATH ?? '../metamw_edge_version/docs/openapi/jwt.yaml');
  const sourceRoot = path.resolve(args.source ?? 'src');
  const result = checkContract({ specPath, sourceRoot });

  if (result.errors.length > 0) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(
    `JWT OpenAPI contract check passed: ${result.frontendCount} frontend operations matched ${result.contractCount} documented operations.`,
  );
};

if (require.main === module) main();

module.exports = {
  checkContract,
  collectFrontendOperations,
  normalizePath,
  parseOpenApiOperations,
};
