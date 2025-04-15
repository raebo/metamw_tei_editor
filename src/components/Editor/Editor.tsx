import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import { TRANSFORMERS } from "@lexical/markdown";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LocalStoragePlugin } from "./plugins/LocalStoragePlugin";
import ExampleTheme from '../../styles/ExampleTheme';
import '../../old/styles.css';

const Placeholder = () => {
  return (
    <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50">
      Start writing...
    </div>
  );
};

const editorConfig = {
  namespace: 'LexicalEditor',
  nodes: [],
  // Handling of errors during update
  onError(error: Error) {
    console.log(error);
  },
  // The editor theme
  theme: ExampleTheme,
  editable: true
};

type LexicalEditorProps = {
  config: Parameters<typeof LexicalComposer>['0']['initialConfig'];
};

export function LexicalEditor(props: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={props.config}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <LocalStoragePlugin namespace={props.config.namespace} />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </LexicalComposer>
  );
}

const EDITOR_NAMESPACE = "lexical-editor";


const EDITOR_NODES = [
  CodeNode,
  HeadingNode,
  LinkNode,
  ListNode,
  ListItemNode,
  QuoteNode,
]



export function Editor() {
  const content = localStorage.getItem(EDITOR_NAMESPACE);

  return (
    <div
      id="editor-wrapper"
      className={
        'relative prose prose-slate prose-p:my-0 prose-headings:mb-4 prose-headings:mt-2'
      }
    >
      <LexicalEditor
        config={{
          namespace: EDITOR_NAMESPACE,
          editorState: content,
          nodes: EDITOR_NODES,
          theme: {
            root: 'p-4 border-slate-500 border-2 rounded h-full min-h-[200px] focus:outline-none focus-visible:border-black',
            link: 'cursor-pointer',
            text: {
              bold: 'font-semibold',
              underline: 'underline',
              italic: 'italic',
              strikethrough: 'line-through',
              underlineStrikethrough: 'underlined-line-through',
            },
          },
          onError: error => {
            console.log(error);
          },
        }}
      />
    </div>
  );
}
