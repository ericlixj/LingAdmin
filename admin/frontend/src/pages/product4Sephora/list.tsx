import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import React, { useState } from "react";
import { Table, Space, Button, Modal, Input, notification, Form } from "antd";
import axiosInstance from "../../utils/axiosInstance";

export const Product4SephoraList = () => {
  const { tableProps, filters, tableQuery } = useTable({
    syncWithLocation: true,
    filters: { mode: "server" },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skuId, setSkuId] = useState("2862480");
  const [productId, setProductId] = useState("P455936");

  const handleScrape = async () => {
    setLoading(true);
    if (!skuId) {
      notification.warning({
        message: "请输入 SKU ID",
        duration: 2,
      });
      return;
    }

    try {
      const payload = {
        skuId: skuId,
        productId: productId,
      };
      const response = await axiosInstance.post('/product4Sephora/scrape_sku', payload);
      if (!response.data) throw new Error(`请求失败: ${response.statusText}`);
      notification.success({
        message: "抓取成功",
        description: `SKU ${skuId} 数据已抓取`,
        duration: 3,
      });

      setModalVisible(false);
      setSkuId("2862480");
      tableQuery.refetch(); // 刷新表格
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "抓取失败",
        description: error.message,
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <List
        headerButtons={({ defaultButtons }) => (
          <>
            {defaultButtons}
            <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginLeft: 8 }}>
              抓取产品信息
            </Button>
          </>
        )}
      >
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title="ID" sorter />

          <Table.Column
            dataIndex="productId"
            title="产品ID"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索产品ID"
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
              (filters.find((f) => f.field === "productId")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="skuId"
            title="SKUID"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索SKUID"
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
              (filters.find((f) => f.field === "skuId")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="productName"
            title="产品名称"
            sorter
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索产品名称"
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
              (filters.find((f) => f.field === "productName")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="listPrice"
            title="价格"
            filterDropdown={(props) => (
              <FilterDropdown {...props}>
                <Input
                  placeholder="搜索价格"
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
              (filters.find((f) => f.field === "listPrice")?.value as any[]) || null
            }

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="variationType"
            title="规格"

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="variationTypeDisplayName"
            title="规格名称"

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="variationValue"
            title="规格值"

            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="images"
            title="图片"
            render={(value) => {
              if (!value) return "-";

              try {
                const imgs = JSON.parse(value);
                if (Array.isArray(imgs)) {
                  return imgs.map((image: any, index: number) => (
                    <img
                      key={index}
                      src={image.imageUrl}
                      alt={`image-${index}`}
                      style={{ maxWidth: 100, maxHeight: 100, objectFit: "contain", marginRight: 8 }}
                    />
                  ));
                }
              } catch {
                // 不是 JSON，直接当单张 URL
                return (
                  <img
                    src={value}
                    alt="product"
                    style={{ maxWidth: 100, maxHeight: 100, objectFit: "contain" }}
                  />
                );
              }

              return "-";
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
      <Modal
        title="输入 SKU/PRODUCT ID"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={handleScrape}
            loading={loading} // 绑定 loading
          >
            抓取
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Product ID">
            <Input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="SKU ID">
            <Input
              value={skuId}
              onChange={(e) => setSkuId(e.target.value)}
              onPressEnter={handleScrape}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};