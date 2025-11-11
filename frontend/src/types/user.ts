export interface Role {
  id: number;
  name: string;
  code: string;
}

export interface UserDetail {
  id: number;
  email: string;
  full_name: string;
  create_time: string; // ISO日期字符串
  dept_name: string;
  roles: Role[];
}
