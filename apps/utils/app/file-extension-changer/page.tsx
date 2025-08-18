"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { message } from "react-message-popup";
import { FolderOpen, FileText, RefreshCw, Download, AlertCircle } from "lucide-react";

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
  const [oldExtension, setOldExtension] = useState<string>("");
  const [newExtension, setNewExtension] = useState<string>("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const folderPath = files[0].webkitRelativePath.split('/')[0];
      setSelectedFolder(folderPath);
      
      // 模拟获取文件夹内容（实际项目中需要后端支持）
      const mockFiles: FileInfo[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : '';
        
        mockFiles.push({
          name: fileName,
          oldExtension: ext,
          newExtension: ext,
          path: file.webkitRelativePath
        });
      }
      setFiles(mockFiles);
    }
  };

  const updateFileExtensions = () => {
    if (!oldExtension || !newExtension) {
      message.error("请输入旧后缀名和新后缀名");
      return;
    }

    const updatedFiles = files.map(file => ({
      ...file,
      newExtension: file.oldExtension === oldExtension ? newExtension : file.oldExtension
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
         const response = await fetch('/api/rename-files', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             oldExtension,
             newExtension,
             files: files.filter(f => f.oldExtension === oldExtension)
           })
         });

        const result = await response.json();
        
                 if (result.success) {
           message.success(result.message || `文件重命名预览完成！成功: ${result.summary.successful} 个，失败: ${result.summary.failed} 个`);
          
          // 更新文件列表显示结果
          const updatedFiles = files.map(file => {
            if (file.oldExtension === oldExtension) {
              const renameResult = result.results.find((r: any) => r.oldName === file.name);
              if (renameResult && renameResult.success) {
                return {
                  ...file,
                  name: renameResult.newName,
                  oldExtension: newExtension,
                  newExtension: newExtension
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
      console.error('文件处理错误:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadScript = () => {
         // 创建Windows批处理脚本
     const batchScript = `@echo off
REM Batch script for bulk file extension renaming
REM Usage: Place this script in the folder containing files to rename

set old_ext=${oldExtension}
set new_ext=${newExtension}

echo Starting bulk file renaming...
echo Old extension: .%old_ext%
echo New extension: .%new_ext%

for %%f in (*.%old_ext%) do (
    if exist "%%f" (
        ren "%%f" "%%~nf.%new_ext%"
        echo Renamed: %%f -^> %%~nf.%new_ext%
    )
)

echo.
echo Complete! All .%old_ext% files have been renamed to .%new_ext%
pause`;

         // 创建Linux/Mac shell脚本
     const shellScript = `#!/bin/bash
# 批量修改文件后缀名脚本
# 使用方法: 将此脚本放在需要修改的文件夹中运行

old_ext="${oldExtension}"
new_ext="${newExtension}"

echo "开始批量重命名文件..."
echo "旧后缀名: .$old_ext"
echo "新后缀名: .$new_ext"

for f in *.$old_ext; do
    if [ -f "$f" ]; then
        new_name="\${f%.*}.$new_ext"
        mv "$f" "$new_name"
        echo "重命名: $f -> $new_name"
    fi
done

echo ""
echo "完成！所有 .$old_ext 文件已重命名为 .$new_ext"`;

     // 创建PowerShell脚本 (Windows推荐)
     const powershellScript = `# PowerShell script for bulk file extension renaming
# Usage: Place this script in the folder containing files to rename
# Run with: powershell -ExecutionPolicy Bypass -File rename_files.ps1

param(
    [string]$OldExtension = "${oldExtension}",
    [string]$NewExtension = "${newExtension}"
)

Write-Host "Starting bulk file renaming..." -ForegroundColor Green
Write-Host "Old extension: .$OldExtension" -ForegroundColor Yellow
Write-Host "New extension: .$NewExtension" -ForegroundColor Yellow

$files = Get-ChildItem -Filter "*.$OldExtension"

if ($files.Count -eq 0) {
    Write-Host "No files found with extension .$OldExtension" -ForegroundColor Red
    exit
}

foreach ($file in $files) {
    $newName = $file.BaseName + ".$NewExtension"
    try {
        Rename-Item -Path $file.FullName -NewName $newName
        Write-Host "Renamed: $($file.Name) -> $newName" -ForegroundColor Green
    }
    catch {
        Write-Host "Error renaming $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Complete! All .$OldExtension files have been renamed to .$NewExtension" -ForegroundColor Green
Read-Host "Press Enter to continue"`;

         // 下载Windows批处理脚本 (UTF-8 with BOM)
     const batchBlob = new Blob(['\ufeff' + batchScript], { type: 'text/plain;charset=utf-8' });
     const batchUrl = URL.createObjectURL(batchBlob);
     const batchLink = document.createElement('a');
     batchLink.href = batchUrl;
     batchLink.download = 'rename_files.bat';
     document.body.appendChild(batchLink);
     batchLink.click();
     document.body.removeChild(batchLink);
     URL.revokeObjectURL(batchUrl);

         // 下载Linux/Mac shell脚本
     const shellBlob = new Blob([shellScript], { type: 'text/plain' });
     const shellUrl = URL.createObjectURL(shellBlob);
     const shellLink = document.createElement('a');
     shellLink.href = shellUrl;
     shellLink.download = 'rename_files.sh';
     document.body.appendChild(shellLink);
     shellLink.click();
     document.body.removeChild(shellLink);
     URL.revokeObjectURL(shellUrl);

     // 下载PowerShell脚本 (Windows推荐)
     const psBlob = new Blob([powershellScript], { type: 'text/plain;charset=utf-8' });
     const psUrl = URL.createObjectURL(psBlob);
     const psLink = document.createElement('a');
     psLink.href = psUrl;
     psLink.download = 'rename_files.ps1';
     document.body.appendChild(psLink);
     psLink.click();
     document.body.removeChild(psLink);
     URL.revokeObjectURL(psUrl);

     message.success("Windows批处理脚本、PowerShell脚本和Linux/Mac shell脚本已下载");
  };

  const resetFiles = () => {
    setFiles([]);
    setSelectedFolder("");
    setOldExtension("");
    setNewExtension("");
    setPreviewMode(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">批量修改文件后缀名</h1>
        <p className="text-muted-foreground">
          选择文件夹，批量修改其中文件的后缀名
        </p>
      </div>

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
            已选择文件夹: <span className="font-mono bg-muted px-2 py-1 rounded">{selectedFolder}</span>
            <span className="ml-4">包含 {files.length} 个文件</span>
          </div>
        )}
      </div>

      {/* 后缀名设置区域 */}
      {files.length > 0 && (
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            设置后缀名
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">旧后缀名</label>
              <Input
                type="text"
                value={oldExtension}
                onChange={(e) => setOldExtension(e.target.value)}
                placeholder="例如: jpg, txt, pdf"
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">新后缀名</label>
              <Input
                type="text"
                value={newExtension}
                onChange={(e) => setNewExtension(e.target.value)}
                placeholder="例如: png, doc, docx"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={updateFileExtensions} className="flex-1">
              更新文件列表
            </Button>
                         <Button variant="outline" onClick={downloadScript}>
               <Download className="w-4 h-4 mr-2" />
               下载脚本 (Windows + PowerShell + Linux/Mac)
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
              <Button
                variant="outline"
                size="sm"
                onClick={resetFiles}
              >
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
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-muted'
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
                 : "文件已准备就绪，可以下载脚本执行重命名操作"
               }
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
           <p>2. 输入旧后缀名和新后缀名（不需要包含点号）</p>
           <p>3. 点击"更新文件列表"查看将要修改的文件</p>
           <p>4. 点击"预览文件更改"确认更改内容</p>
           <p>5. 点击"下载重命名脚本"获取可执行的脚本文件</p>
           <p>6. 将脚本放在目标文件夹中运行，执行实际的文件重命名</p>
           <p className="text-blue-600 dark:text-blue-400">
             💡 Windows用户推荐使用PowerShell脚本(.ps1)，避免批处理脚本的编码问题
           </p>
           <p className="text-amber-600 dark:text-amber-400">
             ⚠️ 注意：文件重命名操作不可逆，请确保已备份重要文件
           </p>
           <p className="text-blue-600 dark:text-blue-400">
             💡 提示：由于浏览器安全限制，实际的文件重命名需要通过下载的脚本在本地执行
           </p>
         </div>
       </div>
    </div>
  );
};
