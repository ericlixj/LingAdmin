import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Image } from "antd";
import dayjs from "dayjs";
import { getProxyImageUrl } from "../../utils/imageProxy";

const { Text } = Typography;

export const StudyKnowledgeNodeShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>pk:</Text>
      <Text>
        {
          record?.id
        }
      </Text>
      <br />
      <Text strong>关联exam的id:</Text>
      <Text>
        {
          record?.exam_id
        }
      </Text>
      <br />
      <Text strong>code:</Text>
      <Text>
        {
          record?.code
        }
      </Text>
      <br />
      <Text strong>标题:</Text>
      <Text>
        {
          record?.title
        }
      </Text>
      <br />
      <Text strong>描述:</Text>
      <Text>
        {
          record?.description
        }
      </Text>
      <br />
      <Text strong>importance:</Text>
      <Text>
        {
          [{"label": "\u9ad8", "value": "high"}, {"label": "\u4e2d", "value": "mid"}, {"label": "\u4f4e", "value": "low"}].find(opt => opt.value === record?.importance)?.label || record?.importance
        }
      </Text>
      <br />
      <Text strong>图片:</Text>
      <br />
      {record?.image_url ? (
        <div style={{ marginTop: "8px" }}>
          <Image
            src={getProxyImageUrl(record.image_url)}
            alt={record?.title || "知识点图片"}
            style={{ maxWidth: "400px", maxHeight: "400px" }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvqVx1emZM3FeB9T4llBQV4nFictyt5PwDxepNyUV4MwHjCy0pElBsVe8dA1HfRg8I7HhCwB3IewG5QfEaInALkOgB3QL2FyBYiBkD6AqwiwG3gQ6AKhFhCfC7MQk3MQk7aHhTeBB4X3haDPCcUZBYlq3q2DxLBUktUKHpvKXpJaBYnfxGrFwM0t7cyFXJTspXUO+HYwrspjJChgOGEpVaxSYWHQKA4L1damfM9LwygU9bKwg+pX1PAcfeh4nB2BiQWHRFgMD0eEDPXcGYFjzJwPBYLWhNPjBxTrtwsFNgUFi5LbWD8UxPSlGRoY9hTgPDvYJACxK1Gu8pvAsv0jwB/yzE4Ftgf8aQ4MAbvW4Bx75jMPjKe78b28H///fHMzA/v+u499gPzfmYH5+B3n4HpD4jQH8Kvz3YW5joR8B8O9E8P8I8L//+xf4//9PzQwM/w4A8fwJ7XqjjskdY2IAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
          <br />
          <Text type="secondary" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
            <a href={record.image_url} target="_blank" rel="noopener noreferrer">查看原图</a>
          </Text>
        </div>
      ) : (
        <Text type="secondary" style={{ marginTop: "8px", display: "block" }}>暂无图片</Text>
      )}
      <br />
    </Show>
  );
};