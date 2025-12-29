import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList, useTranslate, useUpdate } from "@refinedev/core";
import { Button, Checkbox, Input, Modal, Space, Table, Tag, message, InputNumber, Descriptions, Tabs } from "antd";
import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";

export const UserList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  const { data: roleData } = useList({ resource: "role" });
  const { mutate: updateUserRoles } = useUpdate();
  const t = useTranslate();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const openRoleModal = async (userId: number) => {
    setSelectedUserId(userId);
    setLoading(true);
    const ids = await fetchBoundRoles(userId);
    setSelectedRoleIds(ids);
    setLoading(false);
    setModalVisible(true);
  };

  const fetchBoundRoles = async (userId: number) => {
    const response = await axiosInstance.get(`/user/bind-roles/${userId}`);
    return response.data as number[];
  };

  const handleRoleChange = (checkedValues: any) => {
    setSelectedRoleIds(checkedValues);
  };

  const handleBindRoles = () => {
    if (selectedUserId !== null) {
      updateUserRoles({
        resource: `user/bind-roles`,
        values: {
          role_ids: selectedRoleIds,
        },
        id: selectedUserId,
      });
    }
    setModalVisible(false);
    setSelectedRoleIds([]);
  };
  // 重置密码相关状态和函数
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false);
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // 积分管理相关状态和函数
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [pointsUserId, setPointsUserId] = useState<number | null>(null);
  const [pointsData, setPointsData] = useState<any>(null);
  const [pointsTransactions, setPointsTransactions] = useState<any[]>([]);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustRemark, setAdjustRemark] = useState<string>("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);  

  const openResetPwdModal = (userId: number) => {
    setResetUserId(userId);
    setNewPassword("");
    setResetPwdModalVisible(true);
  };
  const handleResetPwd = async () => {
    if (!newPassword || !resetUserId) {
      message.error("请输入新密码");
      return;
    }
    setResetPwdLoading(true);
    try {
      await axiosInstance.patch(`/user/${resetUserId}/reset-password`, {
        password: newPassword,
      });
      message.success("修改成功");
      setResetPwdModalVisible(false);
    } catch (error) {
      message.error("修改失败，请重试");
    } finally {
      setResetPwdLoading(false);
    }
  };

  // 打开积分管理弹窗
  const openPointsModal = async (userId: number) => {
    setPointsUserId(userId);
    setAdjustAmount(0);
    setAdjustRemark("");
    setPointsModalVisible(true);
    await fetchUserPoints(userId);
    await fetchPointsTransactions(userId);
  };

  // 获取用户积分信息
  const fetchUserPoints = async (userId: number) => {
    try {
      const response = await axiosInstance.get(`/userPoints/${userId}`);
      setPointsData(response.data);
    } catch (error: any) {
      message.error("获取积分信息失败: " + (error.response?.data?.detail || error.message));
    }
  };

  // 获取积分交易记录
  const fetchPointsTransactions = async (userId: number, page: number = 1) => {
    setTransactionsLoading(true);
    try {
      const response = await axiosInstance.get(`/userPoints/${userId}/transactions`, {
        params: { page, page_size: 20 }
      });
      if (response.data.code === 0) {
        setPointsTransactions(response.data.data.transactions);
      }
    } catch (error: any) {
      message.error("获取交易记录失败: " + (error.response?.data?.detail || error.message));
    } finally {
      setTransactionsLoading(false);
    }
  };

  // 核销积分
  const handleAdjustPoints = async () => {
    if (!pointsUserId || adjustAmount === 0) {
      message.error("请输入调整金额");
      return;
    }
    setAdjustLoading(true);
    try {
      await axiosInstance.post(`/userPoints/${pointsUserId}/adjust`, {
        amount: adjustAmount,
        remark: adjustRemark || undefined
      });
      message.success("积分调整成功");
      setAdjustAmount(0);
      setAdjustRemark("");
      await fetchUserPoints(pointsUserId);
      await fetchPointsTransactions(pointsUserId);
    } catch (error: any) {
      message.error("积分调整失败: " + (error.response?.data?.detail || error.message));
    } finally {
      setAdjustLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取交易类型标签
  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'earn': '获得',
      'spend': '消费',
      'adjust': '调整'
    };
    return labels[type] || type;
  };

  // 获取交易类型颜色
  const getTransactionTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'earn': 'green',
      'spend': 'red',
      'adjust': 'orange'
    };
    return colors[type] || 'default';
  };

  return (
    <List title={t("user.titles.list")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />

        <Table.Column
          dataIndex="email"
          title={t("user.fields.email")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("user.filters.email")}
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
            (filters.find((f) => f.field === "email")?.value as string[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="full_name"
          title={t("user.fields.full_name")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("user.filters.full_name")}
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
            (filters.find((f) => f.field === "full_name")?.value as string[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="dept_name"  // 假设后端返回的用户数据里有 dept_name 字段
          title={t("user.fields.dept")}
          sorter
          render={(value: string | undefined) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("user.filters.dept")}
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
            (filters.find((f) => f.field === "dept_name")?.value as string[]) || null
          }
        />        

        <Table.Column
          dataIndex="is_active"
          title={t("user.fields.is_active")}
          render={(value) =>
            value ? (
              <Tag color="green">{t("common.enums.yes")}</Tag>
            ) : (
              <Tag color="red">{t("common.enums.no")}</Tag>
            )
          }
        />
        <Table.Column
          dataIndex="create_time"
          title={t("user.fields.create_time")}
        />
        <Table.Column
          title={t("user.actions.title")}
          render={(_, record) => (
            <Space>
              <EditButton
                recordItemId={record.id}
                disabled={record.is_superuser}
              />
              <ShowButton recordItemId={record.id} />
              <Button
                onClick={() => openRoleModal(record.id)}
                disabled={record.is_superuser}
              >
                {t("user.actions.bind_roles")}
              </Button>
              <Button
                onClick={() => openResetPwdModal(record.id)}
              >
                {t("user.actions.reset_pwd")}
              </Button>
              <Button
                onClick={() => openPointsModal(record.id)}
                type="primary"
              >
                积分管理
              </Button>              
            </Space>
          )}
        />
      </Table>

      <Modal
        title={t("user.modal.title")}
        open={modalVisible}
        onOk={handleBindRoles}
        onCancel={() => setModalVisible(false)}
        okText={t("user.modal.ok")}
        cancelText={t("user.modal.cancel")}
      >
        <Checkbox.Group
          style={{ width: "100%" }}
          onChange={handleRoleChange}
          value={selectedRoleIds}
        >
          <Space direction="vertical">
            {roleData?.data.map((role: any) => (
              <Checkbox key={role.id} value={role.id}>
                {role.name}（{role.code}）
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Modal>
      <Modal
        title="重置密码"
        open={resetPwdModalVisible}
        onOk={handleResetPwd}
        onCancel={() => setResetPwdModalVisible(false)}
        okText="提交"
        cancelText="取消"
        confirmLoading={resetPwdLoading}
      >
        <Input.Password
          placeholder="请输入新密码"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>

      {/* 积分管理弹窗 */}
      <Modal
        title="积分管理"
        open={pointsModalVisible}
        onCancel={() => {
          setPointsModalVisible(false);
          setPointsData(null);
          setPointsTransactions([]);
        }}
        footer={null}
        width={800}
      >
        <Tabs
          items={[
            {
              key: 'adjust',
              label: '积分核销',
              children: (
                <div>
                  {pointsData && (
                    <Descriptions bordered column={2} style={{ marginBottom: 20 }}>
                      <Descriptions.Item label="当前积分余额">
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6b35' }}>
                          {parseFloat(pointsData.balance || 0).toFixed(0)} 积分
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="累计获得">
                        {parseFloat(pointsData.total_earned || 0).toFixed(0)} 积分
                      </Descriptions.Item>
                      <Descriptions.Item label="累计消费">
                        {parseFloat(pointsData.total_spent || 0).toFixed(0)} 积分
                      </Descriptions.Item>
                      <Descriptions.Item label="累计调整">
                        {parseFloat(pointsData.total_adjusted || 0).toFixed(0)} 积分
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <label>调整金额（正数为增加，负数为减少）：</label>
                      <InputNumber
                        style={{ width: '100%', marginTop: 8 }}
                        value={adjustAmount}
                        onChange={(value) => setAdjustAmount(value || 0)}
                        min={-999999}
                        max={999999}
                        precision={0}
                        placeholder="请输入调整金额"
                      />
                    </div>
                    <div>
                      <label>备注：</label>
                      <Input.TextArea
                        style={{ marginTop: 8 }}
                        value={adjustRemark}
                        onChange={(e) => setAdjustRemark(e.target.value)}
                        placeholder="请输入备注（可选）"
                        rows={3}
                      />
                    </div>
                    <Button
                      type="primary"
                      onClick={handleAdjustPoints}
                      loading={adjustLoading}
                      block
                    >
                      确认调整
                    </Button>
                  </Space>
                </div>
              )
            },
            {
              key: 'history',
              label: '积分明细',
              children: (
                <div>
                  <Table
                    dataSource={pointsTransactions}
                    loading={transactionsLoading}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  >
                    <Table.Column
                      title="时间"
                      dataIndex="create_time"
                      render={(text) => formatDate(text)}
                      width={180}
                    />
                    <Table.Column
                      title="类型"
                      dataIndex="transaction_type"
                      render={(type) => (
                        <Tag color={getTransactionTypeColor(type)}>
                          {getTransactionTypeLabel(type)}
                        </Tag>
                      )}
                      width={100}
                    />
                    <Table.Column
                      title="金额"
                      dataIndex="amount"
                      render={(amount) => {
                        const numAmount = parseFloat(amount || 0);
                        return (
                          <span style={{ 
                            color: numAmount > 0 ? '#28a745' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {numAmount > 0 ? '+' : ''}{numAmount.toFixed(0)}
                          </span>
                        );
                      }}
                      width={100}
                    />
                    <Table.Column
                      title="余额"
                      dataIndex="balance_after"
                      render={(balance) => parseFloat(balance || 0).toFixed(0)}
                      width={100}
                    />
                    <Table.Column
                      title="描述"
                      dataIndex="description"
                      ellipsis
                    />
                    <Table.Column
                      title="备注"
                      dataIndex="remark"
                      render={(text) => text || '-'}
                      ellipsis
                    />
                  </Table>
                </div>
              )
            }
          ]}
        />
      </Modal>      
    </List>
  );
};
