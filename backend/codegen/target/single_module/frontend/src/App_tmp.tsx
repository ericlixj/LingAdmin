// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  MulCurdModelOrderCreate,
  MulCurdModelOrderEdit,
  MulCurdModelOrderList,
  MulCurdModelOrderShow,
} from "./pages/mulCurdModelOrder";


// 2. Resource Section (inside the resources array)
                {
                  name: "mulCurdModelOrder",
                  list: MulCurdModelOrderList,
                  create: MulCurdModelOrderCreate,
                  edit: MulCurdModelOrderEdit,
                  show: MulCurdModelOrderShow,
                  meta: {
                    canDelete: true,
                    label: "主子表模型订单管理",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/mulCurdModelOrder">
                    <Route index element={<MulCurdModelOrderList />} />
                    <Route path="create" element={<MulCurdModelOrderCreate />} />
                    <Route path="edit/:id" element={<MulCurdModelOrderEdit />} />
                    <Route path="show/:id" element={<MulCurdModelOrderShow />} />
                  </Route>