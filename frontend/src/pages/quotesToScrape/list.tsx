import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker, Button, message, Tooltip  } from "antd";
import axiosInstance from "../../utils/axiosInstance";

export const QuotesToScrapeList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <>
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button type="primary" 
            onClick={async () => {
            const res = await axiosInstance.post('/quotesToScrape/scrape_quotes');
            console.info(res)
            if (res.data.ok) {
              message.success(res.data.msg);
            } else {
              message.error("启动爬虫失败");
            }
          }}
          >
            抓取信息
          </Button>
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="content"
          title="内容"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索内容"
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
            (filters.find((f) => f.field === "content")?.value as any[]) || null
          }
          render={(value: string) => {
            const maxLength = 50;
            if (!value) return "";
            return (
              <Tooltip title={value}
                styles={{
                  root: { maxWidth: 600, whiteSpace: 'normal' },
                }}
              >
                {value.length > maxLength ? value.slice(0, maxLength) + "..." : value}
              </Tooltip>
            );
          }}
        />
        <Table.Column
          dataIndex="author"
          title="作者"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索作者"
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
            (filters.find((f) => f.field === "author")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="tags"
          title="标签"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索标签"
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
            (filters.find((f) => f.field === "tags")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="author_birthday"
          title="作者生日"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索作者生日"
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
            (filters.find((f) => f.field === "author_birthday")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="author_location"
          title="作者出生地"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索作者出生地"
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
            (filters.find((f) => f.field === "author_location")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="author_bio"
          title="作者介绍"
          render={(value: string) => {
            const maxLength = 50;
            if (!value) return "";
            return (
              <Tooltip title={value}
                styles={{
                  root: { maxWidth: 600, whiteSpace: 'normal' },
                }}
              >
                {value.length > maxLength ? value.slice(0, maxLength) + "..." : value}
              </Tooltip>
            );
          }}
        />

        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
    </>
  );
};