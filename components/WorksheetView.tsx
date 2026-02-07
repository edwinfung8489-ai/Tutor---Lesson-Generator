import React, { useState, useEffect, useRef } from 'react';
import { LessonData, Question, VocabTestQuestion } from '../types';
import { generateDialogueAudio, decode, decodeAudioData } from '../services/geminiService';

interface WorksheetViewProps {
  data: LessonData;
  className?: string;
  printMode?: 'full' | 'vocab' | 'vocabTest' | null;
  studentName?: string;
}

const cleanOption = (opt: string) => {
  if (!opt) return "";
  return opt.replace(/^[A-Z0-9][.)\-:]\s*/i, '').trim();
};

const LinedSpace: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="w-full my-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-b border-gray-400 h-8 w-full" />
    ))}
  </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="border-b-2 border-black pb-1 mb-4 mt-2 break-inside-avoid">
    <h3 className="font-bold text-lg md:text-xl uppercase underline decoration-2 underline-offset-4">{title}</h3>
  </div>
);

const PageFooter: React.FC<{ pageNumber: number; footerText: string }> = ({ pageNumber, footerText }) => (
  <div className="mt-auto pt-4 flex justify-between items-center text-[10px] text-gray-500 font-sans border-t border-gray-100 print:border-black">
    <span>{footerText}</span>
    <span className="font-bold">Page {pageNumber}</span>
  </div>
);

const QuestionItem: React.FC<{ question: Question; index: number; className?: string }> = ({ question, index, className = '' }) => {
  if (!question) return null;
  return (
    <div className={`break-inside-avoid ${className}`}>
      <p className="font-bold text-base mb-1 leading-tight">
        {index}. {question.text}
      </p>
      <ul className="space-y-0.5 text-sm">
        {question.options.map((opt, i) => (
          <li key={i} className="flex items-start">
            <span className="font-semibold mr-2 min-w-[1.2em]">{String.fromCharCode(65 + i)}.</span>
            <span>{cleanOption(opt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const VocabTestItem: React.FC<{ question: VocabTestQuestion; index: number }> = ({ question, index }) => {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <div className="mb-4 break-inside-avoid">
          <p className="font-bold mb-1">{index}. {question.questionText}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {question.options?.map((opt, i) => (
              <div key={i} className="flex items-center">
                 <span className="mr-2 w-5 font-bold">{String.fromCharCode(65 + i)}.</span>
                 <span className="border-b border-dotted border-gray-400 flex-grow">{cleanOption(opt)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'fill_in_the_blank':
      return (
        <div className="mb-4 break-inside-avoid">
          <p className="font-bold mb-1">
            {index}. {question.questionText.replace(/___+/g, '____________________')}
          </p>
        </div>
      );
    case 'true_false':
      return (
        <div className="mb-4 break-inside-avoid flex justify-between items-start">
           <p className="font-bold flex-grow pr-4">{index}. {question.questionText}</p>
           <span className="font-bold whitespace-nowrap">( TRUE / FALSE )</span>
        </div>
      );
    case 'unscramble':
      return (
        <div className="mb-4 break-inside-avoid">
           <p className="font-bold mb-1">{index}. Unscramble this word: <span className="underline tracking-widest px-2">{question.scrambledWord}</span></p>
           <div className="border-b border-black h-8 w-1/2"></div>
        </div>
      );
    default:
      return null;
  }
};

const AnswerKey: React.FC<{ data: LessonData; footerText: string }> = ({ data, footerText }) => {
  return (
    <div className="p-8 print:p-12 print:pt-16 print:h-[296mm] flex flex-col bg-white">
      <SectionHeader title="Answer Key (Teacher Only)" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
        <div>
          <h4 className="font-bold mb-2 border-b border-gray-400">Part A: Listening</h4>
          <ul className="space-y-1 text-sm">
            {data.partA.questions.map((q, i) => {
              const cleanedCorrect = cleanOption(q.correctAnswer);
              const optIndex = q.options.findIndex(opt => cleanOption(opt) === cleanedCorrect);
              const letter = optIndex > -1 ? String.fromCharCode(65 + optIndex) : '';
              return (
                <li key={i}>
                  <span className="font-bold">{i + 1}.</span> {letter ? <span className="font-bold mr-1">{letter}.</span> : ''}{cleanedCorrect}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
           <h4 className="font-bold mb-2 border-b border-gray-400">Part F: Reading</h4>
           <ul className="space-y-1 text-sm">
            {data.partF.questions.map((q, i) => {
               const cleanedCorrect = cleanOption(q.correctAnswer);
               const optIndex = q.options.findIndex(opt => cleanOption(opt) === cleanedCorrect);
               const letter = optIndex > -1 ? String.fromCharCode(65 + optIndex) : '';
               return (
                  <li key={i}>
                    <span className="font-bold">{i + 1}.</span> {letter ? <span className="font-bold mr-1">{letter}.</span> : ''}{cleanedCorrect}
                  </li>
               );
            })}
          </ul>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-bold mb-2 border-b border-gray-400">Vocabulary Test Answers</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {data.vocabTest.map((q, i) => (
                <div key={i}>
                    <span className="font-bold">{i+1}.</span> {q.correctAnswer}
                </div>
            ))}
        </div>
      </div>

      <div>
        <h4 className="font-bold mb-2 border-b border-gray-400">Part D: Corrections</h4>
        <div className="grid grid-cols-1 gap-1 text-sm">
          {data.partD.corrections.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-bold min-w-[20px]">{i + 1}.</span>
              <span className="text-red-600 line-through decoration-red-600">{item.mistake}</span>
              <span>&rarr;</span>
              <span className="text-green-600 font-semibold">{item.correction}</span>
            </div>
          ))}
        </div>
      </div>
      <PageFooter pageNumber={8} footerText={footerText} />
    </div>
  );
};

const createWavBlob = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmData.length, true);
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
};

export const WorksheetView: React.FC<WorksheetViewProps> = ({ data, className = '', printMode = null, studentName = '' }) => {
  const [dateStr, setDateStr] = useState('');
  const [classNameStr, setClassNameStr] = useState(studentName || 'English Class');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setClassNameStr(studentName || 'English Class');
  }, [studentName]);

  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    const suffix = ["th", "st", "nd", "rd"][((day % 100) - 20) % 10] || ["th", "st", "nd", "rd"][day % 100] || "th";
    const formattedDate = `${today.toLocaleString('en-US', { month: 'long' })} ${day}${suffix}, ${today.getFullYear()}`;
    setDateStr(formattedDate);
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) { stopAudio(); return; }
    setIsLoadingAudio(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const base64 = await generateDialogueAudio(data.dialogueScript);
      const audioBytes = decode(base64);
      const audioBuffer = await decodeAudioData(audioBytes, ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (e) {
      console.error("Audio playback error", e);
      alert("Failed to generate or play audio.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleDownloadAudio = async () => {
    setIsDownloadingAudio(true);
    try {
      const base64 = await generateDialogueAudio(data.dialogueScript);
      const audioBytes = decode(base64);
      const blob = createWavBlob(audioBytes, 24000);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.topicTitle.replace(/\s+/g, '_')}_Audio.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Audio download error", e);
      alert("Failed to generate audio for download.");
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const handleDownloadTranscript = () => {
    const transcriptText = data.dialogueScript.map(line => `${line.speaker}: ${line.text}`).join('\n\n');
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.topicTitle.replace(/\s+/g, '_')}_Transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const Header = () => (
    <div className="mb-4 border-b-2 border-black pb-2 print:border-black">
      <div className="flex justify-between items-end">
        <div className="w-1/2">
           <input 
             value={classNameStr}
             onChange={(e) => setClassNameStr(e.target.value)}
             className="text-xl font-bold underline decoration-2 underline-offset-4 outline-none bg-transparent w-full no-print"
             placeholder="Class Name"
           />
           <span className="hidden print:inline text-xl font-bold underline decoration-2 underline-offset-4">{classNameStr}</span>
        </div>
        <div className="w-1/2 text-right">
            <span className="text-xl font-bold">{dateStr}</span>
        </div>
      </div>
    </div>
  );

  const VocabularyTable = ({ compact = false }: { compact?: boolean }) => (
    <div className="overflow-hidden mb-8">
      <table className={`w-full border-collapse border-2 border-black ${compact ? 'text-[10px]' : 'text-sm'}`}>
        <thead className="bg-gray-100 print:bg-white">
          <tr className="border-b-2 border-black">
            <th className="p-2 border-r-2 border-black font-bold text-left w-[15%]">Word</th>
            <th className="p-2 border-r-2 border-black font-bold text-left w-[25%]">Meaning (En)</th>
            <th className="p-2 border-r-2 border-black font-bold text-left w-[20%]">Meaning (Ch)</th>
            <th className="p-2 font-bold text-left">Example</th>
          </tr>
        </thead>
        <tbody>
          {data.vocabulary.map((vocab, i) => (
            <tr key={i} className={`border-b border-black break-inside-avoid last:border-0`}>
              <td className="p-1.5 md:p-2 border-r border-black font-bold">
                {vocab.word} <span className="font-normal italic text-[10px] block text-gray-600 print:text-black">({vocab.partOfSpeech})</span>
              </td>
              <td className="p-1.5 md:p-2 border-r border-black align-top">{vocab.definition}</td>
              <td className="p-1.5 md:p-2 border-r border-black align-top">{vocab.chinese}</td>
              <td className="p-1.5 md:p-2 italic align-top">{vocab.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (printMode === 'vocab') {
    return (
      <div id="vocab-worksheet" className="bg-white text-black font-serif-print w-full p-8 print:p-12 print:pt-16 print:min-h-[296mm] flex flex-col">
        <Header />
        <h2 className="text-2xl font-bold uppercase mb-4 border-b-4 border-black pb-2">Vocabulary: {data.topicTitle}</h2>
        <div className="flex-grow">
          <VocabularyTable compact={data.vocabulary.length > 10} />
        </div>
        <PageFooter pageNumber={1} footerText={classNameStr} />
      </div>
    );
  }

  if (printMode === 'vocabTest') {
    return (
        <div id="vocab-test-worksheet" className="bg-white text-black font-serif-print w-full p-8 print:p-12 print:pt-16 print:h-[296mm] flex flex-col">
            <Header />
            <h2 className="text-2xl font-bold uppercase mb-2 border-b-4 border-black pb-1 text-center">Vocabulary Quiz</h2>
            <div className="flex justify-between items-center mb-6 text-sm italic border-b border-black pb-2">
                <span>Name: ________________________</span>
                <span>Date: ________________________</span>
                <span>Score: ______ / {data.vocabTest.length}</span>
            </div>
            
            <div className="flex-grow">
                {data.vocabTest.map((q, i) => (
                    <VocabTestItem key={i} question={q} index={i + 1} />
                ))}
            </div>
            
            <PageFooter pageNumber={1} footerText={classNameStr} />
        </div>
    );
  }

  return (
    <div id="printable-worksheet" className={`bg-white text-black font-serif-print w-full max-w-[210mm] mx-auto shadow-xl print:shadow-none print:max-w-none ${className}`}>
      
      {/* PAGE 1: Part A (Listening) */}
      <div className="p-8 print:p-12 print:pt-16 print:h-[296mm] flex flex-col break-after-page overflow-hidden">
        <Header />
        <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-bold">Part A – Listening - IC</p>
            <span className="text-xs uppercase px-2 py-0.5 border border-black rounded-full print:hidden">
                Level: {data.level}
            </span>
        </div>
        
        <div className="border-2 border-black flex flex-col flex-grow break-inside-avoid">
          <div className="flex flex-col md:flex-row border-b-2 border-black min-h-[160px]">
            <div className="md:w-1/2 p-4 md:border-r-2 border-black flex flex-col justify-center bg-white text-black">
              <h1 className="text-4xl font-bold leading-tight">
                Topic: {data.topicTitle}
              </h1>
            </div>
            <div className="md:w-1/2 p-2 flex flex-col justify-center">
              <QuestionItem question={data.partA.questions[0]} index={1} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 flex-grow">
            {data.partA.questions.slice(1).map((q, idx) => {
              const realIndex = idx + 2;
              const isLeftCol = idx % 2 === 0;
              return (
                <div 
                  key={q.id} 
                  className={`p-3 flex flex-col justify-start border-black border-b-2 md:border-b-0 ${isLeftCol ? 'md:border-r-2' : ''} md:border-b-2`}
                >
                  <QuestionItem question={q} index={realIndex} />
                </div>
              );
            })}
             {data.partA.questions.slice(1).length % 2 !== 0 && (
                <div className="border-t-2 md:border-t-0 md:border-l-2 border-black p-2 bg-white"></div>
             )}
          </div>
        </div>
        <PageFooter pageNumber={1} footerText={classNameStr} />
      </div>

      {!printMode && (
        <div className="p-8 no-print">
            <SectionHeader title="Vocabulary (Excluded from Full PDF)" />
            <VocabularyTable />
        </div>
      )}

      {/* PAGE 2: Part B (Writing/Reading) & Part C (Speaking) COMBINED */}
      <div className="p-8 print:p-12 print:pt-16 print:break-before-page print:h-[296mm] flex flex-col break-after-page overflow-hidden">
        <div className="flex-grow">
          <SectionHeader title="Part B – Writing x Reading – IC" />
          <p className="mb-4 font-bold">Pick a topic and write about it – 75 words:</p>
          <ul className="list-[lower-alpha] pl-5 mb-6 space-y-2">
              {data.partB.prompts.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
          <LinedSpace rows={8} />

          <div className="mt-8">
            <SectionHeader title="Part C – Speaking – IC" />
            <div className="border-2 border-black p-4 md:p-8">
                <h4 className="font-bold text-xl mb-3">Theme: {data.partC.theme}</h4>
                <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                    {data.partC.points.map((pt, i) => <li key={i} className="text-base md:text-lg">{pt}</li>)}
                </ul>
            </div>
          </div>
        </div>
        <PageFooter pageNumber={2} footerText={classNameStr} />
      </div>

      {/* PAGE 3: Part D (Spelling/Mistakes) - OWN PAGE */}
      <div className="p-8 print:p-12 print:pt-16 print:break-before-page print:h-[296mm] flex flex-col break-after-page overflow-hidden">
        <div className="flex-grow">
          <SectionHeader title="Part D – Spelling x Finding Mistakes - IC" />
          <div className="mb-4">
              <p className="font-bold mb-2 underline text-sm">Instructions:</p>
              <ol className="list-decimal pl-5 text-xs mb-4">
                  <li>Read the passage carefully. Find and underline grammatical mistakes.</li>
              </ol>
              <div className="p-4 bg-gray-50 print:bg-transparent border border-black text-sm md:text-base leading-relaxed font-serif text-justify mb-4">
                  {data.partD.textWithErrors}
              </div>
              <p className="font-bold mb-1 text-xs uppercase">Rewrite Corrected Paragraph:</p>
              <LinedSpace rows={6} />
              
              <div className="mt-6">
                <p className="font-bold mb-1 text-xs uppercase">Spelling & Dictation Practice:</p>
                <LinedSpace rows={12} />
              </div>
          </div>
        </div>
        <PageFooter pageNumber={3} footerText={classNameStr} />
      </div>

      {/* PAGE 4: Part E (Translation & Essay) */}
      <div className="p-8 print:p-12 print:pt-16 print:break-before-page print:h-[296mm] flex flex-col break-after-page overflow-hidden">
         <div className="flex-grow">
           <SectionHeader title="Part E – Writing - Translation x Essay – HW" />
           <div className="mb-4">
              <p className="mb-1 text-xs font-bold">Translate the following passage into English:</p>
              <div className="mb-2 p-3 border-l-4 border-black font-serif text-base bg-gray-50 print:bg-transparent leading-snug">
                  {data.partE.translationPassage}
              </div>
              <LinedSpace rows={5} />
           </div>
           <div className="mt-4">
              <h4 className="font-bold text-base mb-1">Essay Topic: {data.partE.essayPrompt}</h4>
              <p className="mb-1 text-xs italic">Write an essay (approx 120 words) covering these points:</p>
              <ul className="list-decimal pl-6 mb-3 text-xs font-serif">
                  {data.partE.essayPoints.map((pt, i) => <li key={i} className="mb-0.5">{pt}</li>)}
              </ul>
              <LinedSpace rows={14} />
           </div>
         </div>
         <PageFooter pageNumber={4} footerText={classNameStr} />
      </div>

      {/* PAGE 5: Part F (Reading) - OWN PAGE */}
      <div className="p-8 print:p-12 print:pt-16 print:break-before-page print:h-[296mm] flex flex-col break-after-page overflow-hidden">
          <div className="flex-grow">
            <SectionHeader title="Part F – Reading Comprehension – IC" />
            <div className="mb-6 border-b-2 border-black pb-4">
              <div className="columns-1 md:columns-2 gap-8 text-justify leading-relaxed text-xs md:text-sm font-serif">
                  {data.partF.passage.split('\n').map((para, i) => (
                      <p key={i} className="mb-3 indent-4">{para}</p>
                  ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
               {data.partF.questions.map((q, idx) => (
                   <div key={q.id} className="p-2 border border-black">
                       <QuestionItem question={q} index={idx + 1} />
                   </div>
               ))}
            </div>
          </div>
          <PageFooter pageNumber={5} footerText={classNameStr} />
      </div>

      {/* PAGE 6: Dialogue Script */}
      <div className="p-8 print:p-12 print:pt-16 print:break-before-page print:h-[296mm] flex flex-col break-after-page overflow-hidden">
        <div className="flex-grow">
          <div className="p-4 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                   <h2 className="text-2xl font-bold text-center uppercase tracking-widest flex-grow">Dialogue (Teacher Script)</h2>
                   <div className="flex flex-wrap gap-2 no-print justify-center">
                     <button 
                       onClick={handlePlayAudio}
                       disabled={isLoadingAudio}
                       className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50 min-w-[140px]"
                     >
                       {isLoadingAudio ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : isPlaying ? (
                         <span>Pause Audio</span>
                       ) : (
                         <span>Listen Audio</span>
                       )}
                     </button>
                     <button 
                       onClick={handleDownloadAudio}
                       disabled={isDownloadingAudio}
                       className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                     >
                        {isDownloadingAudio ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Download Audio</span>
                        )}
                     </button>
                     <button 
                       onClick={handleDownloadTranscript}
                       className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                     >
                       <span>Download Text</span>
                     </button>
                   </div>
              </div>
              
              <div className="space-y-4 max-w-3xl mx-auto font-serif">
                  {data.dialogueScript.map((line, i) => (
                      <div key={i} className="flex flex-col md:flex-row gap-2">
                          <span className="font-bold uppercase min-w-[100px] text-sm pt-1">{line.speaker}:</span>
                          <span className="leading-relaxed text-lg">{line.text}</span>
                      </div>
                  ))}
              </div>
          </div>
        </div>
        <PageFooter pageNumber={6} footerText={classNameStr} />
      </div>

       {/* PAGE 7: Answer Key */}
       <AnswerKey data={data} footerText={classNameStr} />
    </div>
  );
};