import { Show } from "@refinedev/antd";
import { useShow, useTranslate } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const UserShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;
  const t = useTranslate();

  return (
    <Show isLoading={isLoading}>
      <Text strong>{t("common.fields.id")}:</Text>
      <Text>{record?.id}</Text>
      <br />

      <Text strong>{t("user.fields.email")}:</Text>
      <Text>{record?.email}</Text>
      <br />

      <Text strong>{t("user.fields.full_name")}:</Text>
      <Text>{record?.full_name}</Text>
      <br />

      <Text strong>{t("user.fields.is_active")}:</Text>
      <Text>{record?.is_active ? t("common.enums.yes") : t("common.enums.no")}</Text>
      <br />

      <Text strong>{t("user.fields.is_superuser")}:</Text>
      <Text>{record?.is_superuser ? t("common.enums.yes") : t("common.enums.no")}</Text>
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
