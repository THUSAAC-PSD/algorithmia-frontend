import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/nord-dark.css';
import '../styles/custom-milkdown.css';

import { Crepe } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { useImperativeHandle, useRef } from 'react';

// Interface for the editor reference
export interface EditorRef {
  getContent: () => string | undefined;
}

const CrepeEditor = ({
  ref,
  defaultValue,
}: {
  ref: React.Ref<EditorRef>;
  defaultValue?: string;
}) => {
  const crepeRef = useRef<Crepe | null>(null);

  useImperativeHandle(ref, () => ({
    getContent: () => crepeRef.current?.getMarkdown(),
  }));

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: defaultValue || '',
    });
    crepeRef.current = crepe;
    return crepe;
  });

  return <Milkdown />;
};

export const MilkdownEditorWrapper = ({
  ref,
  defaultValue,
}: {
  ref: React.Ref<EditorRef>;
  defaultValue?: string;
}) => {
  const editorRef = useRef<EditorRef>(null);

  useImperativeHandle(ref, () => ({
    getContent: () => editorRef.current?.getContent(),
  }));

  return (
    <MilkdownProvider>
      <CrepeEditor ref={editorRef} defaultValue={defaultValue} />
    </MilkdownProvider>
  );
};
