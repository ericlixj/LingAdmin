// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  DemoUserCreate,
  DemoUserEdit,
  DemoUserList,
  DemoUserShow,
} from "./pages/demoUser";


// 2. Resource Section (inside the resources array)
                {
                  name: "demoUser",
                  list: DemoUserList,
                  create: DemoUserCreate,
                  edit: DemoUserEdit,
                  show: DemoUserShow,
                  meta: {
                    canDelete: true,
                    label: "演示用户",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/demoUser">
                    <Route index element={<DemoUserList />} />
                    <Route path="create" element={<DemoUserCreate />} />
                    <Route path="edit/:id" element={<DemoUserEdit />} />
                    <Route path="show/:id" element={<DemoUserShow />} />
                  </Route>