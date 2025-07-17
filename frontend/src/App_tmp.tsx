// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  CurdModel02Create,
  CurdModel02Edit,
  CurdModel02List,
  CurdModel02Show,
} from "./pages/curdModel02";


// 2. Resource Section (inside the resources array)
                {
                  name: "curdModel02",
                  list: CurdModel02List,
                  create: CurdModel02Create,
                  edit: CurdModel02Edit,
                  show: CurdModel02Show,
                  meta: {
                    canDelete: true,
                    label: "单表模型02管理",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/curdModel02">
                    <Route index element={<CurdModel02List />} />
                    <Route path="create" element={<CurdModel02Create />} />
                    <Route path="edit/:id" element={<CurdModel02Edit />} />
                    <Route path="show/:id" element={<CurdModel02Show />} />
                  </Route>