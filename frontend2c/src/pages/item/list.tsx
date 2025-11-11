// src/pages/item/list.tsx
import React, { useState, useEffect } from "react";
import { Input, Button, Typography, Card, Modal, Select } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { useTranslate } from "@refinedev/core";
import i18nProvider from "../../i18n/i18nProvider";
import axiosInstance from "../../utils/axiosInstance";
import PostalCodeModal from "../../components/common/PostalCodeModal";

export const ItemList: React.FC = () => {
    const t = useTranslate();

    const [products, setProducts] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [zipCode, setZipCode] = useState<string | null>(null);
    const [isZipModalVisible, setIsZipModalVisible] = useState(false);
    const [language, setLanguage] = useState<"zh" | "hk" | "en">(
        (localStorage.getItem("userLang") as "zh" | "hk" | "en") ||
        (navigator.language.startsWith("zh") ? "zh" : "en")
    );

    const PAGE_SIZE = 20;

    useEffect(() => {
        const cachedZip = localStorage.getItem("userZipCode");
        const cachedLang = localStorage.getItem("userLang") as "zh" | "hk" | "en" | null;

        if (cachedLang) setLanguage(cachedLang);
        if (cachedZip) {
            setZipCode(cachedZip);
            fetchProducts(cachedZip, searchQuery, 0, PAGE_SIZE, true, cachedLang || language);
        } else {
            setIsZipModalVisible(true);
        }
    }, []);

    const fetchProducts = async (
        zip: string,
        query: string,
        start: number,
        end: number,
        reset: boolean = false,
        lang: "zh" | "hk" | "en" = "zh"
    ) => {
        if (!zip) return;
        try {
            const res = await axiosInstance.get("/flyerDetails/search", {
                params: { q: query, _start: start, _end: end, zip_code: zip, lang },
            });
            const newData = res.data.data || [];
            setProducts((prev) => (reset ? newData : [...prev, ...newData]));
            setHasMore(newData.length === end - start);
        } catch (error) {
            console.error("搜索失败", error);
        }
    };

    const handleZipSubmit = () => {
        if (zipInput.trim()) {
            localStorage.setItem("userZipCode", zipInput.trim());
            setZipCode(zipInput.trim());
            setIsZipModalVisible(false);
            fetchProducts(zipInput.trim(), searchQuery, 0, PAGE_SIZE, true, language);
        }
    };

    const handleModifyZip = () => {
        setIsZipModalVisible(true);
    };

    const handleSearch = (val: string) => {
        setSearchQuery(val);
        if (zipCode) fetchProducts(zipCode, val, 0, PAGE_SIZE, true, language);
    };

    const fetchMore = () => {
        if (zipCode)
            fetchProducts(zipCode, searchQuery, products.length, products.length + PAGE_SIZE, false, language);
    };

    const handleLanguageChange = async (val: "zh" | "hk" | "en") => {
        await i18nProvider.changeLocale(val);
        localStorage.setItem("userLang", val);
        setLanguage(val);
        if (zipCode) fetchProducts(zipCode, searchQuery, 0, PAGE_SIZE, true, val);
    };

    return (
        <div style={{ padding: 16 }}>
            {/* 顶部：邮编 + 语言选择 横向布局 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
                {/* 当前邮编 */}
                {zipCode && (
                    <Typography.Text>
                        {t("productList.current_zip")}:{" "}
                        <a onClick={handleModifyZip} style={{ textDecoration: "underline" }}>
                            {zipCode}
                        </a>
                    </Typography.Text>
                )}

                {/* 语言切换下拉 */}
                <Select
                    value={language}
                    onChange={(val) => handleLanguageChange(val as "zh" | "hk" | "en")}
                    style={{ minWidth: 120 }}
                >
                    <Select.Option value="zh">中文</Select.Option>
                    <Select.Option value="hk">繁體</Select.Option>
                    <Select.Option value="en">English</Select.Option>
                </Select>
            </div>

            {/* 邮编输入/修改弹窗 */}
            <PostalCodeModal
            visible={isZipModalVisible}
            initialValue={zipCode || ""}
            onConfirm={(zip) => {
                localStorage.setItem("userZipCode", zip);
                setZipCode(zip);
                setIsZipModalVisible(false);
                fetchProducts(zip, searchQuery, 0, PAGE_SIZE, true, language);
            }}
            onCancel={() => setIsZipModalVisible(false)}
            />

            {/* 搜索框 */}
            <Input
                placeholder={t("productList.search_placeholder")}
                allowClear
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                style={{ marginBottom: 16 }}
            />

            {/* 商品列表 */}
            <InfiniteScroll
                dataLength={products.length}
                next={fetchMore}
                hasMore={hasMore}
                loader={<h4>{t("productList.loading")}</h4>}
            >
                {products.map((item) => (
                    <Card
                        key={item.id}
                        hoverable
                        style={{ marginBottom: 16 }}
                        cover={
                            <div
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    margin: "0 auto",
                                    overflow: "hidden",
                                }}
                            >
                                <img
                                    alt={item.title}
                                    src={item.cutout_image_url}
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                            </div>
                        }
                    >
                        <Card.Meta
                            title={item.title}
                            description={
                                <div>
                                    <div>{t("productList.store")}: {item.merchant}</div>
                                    <div>{t("productList.price")}: {item.price || t("productList.price_na")}</div>
                                    <div>
                                        {t("productList.valid")}: {item.valid_from?.split("T")[0]} ~ {item.valid_to?.split("T")[0]}
                                    </div>
                                </div>
                            }
                        />
                    </Card>
                ))}
            </InfiniteScroll>
        </div>
    );
};
