"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChangeEventHandler, useState } from "react";
import { message } from "react-message-popup";

export default function CommaSeparatedLinkStringPage() {
  return (
    <>
      <CommaSeparatedLinkString />
    </>
  );
}

const CommaSeparatedLinkString = () => {
  const [needChangeValue, setNeedChangeValue] = useState("");
  const [changeValue, setChangeValue] = useState("");
  const [splitValue, setSplitValue] = useState(",");

  const processValue = (
    value: string,
    op?: { type: string; fn: any },
    sp?: string
  ) => {
    const v1 = value.split("\n").filter((v) => !!v);
    if (op?.type === "map") {
      return v1.map(op.fn).join(sp || splitValue);
    }
    if (op?.type === "slice") {
      return v1.slice(op.fn).join(sp || splitValue);
    }
    return v1.join(sp || splitValue);
  };

  const onNeedChangeValue: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const value = e.target.value;
    setNeedChangeValue(value);
    setChangeValue(processValue(value));
  };

  const optionList = [
    {
      name: "加单引号",
      fn: () => {
        setChangeValue(
          processValue(needChangeValue, {
            type: "map",
            fn: (item: string) => `'${item}'`,
          })
        );
      },
    },
    {
      name: "加双引号",
      fn: () => {
        setChangeValue(
          processValue(needChangeValue, {
            type: "map",
            fn: (item: string) => `"${item}"`,
          })
        );
      },
    },
    {
      name: "去除第一个",
      fn: () => {
        setChangeValue(processValue(needChangeValue, { type: "slice", fn: 1 }));
      },
    },
    {
      name: "每行一个",
      fn: () => {
        setChangeValue(
          processValue(needChangeValue, undefined, splitValue + "\n")
        );
      },
    },
    {
      name: "去除引号",
      fn: () => {
        setChangeValue(
          processValue(needChangeValue, {
            type: "map",
            fn: (item: string) => item.replace(/['"]/g, ""),
          })
        );
      },
    },
    {
      name: "复制",
      fn: () => {
        navigator.clipboard.writeText(changeValue);
        message.success("复制成功");
      },
    },
    {
      name: "清空",
      fn: () => {
        setNeedChangeValue("");
        setChangeValue("");
      },
    },
  ];
  return (
    <div className="text-xs mobile-container">
      <Textarea
        className="w-full rounded p-2 text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={10}
        name=""
        id=""
        value={needChangeValue}
        onChange={onNeedChangeValue}
        placeholder="请输入需要处理的文本..."
      ></Textarea>
      
      <div className="my-5 flex flex-col sm:flex-row justify-start items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            className="w-[50px] rounded text-base border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={splitValue}
            onChange={(e) => setSplitValue(e.target.value)}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">分隔符</span>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {optionList.map((item) => (
            <Button
              key={item.name}
              className="text-sm sm:text-base px-3 py-2 touch-feedback min-h-[44px] min-w-[44px]"
              onClick={item.fn}
              variant={item.name === "复制" ? "default" : "outline"}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>
      
      <Textarea
        className="w-full rounded p-2 text-base border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
        rows={10}
        name=""
        id=""
        value={changeValue}
        readOnly
        placeholder="处理结果将显示在这里..."
      ></Textarea>
    </div>
  );
};
