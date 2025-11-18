import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const Product4SephoraShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>主键:</Text>
      <Text>
        {
          record?.id
        }
      </Text>
      <br />
      <Text strong>产品ID:</Text>
      <Text>
        {
          record?.productId
        }
      </Text>
      <br />
      <Text strong>SKUID:</Text>
      <Text>
        {
          record?.skuId
        }
      </Text>
      <br />
      <Text strong>产品名称:</Text>
      <Text>
        {
          record?.productName
        }
      </Text>
      <br />
      <Text strong>价格:</Text>
      <Text>
        {
          record?.listPrice
        }
      </Text>
      <br />
      <Text strong>规格:</Text>
      <Text>
        {
          record?.variationType
        }
      </Text>
      <br />
      <Text strong>规格名称:</Text>
      <Text>
        {
          record?.variationTypeDisplayName
        }
      </Text>
      <br />
      <Text strong>规格值:</Text>
      <Text>
        {
          record?.variationValue
        }
      </Text>
      <br />
      <Text strong>图片:</Text>
      <br />
      {record?.images ? (
        (() => {
          try {
            const imgs = JSON.parse(record.images);
            return Array.isArray(imgs)
              ? imgs.map((image: any, index: number) => (
                  <img
                    key={index}
                    src={image.imageUrl}
                    alt={`image-${index}`}
                    style={{ maxWidth: 200, marginRight: 8, marginBottom: 8 }}
                  />
                ))
              : null;
          } catch {
            return <img src={record.images} alt="product" style={{ maxWidth: 200 }} />;
          }
        })()
      ) : (
        <span>-</span>
      )}
      <br />
    </Show>
  );
};