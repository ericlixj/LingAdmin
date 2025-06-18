import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import dataProvider from "../../dataProvider";

const { Text } = Typography;

export const ShopShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [appName, setAppName] = useState<string>("");
  const [loadingAppName, setLoadingAppName] = useState(false);

  useEffect(() => {
    if (record?.app_code) {
      setLoadingAppName(true);
      dataProvider
        .getList({
          resource: "app",
          pagination: { pageSize: 100, current: 1 },
        })
        .then(({ data }) => {
          const app = data.find((item: any) => item.code === record.app_code);
          setAppName(app ? app.name : record.app_code);
        })
        .finally(() => setLoadingAppName(false));
    }
  }, [record?.app_code, dataProvider]);

  return (
    <Show isLoading={isLoading}>
      <Text strong>ID: </Text>
      <Text>{record?.id}</Text>
      <br />

      <Text strong>店铺编码: </Text>
      <Text>{record?.code}</Text>
      <br />

      <Text strong>店铺名称: </Text>
      <Text>{record?.name}</Text>
      <br />

      <Text strong>应用编码: </Text>
      {loadingAppName ? <Spin size="small" /> : <Text>{appName}</Text>}
      <br />

      <Text strong>授权 Token: </Text>
      <Text>{record?.access_token || "-"}</Text>
      <br />

      <Text strong>刷新 Token: </Text>
      <Text>{record?.refresh_token || "-"}</Text>
      <br />

      <Text strong>店铺描述: </Text>
      <Text>{record?.description || "-"}</Text>
    </Show>
  );
};
