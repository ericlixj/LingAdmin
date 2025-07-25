import { Show } from "@refinedev/antd";
import { useShow, useTranslate } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const PermissionShow = () => {
  const t = useTranslate();
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>ID:</Text>
      <Text>{record?.id}</Text>
      <br />

      <Text strong>{t("permission.fields.code")}:</Text>
      <Text>{record?.code}</Text>
      <br />

      <Text strong>{t("permission.fields.name")}:</Text>
      <Text>{record?.name}</Text>
      <br />

      <Text strong>{t("permission.fields.description")}:</Text>
      <Text>{record?.description}</Text>
      <br />

      <Text strong>{t("common.fields.creator")}:</Text>
      <Text>{record?.creator}</Text>
      <br />

      <Text strong>{t("common.fields.updater")}:</Text>
      <Text>{record?.updater}</Text>
      <br />

      <Text strong>{t("common.fields.create_time")}:</Text>
      <Text>{record?.create_time}</Text>
      <br />

      <Text strong>{t("common.fields.update_time")}:</Text>
      <Text>{record?.update_time}</Text>
    </Show>
  );
};
