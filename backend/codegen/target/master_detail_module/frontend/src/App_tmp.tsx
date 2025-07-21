// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  MulCurdModelUser02Create,
  MulCurdModelUser02Edit,
  MulCurdModelUser02List,
  MulCurdModelUser02Show,
} from "./pages/mulCurdModelUser02";


// 2. Resource Section (inside the resources array)
                {
                  name: "mulCurdModelUser02",
                  list: MulCurdModelUser02List,
                  create: MulCurdModelUser02Create,
                  edit: MulCurdModelUser02Edit,
                  show: MulCurdModelUser02Show,
                  meta: {
                    canDelete: true,
                    label: "主子表模型02用户管理",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/mulCurdModelUser02">
                    <Route index element={<MulCurdModelUser02List />} />
                    <Route path="create" element={<MulCurdModelUser02Create />} />
                    <Route path="edit/:id" element={<MulCurdModelUser02Edit />} />
                    <Route path="show/:id" element={<MulCurdModelUser02Show />} />
                  </Route>