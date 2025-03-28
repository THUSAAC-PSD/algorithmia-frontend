import { useState } from 'react';

import Chat from '../../components/Chat';
import ProblemSetting from '../../components/ProblemSetting';
import Sidebar from '../../components/Sidebar';

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState('chat');

  const renderWorkspace = () => {
    switch (activeItem) {
      case 'chat':
        return <Chat />;
      case 'problem-setting':
        return <ProblemSetting />;
      default:
        return <Chat />;
    }
  };
  return (
    <div className="flex h-screen">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />

      <div className="flex-1 overflow-auto">{renderWorkspace()}</div>
    </div>
  );
};
export default Dashboard;
