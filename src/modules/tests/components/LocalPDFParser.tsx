import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileText, AlertCircle, RefreshCw, Download, CheckCircle } from 'lucide-react';
import { apiClient, useExamCategories } from '../../../core/api/endpoints';

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
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error('Failed to load SheetJS'));
    document.head.appendChild(script);
  });
};

interface LocalPDFParserProps {
  onSuccess: () => void;
}

export default function LocalPDFParser({ onSuccess }: LocalPDFParserProps) {
  const { data: categories = [] } = useExamCategories();

  // State management
  const [file, setFile] = useState<File | null>(null);
  const [ansKeyFile, setAnsKeyFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingStatusText, setParsingStatusText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[System Ready] Drop a PDF above to begin.']);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<'Detecting...' | 'IBPS PO / Banking' | 'TNPSC / State Exam'>('Detecting...');
  
  // OCR suggestion states
  const [showOcrBanner, setShowOcrBanner] = useState(false);
  const [tamilRatio, setTamilRatio] = useState(0);
  const [ocrTextHolder, setOcrTextHolder] = useState('');

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Search & Filter preview
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = useMemo(() => {
    return parsedQuestions.filter(q => {
      if (filterIssuesOnly && !q.hasIssue) return false;
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
  }, [parsedQuestions, filterIssuesOnly, searchQuery]);

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
        for (let i = 0; i < nonWhitespaceChars.length; i++) {
          const code = nonWhitespaceChars.charCodeAt(i);
          if (code >= 0x0B80 && code <= 0x0BFF) {
            tamilCharCount++;
          }
        }
        localTamilRatio = (tamilCharCount / totalNonWhitespace) * 100;
      }

      const hasQPrefix = fullText.match(/\bQ\d+\./) !== null;
      const isBanking = hasQPrefix;

      if (!isBanking && totalNonWhitespace >= 200) {
        if (localTamilRatio < 0.5) {
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
    addLog(`Parsing answer key lines (${lines.length} lines)...`);

    const pattern1 = /(\d+)\.\s*\(([a-eA-E])\)/g;  
    const pattern2 = /(\d+)\)\s*([a-eA-E])\b/g;    
    const pattern3 = /(\d+)\s*[-–]\s*([a-eA-E])\b/g; 
    const pattern4 = /^(\d+)\s+([a-eA-E])\s*$/;    

    let currentQNum: number | null = null;
    const questionRegex = /^\s*Q?(\d+)\.\s*(.*)$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const qMatch = line.match(questionRegex);
      if (qMatch) {
        currentQNum = parseInt(qMatch[1]);
      }

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

      let matched = false;
      let match;

      pattern1.lastIndex = 0;
      pattern2.lastIndex = 0;
      pattern3.lastIndex = 0;

      while ((match = pattern1.exec(line)) !== null) {
        answerKeyMapRef.current.set(parseInt(match[1]), match[2].toUpperCase());
        matched = true;
      }

      if (!matched) {
        while ((match = pattern2.exec(line)) !== null) {
          answerKeyMapRef.current.set(parseInt(match[1]), match[2].toUpperCase());
          matched = true;
        }
      }

      if (!matched) {
        while ((match = pattern3.exec(line)) !== null) {
          answerKeyMapRef.current.set(parseInt(match[1]), match[2].toUpperCase());
          matched = true;
        }
      }

      if (!matched) {
        const singleMatch = line.match(pattern4);
        if (singleMatch) {
          answerKeyMapRef.current.set(parseInt(singleMatch[1]), singleMatch[2].toUpperCase());
          matched = true;
        }
      }
    }

    addLog(`Answer key parsing complete: mapped ${answerKeyMapRef.current.size} questions.`, 'success');
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
        hasIssue: !q.optionA || !q.optionB || !correct
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

    setDetectedFormat(isBanking ? 'IBPS PO / Banking' : 'TNPSC / State Exam');
    addLog(`Detected Format: ${isBanking ? 'Banking (Q1. prefix)' : 'TNPSC (1. prefix)'}`);

    let text = rawText.replace(/[✓✔☑]/g, ' ');

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
      : /^(\d+)\.\s+(.+)$/;

    const sectionMarkerRegex = /^Q\.\d+\s*\(/i;

    const optionStartRegex = isBanking
      ? /^\(([a-eA-E])\)\s*(.*)$/
      : /^([A-E])\)\s*(.*)$/;

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

    addLog(`Tokenized into ${lines.length} lines. Starting parser loop...`);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (solutionsBoundary.test(line)) {
        addLog(`Solutions section detected at line ${i}. Terminating question collection loop.`);
        break;
      }

      if (line.includes('விடைகளுடன்') || line.includes('தேர்வு') || line.includes('டி.என்.பி.எஸ்.சி')) {
        continue;
      }

      if (sectionMarkerRegex.test(line)) continue;

      if (!isBanking) {
        const inlineQMatch = line.match(/^(.+)\s+(\d{1,3})\.\s+(.+)$/);
        if (inlineQMatch) {
          const beforeNum = inlineQMatch[1].trimEnd();
          const qNum = parseInt(inlineQMatch[2]);
          const afterNum = inlineQMatch[3];
          const lastChar = beforeNum.slice(-1);
          const lastCharCode = lastChar.charCodeAt(0);
          
          const isTamilChar = lastCharCode >= 0x0B80 && lastCharCode <= 0x0BFF;
          const isBadChar = /[\d%\/]/.test(lastChar) || isTamilChar;
          if (qNum >= 1 && qNum <= 100 && !isBadChar) {
            line = beforeNum.trim();
            lines.splice(i + 1, 0, `${inlineQMatch[2]}. ${afterNum}`);
            addLog(`Splitting inline question out of text line at position ${beforeNum.length}`);
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
          if (currentQuestion) questions.push(currentQuestion);

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
          const label = singleOpt[1].toUpperCase();
          let optText = singleOpt[2].trim();

          const moreOptMatch = optText.match(/\s+([B-E])\)\s/);
          if (moreOptMatch) {
            const fullOptLine = line; 
            const optParts = fullOptLine.split(/\s+(?=[A-E]\))/);
            for (const part of optParts) {
              const m = part.trim().match(optionStartRegex);
              if (m) {
                const lbl = m[1].toUpperCase();
                const val = m[2].trim();
                if (val.length > 0) {
                  currentQuestion.options[lbl] = val;
                  currentQuestion.lastActiveOption = lbl;
                } else {
                  currentQuestion.options[lbl] = '';
                  currentQuestion.lastActiveOption = lbl;
                }
              }
            }
          } else {
            if (optText.length > 0) {
              currentQuestion.options[label] = optText;
            } else {
              currentQuestion.options[label] = '';
            }
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

    addLog(`Base parse complete: ${questions.length} questions constructed. Processing keys...`);

    const answersMap: Record<number, string> = {};
    const answerRegex = /S(\d+)\.\s+Ans\.\(([a-eA-E])\)/g;
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

      const correct = answerKeyMapRef.current.get(q.number) || answersMap[q.number] || '';
      const hasIssue = !optA || !optB || !correct;

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

    setParsedQuestions(finalizedList);
    setIsParsing(false);
    setSelectedQuestionIndex(0);
    addLog("All components parsed and rendered successfully!", 'success');
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
          subject_id: q.subjectId || null,
          topic_id: q.topicId || null,
          exam_category: q.examCategory,
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
      alert(`Successfully saved ${parsedQuestions.length} questions to database.`);
      onSuccess();
    } catch (err: any) {
      addLog(`Database upload failed: ${err.message}`, 'error');
      alert(`Save failed. Error: ${err.message}`);
    } finally {
      setIsSaving(false);
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

  // Inline table cell editor handler
  const handleCellBlur = (idx: number, field: string, value: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: value,
        hasIssue: !copy[idx].optionA || !copy[idx].optionB || (field === 'correctOption' ? !value : !copy[idx].correctOption)
      };
      return copy;
    });
  };

  const activeCategory = categories.find((c) => c.id === selectedCategory);
  const subjectsList = activeCategory?.subjects || [];
  const activeSubject = subjectsList.find((s) => s.id === selectedSubject);
  const topicsList = activeSubject?.topics || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dropzone Questions */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, 'questions')}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/85 hover:border-accent rounded-3xl p-6 text-center cursor-pointer transition-colors bg-cardBg"
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

      {/* Database Taxonomy Selector card */}
      {parsedQuestions.length > 0 && (
        <div className="bg-cardBg border border-border/45 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Database Taxonomy Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategory(val);
                  setSelectedSubject('');
                  setSelectedTopic('');
                  setParsedQuestions((prev) => prev.map(q => ({ ...q, examCategory: val })));
                }}
                className="w-full bg-slate-50 border border-border/50 rounded-xl px-3 py-2 text-xs font-bold text-text-secondary outline-none focus:border-accent"
              >
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSubject(val);
                  setSelectedTopic('');
                  setParsedQuestions((prev) => prev.map(q => ({ ...q, subjectId: val })));
                }}
                disabled={!selectedCategory}
                className="w-full bg-slate-50 border border-border/50 rounded-xl px-3 py-2 text-xs font-bold text-text-secondary outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {subjectsList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTopic(val);
                  setParsedQuestions((prev) => prev.map(q => ({ ...q, topicId: val })));
                }}
                disabled={!selectedSubject}
                className="w-full bg-slate-50 border border-border/50 rounded-xl px-3 py-2 text-xs font-bold text-text-secondary outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">Select Topic</option>
                {topicsList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Log traces */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">System Log Trace</span>
          <button onClick={() => setLogs([])} className="text-[9px] text-slate-500 hover:text-slate-350">Clear</button>
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
                onClick={() => setFilterIssuesOnly(!filterIssuesOnly)}
                className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all ${
                  filterIssuesOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-slate-50 border-border/50 text-text-secondary'
                }`}
              >
                Issues Only ({parsedQuestions.filter(q => q.hasIssue).length})
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
                className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-accent/15 transition-all"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving ({saveProgress}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Upload to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className={`${isSimulatorOpen ? 'col-span-12 lg:col-span-8' : 'col-span-12'} w-full overflow-x-auto overflow-y-auto max-h-[500px] border border-border/50 rounded-2xl bg-cardBg`}>
              <table className="w-full text-left border-collapse min-w-[2200px]">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                  <tr className="text-[10px] font-bold text-text-secondary uppercase">
                    <th className="py-2.5 px-3 w-12 text-center bg-slate-50 dark:bg-slate-900">#</th>
                    <th className="py-2.5 px-3 w-40 bg-slate-50 dark:bg-slate-900">Format</th>
                    {hasComprehension && <th className="py-2.5 px-3 w-96 min-w-[380px] bg-slate-50 dark:bg-slate-900">Comprehension</th>}
                    <th className="py-2.5 px-3 w-96 min-w-[380px] bg-slate-50 dark:bg-slate-900">Question EN</th>
                    {hasQuestionTa && <th className="py-2.5 px-3 w-96 min-w-[380px] bg-slate-50 dark:bg-slate-900">Question TA</th>}
                    <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option A</th>
                    <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option B</th>
                    {hasOptionC && <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option C</th>}
                    {hasOptionD && <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option D</th>}
                    {hasOptionE && <th className="py-2.5 px-3 w-60 min-w-[220px] bg-slate-50 dark:bg-slate-900">Option E</th>}
                    <th className="py-2.5 px-3 w-20 text-center bg-slate-50 dark:bg-slate-900">Answer</th>
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
                        <td className="py-5 px-3 w-12 text-center text-text-secondary font-bold">{q.number}</td>
                        <td className="py-5 px-3 w-40">
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
                        <td className="py-5 px-3 w-20 text-center text-teal-600 font-black uppercase">
                          <input
                            type="text"
                            value={q.correctOption}
                            title={`Correct Option: ${q.correctOption}`}
                            onChange={(e) => handleCellBlur(originalIdx, 'correctOption', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs text-center font-bold text-teal-600 py-1"
                          />
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
    </div>
  );
}
