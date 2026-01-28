import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AICreation from '@/pages/AICreation';
import ScriptManagement from '@/pages/ScriptManagement';
import ScriptDetail from '@/pages/ScriptDetail';
import ResourceLibrary from '@/pages/ResourceLibrary';
import CharacterLibrary from '@/pages/CharacterLibrary';
import TeamSpace from '@/pages/TeamSpace';
import ImageToVideo from '@/pages/ImageToVideo';
import ImageToImage from '@/pages/ImageToImage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/ai-creation" replace />} />
        <Route path="ai-creation" element={<AICreation />} />
        <Route path="script-management" element={<ScriptManagement />} />
        <Route path="script-management/:id" element={<ScriptDetail />} />
        <Route path="resource-library" element={<ResourceLibrary />} />
        <Route path="image-to-video" element={<ImageToVideo />} />
        <Route path="image-to-image" element={<ImageToImage />} />
        <Route path="character-library" element={<CharacterLibrary />} />
        <Route path="team-space" element={<TeamSpace />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;
