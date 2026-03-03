import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import AICreation from '@/pages/AICreation';
import ScriptManagement from '@/pages/ScriptManagement';
import ScriptDetail from '@/pages/ScriptDetail';
import ResourceLibrary from '@/pages/ResourceLibrary';
import CharacterLibrary from '@/pages/CharacterLibrary';
import ScriptCharacters from '@/pages/CharacterLibrary/ScriptCharacters';
import TeamSpace from '@/pages/TeamSpace';
import ImageToVideo from '@/pages/ImageToVideo';
import ImageToImage from '@/pages/ImageToImage';
import Recharge from '@/pages/Recharge';
import Pay from '@/pages/Pay';
import UserManagement from '@/pages/Admin/UserManagement';
// import AdminScriptManagement from '@/pages/Admin/ScriptManagement';

export default function AppRouter() {
  return (
    <Routes>
      {/* 独立页面 - 不需要认证 */}
      <Route path="/login" element={<Login />} />
      <Route path="/pay" element={<Pay />} />

      {/* 首页 - 不需要认证，独立渲染 */}
      <Route path="/" element={<Home />} />

      {/* 主应用路由 - 需要认证，Layout 内部根据主题切换布局 */}
      <Route element={<AuthGuard><Layout /></AuthGuard>}>
        <Route path="ai-creation" element={<AICreation />} />
        <Route path="script-management" element={<ScriptManagement />} />
        <Route path="script-management/:id" element={<ScriptDetail />} />
        <Route path="resource-library" element={<ResourceLibrary />} />
        <Route path="image-to-video" element={<ImageToVideo />} />
        <Route path="image-to-image" element={<ImageToImage />} />
        <Route path="character-library" element={<CharacterLibrary />} />
        <Route path="character-library/script/:scriptId" element={<ScriptCharacters />} />
        <Route path="team-space" element={<TeamSpace />} />
        <Route path="recharge" element={<Recharge />} />
        <Route path="admin/users" element={<UserManagement />} />
      </Route>
    </Routes>
  );
}
