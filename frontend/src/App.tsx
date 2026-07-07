import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/router';

// [API] 对接点：应用启动时初始化全局数据
// import { useEffect } from 'react';
// import { useAppStore } from '@/store';
//
// function App() {
//   // 对接后端后，在此处触发全局数据加载
//   useEffect(() => {
//     useAppStore.getState().initializeApp();
//   }, []);
//
//   return (
//     <BrowserRouter>
//       <AppRoutes />
//     </BrowserRouter>
//   );
// }

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
