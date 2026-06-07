import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    const files = fs.readdirSync(avatarsDir);
    
    // 이미지 파일만 필터링 (확장자 체크)
    const avatars = files.filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file));
    
    // 정렬 (원하는 순서가 있다면)
    avatars.sort();
    
    return NextResponse.json(avatars);
  } catch (error) {
    console.error('Failed to read avatars directory:', error);
    return NextResponse.json({ error: 'Failed to read avatars directory' }, { status: 500 });
  }
}
