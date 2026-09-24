import { EditorConstants } from '@src/constants/editor';

export type GraphicLayout = 'block' | 'inline-graphic';
export type GraphicType = 'notated_Music' | 'drawing' | 'table' | 'formula';
export type GraphicRend = 'inline_big_size' | 'below' | 'above' | 'bottom' | 'top' | 'margin' | 'overleaf' | 'inspace' | 'opposite';
export type GraphicSubtype = 'eighth_page' | 'quarter_page' | 'half_page' | 'three-quarter_page' | 'full_page';
export type GraphicAlignment = 'center' | 'left' | 'right';
export type GraphicMimeType = 'image/jpeg' | 'image/png' | 'image/svg+xml' | null;

export interface GraphicFigureInput {
  layout: GraphicLayout;
  type: GraphicType;
  url: string;
  mimeType: GraphicMimeType;
  rend: GraphicRend;
  subtype: GraphicSubtype;
  alignment: GraphicAlignment;
  head: string;
  headVisible: boolean;
  description: string;
  descriptionVisible: boolean;
}

export type ImageMapZone =
  | {
      id: string;
      shape: 'rectangle';
      label: string;
      target: string;
      ulx: number;
      uly: number;
      lrx: number;
      lry: number;
    }
  | {
      id: string;
      shape: 'polygon';
      label: string;
      target: string;
      points: string;
    };

export interface FigureImageMap {
  width: number;
  height: number;
  zones: ImageMapZone[];
}

const XML_ID_PATTERN = /^[A-Za-z_][A-Za-z0-9._-]*$/;
const ABSOLUTE_SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/;

const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const directChild = (parent: Element, name: string): Element | null =>
  Array.from(parent.children).find((child) => child.localName.toLowerCase() === name.toLowerCase()) ?? null;

const createTeiElement = (doc: Document, name: string): Element => doc.createElementNS(EditorConstants.TEI_NS, name);

const elementsWithXmlId = (doc: Document): Element[] =>
  Array.from(doc.getElementsByTagName('*')).filter((element) => Boolean(element.getAttribute('xml:id')));

const uniqueXmlId = (doc: Document, prefix: string): string => {
  const existingIds = new Set(elementsWithXmlId(doc).map((element) => element.getAttribute('xml:id')));
  let suffix = 1;
  while (existingIds.has(`${prefix}_${suffix}`)) suffix += 1;
  return `${prefix}_${suffix}`;
};

export const validateGraphicUrl = (rawUrl: string): string => {
  const url = rawUrl.trim();
  if (!url) throw new Error('Eine Grafikreferenz ist erforderlich.');
  if (hasControlCharacters(url)) throw new Error('Die Grafikreferenz enthält unzulässige Steuerzeichen.');
  if (url.startsWith('//')) throw new Error('Protokollrelative Grafikreferenzen sind nicht zulässig.');
  if (url.includes('\\')) throw new Error('Rückwärtsschrägstriche sind in Grafikreferenzen nicht zulässig.');

  const scheme = ABSOLUTE_SCHEME.exec(url)?.[1].toLowerCase();
  if (scheme && scheme !== 'https' && scheme !== 'file') {
    throw new Error('Nur HTTPS-, file:- oder relative Grafikreferenzen sind zulässig.');
  }

  if (scheme === 'https') {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) throw new Error('Zugangsdaten sind in Grafikreferenzen nicht zulässig.');
  }
  if (scheme === 'file' && new URL(url).hostname) {
    throw new Error('Entfernte file:-Grafikreferenzen sind nicht zulässig.');
  }

  let pathToCheck: string;
  try {
    pathToCheck = decodeURIComponent(url.replace(ABSOLUTE_SCHEME, '').split(/[?#]/, 1)[0]);
  } catch {
    throw new Error('Die Grafikreferenz enthält eine ungültige Zeichenkodierung.');
  }
  if (pathToCheck.split('/').some((segment) => segment === '..')) {
    throw new Error('Übergeordnete Pfadsegmente sind in Grafikreferenzen nicht zulässig.');
  }

  return url;
};

export const insertGraphicFigure = (anchor: Element, input: GraphicFigureInput): Element => {
  const doc = anchor.ownerDocument;
  const url = validateGraphicUrl(input.url);
  const body = anchor.closest('body');
  if (!body || body.parentElement?.localName.toLowerCase() !== 'text') {
    throw new Error('Grafische Elemente können nur innerhalb von TEI/text/body eingefügt werden.');
  }
  const figure = createTeiElement(doc, 'figure');
  figure.setAttribute('xml:id', uniqueXmlId(doc, 'figure_graphic'));
  figure.setAttribute('type', input.type);

  if (input.layout === 'block') {
    figure.setAttribute('rend', input.rend);
    figure.setAttribute('subtype', input.subtype);
    figure.setAttribute('style', input.alignment);
  } else {
    figure.setAttribute('subtype', 'inline_graphic');
    figure.setAttribute('style', input.alignment);
  }

  const graphic = createTeiElement(doc, 'graphic');
  graphic.setAttribute('url', url);
  if (input.mimeType) graphic.setAttribute('mimeType', input.mimeType);

  const head = createTeiElement(doc, 'head');
  head.setAttribute('style', input.headVisible ? 'display_yes' : 'display_none');
  head.textContent = input.head.trim();

  const figDesc = createTeiElement(doc, 'figDesc');
  figDesc.setAttribute('style', input.descriptionVisible ? 'display_yes' : 'display_none');
  figDesc.textContent = input.description.trim();

  figure.append(graphic, head, figDesc);

  const paragraph = anchor.closest('p');
  if (input.layout === 'inline-graphic') {
    if (!paragraph) throw new Error('Inline-Grafiken benötigen einen Absatz als Einfügeposition.');
    paragraph.appendChild(figure);
  } else {
    const blockAnchor = paragraph ?? anchor;
    if (!blockAnchor.parentNode) throw new Error('Die Einfügeposition ist nicht mehr verfügbar.');
    blockAnchor.parentNode.insertBefore(figure, blockAnchor.nextSibling);
  }

  return figure;
};

const parsePositiveNumber = (raw: string | null, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const surfaceForFigure = (figure: Element): Element | null => {
  const reference = figure.getAttribute('facs')?.trim();
  if (!reference?.startsWith('#')) return null;
  const surfaceId = reference.slice(1);
  return (
    elementsWithXmlId(figure.ownerDocument).find(
      (element) => element.localName.toLowerCase() === 'surface' && element.getAttribute('xml:id') === surfaceId,
    ) ?? null
  );
};

const parseZone = (zone: Element, index: number): ImageMapZone | null => {
  const common = {
    id: zone.getAttribute('xml:id') ?? `zone_${index + 1}`,
    label: zone.getAttribute('n') ?? '',
    target: zone.getAttribute('corresp') ?? '',
  };
  const points = zone.getAttribute('points');
  if (points) return { ...common, shape: 'polygon', points };

  const coordinates = ['ulx', 'uly', 'lrx', 'lry'].map((attribute) => Number(zone.getAttribute(attribute)));
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) return null;
  return {
    ...common,
    shape: 'rectangle',
    ulx: coordinates[0],
    uly: coordinates[1],
    lrx: coordinates[2],
    lry: coordinates[3],
  };
};

export const readFigureImageMap = (figure: Element): FigureImageMap | null => {
  const surface = surfaceForFigure(figure);
  if (!surface) return null;
  const zones = Array.from(surface.children)
    .filter((child) => child.localName.toLowerCase() === 'zone')
    .map(parseZone)
    .filter((zone): zone is ImageMapZone => zone !== null);

  return {
    width: parsePositiveNumber(surface.getAttribute('lrx'), 1000),
    height: parsePositiveNumber(surface.getAttribute('lry'), 1000),
    zones,
  };
};

const parsePolygonPoints = (points: string): Array<[number, number]> => {
  const pairs = points
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((pair) => pair.split(',').map(Number));
  if (pairs.length < 3 || pairs.some((pair) => pair.length !== 2 || pair.some((value) => !Number.isFinite(value)))) {
    throw new Error('Ein Polygon benötigt mindestens drei Punkte im Format x,y x,y x,y.');
  }
  return pairs as Array<[number, number]>;
};

const validateImageMap = (map: FigureImageMap): void => {
  if (!Number.isFinite(map.width) || !Number.isFinite(map.height) || map.width <= 0 || map.height <= 0) {
    throw new Error('Breite und Höhe der Bildkarte müssen größer als null sein.');
  }

  const ids = new Set<string>();
  map.zones.forEach((zone) => {
    if (!XML_ID_PATTERN.test(zone.id)) throw new Error(`Ungültige XML-ID für Bildbereich: ${zone.id}`);
    if (ids.has(zone.id)) throw new Error(`Doppelte XML-ID für Bildbereich: ${zone.id}`);
    ids.add(zone.id);
    if (zone.target && !new RegExp(`^#${XML_ID_PATTERN.source.slice(1, -1)}$`).test(zone.target)) {
      throw new Error('Bereichsziele müssen als sichere interne XML-ID angegeben werden.');
    }

    if (zone.shape === 'rectangle') {
      const coordinates = [zone.ulx, zone.uly, zone.lrx, zone.lry];
      if (coordinates.some((coordinate) => !Number.isFinite(coordinate) || coordinate < 0)) {
        throw new Error('Rechteckkoordinaten müssen nichtnegative Zahlen sein.');
      }
      if (zone.ulx >= zone.lrx || zone.uly >= zone.lry || zone.lrx > map.width || zone.lry > map.height) {
        throw new Error('Der rechteckige Bildbereich liegt außerhalb der Bildfläche.');
      }
    } else {
      const points = parsePolygonPoints(zone.points);
      if (points.some(([x, y]) => x < 0 || y < 0 || x > map.width || y > map.height)) {
        throw new Error('Der polygonale Bildbereich liegt außerhalb der Bildfläche.');
      }
    }
  });
};

const rootTei = (doc: Document): Element => {
  const root = doc.documentElement;
  if (!root || root.localName.toLowerCase() !== 'tei') throw new Error('Das TEI-Wurzelelement wurde nicht gefunden.');
  return root;
};

export const updateFigureImageMap = (figure: Element, map: FigureImageMap): Element => {
  validateImageMap(map);
  const doc = figure.ownerDocument;
  const figureGraphic = directChild(figure, 'graphic');
  if (!figureGraphic) throw new Error('Die Figure enthält kein graphic-Element.');

  let surface = surfaceForFigure(figure);
  const existingIdsOutsideMap = new Set(
    elementsWithXmlId(doc)
      .filter((element) => element !== surface && !(element.parentElement === surface && element.localName.toLowerCase() === 'zone'))
      .map((element) => element.getAttribute('xml:id')),
  );
  const collidingZone = map.zones.find((zone) => existingIdsOutsideMap.has(zone.id));
  if (collidingZone) throw new Error(`Die XML-ID ist bereits im Dokument vorhanden: ${collidingZone.id}`);

  if (!surface) {
    const facsimile = createTeiElement(doc, 'facsimile');
    surface = createTeiElement(doc, 'surface');
    const surfaceId = uniqueXmlId(doc, 'surface_graphic');
    surface.setAttribute('xml:id', surfaceId);
    figure.setAttribute('facs', `#${surfaceId}`);
    facsimile.appendChild(surface);

    const tei = rootTei(doc);
    const text = directChild(tei, 'text');
    tei.insertBefore(facsimile, text);
  }

  surface.setAttribute('ulx', '0');
  surface.setAttribute('uly', '0');
  surface.setAttribute('lrx', String(map.width));
  surface.setAttribute('lry', String(map.height));

  let mapGraphic = directChild(surface, 'graphic');
  if (!mapGraphic) {
    mapGraphic = createTeiElement(doc, 'graphic');
    surface.insertBefore(mapGraphic, surface.firstChild);
  }
  ['url', 'mimeType'].forEach((attribute) => {
    const value = figureGraphic.getAttribute(attribute);
    if (value) mapGraphic!.setAttribute(attribute, value);
    else mapGraphic!.removeAttribute(attribute);
  });

  Array.from(surface.children)
    .filter((child) => child.localName.toLowerCase() === 'zone')
    .forEach((zone) => zone.remove());

  map.zones.forEach((zone) => {
    const element = createTeiElement(doc, 'zone');
    element.setAttribute('xml:id', zone.id);
    if (zone.label.trim()) element.setAttribute('n', zone.label.trim());
    if (zone.target.trim()) element.setAttribute('corresp', zone.target.trim());
    if (zone.shape === 'rectangle') {
      element.setAttribute('ulx', String(zone.ulx));
      element.setAttribute('uly', String(zone.uly));
      element.setAttribute('lrx', String(zone.lrx));
      element.setAttribute('lry', String(zone.lry));
    } else {
      element.setAttribute('points', zone.points.trim().replace(/\s+/g, ' '));
    }
    surface!.appendChild(element);
  });

  return surface;
};

export const deleteFigureImageMap = (figure: Element): void => {
  const surface = surfaceForFigure(figure);
  figure.removeAttribute('facs');
  if (!surface) return;
  const parent = surface.parentElement;
  surface.remove();
  if (parent?.localName.toLowerCase() === 'facsimile' && parent.children.length === 0) parent.remove();
};
