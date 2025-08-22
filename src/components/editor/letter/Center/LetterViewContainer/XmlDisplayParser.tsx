import React, {useEffect} from "react";

type XmlDisplayParserProps = {
	xmlContentRef: React.RefObject<HTMLDivElement> | null;
	xmlString: string;
	onRightClickMarked?: (pos: { top: number; left: number }) => void | null;
};


const XMLDisplayParser = (props: XmlDisplayParserProps)  => {

  const parseXml = (xmlString: string) => {
    const parser = new DOMParser();

    return parser.parseFromString(xmlString, "application/xml");
  };

  const renderNode = (node: ChildNode): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const TagName = element.tagName as keyof JSX.IntrinsicElements;
      const children = Array.from(element.childNodes).map((child ) =>
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

	const handleNativeContextMenu = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (target?.tagName.toLowerCase() === "span" && target.classList.contains("marked")) {
			event.preventDefault();
			props.onRightClickMarked?.({ top: event.clientY, left: event.clientX });
		}
	};

	const handleReactContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		handleNativeContextMenu(event.nativeEvent); // delegate to native handler
	};


	useEffect(() => {
		if (!props.xmlContentRef || !props.xmlContentRef.current) return;

		const container = props.xmlContentRef.current;

		container.addEventListener("contextmenu", handleNativeContextMenu);
		return () => {
			container.removeEventListener("contextmenu", handleNativeContextMenu);
		};
	}, []);


	const containerProps = props.xmlContentRef && props.xmlContentRef.current
		? { onContextMenu: handleReactContextMenu }
		: {};

  const doc = parseXml(props.xmlString);
  const root = doc.documentElement;

	return <div {...containerProps}>{renderNode(root)}</div>;
};

export default XMLDisplayParser;
