"use client";

import { useState } from "react";

export default function EbayImageConverter() {
  const [inputUrls, setInputUrls] = useState("");
  const [outputUrls, setOutputUrls] = useState("");

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
  };

  const clearAll = () => {
    setInputUrls("");
    setOutputUrls("");
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
        <h1 className="text-3xl font-bold mb-2">eBay图片链接转换器</h1>
        <p className="text-muted-foreground">
          支持HTML img标签和纯链接，将eBay图片从webp格式转换为jpg格式
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              输入链接 (每行一个)
            </label>
            <textarea
              placeholder='<img src="https://i.ebayimg.com/images/g/kUYAAOSwzfZoO02Q/s-l1600.webp"/>'
              value={inputUrls}
              onChange={(e) => setInputUrls(e.target.value)}
              rows={8}
              className="w-full p-3 border rounded-md font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={convertUrls}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              转换链接
            </button>
            <button
              onClick={loadExample}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              加载示例
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              清空
            </button>
          </div>
        </div>

        {outputUrls && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">转换结果</label>
              <textarea
                value={outputUrls}
                readOnly
                rows={8}
                className="w-full p-3 border rounded-md font-mono text-sm"
              />
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(outputUrls)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              复制到剪贴板
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
