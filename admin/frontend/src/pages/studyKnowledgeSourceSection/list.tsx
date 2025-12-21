import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Input, Select, Space, Table, Modal, Typography, Descriptions } from "antd";
import { useState, useMemo } from "react";
import dayjs from "dayjs";

const { Text, Link } = Typography;

// 知识点明细 Modal
interface KnowledgeNodeDetail {
  id: number;
  code: string;
  title: string;
  description: string;
  importance: string;
}

// 章节明细 Modal
interface SourceSectionDetail {
  id: number;
  chapter: string;
  section: string;
  page_start: number;
  page_end: number;
  anchor_text: string;
}

export const StudyKnowledgeSourceSectionList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  // 获取所有知识点数据
  const { data: knowledgeNodesData } = useList({
    resource: "studyKnowledgeNode",
    pagination: { pageSize: 1000 },
  });

  // 获取所有章节数据
  const { data: sourceSectionsData } = useList({
    resource: "studySourceSection",
    pagination: { pageSize: 1000 },
  });

  // 创建 ID -> 数据的映射
  const knowledgeNodeMap = useMemo(() => {
    const map: Record<number, KnowledgeNodeDetail> = {};
    knowledgeNodesData?.data?.forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [knowledgeNodesData]);

  const sourceSectionMap = useMemo(() => {
    const map: Record<number, SourceSectionDetail> = {};
    sourceSectionsData?.data?.forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [sourceSectionsData]);

  // Modal 状态
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeNodeDetail | null>(null);
  const [selectedSection, setSelectedSection] = useState<SourceSectionDetail | null>(null);

  const handleKnowledgeClick = (id: number) => {
    const knowledge = knowledgeNodeMap[id];
    if (knowledge) {
      setSelectedKnowledge(knowledge);
      setKnowledgeModalVisible(true);
    }
  };

  const handleSectionClick = (id: number) => {
    const section = sourceSectionMap[id];
    if (section) {
      setSelectedSection(section);
      setSectionModalVisible(true);
    }
  };

  const importanceLabels: Record<string, string> = {
    high: "高",
    mid: "中",
    low: "低",
  };

  return (
    <>
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="id" title="ID" sorter />

          <Table.Column
            dataIndex="knowledge_node_id"
            title="知识点"
            render={(value) => {
              const knowledge = knowledgeNodeMap[value];
              if (knowledge) {
                return (
                  <Link onClick={() => handleKnowledgeClick(value)}>
                    {knowledge.code}
                  </Link>
                );
              }
              return value;
            }}
          />
          <Table.Column
            dataIndex="source_section_id"
            title="来源章节"
            render={(value) => {
              const section = sourceSectionMap[value];
              if (section) {
                const displayText = section.section 
                  ? `${section.chapter} - ${section.section}`
                  : section.chapter;
                return (
                  <Link onClick={() => handleSectionClick(value)}>
                    {displayText}
                  </Link>
                );
              }
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

      {/* 知识点明细 Modal */}
      <Modal
        title="知识点明细"
        open={knowledgeModalVisible}
        onCancel={() => setKnowledgeModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedKnowledge && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{selectedKnowledge.id}</Descriptions.Item>
            <Descriptions.Item label="Code">{selectedKnowledge.code}</Descriptions.Item>
            <Descriptions.Item label="标题">{selectedKnowledge.title}</Descriptions.Item>
            <Descriptions.Item label="描述">
              <div style={{ maxHeight: 200, overflow: "auto" }}>
                {selectedKnowledge.description}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="重要性">
              {importanceLabels[selectedKnowledge.importance] || selectedKnowledge.importance}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 章节明细 Modal */}
      <Modal
        title="来源章节明细"
        open={sectionModalVisible}
        onCancel={() => setSectionModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedSection && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{selectedSection.id}</Descriptions.Item>
            <Descriptions.Item label="章节">{selectedSection.chapter}</Descriptions.Item>
            <Descriptions.Item label="段落">{selectedSection.section}</Descriptions.Item>
            <Descriptions.Item label="起始页">{selectedSection.page_start}</Descriptions.Item>
            <Descriptions.Item label="结束页">{selectedSection.page_end}</Descriptions.Item>
            <Descriptions.Item label="原文摘要">
              <div style={{ maxHeight: 200, overflow: "auto" }}>
                {selectedSection.anchor_text}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};
