import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LessonData, DifficultyLevel } from "../types";

const apiKey = process.env.API_KEY;

export const generateLessonPlan = async (theme: string, level: DifficultyLevel): Promise<LessonData> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let levelInstruction = "";
  switch (level) {
    case 'Beginner':
      levelInstruction = "Level: Beginner (A2/B1). Use simple vocabulary and sentence structures.";
      break;
    case 'Intermediate':
      levelInstruction = "Level: Intermediate (B2). Use standard academic vocabulary and moderate complexity.";
      break;
    case 'Advanced':
      levelInstruction = "Level: Advanced (C1/C2). Use sophisticated vocabulary, nuanced expressions, and complex grammar.";
      break;
  }

  // Randomly select two distinct names to force variety
  const pool = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Quinn", "Avery", "Peyton",
    "Sam", "Charlie", "Dakota", "Reese", "Skyler", "River", "Sage", "Rowan", "Phoenix", "Finley",
    "Elena", "Kenji", "Maya", "Liam", "Noah", "Olivia", "Emma", "Ava", "Sophia", "Jackson",
    "Lucas", "Oliver", "Ethan", "Aiden", "Hiro", "Yuki", "Zara", "Omar", "Priya", "Ravi",
    "Chen", "Wei", "Hana", "Lars", "Astrid", "Mateo", "Sofia", "Diego", "Valentina"
  ];
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const char1 = shuffled[0];
  const char2 = shuffled[1];

  const systemInstruction = `
    You are an expert ESL (English as a Second Language) curriculum developer.
    Create a comprehensive lesson plan based on the user's theme.
    ${levelInstruction}
    
    The lesson must follow this exact structure:
    
    1. **Dialogue (Teacher's Script)**: A creative dialogue between two people about the theme. 
       - **CRITICAL**: Use the characters **${char1}** and **${char2}**. Do NOT use other names.
       - Length: 200-250 words.
    
    2. **Part A - Listening**: 10 MCQs based on the dialogue.
       - 'options' MUST NOT include labels. Distribute 'correctAnswer' evenly across A, B, C, and D.
    
    3. **Vocabulary**: Exactly 15 words/phrases from the theme.
    
    4. **Vocabulary Test**: Create a 1-page test (approx 12-15 items) based on the vocabulary words above.
       - Use a mix of: Multiple Choice (definition to word), Fill in the blank (sentence completion), True/False (usage), and Unscramble (spelling).
       - Ensure high variety in question types.
    
    5. **Part B - Writing x Reading**: 3 short answer prompts.
    
    6. **Part C - Speaking**: Discussion points.
    
    7. **Part D - Spelling x Finding Mistakes**: A paragraph with 8-10 mistakes.
    
    8. **Part E - Translation x Essay**: 
       - Translation (Traditional Chinese to English).
       - Essay prompt (Title and points in Traditional Chinese).
    
    9. **Part F - Reading Comprehension**: Passage and 5 MCQs.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a full lesson plan for the theme: "${theme}"`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topicTitle: { type: Type.STRING },
          dialogueScript: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["speaker", "text"],
            },
          },
          partA: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                  },
                  required: ["id", "text", "options", "correctAnswer"],
                },
              },
            },
            required: ["questions"],
          },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                definition: { type: Type.STRING },
                chinese: { type: Type.STRING },
                example: { type: Type.STRING },
              },
              required: ["word", "partOfSpeech", "definition", "chinese", "example"],
            },
          },
          vocabTest: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                type: { type: Type.STRING, enum: ['multiple_choice', 'fill_in_the_blank', 'true_false', 'unscramble'] },
                questionText: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                scrambledWord: { type: Type.STRING },
              },
              required: ["id", "type", "questionText", "correctAnswer"],
            },
          },
          partB: {
            type: Type.OBJECT,
            properties: {
              prompts: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["prompts"],
          },
          partC: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              points: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["theme", "points"],
          },
          partD: {
            type: Type.OBJECT,
            properties: {
              textWithErrors: { type: Type.STRING },
              corrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mistake: { type: Type.STRING },
                    correction: { type: Type.STRING },
                  },
                  required: ["mistake", "correction"],
                },
              },
            },
            required: ["textWithErrors", "corrections"],
          },
          partE: {
            type: Type.OBJECT,
            properties: {
              translationPassage: { type: Type.STRING },
              essayPrompt: { type: Type.STRING },
              essayPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["translationPassage", "essayPrompt", "essayPoints"],
          },
          partF: {
            type: Type.OBJECT,
            properties: {
              passage: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                  },
                  required: ["id", "text", "options", "correctAnswer"],
                },
              },
            },
            required: ["passage", "questions"],
          },
        },
        required: ["topicTitle", "dialogueScript", "partA", "vocabulary", "vocabTest", "partB", "partC", "partD", "partE", "partF"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response generated from AI.");
  }

  try {
    const data = JSON.parse(text) as LessonData;
    data.level = level;
    return data;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to generate valid lesson format.");
  }
};

export const generateDialogueAudio = async (dialogue: Array<{ speaker: string, text: string }>) => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });

  const speakers = Array.from(new Set(dialogue.map(d => d.speaker)));
  const voices = ['Puck', 'Kore', 'Fenrir', 'Charon']; 
  
  const speakerVoiceConfigs = speakers.map((speaker, index) => ({
    speaker: speaker,
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: voices[index % voices.length]
      }
    }
  }));

  const script = dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerVoiceConfigs
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio");
  
  return base64Audio;
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}