"use client";

import { useState } from "react";

export default function EbayImageConverter() {
  const [inputUrls, setInputUrls] = useState("");
  const [outputUrls, setOutputUrls] = useState("");
  const [convertedLinks, setConvertedLinks] = useState<string[]>([]);

  const convertUrls = () => {
    if (!inputUrls.trim()) return;

    const urls = inputUrls.split("\n").filter((url) => url.trim());
    const convertedUrls = urls.map((url) => {
      // 处理HTML img标签格式，转换为纯链接
      if (url.includes("<img src=")) {
        const match = url.match(/<img src="([^"]+)\.webp"/);
        if (match) {
          return `${match[1]}.jpg`;
        }
      }
      // 处理纯链接格式，直接转换扩展名
      return url.replace(/\.webp/g, ".jpg");
    });
    setOutputUrls(convertedUrls.join("\n"));
    setConvertedLinks(convertedUrls);
  };

  const clearAll = () => {
    setInputUrls("");
    setOutputUrls("");
    setConvertedLinks([]);
  };

  const loadExample = () => {
    const exampleUrls = `<img src="https://i.ebayimg.com/images/g/kUYAAOSwzfZoO02Q/s-l1600.webp"/>
<img src="https://i.ebayimg.com/images/g/gcoAAOSw54BoO06I/s-l1600.webp"/>
<img src="https://i.ebayimg.com/images/g/9h0AAOSwu~5oO02Q/s-l1600.webp"/>
https://i.ebayimg.com/images/g/Xr8AAOSw7vNoO02R/s-l1600.webp
https://i.ebayimg.com/images/g/f-0AAOSwipFoO02S/s-l1600.webp`;
    setInputUrls(exampleUrls);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          eBay图片链接转换器
        </h1>
        <p className="text-muted-foreground">
          支持HTML img标签和纯链接，将eBay图片从webp格式转换为jpg格式
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              输入链接 (每行一个)
            </label>
            <textarea
              placeholder='<img src="https://i.ebayimg.com/images/g/kUYAAOSwzfZoO02Q/s-l1600.webp"/>'
              value={inputUrls}
              onChange={(e) => setInputUrls(e.target.value)}
              rows={8}
              className="w-full p-3 border rounded-md font-mono text-sm bg-background text-foreground border-border focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={convertUrls}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              转换链接
            </button>
            <button
              onClick={loadExample}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors bg-background text-foreground"
            >
              加载示例
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors bg-background text-foreground"
            >
              清空
            </button>
          </div>
        </div>

        {outputUrls && (
          <div className="space-y-6">
            {/* 原始文本结果 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  转换结果 (文本格式)
                </label>
                <textarea
                  value={outputUrls}
                  readOnly
                  rows={8}
                  className="w-full p-3 border rounded-md font-mono text-sm bg-background text-foreground border-border"
                />
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(outputUrls)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                复制到剪贴板
              </button>
            </div>

            {/* 转换后的链接展示 */}
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                转换后的链接展示
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {convertedLinks.map((link, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="aspect-square mb-3 overflow-hidden rounded-md bg-muted">
                      <img
                        src={link}
                        alt={`转换后的图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='14'%3E图片加载失败%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {link}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(link)}
                          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                          复制链接
                        </button>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors text-foreground"
                        >
                          打开链接
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
