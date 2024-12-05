import React from "react";

const XMLDisplay: React.FC<{ xmlString: string }> = ({ xmlString }) => {
  // Decode entities like `&lt;` and `&gt;` back into `<` and `>`
  const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value
  };

  const decodedXml = decodeHTML(xmlString);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: decodedXml }}
    />
  );
};

export default XMLDisplay;