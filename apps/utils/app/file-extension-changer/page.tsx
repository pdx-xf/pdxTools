"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { message } from "react-message-popup";
import {
  FolderOpen,
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
  Play,
  Video,
} from "lucide-react";

// 扩展HTMLInputElement类型以支持webkitdirectory属性
declare global {
  interface HTMLInputElement {
    webkitdirectory: boolean;
  }
}

interface FileInfo {
  name: string;
  oldExtension: string;
  newExtension: string;
  path: string;
}

export default function FileExtensionChangerPage() {
  return (
    <>
      <FileExtensionChanger />
    </>
  );
}

const FileExtensionChanger = () => {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [oldExtensions, setOldExtensions] = useState<string[]>([]);
  const [newExtension, setNewExtension] = useState<string>("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [extensionMode, setExtensionMode] = useState<"multiple">("multiple");
  const [userPlatform, setUserPlatform] = useState<
    "windows" | "mac" | "linux" | "unknown"
  >("unknown");
  const [availableExtensions, setAvailableExtensions] = useState<string[]>([]);
  const [showVideo, setShowVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检测用户平台
  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      return "windows";
    } else if (userAgent.includes("mac")) {
      return "mac";
    } else if (userAgent.includes("linux")) {
      return "linux";
    }
    return "unknown";
  };

  // 组件挂载时检测平台
  useEffect(() => {
    setUserPlatform(detectPlatform());
  }, []);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const folderPath = files[0].webkitRelativePath.split("/")[0];
      setSelectedFolder(folderPath);

      // 模拟获取文件夹内容（实际项目中需要后端支持）
      const mockFiles: FileInfo[] = [];
      const extensionsSet = new Set<string>();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf(".");
        const nameWithoutExt =
          lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        const ext =
          lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : "";

        // 只添加有后缀名的文件
        if (ext) {
          extensionsSet.add(ext.toLowerCase());
        }

        mockFiles.push({
          name: fileName,
          oldExtension: ext,
          newExtension: ext,
          path: file.webkitRelativePath,
        });
      }

      setFiles(mockFiles);

      // 自动设置可用的后缀名列表
      const extensionsArray = Array.from(extensionsSet).sort();
      setAvailableExtensions(extensionsArray);

      // 如果只有一个后缀名，自动选择它
      if (extensionsArray.length === 1) {
        setOldExtensions(extensionsArray);
      }
    }
  };

  const updateFileExtensions = () => {
    if (oldExtensions.length === 0 || !newExtension) {
      message.error("请选择要修改的后缀名和输入新后缀名");
      return;
    }

    const updatedFiles = files.map((file) => ({
      ...file,
      newExtension: oldExtensions.includes(file.oldExtension)
        ? newExtension
        : file.oldExtension,
    }));
    setFiles(updatedFiles);
    message.success("文件后缀名已更新");
  };

  const processFiles = async () => {
    if (files.length === 0) {
      message.error("请先选择文件夹");
      return;
    }

    setIsProcessing(true);

    try {
      if (previewMode) {
        // 预览模式：显示将要修改的文件
        setPreviewMode(false);
        message.success("预览完成，文件已准备就绪");
      } else {
        // 执行文件重命名预览
        const response = await fetch("/api/rename-files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldExtensions,
            newExtension,
            files: files.filter((f) => oldExtensions.includes(f.oldExtension)),
          }),
        });

        const result = await response.json();

        if (result.success) {
          message.success(
            result.message ||
              `文件重命名预览完成！成功: ${result.summary.successful} 个，失败: ${result.summary.failed} 个`
          );

          // 更新文件列表显示结果
          const updatedFiles = files.map((file) => {
            if (oldExtensions.includes(file.oldExtension)) {
              const renameResult = result.results.find(
                (r: any) => r.oldName === file.name
              );
              if (renameResult && renameResult.success) {
                return {
                  ...file,
                  name: renameResult.newName,
                  oldExtension: newExtension,
                  newExtension: newExtension,
                };
              }
            }
            return file;
          });
          setFiles(updatedFiles);
        } else {
          message.error(`重命名失败: ${result.error}`);
        }
      }
    } catch (error) {
      message.error("处理文件时出错");
      console.error("文件处理错误:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadScript = () => {
    // 根据平台选择要下载的脚本
    let scriptToDownload: "batch" | "powershell" | "shell" | "all" = "all";

    if (userPlatform === "windows") {
      scriptToDownload = "batch"; // Windows默认使用批处理脚本
    } else if (userPlatform === "mac" || userPlatform === "linux") {
      scriptToDownload = "shell";
    } else {
      scriptToDownload = "all"; // 未知平台下载所有脚本
    }

    // 创建Windows批处理脚本
    const batchScript = `@echo off
REM Batch script for bulk file extension renaming
REM Usage: Place this script in the folder containing files to rename

set new_ext=${newExtension}

echo Starting bulk file renaming...
echo Old extensions: ${oldExtensions.map((ext) => "." + ext).join(", ")}
echo New extension: .%new_ext%

${oldExtensions
  .map(
    (ext) => `
for %%f in (*.${ext}) do (
    if exist "%%f" (
        ren "%%f" "%%~nf.%new_ext%"
        echo Renamed: %%f -^> %%~nf.%new_ext%
    )
)`
  )
  .join("")}

echo.
echo Complete! All files with extensions ${oldExtensions.map((ext) => "." + ext).join(", ")} have been renamed to .%new_ext%
pause`;

    // 创建Linux/Mac shell脚本
    const shellScript = `#!/bin/bash
# 批量修改文件后缀名脚本
# 使用方法: 将此脚本放在需要修改的文件夹中运行

new_ext="${newExtension}"

echo "开始批量重命名文件..."
echo "旧后缀名: ${oldExtensions.map((ext) => "." + ext).join(", ")}"
echo "新后缀名: .$new_ext"

${oldExtensions
  .map(
    (ext) => `
for f in *.${ext}; do
    if [ -f "$f" ]; then
        new_name="\${f%.*}.$new_ext"
        mv "$f" "$new_name"
        echo "重命名: $f -> $new_name"
    fi
done`
  )
  .join("")}

echo ""
echo "完成！所有 ${oldExtensions.map((ext) => "." + ext).join(", ")} 文件已重命名为 .$new_ext"`;

    // 创建PowerShell脚本 (Windows推荐)
    const powershellScript = `# PowerShell script for bulk file extension renaming
# Usage: Place this script in the folder containing files to rename
# Run with: powershell -ExecutionPolicy Bypass -File rename_files.ps1

param(
    [string]$NewExtension = "${newExtension}"
)

$oldExtensions = @(${oldExtensions.map((ext) => `"${ext}"`).join(", ")})

Write-Host "Starting bulk file renaming..." -ForegroundColor Green
Write-Host "Old extensions: $($oldExtensions -join ', ')" -ForegroundColor Yellow
Write-Host "New extension: .$NewExtension" -ForegroundColor Yellow

$totalFiles = 0
$renamedFiles = 0

foreach ($ext in $oldExtensions) {
    $files = Get-ChildItem -Filter "*.$ext"
    $totalFiles += $files.Count
    
    if ($files.Count -eq 0) {
        Write-Host "No files found with extension .$ext" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Processing .$ext files..." -ForegroundColor Cyan
    
    foreach ($file in $files) {
        $newName = $file.BaseName + ".$NewExtension"
        try {
            Rename-Item -Path $file.FullName -NewName $newName
            Write-Host "Renamed: $($file.Name) -> $newName" -ForegroundColor Green
            $renamedFiles++
        }
        catch {
            Write-Host "Error renaming $($file.Name): $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Complete! Renamed $renamedFiles out of $totalFiles files to .$NewExtension" -ForegroundColor Green
Read-Host "Press Enter to continue"`;

    // 根据平台下载相应脚本
    if (scriptToDownload === "all") {
      // 下载所有脚本
      // 下载Windows批处理脚本 (UTF-8 with BOM)
      const batchBlob = new Blob(["\ufeff" + batchScript], {
        type: "text/plain;charset=utf-8",
      });
      const batchUrl = URL.createObjectURL(batchBlob);
      const batchLink = document.createElement("a");
      batchLink.href = batchUrl;
      batchLink.download = "rename_files.bat";
      document.body.appendChild(batchLink);
      batchLink.click();
      document.body.removeChild(batchLink);
      URL.revokeObjectURL(batchUrl);

      // 下载Linux/Mac shell脚本
      const shellBlob = new Blob([shellScript], { type: "text/plain" });
      const shellUrl = URL.createObjectURL(shellBlob);
      const shellLink = document.createElement("a");
      shellLink.href = shellUrl;
      shellLink.download = "rename_files.sh";
      document.body.appendChild(shellLink);
      shellLink.click();
      document.body.removeChild(shellLink);
      URL.revokeObjectURL(shellUrl);

      // 下载PowerShell脚本
      const psBlob = new Blob([powershellScript], {
        type: "text/plain;charset=utf-8",
      });
      const psUrl = URL.createObjectURL(psBlob);
      const psLink = document.createElement("a");
      psLink.href = psUrl;
      psLink.download = "rename_files.ps1";
      document.body.appendChild(psLink);
      psLink.click();
      document.body.removeChild(psLink);
      URL.revokeObjectURL(psUrl);
    } else if (scriptToDownload === "batch") {
      // 只下载Windows批处理脚本
      const batchBlob = new Blob(["\ufeff" + batchScript], {
        type: "text/plain;charset=utf-8",
      });
      const batchUrl = URL.createObjectURL(batchBlob);
      const batchLink = document.createElement("a");
      batchLink.href = batchUrl;
      batchLink.download = "rename_files.bat";
      document.body.appendChild(batchLink);
      batchLink.click();
      document.body.removeChild(batchLink);
      URL.revokeObjectURL(batchUrl);
    } else if (scriptToDownload === "powershell") {
      // 只下载PowerShell脚本
      const psBlob = new Blob([powershellScript], {
        type: "text/plain;charset=utf-8",
      });
      const psUrl = URL.createObjectURL(psBlob);
      const psLink = document.createElement("a");
      psLink.href = psUrl;
      psLink.download = "rename_files.ps1";
      document.body.appendChild(psLink);
      psLink.click();
      document.body.removeChild(psLink);
      URL.revokeObjectURL(psUrl);
    } else if (scriptToDownload === "shell") {
      // 只下载Shell脚本
      const shellBlob = new Blob([shellScript], { type: "text/plain" });
      const shellUrl = URL.createObjectURL(shellBlob);
      const shellLink = document.createElement("a");
      shellLink.href = shellUrl;
      shellLink.download = "rename_files.sh";
      document.body.appendChild(shellLink);
      shellLink.click();
      document.body.removeChild(shellLink);
      URL.revokeObjectURL(shellUrl);
    }

    // 根据平台显示相应的成功消息
    let successMessage = "";
    if (scriptToDownload === "batch") {
      successMessage = "Windows批处理脚本已下载";
    } else if (scriptToDownload === "powershell") {
      successMessage = "PowerShell脚本已下载";
    } else if (scriptToDownload === "shell") {
      successMessage = "Shell脚本已下载（Linux/Mac）";
    } else {
      successMessage = "所有平台脚本已下载";
    }

    message.success(successMessage);
  };

  const resetFiles = () => {
    setFiles([]);
    setSelectedFolder("");
    setOldExtensions([]);
    setNewExtension("");
    setAvailableExtensions([]);
    setPreviewMode(true);
    setShowVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          批量修改文件后缀名
        </h1>
        <p className="text-muted-foreground">
          选择文件夹，批量修改多种文件后缀名为统一格式
        </p>
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVideo(!showVideo)}
            className="flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            {showVideo ? "隐藏使用演示" : "观看使用演示"}
          </Button>
        </div>
      </div>

      {/* 视频演示区域 */}
      {showVideo && (
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Play className="w-5 h-5" />
            使用演示视频
          </h2>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              poster="/videos/video-poster.jpg"
            >
              <source
                src="/videos/a6e0bce67e22d26d04b016042ccc381a.mp4"
                type="video/mp4"
              />
              <source
                src="/videos/a6e0bce67e22d26d04b016042ccc381a.mp4"
                type="video/webm"
              />
              <track
                kind="subtitles"
                src="/videos/subtitles.vtt"
                srcLang="zh-CN"
                label="中文"
              />
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
                <div className="text-center space-y-4">
                  <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium">
                    您的浏览器不支持视频播放
                  </p>
                  <p className="text-sm text-muted-foreground">
                    请升级到最新版本或使用现代浏览器
                  </p>
                </div>
              </div>
            </video>
          </div>
                     <div className="text-sm text-muted-foreground space-y-2">
             <p>💡 提示：观看演示视频可以帮助您快速掌握使用方法</p>
             <p>🎥 视频说明：</p>
             <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
               <li>视频格式：MP4高清格式，支持所有现代浏览器</li>
               <li>播放控制：支持播放、暂停、音量调节、全屏等</li>
               <li>字幕支持：提供中文字幕，便于理解操作步骤</li>
               <li>响应式设计：在电脑、平板、手机上都能正常播放</li>
             </ul>
             <p>🔧 功能说明：</p>
             <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
               <li>智能后缀名检测：自动识别文件夹中的所有文件类型</li>
               <li>多后缀名选择：支持同时修改多种文件格式</li>
               <li>平台智能识别：自动下载适合您操作系统的脚本</li>
               <li>文件预览：在重命名前预览所有将要修改的文件</li>
             </ul>
           </div>
        </div>
      )}

      {/* 文件夹选择区域 */}
      <div className="bg-card p-6 rounded-lg border space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          选择文件夹
        </h2>

        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            {...({ webkitdirectory: true } as any)}
            multiple
            onChange={handleFolderSelect}
            className="flex-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="选择包含文件的文件夹"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            浏览文件夹
          </Button>
        </div>

        {selectedFolder && (
          <div className="text-sm text-muted-foreground">
            已选择文件夹:{" "}
            <span className="font-mono bg-muted px-2 py-1 rounded">
              {selectedFolder}
            </span>
            <span className="ml-4">包含 {files.length} 个文件</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          检测到平台:{" "}
          <span className="font-mono bg-muted px-2 py-1 rounded">
            {userPlatform === "windows"
              ? "Windows"
              : userPlatform === "mac"
                ? "macOS"
                : userPlatform === "linux"
                  ? "Linux"
                  : "未知"}
          </span>
          {userPlatform === "windows" && (
            <span className="ml-2 text-blue-600">推荐使用批处理脚本</span>
          )}
          {(userPlatform === "mac" || userPlatform === "linux") && (
            <span className="ml-2 text-green-600">推荐使用Shell脚本</span>
          )}
        </div>
      </div>

      {/* 后缀名设置区域 */}
      {files.length > 0 && (
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            设置文件后缀名
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">要修改的后缀名</label>

                {/* 显示可用的后缀名 */}
                {availableExtensions.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">
                        检测到的后缀名:
                      </div>
                      {availableExtensions.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              oldExtensions.length ===
                              availableExtensions.length
                            ) {
                              setOldExtensions([]);
                            } else {
                              setOldExtensions([...availableExtensions]);
                            }
                          }}
                          className="text-xs h-6 px-2"
                        >
                          {oldExtensions.length === availableExtensions.length
                            ? "取消全选"
                            : "全选"}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableExtensions.map((ext) => (
                        <Button
                          key={ext}
                          variant={
                            oldExtensions.includes(ext) ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            if (oldExtensions.includes(ext)) {
                              setOldExtensions(
                                oldExtensions.filter((e) => e !== ext)
                              );
                            } else {
                              setOldExtensions([...oldExtensions, ext]);
                            }
                          }}
                          className="text-xs h-7 px-2"
                        >
                          .{ext}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    type="text"
                    value={oldExtensions.join(", ")}
                    onChange={(e) => {
                      const extensions = e.target.value
                        .split(",")
                        .map((ext) => ext.trim())
                        .filter(Boolean);
                      setOldExtensions(extensions);
                    }}
                    placeholder="例如: jpg, png, gif (用逗号分隔)"
                    className="font-mono"
                  />
                  <div className="text-xs text-muted-foreground">
                    用逗号分隔多个后缀名，如: jpg, png, gif
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">新后缀名</label>
                <Input
                  type="text"
                  value={newExtension}
                  onChange={(e) => setNewExtension(e.target.value)}
                  placeholder="例如: webp"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={updateFileExtensions} className="flex-1">
              更新文件列表
            </Button>
            <Button variant="outline" onClick={downloadScript}>
              <Download className="w-4 h-4 mr-2" />
              下载脚本{" "}
              {userPlatform === "windows"
                ? "(Windows批处理)"
                : userPlatform === "mac" || userPlatform === "linux"
                  ? "(Linux/Mac Shell)"
                  : "(所有平台)"}
            </Button>
          </div>
        </div>
      )}

      {/* 文件列表预览 */}
      {files.length > 0 && (
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              文件列表预览
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFiles}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重置
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border text-sm ${
                    file.oldExtension !== file.newExtension
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-muted"
                  }`}
                >
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-mono">{file.oldExtension}</span>
                    {file.oldExtension !== file.newExtension && (
                      <>
                        <span className="mx-1">→</span>
                        <span className="font-mono text-green-600 dark:text-green-400">
                          {file.newExtension}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>
              {previewMode
                ? "预览模式：文件尚未实际重命名，点击下方按钮开始处理"
                : "文件已准备就绪，可以下载脚本执行重命名操作"}
            </span>
          </div>

          <Button
            onClick={processFiles}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : previewMode ? (
              "预览文件更改"
            ) : (
              "下载重命名脚本"
            )}
          </Button>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-muted/50 p-6 rounded-lg space-y-3">
        <h3 className="text-lg font-semibold">使用说明</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>1. 点击"浏览文件夹"选择包含需要修改后缀名的文件的文件夹</p>
          <p>2. 系统会自动检测并显示文件夹中所有可用的文件后缀名</p>
          <p>3. 选择要修改的文件类型（支持多种后缀名）</p>
          <p>4. 点击后缀名按钮选择要修改的文件类型，或手动输入后缀名</p>
          <p>5. 输入新的后缀名（不需要包含点号）</p>
          <p>6. 点击"更新文件列表"查看将要修改的文件</p>
          <p>7. 点击"预览文件更改"确认更改内容</p>
          <p>
            8.
            点击"下载重命名脚本"获取可执行的脚本文件（系统会自动选择适合您平台的脚本）
          </p>
          <p>9. 将脚本放在目标文件夹中运行，执行实际的文件重命名</p>
          <p className="text-blue-600 dark:text-blue-400">
            💡 Windows用户默认下载批处理脚本(.bat)，简单易用
          </p>
          <p className="text-amber-600 dark:text-amber-400">
            ⚠️ 注意：文件重命名操作不可逆，请确保已备份重要文件
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            💡
            提示：由于浏览器安全限制，实际的文件重命名需要通过下载的脚本在本地执行
          </p>
          <p className="text-green-600 dark:text-green-400">
            🎯 智能下载：系统会自动检测您的操作系统，只下载适合的脚本文件
          </p>
          <p className="text-purple-600 dark:text-purple-400">
            🔍
            智能检测：系统会自动扫描文件夹，识别所有可用的文件后缀名，无需手动输入
          </p>
                     <p className="text-orange-600 dark:text-orange-400">
             🎥 视频演示：点击"观看使用演示"按钮，观看高清操作演示视频
           </p>
        </div>
      </div>
    </div>
  );
};
