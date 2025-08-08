import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useSelect,
  useTable,
} from "@refinedev/antd";
import { Select, Space, Table, Button } from "antd";
import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance"; // 请确认路径
import { useMemo } from "react";
import { useList } from "@refinedev/core";
import { CodePreviewModal } from "../../components/common/CodePreviewModal";

export const MasterDetailRelList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  // 主表模块列表
  const { selectProps: masterModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select",
    optionLabel: "label",
    optionValue: "id",
  });
  const moduleOptions = masterModuleSelectProps.options ?? [];

  // 子表模块列表
  const { selectProps: detailModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select",
    optionLabel: "label",
    optionValue: "id",
  });
  const detailModuleOptions = detailModuleSelectProps.options ?? [];

  // 子表字段列表
  const { selectProps: fieldSelectProps } = useSelect({
    resource: "crudDefineFileds/filed_select",
    optionLabel: "description",
    optionValue: "name",
    queryOptions: {
      enabled: true,
    },
  });
  const fieldOptions = fieldSelectProps.options ?? [];

  // 构造映射
  const fieldLabelMap = Object.fromEntries(
    fieldOptions.map((item) => [String(item.value), item.label])
  );

  const moduleLabelMap = Object.fromEntries(
    moduleOptions.map((item) => [String(item.value), item.label])
  );

  // 代码预览相关状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [fileContentMap, setFileContentMap] = useState<{ [key: string]: string }>({});
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [moduleName, setModuleName] = useState<string>("");

  // 预览代码函数
  const handlePreview = async (record: any) => {
    setLoading(true);
    setPreviewVisible(true);
    setModuleName(record.module_name || ""); // 你数据中模块名字段可能不叫 module_name ，请替换成正确字段名

    try {
      const res = await axiosInstance.get("/masterDetailRel/preview_code", {
        params: { id: record.id },
      });
      const data = res.data;
      setFileContentMap(data);

      // 默认选中第一个文件
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
  const { data: menuData } = useList({
    resource: "menu/list_valid_menus",
    pagination: {
      pageSize: 9999,
    },    
    meta: { selectAll: true },
  });

  const idNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (menuData?.data || []).forEach(item => {
      map.set(item.id, item.menu_label);
    });
    return map;
  }, [menuData?.data]);
  // console.info("ID-Name Map:", idNameMap);  

  return (
    <>
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title="ID" sorter />
          <Table.Column
            dataIndex="parent_menu_id"
            title="上级菜单"
            render={(menuId: number) => {
              return idNameMap.get(menuId) || menuId || "-";
            }}
          />    
          <Table.Column
            dataIndex="master_module_id"
            title="主表模块"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Select
                  allowClear
                  showSearch
                  placeholder="请选择主表模块"
                  style={{ minWidth: 150 }}
                  options={moduleOptions}
                  value={props.selectedKeys[0]}
                  onChange={(value) => props.setSelectedKeys(value ? [value] : [])}
                  onBlur={() => props.confirm()}
                />
              </FilterDropdown>
            )}
            filteredValue={
              (filters.find((f) => f.field === "master_module_id")?.value as any[]) || null
            }
            render={(value) => moduleLabelMap[String(value)] || value}
          />

          <Table.Column
            dataIndex="detail_module_id"
            title="子表模块"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Select
                  allowClear
                  showSearch
                  placeholder="请选择子表模块"
                  style={{ minWidth: 150 }}
                  options={detailModuleOptions}
                  value={props.selectedKeys[0]}
                  onChange={(value) => props.setSelectedKeys(value ? [value] : [])}
                  onBlur={() => props.confirm()}
                />
              </FilterDropdown>
            )}
            filteredValue={
              (filters.find((f) => f.field === "detail_module_id")?.value as any[]) || null
            }
            render={(value) => moduleLabelMap[String(value)] || value}
          />

          <Table.Column
            dataIndex="rel_filed_name"
            title="子表关联字段名"
            sorter
            render={(value) => fieldLabelMap[String(value)] || value}
          />

          <Table.Column
            title="操作"
            render={(_, record) => (
              <Space>
                <EditButton recordItemId={record.id} />
                <ShowButton recordItemId={record.id} />
                <Button type="link" onClick={() => handlePreview(record)}>
                  预览代码
                </Button>
              </Space>
            )}
          />
        </Table>
      </List>

      <CodePreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        files={fileContentMap}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        loading={loading}
        moduleName={moduleName}
      />
    </>
  );
};
