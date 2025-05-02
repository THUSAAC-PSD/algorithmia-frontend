import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import '../styles/custom-milkdown.css';

import { Crepe } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';

const CrepeEditor: React.FC = () => {
  useEditor((root) => {
    return new Crepe({ root });
  });

  return <Milkdown />;
};

export const MilkdownEditorWrapper: React.FC = () => {
  return (
    <MilkdownProvider>
      <CrepeEditor />
    </MilkdownProvider>
  );
};
