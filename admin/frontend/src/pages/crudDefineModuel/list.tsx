import { List, useTable, EditButton, ShowButton, FilterDropdown } from "@refinedev/antd";
import { Table, Input, Space, Button, Modal, Typography } from "antd";
import { useState, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { CodePreviewModal } from "../../components/common/CodePreviewModal";
import { useList } from "@refinedev/core";

export const CrudDefineModuelList = () => {
  const { tableProps, filters, setFilters } = useTable({
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

  // 新增：操作说明弹窗控制
  const [instructionVisible, setInstructionVisible] = useState(false);

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
    pagination: { pageSize: 9999 },
    meta: { selectAll: true },
  });

  const idNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (menuData?.data || []).forEach((item) => {
      map.set(item.id, item.menu_label);
    });
    return map;
  }, [menuData?.data]);

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
            render={(menuId: number) => idNameMap.get(menuId) || menuId || "-"}
          />
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
          />
          <Table.Column dataIndex="description" title="描述信息" />
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
      </List>

      {/* 代码预览弹窗 */}
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
        1）分析需求，如果需求基于单表模型可以设计实现，请先定义相关模块名称、编码、字段信息，并保存
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
        10）如果模型结构需要调整，请重复以上步骤
      </Typography.Paragraph>

      </Modal>
    </>
  );
};
