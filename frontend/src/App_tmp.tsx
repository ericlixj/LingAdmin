// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  DemoOrder01Create,
  DemoOrder01Edit,
  DemoOrder01List,
  DemoOrder01Show,
} from "./pages/demoOrder01";


// 2. Resource Section (inside the resources array)
                {
                  name: "demoOrder01",
                  list: DemoOrder01List,
                  create: DemoOrder01Create,
                  edit: DemoOrder01Edit,
                  show: DemoOrder01Show,
                  meta: {
                    canDelete: true,
                    label: "演示订单01",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/demoOrder01">
                    <Route index element={<DemoOrder01List />} />
                    <Route path="create" element={<DemoOrder01Create />} />
                    <Route path="edit/:id" element={<DemoOrder01Edit />} />
                    <Route path="show/:id" element={<DemoOrder01Show />} />
                  </Route>