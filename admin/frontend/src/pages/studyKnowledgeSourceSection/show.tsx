import { Show } from "@refinedev/antd";
import { useShow, useOne } from "@refinedev/core";
import { Typography, Descriptions, Spin } from "antd";
import dayjs from "dayjs";

const { Text, Link } = Typography;

export const StudyKnowledgeSourceSectionShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  // 获取关联的知识点数据
  const { data: knowledgeData, isLoading: knowledgeLoading } = useOne({
    resource: "studyKnowledgeNode",
    id: record?.knowledge_node_id,
    queryOptions: {
      enabled: !!record?.knowledge_node_id,
    },
  });

  // 获取关联的章节数据
  const { data: sectionData, isLoading: sectionLoading } = useOne({
    resource: "studySourceSection",
    id: record?.source_section_id,
    queryOptions: {
      enabled: !!record?.source_section_id,
    },
  });

  const knowledge = knowledgeData?.data;
  const section = sectionData?.data;

  const importanceLabels: Record<string, string> = {
    high: "高",
    mid: "中",
    low: "低",
  };

  return (
    <Show isLoading={isLoading}>
      <Descriptions column={1} bordered title="映射信息">
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
      </Descriptions>

      <br />
      
      <Descriptions column={1} bordered title="知识点">
        {knowledgeLoading ? (
          <Descriptions.Item label="加载中"><Spin /></Descriptions.Item>
        ) : knowledge ? (
          <>
            <Descriptions.Item label="ID">{knowledge.id}</Descriptions.Item>
            <Descriptions.Item label="Code">{knowledge.code}</Descriptions.Item>
            <Descriptions.Item label="标题">{knowledge.title}</Descriptions.Item>
            <Descriptions.Item label="描述">
              <div style={{ maxHeight: 150, overflow: "auto" }}>
                {knowledge.description}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="重要性">
              {importanceLabels[knowledge.importance] || knowledge.importance}
            </Descriptions.Item>
          </>
        ) : (
          <Descriptions.Item label="knowledge_node_id">{record?.knowledge_node_id}</Descriptions.Item>
        )}
      </Descriptions>

      <br />

      <Descriptions column={1} bordered title="来源章节">
        {sectionLoading ? (
          <Descriptions.Item label="加载中"><Spin /></Descriptions.Item>
        ) : section ? (
          <>
            <Descriptions.Item label="ID">{section.id}</Descriptions.Item>
            <Descriptions.Item label="章节">{section.chapter}</Descriptions.Item>
            <Descriptions.Item label="段落">{section.section}</Descriptions.Item>
            <Descriptions.Item label="起始页">{section.page_start}</Descriptions.Item>
            <Descriptions.Item label="结束页">{section.page_end}</Descriptions.Item>
            <Descriptions.Item label="原文摘要">
              <div style={{ maxHeight: 150, overflow: "auto" }}>
                {section.anchor_text}
              </div>
            </Descriptions.Item>
          </>
        ) : (
          <Descriptions.Item label="source_section_id">{record?.source_section_id}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
