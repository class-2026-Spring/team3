import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

// 충전기 타입 코드 → 한국어 레이블
const CHARGER_TYPE_LABEL: Record<string, string> = {
  '01': 'DC차데모(급속)',
  '02': 'AC완속',
  '03': 'DC차데모+AC3상(급속)',
  '04': 'DC콤보(급속)',
  '05': 'DC콤보+차데모(급속)',
  '06': 'DC콤보+차데모+AC3상(급속)',
  '07': '슈퍼차저(급속)',
};

// 충전기 상태 코드 → 한국어 레이블
const CHARGER_STAT_LABEL: Record<string, string> = {
  '1': '통신이상',
  '2': '사용가능',
  '3': '충전중',
  '4': '운영중지',
  '5': '점검중',
  '9': '미확인',
};

// 충전기가 급속인지 여부
function isFast(type: string): boolean {
  return ['01', '03', '04', '05', '06', '07'].includes(type);
}

interface ChargerPort {
  chgerId: string;
  type: string;
  stat?: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: string;
  chargers?: ChargerPort[];
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// 충전소 상태 요약 텍스트 생성
function buildStationSummary(station: Station, index: number): string {
  let summary = `${index + 1}. ${station.name}\n`;
  summary += `   주소: ${station.address}\n`;
  if (station.distance !== undefined) {
    summary += `   거리: ${station.distance}km\n`;
  }

  if (station.chargers && station.chargers.length > 0) {
    let fastTotal = 0, fastAvail = 0;
    let slowTotal = 0, slowAvail = 0;
    const typeSet = new Set<string>();

    station.chargers.forEach((c) => {
      const fast = isFast(c.type);
      typeSet.add(CHARGER_TYPE_LABEL[c.type] ?? c.type);
      if (fast) {
        fastTotal++;
        if (c.stat === '2') fastAvail++;
      } else {
        slowTotal++;
        if (c.stat === '2') slowAvail++;
      }
    });

    summary += `   충전기 종류: ${[...typeSet].join(', ')}\n`;
    if (fastTotal > 0) summary += `   급속: ${fastAvail}/${fastTotal}개 사용가능\n`;
    if (slowTotal > 0) summary += `   완속: ${slowAvail}/${slowTotal}개 사용가능\n`;

    // 충전기별 상세 상태
    const statDetails = station.chargers
      .map((c) => `충전기${c.chgerId}(${isFast(c.type) ? '급속' : '완속'}): ${CHARGER_STAT_LABEL[c.stat ?? '9'] ?? '미확인'}`)
      .join(', ');
    summary += `   상태: ${statDetails}\n`;
  }

  return summary;
}

// 사용자에게 보여줄 친화적 에러 메시지 변환
function toUserFriendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
    return 'AI 서비스 인증에 실패했습니다. 잠시 후 다시 시도해주세요.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  if (msg.includes('500') || msg.includes('503')) {
    return 'AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.';
  }
  return '응답을 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.';
}

export async function POST(req: Request) {
  try {
    const { message, context, history } = await req.json() as {
      message: string;
      context: Station[];
      history: ChatMessage[];
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI 서비스가 준비되지 않았습니다.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // ① systemInstruction을 config로 분리 (user role에 섞지 않음)
    let systemInstruction = `당신은 제주도 전기차 충전소 전문 AI 어시스턴트입니다.

[답변 규칙]
1. **핵심 내용을 먼저** 1~2문장으로 간결하게 답하세요.
2. 추가 설명이 필요한 경우에만 아래에 항목(-) 으로 나열하세요.
3. 헤더(#, ##, ###)는 절대 사용하지 마세요.
4. **굵은 글씨**는 핵심 키워드 강조에만 사용하세요 (과도 사용 금지).
5. 답변은 3~6문장 이내로 짧게 유지하세요. 길어지면 핵심만 남기세요.
6. 모르는 정보는 추측하지 말고 솔직하게 답하세요.
7. 한국어로 친근하고 자연스럽게 대화하세요.`;



    // ② 충전소 context가 있으면 상태 포함 상세 정보를 추가
    if (context && context.length > 0) {
      systemInstruction += `\n\n## 사용자 근처 충전소 현황 (실시간 데이터)\n`;
      context.forEach((station, index) => {
        systemInstruction += buildStationSummary(station, index);
      });
      systemInstruction += `\n위 정보를 바탕으로 사용자의 질문에 답하세요. 사용가능한 충전기가 있는 곳을 우선 추천하세요.`;
    }

    // ③ 대화 기록(history)을 그대로 전달 — 이전 대화 맥락 유지
    const contents: ChatMessage[] = [
      ...(history ?? []),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    return NextResponse.json({ reply: response.text });

  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: toUserFriendlyError(error) },
      { status: 500 }
    );
  }
}
