import { Route } from 'react-router-dom';

import Sidebar from '../../components/Sidebar';
import Chat from '../Chat';
import ProblemSetting from '../ProblemSetting';

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <Route path="problem-setting" element={<ProblemSetting />} />
      <Route path="chat" element={<Chat />} />
    </div>
  );
};
export default Dashboard;
