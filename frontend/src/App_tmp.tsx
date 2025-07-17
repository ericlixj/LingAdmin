// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  CurdModel001Create,
  CurdModel001Edit,
  CurdModel001List,
  CurdModel001Show,
} from "./pages/curdModel001";


// 2. Resource Section (inside the resources array)
                {
                  name: "curdModel001",
                  list: CurdModel001List,
                  create: CurdModel001Create,
                  edit: CurdModel001Edit,
                  show: CurdModel001Show,
                  meta: {
                    canDelete: true,
                    label: "单表模型01管理",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/curdModel001">
                    <Route index element={<CurdModel001List />} />
                    <Route path="create" element={<CurdModel001Create />} />
                    <Route path="edit/:id" element={<CurdModel001Edit />} />
                    <Route path="show/:id" element={<CurdModel001Show />} />
                  </Route>