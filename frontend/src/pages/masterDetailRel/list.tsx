import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useSelect,
  useTable,
} from "@refinedev/antd";
import { Select, Space, Table, Button, Modal, Typography } from "antd";
import { useState, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance"; // 请确认路径
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
  const [instructionVisible, setInstructionVisible] = useState(false);

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
        <List
          headerButtons={({ defaultButtons }) => (
            <>
              {defaultButtons}
              <Button key="instruction" onClick={() => setInstructionVisible(true)} style={{ marginLeft: 8 }}>
                操作说明
              </Button>
            </>
          )}
        >
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

{/* 新增：操作说明弹窗 */}
      <Modal
        title="操作说明"
        visible={instructionVisible}
        onCancel={() => setInstructionVisible(false)}
        footer={[
          <Button key="close" onClick={() => setInstructionVisible(false)}>
            关闭
          </Button>,
        ]}
      >
      <Typography.Paragraph>
        <Typography.Text strong type="danger">
          注意: 自动生成代码后，开发人员需要继续完善加工，加工处理后的业务代码在进行如下操作的4）时会丢失所有自己修改的内容，请小心使用！
        </Typography.Text>
        <br />        
        1）分析需求，如果需求基于主子表模型可以设计实现，请前往"代码生成[单表]"先分别定义主、子表模块名称、编码、字段信息，并保存。完成后来到当前模块进行主子表关联。
        <br />
        2）点击"预览代码"
        <br />
        3）执行 <code>sql_tmp</code>，建立 menu 数据
        <br />
        4）下载代码，复制 <code>fronted</code> 与 <code>backend</code> 到项目目录下
        <br />
        5）基于 <code>zh_tmp.ts</code> 修改 <code>zh.ts</code>，如果希望支持 <code>en</code>，同步修改之
        <br />
        6）执行 alembic model 的 sql 生成脚本
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;<code>alembic revision --autogenerate -m 'your commit message'</code>
        <br />
        7）执行 alembic 数据库同步
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;<code>alembic upgrade head</code>
        <br />
        8）重启 backend 服务
        <br />
        9）角色管理中，针对相关角色配置菜单权限中新增加的 menu
        <br />
        10）如果相关模型字段结构需要调整，请重复以上步骤
      </Typography.Paragraph>

      </Modal>      
    </>
  );
};
