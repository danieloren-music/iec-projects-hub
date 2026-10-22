import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // שליפת כל נתוני הפרויקטים והחסמים העדכניים ממסד הנתונים
    const { data: projects } = await supabase
      .from('projects')
      .select('*, infra_requirements(*)');

    const systemInstruction = `
      אתה "Lin", סוכן AI חכם לניהול פרויקטים ב-PMO של חטיבת ה-IT והתקשוב (iec-projects-hub).
      תפקידך לתת מענה למנהלים ורכזי PMO על סטטוסים, לוחות זמנים וחסמי תשתית.
      
      כללים חשובים:
      1. ענה בעברית מקצועית, תמציתית וברורה (אלא אם פנו אליך באנגלית).
      2. זיהוי שמות דו-לשוני: "דאטריקס" ו-"Datricks" הם אותו פרויקט. זהה הקשרים בצורה חכמה.
      3. אם שואלים מה חוסם פרויקט, פרט את סיבת החסם התשתיתי (blocker_reason).
      4. הנה כל נתוני המערכת העדכניים:
      ${JSON.stringify(projects, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Lin AI Error:', error);
    return NextResponse.json({ error: 'שגיאה במענה של Lin' }, { status: 500 });
  }
}