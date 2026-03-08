import { GoogleGenAI, Type } from "@google/genai";
import { DebriefData, TranscriptTurn } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateDebrief(
  transcript: TranscriptTurn[],
  plannedDuration: number,
  actualDuration: number,
  company: string,
  role: string,
  type: string,
  difficulty: string
): Promise<DebriefData> {
  const prompt = `
    Analyze the following interview transcript and generate a detailed debrief in JSON format.
    
    Interview Context:
    - Company: ${company}
    - Role: ${role}
    - Type: ${type}
    - Difficulty: ${difficulty}
    - Planned Duration: ${plannedDuration} mins
    - Actual Duration: ${actualDuration} mins
    
    Transcript:
    ${transcript.map(t => `[${t.speaker}] ${t.text}`).join('\n')}
    
    Requirements:
    - Scores must be 1-100.
    - If the transcript is short, still provide scores and fill 'notes_if_low_data'.
    - Provide specific evidence with quotes and timestamps from the transcript.
    - The output MUST strictly follow the provided JSON schema.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          session_summary: {
            type: Type.OBJECT,
            properties: {
              session_status: { type: Type.STRING, enum: ["ended_early", "completed"] },
              planned_duration_minutes: { type: Type.NUMBER },
              actual_duration_minutes: { type: Type.NUMBER },
              role_guess: { type: Type.STRING },
              company: { type: Type.STRING },
              interview_type: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              topics_discussed: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    notes: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          },
          scores: {
            type: Type.OBJECT,
            properties: {
              overall: { type: Type.NUMBER },
              communication: { type: Type.NUMBER },
              structure_star: { type: Type.NUMBER },
              role_fit: { type: Type.NUMBER },
              confidence_clarity: { type: Type.NUMBER },
              delivery: { type: Type.NUMBER },
              technical_depth: { type: Type.NUMBER }
            }
          },
          strengths: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                evidence: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp_start: { type: Type.STRING },
                    timestamp_end: { type: Type.STRING },
                    quote: { type: Type.STRING }
                  }
                },
                why_it_matters: { type: Type.STRING }
              }
            }
          },
          improvements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                issue: { type: Type.STRING },
                evidence: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp_start: { type: Type.STRING },
                    timestamp_end: { type: Type.STRING },
                    quote: { type: Type.STRING }
                  }
                },
                better_answer_example: { type: Type.STRING },
                micro_exercise: { type: Type.STRING }
              }
            }
          },
          delivery_metrics: {
            type: Type.OBJECT,
            properties: {
              filler_word_estimate: { type: Type.NUMBER },
              pace_wpm_estimate: { type: Type.NUMBER },
              long_pause_estimate: { type: Type.NUMBER }
            }
          },
          moments_that_mattered: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                timestamp_start: { type: Type.STRING },
                timestamp_end: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          },
          practice_plan_7_days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                focus: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                time_minutes: { type: Type.NUMBER }
              }
            }
          },
          next_interview_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          notes_if_low_data: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
