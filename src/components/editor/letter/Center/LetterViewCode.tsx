import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import vkbeautify from 'vkbeautify';

type LetterViewCodeProps = {
  xmlString: string;
};

const LetterViewCode = ({ xmlString }: LetterViewCodeProps) => {
  const formattedXml = useMemo(() => {
    return vkbeautify.xml(xmlString);
  }, [xmlString]);

  return (
    <>
      <div className="letterViewCodeContainer">
        <Editor
          key={xmlString}
          height="1000px"
          defaultLanguage="xml"
          value={formattedXml}
          options={{
            readOnly: false,
            minimap: { enabled: true },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true
          }}
        />
      </div>
    </>
  );
};

export default LetterViewCode;
