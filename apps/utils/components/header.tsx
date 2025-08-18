"use client";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const Header: React.FC<any> = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const TAB_LIST = [
    { name: "逗号分隔链接字符串", path: "/" },
    { name: "eBay图片链接转换", path: "/ebay-image-converter" },
    { name: "批量修改文件后缀名", path: "/file-extension-changer" },
    { name: "地图经纬度转换", path: "/map-convert" },
    { name: "图片预览", path: "/image-preview" },
    { name: "URL Decode&Encode", path: "/url-decode-encode" },
    { name: "颜色值转换", path: "/color-convert" },
    { name: "正则表达式提取文本", path: "/regex-extract-text" },
  ];

  return (
    <nav
      className="p-4 shadow-lg bg-background -mx-5 mb-10 text-sm border-b"
    >
      <div className="flex justify-between items-center">
        <ul className="flex space-x-6">
          {TAB_LIST.map((item) => (
            <li
              key={item.name}
              className={`cursor-pointer transition duration-300 ${pathname === item.path && "text-yellow-300"} ${"text-foreground hover:text-yellow-600"}`}
              onClick={() => router.push(item.path)}
            >
              {item.name}
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Header;
