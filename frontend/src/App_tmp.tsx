// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  SysDicCreate,
  SysDicEdit,
  SysDicList,
  SysDicShow,
} from "./pages/sysDic";


// 2. Resource Section (inside the resources array)
                {
                  name: "sysDic",
                  list: SysDicList,
                  create: SysDicCreate,
                  edit: SysDicEdit,
                  show: SysDicShow,
                  meta: {
                    canDelete: true,
                    label: "字典表",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/sysDic">
                    <Route index element={<SysDicList />} />
                    <Route path="create" element={<SysDicCreate />} />
                    <Route path="edit/:id" element={<SysDicEdit />} />
                    <Route path="show/:id" element={<SysDicShow />} />
                  </Route>