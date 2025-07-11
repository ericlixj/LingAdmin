// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  AppNewCreate,
  AppNewEdit,
  AppNewList,
  AppNewShow,
} from "./pages/appNew";


// 2. Resource Section (inside the resources array)
{
  name: "appNew",
  list: AppNewList,
  create: AppNewCreate,
  edit: AppNewEdit,
  show: AppNewShow,
  meta: {
    canDelete: true,
    label: "应用管理New",
    icon: <ApiOutlined />,
  },
},


// 3. Route Section (inside the Routes definition)
<Route path="/appNew">
  <Route index element={<AppNewList />} />
  <Route path="create" element={<AppNewCreate />} />
  <Route path="edit/:id" element={<AppNewEdit />} />
  <Route path="show/:id" element={<AppNewShow />} />
</Route>