import {
  EditButton,
  FilterDropdown,
  ShowButton,
  useTable,
  List,
} from "@refinedev/antd";
import { Input, Space, Table, Typography , Button } from "antd";
import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { CodePreviewModal } from "../../components/common/CodePreviewModal";
const { Text } = Typography;

export const CrudDefineModuelList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  const [previewVisible, setPreviewVisible] = useState(false);
  const [fileContentMap, setFileContentMap] = useState<{ [key: string]: string }>({});
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [moduleName, setModuleName] = useState<string>("");

  const handlePreview = async (record: any) => {
    setLoading(true);
    setPreviewVisible(true);
    setModuleName(record.module_name); 
    try {
      const res = await axiosInstance.get("/crudDefineModuel/preview_code", {
        params: { id: record.id },
      });
      const data = res.data;
      setFileContentMap(data);

      // 默认选第一个文件
      const firstFile = Object.keys(data)[0];
      setSelectedFile(firstFile || "");
    } catch (error) {
      console.error("预览失败", error);
      setFileContentMap({});
      setSelectedFile("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="module_name"
          title="模块编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索模块编码"
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
            (filters.find((f) => f.field === "module_name")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="label"
          title="模块名称"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索模块名称"
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
            (filters.find((f) => f.field === "label")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="description"
          title="描述信息"

          render={(value) => {
            return value;
          }}
        />

        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id}>字段管理</ShowButton>
              <Button type="link" onClick={() => handlePreview(record)}>
                预览代码
              </Button>
            </Space>
          )}
        />
      </Table>
      <CodePreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        files={fileContentMap}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        loading={loading}
        moduleName={moduleName}
      />
    </List>
  );
};
