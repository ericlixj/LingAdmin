import { authProvider } from "./authProvider";

// accessControlProvider.ts
export const accessControlProvider = {
    can: async ({ resource, action }) => {
        const permissions = await authProvider.getPermissions();
        //console.info(`permissions is ${permissions}`);
        if (permissions.includes("super_admin")) {
            // console.log("超级管理员权限，允许所有操作");
            return { can: true };
        }

        const permissionKey = `${resource}:${action}`;
        const canAccess = permissions.includes(permissionKey);
        // console.log(`检查权限: ${permissionKey}, 结果: ${canAccess}`);
        return {
            can: canAccess,
        };
    },
};
