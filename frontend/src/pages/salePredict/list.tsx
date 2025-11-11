import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Table, Space, Button, Modal, Input, notification, Spin } from "antd";
import axiosInstance from "../../utils/axiosInstance";
import { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";

export const SalePredictList = () => {
  const [loading, setLoading] = useState(false);
  const { tableProps, filters, tableQuery } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
    pagination: {
        pageSize: 10, // 默认每页条数
        showSizeChanger: true, // 显示每页条数选择
        pageSizeOptions: ["10", "20", "50", "100"], // 可选条数
    },    
  });
  
  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;
  const sync_data= async () =>{
    setLoading(true);
    try {
      const payload = {

      };
      const response = await axiosInstance.post('/salePredict/sync_data', payload);
      if (response?.data?.success) {
        notification.success({
          message: "同步成功",
          description: response.data.message,
          duration: 3,
        });
      } else {
        notification.error({
          message: "同步失败",
          description: response?.data?.message || "同步失败",
          duration: 3,
        });
      }

      tableQuery.refetch(); // 刷新表格
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "同步失败",
        description: error.message,
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }


  const predict_data= async () =>{
    setLoading(true);
    try {
      const payload = {

      };
      const response = await axiosInstance.post('/salePredict/predict_data', payload);
      if (response?.data?.success) {
        notification.success({
          message: "预测成功",
          description: response.data.message,
          duration: 3,
        });
      } else {
        notification.error({
          message: "预测失败",
          description: response?.data?.message || "预测失败",
          duration: 3,
        });
      }

      tableQuery.refetch(); // 刷新表格
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "预测失败",
        description: error.message,
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }  

  return (
    <Spin
      spinning={loading}
      tip="数据处理中，请稍候..."
      indicator={antIcon}
      size="large"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.6)",
        zIndex: 9999,
        flexDirection: "column",
      }}
    >
      <List
        headerButtons={({ defaultButtons }) => (
          <>
            {defaultButtons}
            <Button type="primary" onClick={() => sync_data()} style={{ marginLeft: 8 }}>
              同步数仓
            </Button>
            <Button type="primary" onClick={() => predict_data()} style={{ marginLeft: 8 }}>
              预测销量
            </Button>            
          </>
        )}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title="ID" sorter />

          <Table.Column
            dataIndex="stat_year"
            title="统计年"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索统计年"
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
              (filters.find((f) => f.field === "stat_year")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="stat_month"
            title="统计月"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索统计月"
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
              (filters.find((f) => f.field === "stat_month")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="sku"
            title="sku"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索sku"
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
              (filters.find((f) => f.field === "sku")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />        
          <Table.Column
            dataIndex="sales_quantity"
            title="实际销量"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索实际销量"
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
              (filters.find((f) => f.field === "sales_quantity")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="predict_quantity"
            title="预测销量"
            sorter

            render={(value) => {
              return value;
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
    </Spin>
  );
};