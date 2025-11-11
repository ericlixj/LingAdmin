import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const FlyerDetailsShow = () => {
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
      <Text strong>ItemID:</Text>
      <Text>
        {
          record?.item_id
        }
      </Text>
      <br />
      <Text strong>名称:</Text>
      <Text>
        {
          record?.name
        }
      </Text>
      <br />
      <Text strong>品牌:</Text>
      <Text>
        {
          record?.brand
        }
      </Text>
      <br />
      <Text strong>开始有效期:</Text>
      <Text>
        {
          record?.valid_from
        }
      </Text>
      <br />
      <Text strong>结束有效期:</Text>
      <Text>
        {
          record?.valid_to
        }
      </Text>
      <br />
      <Text strong>截至有效期:</Text>
      <Text>
        {
          record?.available_to
        }
      </Text>
      <br />
      <Text strong>图片地址:</Text>
      <Text>
        {
          record?.cutout_image_url
        }
      </Text>
      <br />
      <Text strong>价格:</Text>
      <Text>
        {
          record?.price
        }
      </Text>
      <br />
      <Text strong>传单ID:</Text>
      <Text>
        {
          record?.flyer_id
        }
      </Text>
      <br />
      <Text strong>商家ID:</Text>
      <Text>
        {
          record?.merchant_id
        }
      </Text>
      <br />
      <Text strong>商家名:</Text>
      <Text>
        {
          record?.merchant
        }
      </Text>
      <br />
      <Text strong>名称_简体中文:</Text>
      <Text>
        {
          record?.cn_name
        }
      </Text>
      <br />
      <Text strong>名称_繁体中文:</Text>
      <Text>
        {
          record?.hk_name
        }
      </Text>
      <br />      
    </Show>
  );
};