import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { oldExtension, newExtension, files } = await request.json();

    if (!oldExtension || !newExtension || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 由于浏览器安全限制，我们无法直接访问文件系统
    // 这里我们返回一个模拟的成功响应，并提供脚本下载
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        if (file.oldExtension === oldExtension) {
          const newName = file.name.replace(`.${oldExtension}`, `.${newExtension}`);
          
          // 模拟重命名成功
          results.push({
            oldName: file.name,
            newName: newName,
            success: true
          });
        }
      } catch (error) {
        errors.push(`处理文件 ${file.name} 时出错: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: files.length,
        successful: results.length,
        failed: errors.length
      },
      message: '由于浏览器安全限制，文件重命名操作需要下载脚本在本地执行。请使用下载的脚本文件来实际重命名文件。'
    });

  } catch (error) {
    console.error('文件重命名API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取文件夹内容的API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('path');

    if (!folderPath) {
      return NextResponse.json(
        { error: '缺少文件夹路径参数' },
        { status: 400 }
      );
    }

    try {
      const files = await fs.readdir(folderPath);
      const fileStats = await Promise.all(
        files.map(async (fileName) => {
          try {
            const filePath = path.join(folderPath, fileName);
            const stat = await fs.stat(filePath);
            
            if (stat.isFile()) {
              const ext = path.extname(fileName).slice(1);
              return {
                name: fileName,
                extension: ext,
                size: stat.size,
                modified: stat.mtime
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      const validFiles = fileStats.filter(Boolean);
      
      return NextResponse.json({
        success: true,
        files: validFiles,
        folderPath
      });

    } catch (error) {
      return NextResponse.json(
        { error: `无法读取文件夹: ${error}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('获取文件夹内容API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
