import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useMany, useList } from "@refinedev/core";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";

export const StudySessionList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  // 收集所有 user_id 和 exam_id
  const allSessions = tableProps?.dataSource || [];
  const userIds = [...new Set(allSessions.map((item: any) => item.user_id).filter(Boolean))];
  const examIds = [...new Set(allSessions.map((item: any) => item.exam_id).filter(Boolean))];

  // 批量获取用户信息
  const { data: usersData } = useMany({
    resource: "user",
    ids: userIds as number[],
    queryOptions: {
      enabled: userIds.length > 0,
    },
  });

  // 批量获取考试信息
  const { data: examsData } = useMany({
    resource: "studyExam",
    ids: examIds as number[],
    queryOptions: {
      enabled: examIds.length > 0,
    },
  });

  // 构建映射
  const usersMap = useMemo(() => {
    const map = new Map();
    (usersData?.data || []).forEach((user: any) => {
      map.set(user.id, user);
    });
    return map;
  }, [usersData]);

  const examsMap = useMemo(() => {
    const map = new Map();
    (examsData?.data || []).forEach((exam: any) => {
      map.set(exam.id, exam);
    });
    return map;
  }, [examsData]);

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="user_id"
          title="用户"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索用户ID"
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "user_id")?.value as any[]) || null
          }
          render={(value) => {
            const user = usersMap.get(value);
            return user ? (user.full_name || user.email || `ID: ${value}`) : `ID: ${value}`;
          }}
        />
        <Table.Column
          dataIndex="exam_id"
          title="考试"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索考试ID"
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "exam_id")?.value as any[]) || null
          }
          render={(value) => {
            const exam = examsMap.get(value);
            return exam ? (exam.name || `ID: ${value}`) : `ID: ${value}`;
          }}
        />
        <Table.Column
          dataIndex="mode"
          title="学习模式"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择学习模式"

                style={{ minWidth: 150 }}
                options={ [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}] }
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "mode")?.value as any[]) || null
          }

          render={(value) => {
            const option = [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}].find(opt => opt.value === value);
            return option ? option.label : value;
          }}
        />
        <Table.Column
          dataIndex="start_time"
          title="start_time"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="end_time"
          title="end_time"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="score"
          title="score"

          render={(value) => {
            return value;
          }}
        />

        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id} >子表管理</ShowButton>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};