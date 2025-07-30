// Template: frontend/src/App.tsx

// 1. Import Section (add where all other pages are imported)
import {
  MenuCreate,
  MenuEdit,
  MenuList,
  MenuShow,
} from "./pages/menu";


// 2. Resource Section (inside the resources array)
                {
                  name: "menu",
                  list: MenuList,
                  create: MenuCreate,
                  edit: MenuEdit,
                  show: MenuShow,
                  meta: {
                    canDelete: true,
                    label: "菜单",
                    icon: <ApiOutlined />,
                  },
                },


// 3. Route Section (inside the Routes definition)
                  <Route path="/menu">
                    <Route index element={<MenuList />} />
                    <Route path="create" element={<MenuCreate />} />
                    <Route path="edit/:id" element={<MenuEdit />} />
                    <Route path="show/:id" element={<MenuShow />} />
                  </Route>