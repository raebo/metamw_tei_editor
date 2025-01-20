import React from "react";

const XMLDisplayParser: React.FC<{ xmlString: string }> = ({ xmlString }) => {

  const parseXml = (xmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    return doc;
  };

  const renderNode = (node: ChildNode): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const TagName = element.tagName as keyof JSX.IntrinsicElements;
      const children = Array.from(element.childNodes).map((child, i) =>
        renderNode(child)
      );

      const attributes = Array.from(element.attributes).reduce((acc, attr) => {
        if (attr.name === "style") {
          acc.style = attr.value.split(";").reduce((styleObj, styleProp) => {
            const [key, value] = styleProp.split(":").map(s => s.trim());
            if (key && value) {
              const camelCasedKey = key.replace(/-([a-z])/g, (_, char) =>
                char.toUpperCase()
              );
              (styleObj as Record<string, string>)[camelCasedKey] = value;
            }
            return styleObj;
          }, {} as React.CSSProperties);
        } else {
          acc[attr.name] = attr.value;
        }
        return acc;
      }, {} as Record<string, any>);

      return (
        <TagName key={`${element.tagName}-${Math.random()}`} {...attributes}>
          {children}
        </TagName>
      );
    }

    return null;
  };


  const doc = parseXml(xmlString);
  const root = doc.documentElement;

  return <>{renderNode(root)}</>;
};

export default XMLDisplayParser;
