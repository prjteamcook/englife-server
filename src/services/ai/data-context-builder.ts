import fs from 'fs';
import path from 'path';

interface VocabularyItem {
  word: string;
  word_meaning: string;
  example: {
    example_eng: string;
    example_kor: string;
  };
  level: string;
}

interface BasicSentenceItem {
  lesson_title: string;
  expression_list: Array<{
    kor_expression: string;
    eng_expression: string;
    example: string;
    basic_exercise_list: Array<{
      kor_sentence: string;
      eng_sentence1: string;
    }>;
  }>;
}

interface LifestyleItem {
  eng_title: string;
  kor_title: string;
  eng_content: string;
  kor_content: string;
  words: Array<{
    word: string;
    mean: string;
  }>;
}

class DataContextBuilder {
  private vocabularyData: VocabularyItem[] = [];
  private basicSentenceData: BasicSentenceItem[] = [];
  private lifestyleData: LifestyleItem[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const assetsPath = path.join(__dirname, '../../assets');
      
      // Load vocabulary data
      const vocabPath = path.join(assetsPath, 'voca_10000.json');
      const vocabRaw = fs.readFileSync(vocabPath, 'utf-8');
      this.vocabularyData = JSON.parse(vocabRaw);

      // Load basic sentence data
      const basicSentencePath = path.join(assetsPath, 'english_by_basic_sentence.json');
      const basicSentenceRaw = fs.readFileSync(basicSentencePath, 'utf-8');
      this.basicSentenceData = JSON.parse(basicSentenceRaw);

      // Load lifestyle data
      const lifestylePath = path.join(assetsPath, 'your_life_style.json');
      const lifestyleRaw = fs.readFileSync(lifestylePath, 'utf-8');
      this.lifestyleData = JSON.parse(lifestyleRaw);

      console.log('영어 학습 데이터 로드 완료');
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  }

  // 상황에 맞는 학습 데이터 컨텍스트 생성
  public buildLearningContext(situation: string, detectedWords: string[] = []): string {
    let context = `다음은 영어 학습을 위한 참고 자료입니다. 이 데이터를 참고하여 주어진 상황에 맞는 자연스러운 영어 예문들을 생성해주세요.\n\n`;
    
    // 1. 관련 어휘 찾기
    const relevantVocab = this.findRelevantVocabulary(situation, detectedWords);
    if (relevantVocab.length > 0) {
      context += `=== 관련 어휘 ===\n`;
      relevantVocab.slice(0, 20).forEach(vocab => {
        context += `- ${vocab.word}: ${vocab.word_meaning}\n`;
        context += `  예문: ${vocab.example.example_eng}\n`;
        context += `  번역: ${vocab.example.example_kor}\n\n`;
      });
    }

    // 2. 관련 기본 문형 찾기
    const relevantExpressions = this.findRelevantExpressions(situation, detectedWords);
    if (relevantExpressions.length > 0) {
      context += `=== 관련 기본 표현 ===\n`;
      relevantExpressions.slice(0, 15).forEach(expr => {
        context += `- ${expr.kor_expression} → ${expr.eng_expression}\n`;
        context += `  예문: ${expr.example}\n`;
        if (expr.basic_exercise_list && expr.basic_exercise_list.length > 0) {
          expr.basic_exercise_list.slice(0, 2).forEach((exercise: any) => {
            if (exercise.eng_sentence1) {
              context += `  연습: ${exercise.kor_sentence}\n`;
              context += `  영작: ${exercise.eng_sentence1}\n`;
            }
          });
        }
        context += `\n`;
      });
    }

    // 3. 관련 생활 영어 찾기
    const relevantLifestyle = this.findRelevantLifestyle(situation, detectedWords);
    if (relevantLifestyle.length > 0) {
      context += `=== 관련 생활 영어 ===\n`;
      relevantLifestyle.slice(0, 10).forEach(lifestyle => {
        context += `주제: ${lifestyle.eng_title} (${lifestyle.kor_title})\n`;
        // 문장을 나누어서 보여주기
        const sentences = lifestyle.eng_content
          .replace(/<br>/g, ' ')
          .split(/[.!?]+/)
          .filter(s => s.trim().length > 20)
          .slice(0, 3);
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            context += `- ${sentence.trim()}.\n`;
          }
        });
        context += `\n`;
      });
    }

    return context;
  }

  private findRelevantVocabulary(situation: string, detectedWords: string[]): VocabularyItem[] {
    const keywords = [...detectedWords, ...this.extractKeywords(situation)];
    
    return this.vocabularyData.filter(vocab => {
      const searchText = `${vocab.word} ${vocab.word_meaning} ${vocab.example.example_eng} ${vocab.example.example_kor}`.toLowerCase();
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(vocab.word.toLowerCase())
      );
    });
  }

  private findRelevantExpressions(situation: string, detectedWords: string[]): any[] {
    const keywords = [...detectedWords, ...this.extractKeywords(situation)];
    const expressions: any[] = [];

    this.basicSentenceData.forEach(lesson => {
      lesson.expression_list.forEach(expr => {
        const searchText = `${expr.kor_expression} ${expr.eng_expression} ${expr.example}`.toLowerCase();
        const isRelevant = keywords.some(keyword => 
          searchText.includes(keyword.toLowerCase())
        );
        if (isRelevant) {
          expressions.push(expr);
        }
      });
    });

    return expressions;
  }

  private findRelevantLifestyle(situation: string, detectedWords: string[]): LifestyleItem[] {
    const keywords = [...detectedWords, ...this.extractKeywords(situation)];
    
    return this.lifestyleData.filter(lifestyle => {
      const searchText = `${lifestyle.eng_title} ${lifestyle.kor_title} ${lifestyle.eng_content}`.toLowerCase();
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
  }

  private extractKeywords(situation: string): string[] {
    // 상황에서 키워드 추출 (간단한 형태소 분석)
    const keywords: string[] = [];
    const words = situation.toLowerCase().split(/\s+/);
    
    // 영어 단어들 추출
    words.forEach(word => {
      if (word.match(/[a-zA-Z]{2,}/)) {
        keywords.push(word);
      }
    });

    // 한국어에서 영어 학습과 관련된 주요 키워드 매핑
    const koreanMappings = {
      '카페': ['cafe', 'coffee', 'drink', 'order'],
      '식당': ['restaurant', 'food', 'eat', 'meal', 'order'],
      '학교': ['school', 'study', 'learn', 'class', 'student'],
      '회사': ['office', 'work', 'business', 'meeting'],
      '집': ['home', 'house', 'family', 'room'],
      '쇼핑': ['shopping', 'buy', 'store', 'money'],
      '여행': ['travel', 'trip', 'vacation', 'hotel'],
      '운동': ['exercise', 'sport', 'health', 'fitness'],
      '요리': ['cooking', 'food', 'kitchen', 'recipe'],
      '병원': ['hospital', 'doctor', 'health', 'medicine']
    };

    Object.entries(koreanMappings).forEach(([korean, englishWords]) => {
      if (situation.includes(korean)) {
        keywords.push(...englishWords);
      }
    });

    return keywords;
  }

  // 특정 상황에 대한 샘플 데이터 가져오기
  public getSampleDataForSituation(situation: string): {
    vocabulary: VocabularyItem[];
    expressions: any[];
    lifestyle: LifestyleItem[];
  } {
    const detectedWords: string[] = [];
    
    return {
      vocabulary: this.findRelevantVocabulary(situation, detectedWords).slice(0, 10),
      expressions: this.findRelevantExpressions(situation, detectedWords).slice(0, 10),
      lifestyle: this.findRelevantLifestyle(situation, detectedWords).slice(0, 5)
    };
  }
}

export const dataContextBuilder = new DataContextBuilder();
