import React, { useEffect, useState } from "react";
import { Modal, Tree, Button, message } from "antd";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface CodePreviewModalProps {
    visible: boolean;
    onClose: () => void;
    files: { [key: string]: string };
    selectedFile: string;
    setSelectedFile: (file: string) => void;
    loading: boolean;
    moduleName: string;
}

interface TreeNode {
    title: string;
    key: string;
    children?: TreeNode[];
    isLeaf?: boolean;
}

// 辅助函数：把路径数组插入树结构
function insertPath(tree: TreeNode[], pathSegments: string[], fullPath: string, depth = 0) {
  if (depth >= pathSegments.length) return;

  const segment = pathSegments[depth];
  let node = tree.find((n) => n.title === segment);
  if (!node) {
    node = {
      title: segment,
      key: fullPath.split("/").slice(0, depth + 1).join("/"),
      children: [],
    };
    tree.push(node);
  }

  if (depth === pathSegments.length - 1) {
    node.isLeaf = true;
    node.children = undefined;
    if (segment.includes("_tmp")) {
      (node as any).className = "tree-node-tmp";
    }
  } else {
    if (!node.children) node.children = [];
    insertPath(node.children, pathSegments, fullPath, depth + 1);
  }
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  visible,
  onClose,
  files,
  selectedFile,
  setSelectedFile,
  loading,
  moduleName,
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    // 构造树形结构
    const tree: TreeNode[] = [];
    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/");
      insertPath(tree, parts, filePath);
    });
    setTreeData(tree);
  }, [files]);

  // 构造所有展开 key 列表，树数据变更时触发
  useEffect(() => {
    function collectKeys(nodes: TreeNode[]): string[] {
      let keys: string[] = [];
      nodes.forEach((node) => {
        keys.push(node.key);
        if (node.children) {
          keys = keys.concat(collectKeys(node.children));
        }
      });
      return keys;
    }
    const allKeys = collectKeys(treeData);
    setExpandedKeys(allKeys);
  }, [treeData]);

    // 选择树节点回调
    const onSelect = (keys: React.Key[]) => {
        if (keys.length > 0) {
        const key = keys[0].toString();
        // 确保选中的是叶子文件节点
        if (files[key]) {
            setSelectedFile(key);
        }
        }
    };

    // 树展开/收起回调
    const onExpand = (keys: React.Key[]) => {
        setExpandedKeys(keys);
    };

    const handleCopyCurrentFile = async () => {
        if (!selectedFile || !files[selectedFile]) {
        message.warning("没有可复制的代码");
        return;
        }
        try {
        await navigator.clipboard.writeText(files[selectedFile]);
        message.success(`文件 "${selectedFile}" 代码已复制`);
        } catch (error) {
        message.error("复制失败，请手动复制");
        }
    };

    // 代码语言简易判定，根据后缀
    const getLanguage = (filename: string) => {
    if (!filename) return "text";
    if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
    if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".html") || filename.endsWith(".jinja2")) return "html";
    if (filename.endsWith(".css")) return "css";
    return "text";
    };

    // 下载所有文件为zip
    const handleDownloadZip = async () => {
        if (!files || Object.keys(files).length === 0) {
            message.warning("没有可下载的文件");
            return;
        }
        const zip = new JSZip();
        Object.entries(files).forEach(([path, content]) => {
            zip.file(path, content);
        });
        const blob = await zip.generateAsync({ type: "blob" });

        // ✅ 格式化时间戳
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

        const filename = `${moduleName || "code_preview"}_${timestamp}.zip`;
        saveAs(blob, filename);
    };

    return (
    <Modal
        open={visible}
        title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>代码预览</span>
            <Button onClick={handleDownloadZip} type="primary" size="small" style={{ marginRight: 20 }} >
            下载全部
            </Button>
            <Button onClick={handleCopyCurrentFile} type="primary" style={{ marginRight: 20 }} size="small">
              复制当前文件
            </Button>            
        </div>
        }
        onCancel={onClose}
        footer={null}
        width={1200}
        style={{}}
        styles={{body:{ display: "flex", height: "70vh", padding: 0 }}}
    >
        <div
        style={{
            width: "30%",
            borderRight: "1px solid #ddd",
            overflowY: "auto",
            backgroundColor: "#fafafa",
            padding: 8,
        }}
        >
        <Tree
            treeData={treeData}
            selectedKeys={[selectedFile]}
            onSelect={onSelect}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            showIcon={false}
            titleRender={(nodeData: any) => (
                <span
                style={{
                    color: nodeData.className === "tree-node-tmp" ? "red" : "inherit",
                }}
                >
                {nodeData.title}
                </span>
            )}
        />
        </div>

        <div
        style={{
            width: "70%",
            padding: 16,
            overflowY: "auto",
            background: "#f5f5f5",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
        }}
        >
        {loading ? (
            "加载中..."
        ) : selectedFile && files[selectedFile] ? (
            <SyntaxHighlighter
            language={getLanguage(selectedFile)}
            style={docco}
            showLineNumbers
            wrapLongLinesPreTag="div" // 替换默认的 pre 为 div，避免样式干扰复制
            customStyle={{
                backgroundColor: "#f5f5f5",
                fontFamily: "monospace",
                whiteSpace: "pre", // 保留缩进但避免软换行
                wordBreak: "normal",
                overflowX: "auto",
            }}
            >
            {files[selectedFile]}
            </SyntaxHighlighter>
        ) : (
            <div style={{ padding: 16, color: "#999" }}>无内容</div>
        )}
        </div>
    </Modal>
    );
};
