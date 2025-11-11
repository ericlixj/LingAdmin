import React, { useState } from "react";
import { Modal, Input, Button, Typography } from "antd";

interface PostalCodeModalProps {
    visible: boolean;
    initialValue?: string;
    onConfirm: (code: string) => void;
    onCancel: () => void;
}

const PostalCodeModal: React.FC<PostalCodeModalProps> = ({
    visible,
    initialValue = "",
    onConfirm,
    onCancel,
}) => {
    const [zipInput, setZipInput] = useState(initialValue);
    const [error, setError] = useState("");

    // 正则检查加拿大邮编格式
    const postalCodeRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.toUpperCase(); // 自动大写
        // 只保留字母和数字
        val = val.replace(/[^A-Z0-9]/g, "");

        // 自动加空格
        if (val.length > 3) {
            val = val.slice(0, 3) + " " + val.slice(3, 6);
        }

        // 限制最大长度 7
        if (val.length > 7) val = val.slice(0, 7);

        setZipInput(val);
        if (val.length === 7 && !postalCodeRegex.test(val)) {
            setError("邮编格式错误，应为 A1A 1A1");
        } else {
            setError("");
        }
    };

    const handleSubmit = () => {
        if (!postalCodeRegex.test(zipInput)) {
            setError("邮编格式错误，应为 A1A 1A1");
            return;
        }
        onConfirm(zipInput);
    };

    return (
        <Modal
            title="请输入邮编"
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
        >
            <Input
                placeholder="A1A 1A1"
                value={zipInput}
                onChange={handleChange}
                onPressEnter={handleSubmit}
                maxLength={7}
                style={{ marginBottom: 8, textTransform: "uppercase", fontWeight: 500 }}
            />
            {error && <Typography.Text type="danger">{error}</Typography.Text>}
            <Button type="primary" block onClick={handleSubmit} style={{ marginTop: 8 }}>
                确定
            </Button>
        </Modal>
    );
};

export default PostalCodeModal;
