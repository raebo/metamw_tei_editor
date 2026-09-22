import { EditorConstants } from '@src/constants/editor';

export const assertWellFormedXml = (xmlString: string): void => {
  if (!xmlString.trim()) {
    throw new Error('XML content is empty.');
  }

  const xmlDocument = new DOMParser().parseFromString(xmlString, 'application/xml');
  if (xmlDocument.querySelector('parsererror')) {
    throw new Error('XML content is not well-formed.');
  }
};

export const replaceWithCamelCase = (text: string): string => {
  EditorConstants.camelCaseTags.forEach((tag) => {
    const lowercaseTag = tag.toLowerCase();
    text = text.replace(new RegExp(`\\b${lowercaseTag}\\b`, 'g'), tag);
  });
  return text;
};

export const replaceDataKeys = (text: string): string => {
  return text.replace(/data-key="(.*?)"/g, 'key="$1"');
};

export const removeTmpIds = (text: string): string => {
  return text.replace(/\s?tmp:id=".*?"/g, '').replace(/\s?tmp_id=".*?"/g, '');
};

export const prepareEditorXmlForBackend = (xmlString: string): string => {
  assertWellFormedXml(xmlString);

  const preparedXml = removeTmpIds(replaceDataKeys(replaceWithCamelCase(xmlString)));

  assertWellFormedXml(preparedXml);
  return preparedXml;
};
