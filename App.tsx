import React, { useState, useEffect } from 'react';
import { generateLessonPlan } from './services/geminiService';
import { LessonData, GenerationStatus, DifficultyLevel } from './types';
import { WorksheetView } from './components/WorksheetView';

// Icons
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const VocabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const QuizIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h3.75a.75.75 0 0 1 .75.75v17.25a.75.75 0 0 1-.75.75h-3.75a.75.75 0 0 1-.75-.75V3a.75.75 0 0 1 .75-.75ZM9 6.75H4.5a1.875 1.875 0 0 0-1.875 1.875v9.75c0 1.036.84 1.875 1.875 1.875H9v-13.5ZM15 6.75h4.5c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H15v-13.5Z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ExampleBadge: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-full transition-colors duration-200"
  >
    {text}
  </button>
);

function App() {
  const [theme, setTheme] = useState('');
  const [level, setLevel] = useState<DifficultyLevel>('Intermediate');
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LessonData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'vocab' | 'vocabTest' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lessonGen_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveHistory = (newItem: LessonData) => {
    const newHistory = [newItem, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('lessonGen_history', JSON.stringify(newHistory));
  };

  const generate = async (selectedLevel: DifficultyLevel = level) => {
    if (!theme.trim()) return;
    setStatus(GenerationStatus.LOADING);
    setError(null);
    setLessonData(null);
    try {
      const data = await generateLessonPlan(theme, selectedLevel);
      const dataWithMeta = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
      setLessonData(dataWithMeta);
      saveHistory(dataWithMeta);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleDownloadFull = async () => {
    if (!lessonData || isDownloading) return;
    setIsDownloading(true);
    setPrintMode('full');
    setTimeout(() => {
      const element = document.getElementById('printable-worksheet');
      if (!element) { setIsDownloading(false); return; }
      const opt = {
        margin: 0,
        filename: `${lessonData.topicTitle.replace(/\s+/g, '_')}_Full_Lesson.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0, windowWidth: element.clientWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      // @ts-ignore
      html2pdf().set(opt).from(element).save().then(() => { setIsDownloading(false); setPrintMode(null); });
    }, 800);
  };

  const handleDownloadVocab = async () => {
    if (!lessonData || isDownloading) return;
    setIsDownloading(true);
    setPrintMode('vocab');
    setTimeout(() => {
      const element = document.getElementById('vocab-worksheet');
      if (!element) { setIsDownloading(false); return; }
      const opt = {
        margin: 0,
        filename: `${lessonData.topicTitle.replace(/\s+/g, '_')}_Vocabulary.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0, windowWidth: element.clientWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      html2pdf().set(opt).from(element).save().then(() => { setIsDownloading(false); setPrintMode(null); });
    }, 800);
  };

  const handleDownloadVocabTest = async () => {
    if (!lessonData || isDownloading) return;
    setIsDownloading(true);
    setPrintMode('vocabTest');
    setTimeout(() => {
      const element = document.getElementById('vocab-test-worksheet');
      if (!element) { setIsDownloading(false); return; }
      const opt = {
        margin: 0,
        filename: `${lessonData.topicTitle.replace(/\s+/g, '_')}_Vocab_Test.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0, windowWidth: element.clientWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      html2pdf().set(opt).from(element).save().then(() => { setIsDownloading(false); setPrintMode(null); });
    }, 800);
  };

  const reset = () => { setStatus(GenerationStatus.IDLE); setTheme(''); setLessonData(null); };
  const loadFromHistory = (item: LessonData) => { setLessonData(item); setTheme(item.topicTitle); setLevel(item.level); setStatus(GenerationStatus.SUCCESS); setShowHistory(false); };
  const handleExampleClick = (text: string) => { setTheme(text); };
  const handleLevelChange = async (newLevel: DifficultyLevel) => { setLevel(newLevel); if (status === GenerationStatus.SUCCESS && lessonData) { await generate(newLevel); } };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 py-4 px-6 no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={reset}>
            <div className="bg-black text-white p-1 rounded"><SparklesIcon /></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">LessonGen AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button onClick={() => setShowHistory(!showHistory)} className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-black transition">
                <HistoryIcon /><span className="hidden lg:inline">History</span>
              </button>
              {showHistory && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100 font-bold text-sm text-gray-500">Recent Lessons</div>
                  {history.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">No history yet.</div> : (
                    <ul>{history.map((item) => (
                      <li key={item.id || item.timestamp}>
                        <button onClick={() => loadFromHistory(item)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition">
                          <p className="font-semibold text-gray-800 truncate">{item.topicTitle}</p>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{item.level}</span>
                            <span className="text-xs text-gray-400">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}</span>
                          </div>
                        </button>
                      </li>
                    ))}</ul>
                  )}
                </div>
              )}
            </div>
            {status === GenerationStatus.SUCCESS && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1 text-sm font-medium">
                {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((l) => (
                  <button key={l} onClick={() => handleLevelChange(l)} className={`px-2 py-1 rounded ${level === l ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}>{l}</button>
                ))}
              </div>
            )}
            {status === GenerationStatus.SUCCESS && (
              <div className="flex space-x-2">
                <button onClick={reset} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition">
                  <RefreshIcon /><span className="hidden xl:inline">New</span>
                </button>
                <button onClick={handleDownloadVocab} disabled={isDownloading} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition disabled:opacity-50">
                  <VocabIcon /><span className="hidden md:inline">{isDownloading && printMode === 'vocab' ? '...' : 'Vocab PDF'}</span>
                </button>
                <button onClick={handleDownloadVocabTest} disabled={isDownloading} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition disabled:opacity-50">
                  <QuizIcon /><span className="hidden md:inline">{isDownloading && printMode === 'vocabTest' ? '...' : 'Test PDF'}</span>
                </button>
                <button onClick={handleDownloadFull} disabled={isDownloading} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition shadow-sm disabled:opacity-50">
                  <PdfIcon /><span className="hidden md:inline">{isDownloading && printMode === 'full' ? '...' : 'Full PDF'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-grow flex flex-col items-center p-4 md:p-8" onClick={() => showHistory && setShowHistory(false)}>
        {status === GenerationStatus.IDLE && (
          <div className="w-full max-w-2xl mt-12 text-center animate-fade-in">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Instantly create <span className="text-blue-600">English lessons</span> from any topic.</h1>
            <p className="text-lg text-gray-600 mb-8">Enter a theme, and our AI will generate a professional worksheet and vocabulary test in seconds.</p>
            
            <div className="w-full max-w-2xl mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Student / Class Name</label>
                <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Auston & Ansel"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
            </div>

            <div className="mb-6 flex justify-center space-x-4">
                 {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((l) => (
                    <label key={l} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition">
                        <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="text-black focus:ring-black" />
                        <span className="text-sm font-medium">{l}</span>
                    </label>
                 ))}
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white p-2 rounded-lg shadow-xl ring-1 ring-gray-900/5 flex">
                <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generate()} placeholder="E.g., Space Exploration..." className="flex-grow p-4 text-lg outline-none text-gray-900 bg-white placeholder-gray-400 rounded-l-md" autoFocus />
                <button onClick={() => generate()} disabled={!theme.trim()} className="bg-black text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Generate</button>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-gray-500 mr-1">Try:</span>
                <ExampleBadge text="Space Exploration" onClick={() => handleExampleClick("Space Exploration")} />
                <ExampleBadge text="The History of Coffee" onClick={() => handleExampleClick("The History of Coffee")} />
                <ExampleBadge text="Sustainable Fashion" onClick={() => handleExampleClick("Sustainable Fashion")} />
            </div>
          </div>
        )}
        {status === GenerationStatus.LOADING && (
          <div className="flex flex-col items-center justify-center mt-20">
             <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="mt-6 text-xl font-medium text-gray-700 animate-pulse">Designing {level.toLowerCase()} worksheet for "{theme}"...</p>
          </div>
        )}
        {status === GenerationStatus.ERROR && (
          <div className="mt-20 text-center max-w-md">
            <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200">
              <h3 className="font-bold text-lg mb-2">Oops! Something went wrong.</h3>
              <p className="mb-4">{error}</p>
              <button onClick={reset} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Try Again</button>
            </div>
          </div>
        )}
        {status === GenerationStatus.SUCCESS && lessonData && (
          <div className="w-full flex justify-center animate-fade-in-up">
            <WorksheetView data={lessonData} printMode={printMode} studentName={studentName} />
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-gray-400 text-sm no-print">
        <p>&copy; {new Date().getFullYear()} English Lesson Generator</p>
      </footer>
    </div>
  );
}

export default App;