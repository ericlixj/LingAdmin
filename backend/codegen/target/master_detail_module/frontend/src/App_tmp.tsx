// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  MulCurdModelUser01Create,
  MulCurdModelUser01Edit,
  MulCurdModelUser01List,
  MulCurdModelUser01Show,
} from "./pages/mulCurdModelUser01";


// 2. Resource Section (inside the resources array)
                {
                  name: "mulCurdModelUser01",
                  list: MulCurdModelUser01List,
                  create: MulCurdModelUser01Create,
                  edit: MulCurdModelUser01Edit,
                  show: MulCurdModelUser01Show,
                  meta: {
                    canDelete: true,
                    label: "主子表模型用户管理01",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/mulCurdModelUser01">
                    <Route index element={<MulCurdModelUser01List />} />
                    <Route path="create" element={<MulCurdModelUser01Create />} />
                    <Route path="edit/:id" element={<MulCurdModelUser01Edit />} />
                    <Route path="show/:id" element={<MulCurdModelUser01Show />} />
                  </Route>