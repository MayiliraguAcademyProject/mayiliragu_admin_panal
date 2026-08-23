import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  Trash2, 
  Sparkles,
  Layers,
  Plus,
  Zap
} from 'lucide-react';
import { apiClient, useExamCategories, useQuestionBatches } from '../../../core/api/endpoints';
import { useToast } from '../../../shared/context';
import { extractErrorMessage } from '../../../shared/utils';
import TestBuilderWizardModal from './TestBuilderWizardModal';

export interface SectionRangeConfig {
  id: string;
  name: string;
  fromNumber: number;
  toNumber: number;
  categoryId: string;
  subjectId: string;
  topicId: string;
  duration: number;
  cutoffMarks: number;
}

// Dynamic PDF.js ES module loader
const loadPdfJS = async (): Promise<any> => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }
  // @ts-ignore
  const pdfjsLib = await import(/* @vite-ignore */ 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs';
  (window as any).pdfjsLib = pdfjsLib;
  return pdfjsLib;
};

// Dynamic SheetJS loader
const loadSheetJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) {
      resolve((window as any).XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error('Failed to load SheetJS'));
    document.head.appendChild(script);
  });
};

interface LocalPDFParserProps {
  onSuccess: () => void;
}

export default function LocalPDFParser({ onSuccess }: LocalPDFParserProps) {
  const toast = useToast();
  const { data: categories = [] } = useExamCategories();
  const { data: existingBatches = [] } = useQuestionBatches();

  const allSubjects = useMemo(() => {
    return categories.flatMap((cat) => (cat.subjects || []).map((s) => ({ ...s, categoryId: cat.id })));
  }, [categories]);

  const allTopics = useMemo(() => {
    return allSubjects.flatMap((sub) => (sub.topics || []).map((t) => ({ ...t, subjectId: sub.id })));
  }, [allSubjects]);

  // State management
  const [file, setFile] = useState<File | null>(null);
  const [ansKeyFile, setAnsKeyFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const selectedSubject = '';
  const selectedTopic = '';
  const [customBatchName, setCustomBatchName] = useState('');

  // Multi-section range configuration state
  const [sectionsConfig, setSectionsConfig] = useState<SectionRangeConfig[]>([
    {
      id: 'sec_1',
      name: 'Section 1',
      fromNumber: 1,
      toNumber: 1,
      categoryId: '',
      subjectId: '',
      topicId: '',
      duration: 20,
      cutoffMarks: 35,
    }
  ]);

  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingStatusText, setParsingStatusText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[System Ready] Drop a PDF above to begin.']);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<'Detecting...' | 'IBPS PO / Banking' | 'TNPSC / State Exam' | 'SSC / Competitive'>('Detecting...');
  
  // OCR suggestion states
  const [showOcrBanner, setShowOcrBanner] = useState(false);
  const [tamilRatio, setTamilRatio] = useState(0);
  const [ocrTextHolder, setOcrTextHolder] = useState('');

  // Save & Test Builder states
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isTestWizardOpen, setIsTestWizardOpen] = useState(false);
  const [savedQuestionsForTest, setSavedQuestionsForTest] = useState<any[]>([]);

  // Search & Filter preview
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(false);
  const [filterNoAnswerOnly, setFilterNoAnswerOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = useMemo(() => {
    return parsedQuestions.filter(q => {
      if (filterIssuesOnly && !q.hasIssue) return false;
      if (filterNoAnswerOnly && !q.missingAnswer) return false;
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        return (
          (q.questionEn || '').toLowerCase().includes(query) ||
          (q.questionTa || '').toLowerCase().includes(query) ||
          (q.sharedContext || '').toLowerCase().includes(query) ||
          (q.optionA || '').toLowerCase().includes(query) ||
          (q.optionB || '').toLowerCase().includes(query) ||
          (q.optionC || '').toLowerCase().includes(query) ||
          (q.optionD || '').toLowerCase().includes(query) ||
          (q.format || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [parsedQuestions, filterIssuesOnly, filterNoAnswerOnly, searchQuery]);

  const hasComprehension = useMemo(() => {
    return parsedQuestions.some(q => q.sharedContext && q.sharedContext.trim().length > 0);
  }, [parsedQuestions]);

  const hasQuestionTa = useMemo(() => {
    return parsedQuestions.some(q => q.questionTa && q.questionTa.trim().length > 0);
  }, [parsedQuestions]);

  const hasOptionC = useMemo(() => {
    return parsedQuestions.some(q => q.optionC && q.optionC.trim().length > 0);
  }, [parsedQuestions]);

  const hasOptionD = useMemo(() => {
    return parsedQuestions.some(q => q.optionD && q.optionD.trim().length > 0);
  }, [parsedQuestions]);

  const hasOptionE = useMemo(() => {
    return parsedQuestions.some(q => q.optionE && q.optionE.trim().length > 0);
  }, [parsedQuestions]);

  // Simulator Drawer states
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ansKeyInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, _type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  useEffect(() => {
    // Satisfy unused variables rules due to commented out key dropzone
    const _unused = [ansKeyFile, ansKeyInputRef, FileText];
    if (_unused.length > 0 && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, ansKeyFile]);

  // Answer Key storage map reference
  const answerKeyMapRef = useRef<Map<number, string>>(new Map());

  // 1. Text Extractor logic
  const extractPdfText = async (arrayBuffer: ArrayBuffer, isAnswerKey = false, onProgress?: (page: number, total: number) => void) => {
    addLog(`Loading document via pdfjsLib...`);
    const pdfjsLib = await loadPdfJS();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    addLog(`Document initialized. Total pages: ${totalPages}`, 'success');

    let fullText = '';

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, totalPages);
      }
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const textItems = textContent.items.filter((item: any) => item.str.trim().length > 0);
      textItems.sort((a: any, b: any) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        if (Math.abs(yA - yB) > 5) {
          return yB - yA;
        }
        return a.transform[4] - b.transform[4];
      });

      let lastY = null;
      let pageText = '';
      for (const item of textItems) {
        const currentY = item.transform[5];
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = currentY;
      }
      fullText += pageText + '\n';
    }

    let localTamilRatio = 0.0;
    let status = 'UNICODE_OK';

    if (!isAnswerKey) {
      const nonWhitespaceChars = fullText.replace(/\s/g, '');
      const totalNonWhitespace = nonWhitespaceChars.length;
      if (totalNonWhitespace > 0) {
        let tamilCharCount = 0;
        let corruptedCharCount = 0;
        for (let i = 0; i < nonWhitespaceChars.length; i++) {
          const code = nonWhitespaceChars.charCodeAt(i);
          if (code >= 0x0b80 && code <= 0x0bff) {
            tamilCharCount++;
          } else if (code === 0xfffd || (code >= 0xe000 && code <= 0xf8ff)) {
            corruptedCharCount++;
          }
        }
        localTamilRatio = (tamilCharCount / totalNonWhitespace) * 100;
        const corruptedRatio = (corruptedCharCount / totalNonWhitespace) * 100;

        // Only flag as corrupted if there is a significant amount of unmapped/replacement glyphs
        if (corruptedRatio > 5.0) {
          status = 'UNICODE_CORRUPTED';
        }
      }
    }

    return {
      text: fullText,
      tamilRatio: localTamilRatio,
      status,
      pageCount: totalPages
    };
  };

  // 2. Parse Answer Key
  const parseAnswerKey = (rawText: string) => {
    answerKeyMapRef.current.clear();
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    addLog(`Scanning document text for answer keys (${lines.length} lines)...`);

    // Pattern A: S1. Ans.(a) or 1. Ans: (B) or Q1. Ans. A or 1. Ans. D or 1. Answer: A
    const patternDetailedAns = /(?:S|Q)?(\d{1,3})\s*[\.:\-]?\s*Ans(?:wer)?\.?\s*[:\-\.]?\s*[\(\[]?\s*([a-eA-E])\s*[\)\]]?/gi;
    
    // Pattern B: 1. (a) or 1. (A) or 1.(a) or 1[b]
    const patternParen = /(?:Q\.?)?(\d{1,3})\s*[\.:\-]?\s*[\(\[]\s*([a-eA-E])\s*[\)\]]/g;
    
    // Pattern C: 1) A or 1) a
    const patternBracket = /(?:Q\.?)?(\d{1,3})\)\s*([a-eA-E])\b/g;
    
    // Pattern D: 1 - A or 1 - (A) or 1: A or 1: (a) or 1–A
    const patternDash = /(?:Q\.?)?(\d{1,3})\s*[-–—:]\s*[\(\[]?\s*([a-eA-E])\s*[\)\]]?/g;
    
    // Pattern E: 1. A or 1. B or Q1. A
    const patternDot = /(?:Q\.?)?(\d{1,3})\s*\.\s*([a-eA-E])\b/g;

    // Pattern F: Tamil விடை e.g. 1. விடை: A or விடை (B)
    const patternTamil = /(\d{1,3})\s*[\.:\-]?\s*(?:விடை|விடைக்குறிப்பு)\s*[:\-\.]?\s*[\(\[]?\s*([a-eA-E])\s*[\)\]]?/gi;

    let match;

    // 1. Scan entire text with detailed answer pattern
    while ((match = patternDetailedAns.exec(rawText)) !== null) {
      const qNum = parseInt(match[1]);
      const opt = match[2].toUpperCase();
      if (qNum >= 1 && qNum <= 300) {
        answerKeyMapRef.current.set(qNum, opt);
      }
    }

    // 2. Scan entire text with Tamil answer pattern
    while ((match = patternTamil.exec(rawText)) !== null) {
      const qNum = parseInt(match[1]);
      const opt = match[2].toUpperCase();
      if (qNum >= 1 && qNum <= 300) {
        answerKeyMapRef.current.set(qNum, opt);
      }
    }

    // 3. Line by line parsing for tables, lists, and checkmarks
    let currentQNum: number | null = null;
    const questionRegex = /^\s*Q?(\d+)\.\s*(.*)$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const qMatch = line.match(questionRegex);
      if (qMatch) {
        currentQNum = parseInt(qMatch[1]);
      }

      // Checkmark in answer key / question lines
      const hasCheckmark = line.includes('✓') || line.includes('✔') || line.includes('☑');
      if (hasCheckmark && currentQNum !== null) {
        let parts = [line];
        if (line.includes('A)') && line.includes('B)')) {
          parts = line.split(/(?=[A-E]\))/);
        } else if (line.includes('(a)') && line.includes('(b)')) {
          parts = line.split(/(?=\([a-e]\))/);
        }

        for (const part of parts) {
          const partHasCheck = part.includes('✓') || part.includes('✔') || part.includes('☑');
          if (partHasCheck) {
            const mOpt = part.trim().match(/^\s*([A-E])\)/) || part.trim().match(/^\s*\(([a-e])\)/i);
            if (mOpt) {
              const optLetter = mOpt[1].toUpperCase();
              answerKeyMapRef.current.set(currentQNum, optLetter);
            }
          }
        }
      }

      // Grid / Table key parsing (e.g. 1 2 3 4 5 followed by A B C D E)
      const numTokens = line.split(/\s+/);
      if (numTokens.every(t => /^\d+$/.test(t)) && numTokens.length >= 3 && i + 1 < lines.length) {
        const nextLineTokens = lines[i + 1].split(/\s+/);
        if (nextLineTokens.every(t => /^[a-eA-E]$/.test(t)) && nextLineTokens.length === numTokens.length) {
          for (let k = 0; k < numTokens.length; k++) {
            const qNum = parseInt(numTokens[k]);
            const option = nextLineTokens[k].toUpperCase();
            answerKeyMapRef.current.set(qNum, option);
          }
          i++;
          continue;
        }
      }

      // Try patterns on each line
      patternParen.lastIndex = 0;
      while ((match = patternParen.exec(line)) !== null) {
        const qNum = parseInt(match[1]);
        if (qNum >= 1 && qNum <= 300) answerKeyMapRef.current.set(qNum, match[2].toUpperCase());
      }

      patternBracket.lastIndex = 0;
      while ((match = patternBracket.exec(line)) !== null) {
        const qNum = parseInt(match[1]);
        if (qNum >= 1 && qNum <= 300) answerKeyMapRef.current.set(qNum, match[2].toUpperCase());
      }

      patternDash.lastIndex = 0;
      while ((match = patternDash.exec(line)) !== null) {
        const qNum = parseInt(match[1]);
        if (qNum >= 1 && qNum <= 300) answerKeyMapRef.current.set(qNum, match[2].toUpperCase());
      }

      patternDot.lastIndex = 0;
      while ((match = patternDot.exec(line)) !== null) {
        const qNum = parseInt(match[1]);
        if (qNum >= 1 && qNum <= 300) answerKeyMapRef.current.set(qNum, match[2].toUpperCase());
      }

      // Standalone single-number line followed by option e.g. "1 A" or "1 [A]"
      const singleMatch = line.match(/^(\d{1,3})\s+[\(\[]?([a-eA-E])[\)\]]?$/);
      if (singleMatch) {
        const qNum = parseInt(singleMatch[1]);
        if (qNum >= 1 && qNum <= 300) answerKeyMapRef.current.set(qNum, singleMatch[2].toUpperCase());
      }
    }

    if (answerKeyMapRef.current.size > 0) {
      addLog(`Answer key parsing complete: mapped ${answerKeyMapRef.current.size} answers.`, 'success');
    }
  };

  // Bilingual splitter & repair
  const splitBilingual = (text: string) => {
    if (!text) return { en: '', ta: '' };
    
    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return { en: '', ta: '' };

    const tamilTokens: string[] = [];
    const latinTokens: string[] = [];

    for (const token of tokens) {
      const isTamil = [...token].some(c => {
        const code = c.charCodeAt(0);
        return code >= 0x0B80 && code <= 0x0BFF;
      });

      if (isTamil) {
        tamilTokens.push(token);
      } else {
        latinTokens.push(token);
      }
    }

    return {
      en: latinTokens.join(' ').trim(),
      ta: repairTamilText(tamilTokens.join(' ').trim())
    };
  };

  const repairTamilText = (str: string) => {
    if (!str) return '';
    let s = str;
    s = s.replace(/பகா/g, 'கொ');
    s = s.replace(/சதா/g, 'தொ');
    s = s.replace(/பபா/g, 'பொ');
    s = s.replace(/சதற்கு/g, 'தெற்கு');
    s = s.replace(/வநர/g, 'நேர');
    s = s.replace(/வமல/g, 'மேல');
    s = s.replace(/வெர்/g, 'சேர்');
    s = s.replace(/வந/g, 'நே');
    s = s.replace(/வம/g, 'மே');
    s = s.replace(/வெ/g, 'சே');
    s = s.replace(/பச/g, 'செ');
    s = s.replace(/ேது/g, 'வது');
    s = s.replace(/சத/g, 'சபை');
    s = s.replace(/லம/g, 'மை');
    s = s.replace(/லக/g, 'கை');
    s = s.replace(/ைா/g, 'லா');
    s = s.replace(/லற/g, 'றை');
    s = s.replace(/விே/g, 'விவ');
    s = s.replace(/ஆகிை/g, 'ஆகிய');
    s = s.replace(/இலை/g, 'இணை');
    s = s.replace(/எத்தலை/g, 'எத்தனை');
    s = s.replace(/நாட்களிலை/g, 'நாட்களிலே');
    s = s.replace(/உைர்த்த/g, 'உயர்த்த');
    s = s.replace(/கின்றை/g, 'கின்றன');
    s = s.replace(/மீ ைேர்/g, 'மீனவர்');
    s = s.replace(/உைக/g, 'உலக');
    s = s.replace(/உைவு/g, 'உணவு');
    s = s.replace(/தைாரி/g, 'தயாரி');
    s = s.replace(/இைந்திரம்/g, 'இயந்திரம்');
    s = s.replace(/சதாழிைாளர்/g, 'தொழிலாளர்');
    s = s.replace(/சவppமண்டய/g, 'வெப்பமண்டல');
    s = s.replace(/நிர்ோக/g, 'நிர்வாக');
    s = s.replace(/தலைேர்/g, 'தலைவர்');
    s = s.replace(/செைல்பாடுகலள/g, 'செயல்பாடுகளை');
    s = s.replace(/சவப்ப நிலை/g, 'வெப்ப நிலை');
    s = s.replace(/ேழி/g, 'வழி');
    s = s.replace(/ேலி/g, 'வலி');
    s = s.replace(/ேருடம்/g, 'வருடம்');
    s = s.replace(/மற்சறாரு/g, 'மற்றொரு');
    s = s.replace(/சபாருள்/g, 'பொருள்');
    return s;
  };

  const mergeAnswerKeyData = (questionsList: any[]) => {
    if (questionsList.length === 0) return;
    addLog(`Merging correct option keys...`);
    let mergedCount = 0;

    const updated = questionsList.map((q) => {
      let correct = q.correctOption;
      if (answerKeyMapRef.current.has(q.number)) {
        correct = answerKeyMapRef.current.get(q.number) || '';
        mergedCount++;
      }
      return {
        ...q,
        correctOption: correct,
        hasIssue: !q.optionA || !q.optionB,
        missingAnswer: !correct
      };
    });

    addLog(`Merged ${mergedCount} answer keys successfully.`, 'success');
    setParsedQuestions(updated);
  };

  const parseQuestions = (rawText: string) => {
    if (rawText.trim().length < 100) {
      addLog("Extracted text is too short. PDF is likely scanned/image-only.", 'error');
      alert('This PDF appears to be image-based or scanned. Only text-layer PDFs are supported.');
      setIsParsing(false);
      return;
    }

    addLog("Detecting question paper format standard...");
    const hasQPrefix = rawText.match(/\bQ\d+\./) !== null;
    const isBanking = hasQPrefix;
    const isSSC = !isBanking && rawText.match(/\([a-e]\)\s/i) !== null;

    if (isBanking) {
      setDetectedFormat('IBPS PO / Banking');
      addLog(`Detected Format: Banking (Q1. prefix)`);
    } else if (isSSC) {
      setDetectedFormat('SSC / Competitive');
      addLog(`Detected Format: SSC / Competitive ((a) prefix/inline)`);
    } else {
      setDetectedFormat('TNPSC / State Exam');
      addLog(`Detected Format: TNPSC (1. prefix)`);
    }

    // Automatically parse all answer keys from document
    parseAnswerKey(rawText);

    let text = rawText;

    text = text.split('\n').filter(line => {
      const t = line.trim();
      if (!t) return false;
      if (t.match(/^--\s*\d+\s+of\s+\d+\s*--$/i)) return false; 
      if (t.includes('www.Mayiliragu') || t.includes('Mayiliragu') && t.length < 20) return false;
      if (t.includes('Adda247 App') || t.includes('Memory Based Paper')) return false;
      if (t.includes('Join us TNPSC')) return false;
      if (t.match(/^TEST\s*[–\-]\s*\d+$/i)) return false;
      if (t.match(/^BANKING\s*\/\s*SSC/i)) return false;
      return true;
    }).join('\n');

    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const questionRegex = isBanking
      ? /^Q(\d+)\.\s*(.*)$/
      : /^(\d{1,3})\.\s+(\S.*)$/;

    const sectionMarkerRegex = /^Q\.\d+\s*\(/i;

    const optionStartRegex = isBanking
      ? /^\(([a-eA-E])\)\s*(.*)$/
      : /^(?:([A-E])\)|\(([a-eA-E])\))\s*(.*)$/;

    const directionsRegex = /^\s*Direc\s*tion\s*s?\s*\(\s*(\d+)\s*-\s*(\d+)\s*\):?\s*(.*)$/i;
    const solutionsBoundary = /^(S1\.\s*Ans\.|Answers\s*&\s*Explanations|Detailed\s*Solutions|Solutions\s*\(|^Solutions$|Answer\s*Key|விடை\s+வட்டங்கள்|விடைகள்|Ans\.?\s*$)/i;

    const lines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      lines.push(rawLines[i]);
    }

    const questions: any[] = [];
    let currentQuestion: any = null;
    let activeDirections = '';
    let activeDirectionsRange: any = null;

    const sectionHeaderRegex = /^(Blood Relations|Direction Sense|Seating Arrangement|Syllogism|Analogy|Odd One Out|Alphabet Series|Letter\/Number Coding|Mathematical Operations|Inequality|Ranking & Order|Missing Number|Statement & Conclusion|Data Sufficiency|Quantitative Aptitude|Reasoning Ability|English Language|General Awareness|Computer Aptitude|Current Affairs|General Studies|Topics:.*|Reasoning Practice.*)$/i;

    addLog(`Tokenized into ${lines.length} lines. Starting parser loop...`);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (solutionsBoundary.test(line)) {
        addLog(`Solutions section detected at line ${i}. Terminating question collection loop.`);
        break;
      }

      if (sectionHeaderRegex.test(line)) {
        continue;
      }

      if (line.includes('விடைகளுடன்') || line.includes('தேர்வு') || line.includes('டி.என்.பி.எஸ்.சி')) {
        continue;
      }

      if (sectionMarkerRegex.test(line)) continue;

      if (!isBanking) {
        const expectedNextNum = currentQuestion ? currentQuestion.number + 1 : 1;
        const inlineQMatch = line.match(/^(.+)\s+(\d{1,3})\.\s+(.+)$/);
        if (inlineQMatch) {
          const beforeNum = inlineQMatch[1].trimEnd();
          const qNum = parseInt(inlineQMatch[2]);
          const afterNum = inlineQMatch[3];
          const lastChar = beforeNum.slice(-1);
          const lastCharCode = lastChar.charCodeAt(0);
          
          const isTamilChar = lastCharCode >= 0x0B80 && lastCharCode <= 0x0BFF;
          const isBadChar = /[\d%\/=+\-*:,]/.test(lastChar) || isTamilChar;
          // ONLY split if qNum is the sequential next question AND we were already capturing options for the current question
          if (qNum === expectedNextNum && currentQuestion && currentQuestion.lastActiveOption !== null && !isBadChar) {
            line = beforeNum.trim();
            lines.splice(i + 1, 0, `${inlineQMatch[2]}. ${afterNum}`);
            addLog(`Splitting inline question ${qNum} out of text line at position ${beforeNum.length}`);
          }
        }
      }

      const dirMatch = line.match(directionsRegex);
      if (dirMatch) {
        if (currentQuestion) { questions.push(currentQuestion); currentQuestion = null; }
        activeDirections = dirMatch[3] || '';
        activeDirectionsRange = { start: parseInt(dirMatch[1]), end: parseInt(dirMatch[2]) };
        let nextIdx = i + 1;
        while (nextIdx < lines.length) {
          const nl = lines[nextIdx].trim();
          if (questionRegex.test(nl) || directionsRegex.test(nl)) break;
          activeDirections += ' ' + nl;
          nextIdx++;
        }
        i = nextIdx - 1;
        continue;
      }

      const qMatch = line.match(questionRegex);
      if (qMatch) {
        const qNum = parseInt(qMatch[1]);
        if (qNum >= 1 && qNum <= 200) {
          if (currentQuestion) {
            const lastText = currentQuestion.text.trim();
            if (lastText.endsWith(' ' + qNum) || lastText.endsWith(' ' + qNum + '.')) {
              currentQuestion.text = (currentQuestion.text + ' ' + qMatch[2]).trim();
              continue;
            }
            questions.push(currentQuestion);
          }

          const existingIdx = questions.findIndex(q => q.number === qNum);
          if (existingIdx !== -1) {
            currentQuestion = null; 
            continue;
          }

          let sharedContext = '';
          if (activeDirectionsRange && qNum >= activeDirectionsRange.start && qNum <= activeDirectionsRange.end) {
            sharedContext = activeDirections;
          }
          currentQuestion = {
            number: qNum,
            text: qMatch[2].trim(),
            sharedContext,
            options: {} as Record<string, string>,
            lastActiveOption: null as string | null,
          };
          continue;
        }
      }

      if (currentQuestion) {
        const singleOpt = line.match(optionStartRegex);
        if (singleOpt) {
          const label = isBanking ? singleOpt[1].toUpperCase() : (singleOpt[1] || singleOpt[2]).toUpperCase();
          let optText = isBanking ? singleOpt[2].trim() : singleOpt[3].trim();

          const isLineCheck = line.includes('✓') || line.includes('✔') || line.includes('☑');
          if (isLineCheck) {
            currentQuestion.correctOption = label;
          }

          const moreOptMatch = isBanking
            ? optText.match(/\s+([B-E])\)\s/)
            : optText.match(/\s+(?:([B-E])\)|\(([b-eA-E])\))\s/);
          if (moreOptMatch) {
            const fullOptLine = line; 
            const optParts = isBanking
              ? fullOptLine.split(/\s+(?=[A-E]\))/)
              : fullOptLine.split(/\s+(?=(?:[A-E]\)|\([a-eA-E]\)))/);
            for (const part of optParts) {
              const m = part.trim().match(optionStartRegex);
              if (m) {
                const lbl = isBanking ? m[1].toUpperCase() : (m[1] || m[2]).toUpperCase();
                const val = isBanking ? m[2].trim() : m[3].trim();
                const isPartCheck = part.includes('✓') || part.includes('✔') || part.includes('☑');
                if (isPartCheck) {
                  currentQuestion.correctOption = lbl;
                }
                currentQuestion.options[lbl] = val;
                currentQuestion.lastActiveOption = lbl;
              }
            }
          } else {
            currentQuestion.options[label] = optText;
            currentQuestion.lastActiveOption = label;
          }
          continue;
        }

        if (currentQuestion.lastActiveOption !== null) {
          const existing = currentQuestion.options[currentQuestion.lastActiveOption] || '';
          currentQuestion.options[currentQuestion.lastActiveOption] = (existing + ' ' + line).trim();
        } else {
          currentQuestion.text = (currentQuestion.text + ' ' + line).trim();
        }
      }
    }

    if (currentQuestion) questions.push(currentQuestion);

    const extractInlineOptions = (text: string): { questionBody: string, options: Record<string, string> } | null => {
      const matchA = text.match(/\([aA]\)/);
      if (!matchA || matchA.index === undefined) return null;

      const firstOptIndex = matchA.index;
      const questionBody = text.substring(0, firstOptIndex).trim();
      const optionsText = text.substring(firstOptIndex);

      const optionRegex = /\(([a-eA-E])\)\s*((?:(?!\([a-eA-E]\)).)+)/g;
      const options: Record<string, string> = {};
      let match;
      let count = 0;

      while ((match = optionRegex.exec(optionsText)) !== null) {
        const label = match[1].toUpperCase();
        const val = match[2].trim();
        options[label] = val;
        count++;
      }

      if (count < 2) return null;
      return { questionBody, options };
    };

    // Post-processing pass for inline options (fallback)
    for (const q of questions) {
      if (Object.keys(q.options).length === 0) {
        const result = extractInlineOptions(q.text);
        if (result) {
          q.options = result.options;
          q.text = result.questionBody;
        }
      }
    }

    addLog(`Base parse complete: ${questions.length} questions constructed. Processing keys...`);

    const answersMap: Record<number, string> = {};
    const answerRegex = /(?:S)?(\d+)\.\s*Ans\.\s*\(([a-eA-E])\)/gi;
    let ansMatch;
    while ((ansMatch = answerRegex.exec(rawText)) !== null) {
      answersMap[parseInt(ansMatch[1])] = ansMatch[2].toUpperCase();
    }

    const seenNums = new Set();
    const uniqueQuestions = questions.filter(q => {
      if (seenNums.has(q.number)) return false;
      seenNums.add(q.number);
      return true;
    });

    const mappedQuestions = uniqueQuestions.map(q => {
      if ((!q.options['A'] || !q.options['B']) && q.sharedContext) {
        const parts = q.sharedContext.split(/(?=\([a-e]\))/i);
        for (const part of parts) {
          const m = part.trim().match(/^\(([a-eA-E])\)\s*([\s\S]*)$/);
          if (m) q.options[m[1].toUpperCase()] = m[2].trim();
        }
      }

      const optA = q.options['A'] || '';
      const optB = q.options['B'] || '';
      const optC = q.options['C'] || '';
      const optD = q.options['D'] || '';
      const optE = q.options['E'] || '';

      const correct = q.correctOption || answerKeyMapRef.current.get(q.number) || answersMap[q.number] || '';
      const hasIssue = !optA || !optB;
      const missingAnswer = !correct;

      let cleanOptE = optE;
      const inlineCleanupIndex = cleanOptE.search(/Direc\s*tions?\s*\(\s*\d+\s*-\s*\d+\s*\)/i);
      if (inlineCleanupIndex !== -1) cleanOptE = cleanOptE.substring(0, inlineCleanupIndex).trim();

      const stripChecks = (s: string) => s ? s.replace(/[✓✔☑]/g, '').trim() : '';

      const splitQ = splitBilingual(stripChecks(q.text));
      const splitOptA = splitBilingual(stripChecks(optA));
      const splitOptB = splitBilingual(stripChecks(optB));
      const splitOptC = splitBilingual(stripChecks(optC));
      const splitOptD = splitBilingual(stripChecks(optD));
      const splitOptE = splitBilingual(stripChecks(cleanOptE));
      const splitCtx = splitBilingual(stripChecks(q.sharedContext));

      return {
        number: q.number,
        type: 'SINGLE_CHOICE',
        questionEn: splitQ.en,
        questionTa: splitQ.ta,
        optionA: splitOptA.en,
        optionATa: splitOptA.ta,
        optionB: splitOptB.en,
        optionBTa: splitOptB.ta,
        optionC: splitOptC.en,
        optionCTa: splitOptC.ta,
        optionD: splitOptD.en,
        optionDTa: splitOptD.ta,
        optionE: splitOptE.en,
        optionETa: splitOptE.ta,
        correctOption: correct,
        sharedContext: splitCtx.en || splitCtx.ta,
        hasIssue,
        missingAnswer,
        examCategory: isBanking ? 'IBPS_PO' : 'TNPSC_GROUP_2_4',
        negativeMarks: isBanking ? 0.25 : 0.0,
        negativeEnabled: isBanking ? 'TRUE' : 'FALSE',
        subjectId: selectedSubject,
        topicId: selectedTopic,
        format: q.sharedContext ? 'READING_COMPREHENSION' : 'STANDARD',
        tableData: '',
        images: ''
      };
    });

    const catToUse = isBanking ? 'IBPS_PO' : 'TNPSC_GROUP_2_4';
    setSelectedCategory(catToUse);

    const finalizedList = mappedQuestions.map(mq => ({
      ...mq,
      examCategory: catToUse
    }));

    // Rich Console Output for Easy Debugging
    console.group('📄 [PDF PARSER RESULT]');
    console.log(`%cTotal questions detected: ${finalizedList.length}`, 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.table(finalizedList.map(q => ({
      '#': q.number,
      'Question': q.questionEn.length > 50 ? q.questionEn.substring(0, 50) + '...' : q.questionEn,
      'A': q.optionA,
      'B': q.optionB,
      'C': q.optionC,
      'D': q.optionD,
      'E': q.optionE,
      'Answer': q.correctOption || '⚠ Missing',
      'Status': q.hasIssue ? '❌ Issue' : '✅ OK'
    })));
    console.log('Full Parsed Objects:', finalizedList);
    console.groupEnd();

    console.group('🔑 [PARSED ANSWER KEYS]');
    console.log(`Total answer keys mapped: ${answerKeyMapRef.current.size}`);
    const ansObj: Record<string, string> = {};
    answerKeyMapRef.current.forEach((val, key) => { ansObj[`Q${key}`] = val; });
    console.log(ansObj);
    console.groupEnd();

    setParsedQuestions(finalizedList);
    if (finalizedList.length > 0) {
      setSectionsConfig(prev => {
        if (prev.length === 1 && prev[0].toNumber <= 1) {
          return [{
            ...prev[0],
            toNumber: finalizedList.length,
            duration: Math.max(10, Math.round(finalizedList.length * 1.5)),
            cutoffMarks: Math.max(1, Math.round(finalizedList.length * 0.4)),
          }];
        }
        return prev;
      });
    }
    setIsParsing(false);
    setSelectedQuestionIndex(0);
    addLog(`All ${finalizedList.length} questions parsed and rendered successfully!`, 'success');
  };

  const handleFileDrop = async (e: React.DragEvent, type: 'questions' | 'key') => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (type === 'questions') {
      setFile(droppedFile);
      addLog(`Selected main PDF file: ${droppedFile.name}`);
      await processQuestionsFile(droppedFile);
    } else {
      setAnsKeyFile(droppedFile);
      addLog(`Selected answer key PDF: ${droppedFile.name}`);
      await processAnswerKeyFile(droppedFile);
    }
  };

  const processQuestionsFile = async (questionsFile: File) => {
    setShowOcrBanner(false);
    setIsParsing(true);
    setParsingProgress(0);
    setParsingStatusText('Reading PDF text...');
    const cleanName = questionsFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    setCustomBatchName(cleanName);

    try {
      const arrayBuffer = await questionsFile.arrayBuffer();
      const extraction = await extractPdfText(arrayBuffer, false, (page, total) => {
        setParsingProgress(Math.round((page / total) * 100));
        setParsingStatusText(`Extracting PDF: Page ${page} of ${total}...`);
      });

      if (extraction.status === 'UNICODE_CORRUPTED') {
        setTamilRatio(extraction.tamilRatio);
        setOcrTextHolder(extraction.text);
        setShowOcrBanner(true);
        setIsParsing(false);
        addLog(`Corrupted encoding detected. Tamil Ratio: ${extraction.tamilRatio.toFixed(2)}%`, 'warn');
      } else {
        parseQuestions(extraction.text);
      }
    } catch (err: any) {
      addLog(`Parsing failed: ${err.message}`, 'error');
      setIsParsing(false);
    }
  };

  const processAnswerKeyFile = async (keyFile: File) => {
    try {
      const arrayBuffer = await keyFile.arrayBuffer();
      const extraction = await extractPdfText(arrayBuffer, true);
      parseAnswerKey(extraction.text);
      
      if (parsedQuestions.length > 0) {
        mergeAnswerKeyData(parsedQuestions);
      }
    } catch (err: any) {
      addLog(`Failed to parse answer key: ${err.message}`, 'error');
    }
  };

  // Direct database uploader
  const handleSaveToDatabase = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSaving(true);
    setSaveProgress(0);

    try {
      addLog(`Preparing bulk payload of ${parsedQuestions.length} questions...`);
      const payload = parsedQuestions.map(q => {
        const optionsList = [
          { id: 'A', text_en: q.optionA, text_ta: q.optionATa },
          { id: 'B', text_en: q.optionB, text_ta: q.optionBTa },
          { id: 'C', text_en: q.optionC, text_ta: q.optionCTa },
          { id: 'D', text_en: q.optionD, text_ta: q.optionDTa },
          { id: 'E', text_en: q.optionE, text_ta: q.optionETa }
        ].filter(o => o.text_en || o.text_ta);

        return {
          type: q.type,
          question_text_en: q.questionEn,
          question_text_ta: q.questionTa || null,
          subject_id: q.subjectId || selectedSubject || null,
          topic_id: q.topicId || selectedTopic || null,
          exam_category: q.examCategory || selectedCategory,
          difficulty: 'MEDIUM',
          explanation_en: '',
          explanation_ta: '',
          marks: {
            correct: 1,
            wrong: q.negativeMarks || 0,
            partial: 0,
            negative_enabled: q.negativeEnabled === 'TRUE'
          },
          tags: [],
          source_batch: customBatchName.trim() || file?.name || 'Manual Upload',
          is_published: true,
          options: optionsList,
          correct_option_id: q.correctOption || null,
          format: q.format || 'STANDARD',
          shared_context_en: q.sharedContext || null
        };
      });

      addLog(`Uploading to database in a single bulk request...`);
      setSaveProgress(50);
      await apiClient.post('/questions/bulk', payload);
      setSaveProgress(100);

      addLog(`SUCCESS! Uploaded all ${parsedQuestions.length} questions directly into database!`, 'success');
      toast.success(`Successfully saved ${parsedQuestions.length} questions to database.`);
      onSuccess();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      addLog(`Database upload failed: ${msg}`, 'error');
      toast.error(`Save failed: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Fast-Track: Save questions and directly launch Test Builder Wizard
  const handleSaveAndCreateTest = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSaving(true);
    setIsCreatingTest(true);
    setSaveProgress(0);

    try {
      addLog(`Preparing bulk payload of ${parsedQuestions.length} questions for Test Assessment...`);
      const payload = parsedQuestions.map(q => {
        const optionsList = [
          { id: 'A', text_en: q.optionA, text_ta: q.optionATa },
          { id: 'B', text_en: q.optionB, text_ta: q.optionBTa },
          { id: 'C', text_en: q.optionC, text_ta: q.optionCTa },
          { id: 'D', text_en: q.optionD, text_ta: q.optionDTa },
          { id: 'E', text_en: q.optionE, text_ta: q.optionETa }
        ].filter(o => o.text_en || o.text_ta);

        return {
          type: q.type,
          question_text_en: q.questionEn,
          question_text_ta: q.questionTa || null,
          subject_id: q.subjectId || selectedSubject || null,
          topic_id: q.topicId || selectedTopic || null,
          exam_category: q.examCategory || selectedCategory,
          difficulty: 'MEDIUM',
          explanation_en: '',
          explanation_ta: '',
          marks: {
            correct: 1,
            wrong: q.negativeMarks || 0,
            partial: 0,
            negative_enabled: q.negativeEnabled === 'TRUE'
          },
          tags: [],
          source_batch: customBatchName.trim() || file?.name || 'Manual Upload',
          is_published: true,
          options: optionsList,
          correct_option_id: q.correctOption || null,
          format: q.format || 'STANDARD',
          shared_context_en: q.sharedContext || null
        };
      });

      addLog(`Uploading questions to database...`);
      setSaveProgress(50);
      const res = await apiClient.post('/questions/bulk', payload);
      setSaveProgress(100);

      const createdQuestions = res.data.data || [];
      addLog(`SUCCESS! Saved ${createdQuestions.length} questions. Opening Test Builder...`, 'success');
      toast.success(`Saved ${createdQuestions.length} questions. Opening Test Builder...`);

      setSavedQuestionsForTest(createdQuestions);
      setIsTestWizardOpen(true);
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      addLog(`Failed to save and launch test: ${msg}`, 'error');
      toast.error(`Save failed: ${msg}`);
    } finally {
      setIsSaving(false);
      setIsCreatingTest(false);
    }
  };

  const handleTestBuilderSubmit = async (testPayload: any) => {
    try {
      await apiClient.post('/tests', testPayload);
      toast.success('Test Assessment created and published successfully!');
      setIsTestWizardOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
      throw err;
    }
  };

  const handleDownloadExcel = async () => {
    if (parsedQuestions.length === 0) return;
    try {
      const XLSX = await loadSheetJS();
      const excelRows = parsedQuestions.map(q => ({
        'Type': q.type,
        'Question (EN)': q.questionEn,
        'Question (TA)': q.questionTa || '',
        'Exam Category': q.examCategory,
        'Subject ID': q.subjectId,
        'Topic ID': q.topicId,
        'Format': q.format || 'STANDARD',
        'Difficulty': 'MEDIUM',
        'Marks': 1,
        'Negative Marks': q.negativeMarks,
        'Negative Enabled': q.negativeEnabled,
        'Explanation (EN)': '',
        'Explanation (TA)': '',
        'Tags': '',
        'Correct Option Label': q.correctOption || 'A',
        'Option A (EN)': q.optionA,
        'Option A (TA)': q.optionATa || '',
        'Option B (EN)': q.optionB,
        'Option B (TA)': q.optionBTa || '',
        'Option C (EN)': q.optionC,
        'Option C (TA)': q.optionCTa || '',
        'Option D (EN)': q.optionD,
        'Option D (TA)': q.optionDTa || '',
        'Option E (EN)': q.optionE,
        'Option E (TA)': q.optionETa || '',
        'Table Data': q.tableData || '',
        'Images': q.images || '',
        'Shared Context (EN)': q.sharedContext || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
      XLSX.writeFile(workbook, `${file?.name?.replace(/\.[^/.]+$/, "") || 'parsed'}_questions.xlsx`);
      addLog("Excel sheet generated and downloaded successfully.", 'success');
    } catch (err: any) {
      addLog(`Failed to build Excel: ${err.message}`, 'error');
    }
  };

  const handleAddSection = () => {
    const lastSection = sectionsConfig[sectionsConfig.length - 1];
    const nextFrom = lastSection ? lastSection.toNumber + 1 : 1;
    const nextTo = Math.max(nextFrom, parsedQuestions.length || (nextFrom + 24));
    
    const newSection: SectionRangeConfig = {
      id: `sec_${Date.now()}`,
      name: `Section ${sectionsConfig.length + 1}`,
      fromNumber: nextFrom,
      toNumber: nextTo,
      categoryId: selectedCategory || (lastSection?.categoryId || ''),
      subjectId: '',
      topicId: '',
      duration: 20,
      cutoffMarks: 35,
    };
    setSectionsConfig(prev => [...prev, newSection]);
  };

  const handleRemoveSection = (index: number) => {
    if (sectionsConfig.length <= 1) return;
    setSectionsConfig(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSection = (index: number, field: keyof SectionRangeConfig, val: any) => {
    setSectionsConfig(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      if (field === 'categoryId') {
        updated[index].subjectId = '';
        updated[index].topicId = '';
      }
      if (field === 'subjectId') {
        updated[index].topicId = '';
      }
      return updated;
    });
  };

  const handleApplyTaxonomyToQuestions = () => {
    if (parsedQuestions.length === 0) {
      toast.error('No parsed questions to tag.');
      return;
    }
    
    setParsedQuestions(prev => prev.map(q => {
      const matchingSection = sectionsConfig.find(s => q.number >= s.fromNumber && q.number <= s.toNumber);
      if (!matchingSection) return q;

      return {
        ...q,
        sectionName: matchingSection.name,
        examCategory: matchingSection.categoryId || q.examCategory || selectedCategory,
        subjectId: matchingSection.subjectId || q.subjectId || selectedSubject,
        topicId: matchingSection.topicId || q.topicId || selectedTopic,
      };
    }));

    toast.success(`Applied taxonomy across ${sectionsConfig.length} section(s) to ${parsedQuestions.length} questions.`);
  };

  const handleCellBlur = (idx: number, field: string, value: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      const optA = field === 'optionA' ? value : copy[idx].optionA;
      const optB = field === 'optionB' ? value : copy[idx].optionB;
      const correct = field === 'correctOption' ? value : copy[idx].correctOption;

      copy[idx] = {
        ...copy[idx],
        [field]: field === 'number' ? (parseInt(value) || 0) : value,
        hasIssue: !optA || !optB,
        missingAnswer: !correct
      };
      if (field === 'subjectId') {
        const subjectTopics = allTopics.filter(t => t.subjectId === value);
        if (!subjectTopics.some(t => t.id === copy[idx].topicId)) {
          copy[idx].topicId = '';
        }
      }
      return copy;
    });
  };
  const handleDeleteRow = (idx: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setParsedQuestions((prev) => {
        const copy = prev.filter((_, i) => i !== idx);
        if (selectedQuestionIndex >= copy.length) {
          setSelectedQuestionIndex(Math.max(0, copy.length - 1));
        }
        return copy;
      });
      addLog(`Deleted question at row index ${idx + 1}.`, 'warn');
    }
  };


  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        {/* Dropzone Questions */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, 'questions')}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border/85 hover:border-accent rounded-3xl p-8 text-center cursor-pointer transition-colors bg-cardBg shadow-xs"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && processQuestionsFile(e.target.files[0])}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto mb-3 text-text-secondary" />
          {file ? (
            <div className="inline-block max-w-full px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 text-xs font-bold truncate">
              📄 {file.name}
            </div>
          ) : (
            <p className="text-sm font-semibold text-text-primary">
              Drag & drop Question paper PDF
            </p>
          )}
          <p className="text-xs text-text-secondary mt-1">Local processing, no server load</p>
        </div>

        {/* Dropzone Answer Key */}
        {/* <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, 'key')}
          onClick={() => ansKeyInputRef.current?.click()}
          className="border-2 border-dashed border-border/85 hover:border-accent rounded-3xl p-6 text-center cursor-pointer transition-colors bg-cardBg"
        >
          <input
            ref={ansKeyInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && processAnswerKeyFile(e.target.files[0])}
            className="hidden"
          />
          <FileText className="w-8 h-8 mx-auto mb-3 text-text-secondary" />
          {ansKeyFile ? (
            <div className="inline-block max-w-full px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full border border-indigo-500/20 text-xs font-bold truncate">
              🔑 {ansKeyFile.name}
            </div>
          ) : (
            <p className="text-sm font-semibold text-text-primary">
              Drag & drop Answer Key PDF (Optional)
            </p>
          )}
          <p className="text-xs text-text-secondary mt-1">Automatically maps option answers</p>
        </div> */}
      </div>

      {isParsing && (
        <div className="bg-cardBg border border-border/45 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-bold text-text-secondary">
            <span>{parsingStatusText}</span>
            <span>{parsingProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-accent h-full transition-all duration-200" style={{ width: `${parsingProgress}%` }} />
          </div>
        </div>
      )}

      {showOcrBanner && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-600 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Tamil encoding corrupted</span>
            <span className="text-xs px-2 py-0.5 bg-amber-500/20 rounded-md">Ratio: {tamilRatio.toFixed(2)}%</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            This PDF has scanned pages or custom encodings. You can still try to extract English text.
          </p>
          <button
            onClick={() => {
              setShowOcrBanner(false);
              parseQuestions(ocrTextHolder);
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            Extract English Only
          </button>
        </div>
      )}

      {/* Section & Taxonomy Range Manager Card */}
      {parsedQuestions.length > 0 && (
        <div className="bg-cardBg border border-border/45 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                  Sections & Taxonomy Configuration
                </h3>
                <p className="text-[10px] font-semibold text-text-secondary">
                  Define timed sections with subject & topic taxonomy for mock test series
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Batch Name Input Field */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/60 border border-border/50 rounded-xl px-3 py-1.5">
                <span className="text-[10px] font-black uppercase text-text-secondary">Batch:</span>
                <input
                  type="text"
                  list="pdf-batch-suggestions"
                  value={customBatchName}
                  onChange={(e) => setCustomBatchName(e.target.value)}
                  placeholder="e.g. TNPSC Mock 1"
                  className="bg-transparent border-none outline-none text-xs font-bold text-text-primary w-40"
                />
                <datalist id="pdf-batch-suggestions">
                  {existingBatches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.count} questions)
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Apply Taxonomy to Questions Button */}
              <button
                type="button"
                onClick={handleApplyTaxonomyToQuestions}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                title="Tag all parsed questions with these section subjects & topics"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Apply Taxonomy to Questions</span>
              </button>
            </div>
          </div>

          {/* Section Rows Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-text-secondary uppercase tracking-wider border-b border-border/40 pb-2">
                  <th className="py-2 px-2 w-8 text-center">#</th>
                  <th className="py-2 px-2 min-w-[180px]">Section Name</th>
                  <th className="py-2 px-2 min-w-[150px]">Question Range</th>
                  <th className="py-2 px-2 min-w-[140px]">Exam Category</th>
                  <th className="py-2 px-2 min-w-[160px]">Subject</th>
                  <th className="py-2 px-2 min-w-[160px]">Topic</th>
                  <th className="py-2 px-2 w-24">⏱️ Time (min)</th>
                  <th className="py-2 px-2 w-24">🎯 Cutoff</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sectionsConfig.map((sec, sIdx) => {
                  const secCategorySubjects = sec.categoryId 
                    ? allSubjects.filter(s => s.categoryId === sec.categoryId)
                    : allSubjects;
                  const secSubjectTopics = sec.subjectId
                    ? allTopics.filter(t => t.subjectId === sec.subjectId)
                    : [];
                  const qCount = Math.max(0, sec.toNumber - sec.fromNumber + 1);

                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-xs">
                      <td className="py-2.5 px-2 text-center font-black text-text-secondary">
                        {sIdx + 1}
                      </td>

                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) => handleUpdateSection(sIdx, 'name', e.target.value)}
                          placeholder={`Section ${sIdx + 1} Name`}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-accent"
                        />
                      </td>

                      <td className="py-2.5 px-2">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            min={1}
                            max={parsedQuestions.length || 999}
                            value={sec.fromNumber}
                            onChange={(e) => handleUpdateSection(sIdx, 'fromNumber', parseInt(e.target.value) || 1)}
                            className="w-14 bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-center text-text-primary outline-none focus:border-accent"
                          />
                          <span className="text-[10px] font-bold text-text-secondary">to</span>
                          <input
                            type="number"
                            min={sec.fromNumber}
                            max={parsedQuestions.length || 999}
                            value={sec.toNumber}
                            onChange={(e) => handleUpdateSection(sIdx, 'toNumber', parseInt(e.target.value) || sec.fromNumber)}
                            className="w-14 bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-center text-text-primary outline-none focus:border-accent"
                          />
                          <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-black text-[9px]">
                            {qCount} Qs
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2">
                        <select
                          value={sec.categoryId}
                          onChange={(e) => handleUpdateSection(sIdx, 'categoryId', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-text-secondary outline-none focus:border-accent"
                        >
                          <option value="">(Select Category)</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-2">
                        <select
                          value={sec.subjectId}
                          onChange={(e) => handleUpdateSection(sIdx, 'subjectId', e.target.value)}
                          disabled={!sec.categoryId && categories.length > 0}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-text-secondary outline-none focus:border-accent disabled:opacity-40"
                        >
                          <option value="">(Select Subject)</option>
                          {secCategorySubjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-2">
                        <select
                          value={sec.topicId}
                          onChange={(e) => handleUpdateSection(sIdx, 'topicId', e.target.value)}
                          disabled={!sec.subjectId}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-text-secondary outline-none focus:border-accent disabled:opacity-40"
                        >
                          <option value="">(All / Optional Topic)</option>
                          {secSubjectTopics.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-2">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min={1}
                            value={sec.duration}
                            onChange={(e) => handleUpdateSection(sIdx, 'duration', parseInt(e.target.value) || 1)}
                            className="w-14 bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-center text-text-primary outline-none focus:border-accent"
                          />
                          <span className="text-[9px] font-semibold text-text-secondary">min</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min={0}
                            value={sec.cutoffMarks}
                            onChange={(e) => handleUpdateSection(sIdx, 'cutoffMarks', parseInt(e.target.value) || 0)}
                            className="w-14 bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-center text-text-primary outline-none focus:border-accent"
                          />
                          <span className="text-[9px] font-semibold text-text-secondary">marks</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {sectionsConfig.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sIdx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Remove section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <button
              type="button"
              onClick={handleAddSection}
              className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-black rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>

            <span className="text-[10px] font-bold text-text-secondary">
              {parsedQuestions.length} total questions partitioned across {sectionsConfig.length} section(s)
            </span>
          </div>
        </div>
      )}

      {/* Log traces */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">System Log Trace</span>
          <button onClick={() => setLogs([])} className="text-[9px] text-slate-500 hover:text-slate-300">Clear</button>
        </div>
        <div ref={logContainerRef} className="font-mono text-[10px] text-slate-400 h-20 overflow-y-auto space-y-1 font-semibold">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>

      {/* Preview Workspace Area */}
      {parsedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                {detectedFormat}
              </span>
              {file && (
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-text-primary px-2 py-0.5 rounded border border-border/20 max-w-[200px] truncate" title={file.name}>
                  📄 {file.name}
                </span>
              )}
              <span className="text-xs font-bold text-text-secondary">
                Total parsed: {parsedQuestions.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search preview..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 px-3 py-1.5 text-xs bg-slate-50 border border-border/50 rounded-xl outline-none focus:border-accent font-semibold text-text-primary placeholder:text-text-secondary"
              />
              <button
                onClick={() => {
                  setFilterIssuesOnly(!filterIssuesOnly);
                  setFilterNoAnswerOnly(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all ${
                  filterIssuesOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-slate-50 border-border/50 text-text-secondary'
                }`}
              >
                Issues Only ({parsedQuestions.filter(q => q.hasIssue).length})
              </button>

              <button
                onClick={() => {
                  setFilterNoAnswerOnly(!filterNoAnswerOnly);
                  setFilterIssuesOnly(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all ${
                  filterNoAnswerOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-slate-50 border-border/50 text-text-secondary'
                }`}
              >
                No Answer ({parsedQuestions.filter(q => q.missingAnswer).length})
              </button>
              
              <button
                onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
                className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all ${
                  isSimulatorOpen ? 'bg-primary text-white border-primary' : 'bg-slate-50 border-border/50 text-text-secondary'
                }`}
              >
                📱 {isSimulatorOpen ? 'Hide Simulator' : 'Simulator Preview'}
              </button>

              <button
                onClick={handleDownloadExcel}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-border/50 text-text-secondary font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                title="Save questions to question bank only"
              >
                {isSaving && !isCreatingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving ({saveProgress}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save to Question Bank</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveAndCreateTest}
                disabled={isSaving}
                className="px-4.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer border border-blue-400/30"
                title="1-Click: Save questions and immediately launch test builder with these questions pre-selected"
              >
                {isCreatingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing Test ({saveProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Save & Create Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className={`${isSimulatorOpen ? 'col-span-12 lg:col-span-8' : 'col-span-12'} w-full overflow-x-auto overflow-y-auto max-h-[500px] border border-border/50 rounded-2xl bg-cardBg`}>
              <table className="w-full text-left border-collapse min-w-[2400px]">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                  <tr className="text-[10px] font-bold text-text-secondary uppercase">
                    <th className="py-2.5 px-3 w-12 text-center bg-slate-50 dark:bg-slate-900">#</th>
                    <th className="py-2.5 px-3 w-36 min-w-[140px] bg-slate-50 dark:bg-slate-900">Section</th>
                    <th className="py-2.5 px-3 w-40 min-w-[150px] bg-slate-50 dark:bg-slate-900">Subject</th>
                    <th className="py-2.5 px-3 w-40 min-w-[150px] bg-slate-50 dark:bg-slate-900">Topic</th>
                    <th className="py-2.5 px-3 w-36 bg-slate-50 dark:bg-slate-900">Format</th>
                    {hasComprehension && <th className="py-2.5 px-3 w-96 min-w-[380px] bg-slate-50 dark:bg-slate-900">Comprehension</th>}
                    <th className="py-2.5 px-3 w-96 min-w-[380px] bg-slate-50 dark:bg-slate-900">Question EN</th>
                    {hasQuestionTa && <th className="py-2.5 px-3 w-96 min-w-[380px] bg-slate-50 dark:bg-slate-900">Question TA</th>}
                    <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option A</th>
                    <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option B</th>
                    {hasOptionC && <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option C</th>}
                    {hasOptionD && <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option D</th>}
                    {hasOptionE && <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option E</th>}
                    <th className="py-2.5 px-3 w-20 text-center bg-slate-50 dark:bg-slate-900">Answer</th>
                    <th className="py-2.5 px-3 w-20 text-center bg-slate-50 dark:bg-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-xs font-semibold text-text-primary">
                  {filteredQuestions.map((q) => {
                    const originalIdx = parsedQuestions.indexOf(q);
                    const isSelected = selectedQuestionIndex === originalIdx && isSimulatorOpen;
                    return (
                      <tr
                        key={originalIdx}
                        onClick={() => {
                          setSelectedQuestionIndex(originalIdx);
                          setIsSimulatorOpen(true);
                        }}
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          q.hasIssue ? 'bg-amber-500/5' : ''
                        } ${isSelected ? 'bg-accent/5 border-l-4 border-l-accent' : ''}`}
                      >
                        <td className="py-5 px-3 w-12 text-center text-text-secondary font-bold">
                          <input
                            type="number"
                            value={q.number}
                            title={`Question number: ${q.number}`}
                            onChange={(e) => handleCellBlur(originalIdx, 'number', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs text-center font-bold text-text-secondary py-1"
                          />
                        </td>
                        <td className="py-5 px-3 w-36 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={q.sectionName || ''}
                            placeholder="Section Name"
                            title={`Section: ${q.sectionName || 'None'}`}
                            onChange={(e) => handleCellBlur(originalIdx, 'sectionName', e.target.value)}
                            className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-border/40 rounded-lg px-2 py-1 text-[11px] font-bold text-text-primary outline-none focus:border-accent"
                          />
                        </td>
                        <td className="py-5 px-3 w-40 min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={q.subjectId || ''}
                            onChange={(e) => handleCellBlur(originalIdx, 'subjectId', e.target.value)}
                            className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-border/40 rounded-lg px-2 py-1 text-[11px] font-bold text-text-secondary outline-none focus:border-accent"
                          >
                            <option value="">(No Subject)</option>
                            {(q.examCategory ? allSubjects.filter(s => s.categoryId === q.examCategory) : allSubjects).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-5 px-3 w-40 min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={q.topicId || ''}
                            onChange={(e) => handleCellBlur(originalIdx, 'topicId', e.target.value)}
                            disabled={!q.subjectId}
                            className="w-full bg-slate-50/70 dark:bg-slate-800/60 border border-border/40 rounded-lg px-2 py-1 text-[11px] font-bold text-text-secondary outline-none focus:border-accent disabled:opacity-40"
                          >
                            <option value="">(No Topic)</option>
                            {allTopics.filter(t => t.subjectId === q.subjectId).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-5 px-3 w-36">
                          <input
                            type="text"
                            value={q.format}
                            title={q.format}
                            onChange={(e) => handleCellBlur(originalIdx, 'format', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-semibold py-1"
                          />
                        </td>
                        {hasComprehension && (
                          <td className="py-5 px-3 w-96 min-w-[380px]">
                            <textarea
                              value={q.sharedContext || ''}
                              title={q.sharedContext || ''}
                              rows={6}
                              onChange={(e) => handleCellBlur(originalIdx, 'sharedContext', e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-xs font-semibold resize-none"
                              placeholder="No passage"
                            />
                          </td>
                        )}
                        <td className="py-5 px-3 w-96 min-w-[380px]">
                          <textarea
                            value={q.questionEn}
                            title={q.questionEn}
                            rows={4}
                            onChange={(e) => handleCellBlur(originalIdx, 'questionEn', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-semibold text-text-primary resize-none"
                          />
                        </td>
                        {hasQuestionTa && (
                          <td className="py-5 px-3 w-96 min-w-[380px] text-emerald-600">
                            <textarea
                              value={q.questionTa || ''}
                              title={q.questionTa || ''}
                              rows={4}
                              onChange={(e) => handleCellBlur(originalIdx, 'questionTa', e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-xs font-bold text-emerald-650 resize-none"
                            />
                          </td>
                        )}
                        <td className="py-5 px-3 w-60 min-w-[220px]">
                          <input
                            type="text"
                            value={q.optionA}
                            title={q.optionA}
                            onChange={(e) => handleCellBlur(originalIdx, 'optionA', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-semibold py-1"
                          />
                        </td>
                        <td className="py-5 px-3 w-60 min-w-[220px]">
                          <input
                            type="text"
                            value={q.optionB}
                            title={q.optionB}
                            onChange={(e) => handleCellBlur(originalIdx, 'optionB', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-semibold py-1"
                          />
                        </td>
                        {hasOptionC && (
                          <td className="py-5 px-3 w-60 min-w-[220px]">
                            <input
                              type="text"
                              value={q.optionC}
                              title={q.optionC}
                              onChange={(e) => handleCellBlur(originalIdx, 'optionC', e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-xs font-semibold py-1"
                            />
                          </td>
                        )}
                        {hasOptionD && (
                          <td className="py-5 px-3 w-60 min-w-[220px]">
                            <input
                              type="text"
                              value={q.optionD}
                              title={q.optionD}
                              onChange={(e) => handleCellBlur(originalIdx, 'optionD', e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-xs font-semibold py-1"
                            />
                          </td>
                        )}
                        {hasOptionE && (
                          <td className="py-5 px-3 w-60 min-w-[220px]">
                            <input
                              type="text"
                              value={q.optionE}
                              title={q.optionE}
                              onChange={(e) => handleCellBlur(originalIdx, 'optionE', e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-xs font-semibold py-1"
                            />
                          </td>
                        )}
                        <td className="py-5 px-3 w-20 text-center text-teal-600 font-black uppercase relative">
                          <input
                            type="text"
                            value={q.correctOption}
                            title={`Correct Option: ${q.correctOption}`}
                            onChange={(e) => handleCellBlur(originalIdx, 'correctOption', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs text-center font-bold text-teal-600 py-1"
                          />
                          {q.missingAnswer && !q.hasIssue && (
                            <span className="block text-[9px] text-amber-500 font-bold mt-0.5 whitespace-nowrap">
                              ⚠ No Answer
                            </span>
                          )}
                        </td>
                        <td className="py-5 px-3 w-20 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteRow(originalIdx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                            title="Delete this question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Live Simulator Preview Frame */}
            {isSimulatorOpen && parsedQuestions[selectedQuestionIndex] && (
              <div className="col-span-12 lg:col-span-4 flex justify-center">
                <div className="w-[420px] h-[640px] bg-[#FAF9FF] dark:bg-slate-900 rounded-[28px] overflow-hidden flex flex-col relative text-slate-800 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-800">
                  {/* Mock App Bar */}
                  <div className="bg-[#0F3CC9] pt-4 pb-3 px-4 text-white flex justify-between items-center text-xs font-bold">
                    <span>Q.{parsedQuestions[selectedQuestionIndex].number} of {parsedQuestions.length}</span>
                    <span className="truncate max-w-[180px]">{parsedQuestions[selectedQuestionIndex].questionEn.substring(0, 25)}...</span>
                  </div>

                  {/* Simulator Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white dark:bg-slate-850 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
                      {parsedQuestions[selectedQuestionIndex].sharedContext && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700/50 rounded-lg p-2.5 text-xs text-slate-650 dark:text-slate-400 max-h-32 overflow-y-auto leading-relaxed">
                          {parsedQuestions[selectedQuestionIndex].sharedContext}
                        </div>
                      )}
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-relaxed">
                        {parsedQuestions[selectedQuestionIndex].questionEn}
                      </p>
                      {parsedQuestions[selectedQuestionIndex].questionTa && (
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed font-sans mt-1">
                          {parsedQuestions[selectedQuestionIndex].questionTa}
                        </p>
                      )}

                      {/* Options */}
                      <div className="space-y-2 pt-2 text-xs">
                        {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                          const valEn = parsedQuestions[selectedQuestionIndex][`option${opt}`];
                          const valTa = parsedQuestions[selectedQuestionIndex][`option${opt}Ta`];
                          if (!valEn && !valTa) return null;
                          const isCorrect = parsedQuestions[selectedQuestionIndex].correctOption === opt;
                          return (
                            <div
                              key={opt}
                              className={`p-3 rounded-lg border font-semibold transition-all ${
                                isCorrect
                                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400'
                                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="font-bold mr-1.5">{opt}.</span> {valEn}
                              {valTa && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-sans mt-1">{valTa}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-3 flex justify-between items-center text-xs font-bold">
                    <button
                      onClick={() => setSelectedQuestionIndex(p => Math.max(0, p - 1))}
                      className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setSelectedQuestionIndex(p => Math.min(parsedQuestions.length - 1, p + 1))}
                      className="px-4.5 py-1.5 bg-[#0F3CC9] text-white rounded-lg hover:bg-blue-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1-Click Test Builder Wizard Modal */}
      {isTestWizardOpen && (
        <TestBuilderWizardModal
          isOpen={isTestWizardOpen}
          onClose={() => {
            setIsTestWizardOpen(false);
            onSuccess();
          }}
          onSubmit={handleTestBuilderSubmit}
          preSelectedQuestions={savedQuestionsForTest}
          prefilledTitle={customBatchName.trim() || (file ? file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'New Practice Test')}
          prefilledSubjectId={selectedSubject}
          prefilledCategoryId={selectedCategory}
          prefilledBatchName={customBatchName.trim() || file?.name || 'Uploaded Batch'}
          prefilledSections={sectionsConfig.map((sec, idx) => ({
            id: sec.id,
            name: sec.name || `Section ${idx + 1}`,
            order: idx,
            duration: Number(sec.duration) || 20,
            cutoff_marks: Number(sec.cutoffMarks) || 35,
            total_marks: parsedQuestions.filter(q => q.number >= sec.fromNumber && q.number <= sec.toNumber).length,
            fromNumber: sec.fromNumber,
            toNumber: sec.toNumber,
            subjectId: sec.subjectId,
            topicId: sec.topicId,
          }))}
        />
      )}
    </div>
  );
}
