import OpenAI from 'openai';
import config from '../../config';
import { dataContextBuilder } from './data-context-builder';

interface ExtractedWord {
  word: string;
  x: number;
  y: number;
  confidence?: number;
}

interface SituationAnalysis {
  situation: string;
  context: string;
  relevantTopics: string[];
}

interface GeneratedExample {
  english: string;
  korean: string;
  situation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ScenarioDialogue {
  speaker: string;
  english: string;
  korean: string;
}

interface Scenario {
  title: string;
  situation: string;
  dialogue: ScenarioDialogue[];
}

interface ImageAnalysisResult {
  extractedWords: ExtractedWord[];
  situationAnalysis: SituationAnalysis;
  generatedExamples: GeneratedExample[];
  scenario: Scenario;
}

class ImageAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.gpt_api,
    });
  }

  async analyzeImageAndGenerateExamples(imageBase64: string): Promise<ImageAnalysisResult> {
    try {
      // 1단계: 이미지 분석으로 기본 정보 추출
      const { extractedWords, situationAnalysis } = await this.analyzeImage(imageBase64);

      // 2단계: 학습 데이터 컨텍스트 구성
      const learningContext = dataContextBuilder.buildLearningContext(
        situationAnalysis.situation,
        extractedWords.map(w => w.word)
      );

      // 3단계: GPT로 상황에 맞는 예문 및 시나리오 생성
      const { generatedExamples, scenario } = await this.generateSituationalExamples(
        situationAnalysis,
        extractedWords,
        learningContext
      );

      return {
        extractedWords,
        situationAnalysis,
        generatedExamples,
        scenario
      };

    } catch (error) {
      console.error('이미지 분석 및 예문 생성 오류:', error);
      throw error;
    }
  }

  private async analyzeImage(imageBase64: string): Promise<{
    extractedWords: ExtractedWord[];
    situationAnalysis: SituationAnalysis;
  }> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이미지를 분석해서 다음 정보를 JSON 형태로 제공해주세요:

1. 이미지에서 보이는 모든 영어 단어나 텍스트를 추출하고, 각 단어의 대략적인 위치 좌표(x, y)를 이미지 크기 기준 픽셀로 표시
2. 이미지의 상황/맥락을 분석하여 어떤 상황인지, 어떤 주제와 관련이 있는지 설명

응답 형식:
{
  "extractedWords": [
    {
      "word": "영어단어",
      "ko": "한국어 단어",
      "x": 50,
      "y": 30,
      "confidence": 0.9
    }
  ],
  "situationAnalysis": {
    "situation": "상황 설명",
    "context": "맥락 설명", 
    "relevantTopics": ["관련주제1", "관련주제2"]
  }
}

모든 텍스트는 한국어로 작성하되, 추출된 영어 단어는 원문 그대로 유지해주세요.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI 응답이 비어있습니다');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('OpenAI 응답에서 JSON을 찾을 수 없습니다');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      extractedWords: result.extractedWords || [],
      situationAnalysis: result.situationAnalysis || {
        situation: '분석된 상황이 없습니다',
        context: '분석된 맥락이 없습니다',
        relevantTopics: []
      }
    };
  }

  private async generateSituationalExamples(
    situationAnalysis: SituationAnalysis,
    extractedWords: ExtractedWord[],
    learningContext: string
  ): Promise<{
    generatedExamples: GeneratedExample[];
    scenario: Scenario;
  }> {
    const prompt = `${learningContext}

위의 영어 학습 자료를 참고하여, 다음 상황에 맞는 실용적인 영어 예문들을 생성해주세요:

상황: ${situationAnalysis.situation}
맥락: ${situationAnalysis.context}
관련 주제: ${situationAnalysis.relevantTopics.join(', ')}
감지된 단어들: ${extractedWords.map(w => w.word).join(', ')}

요구사항:
1. 초급자용 3개, 중급자용 3개, 고급자용 2개 총 8개의 예문 생성
2. 각 예문은 해당 상황에서 실제로 사용할 수 있는 자연스러운 표현
3. 제공된 학습 자료의 패턴과 어휘를 참고하되, 완전히 같을 필요는 없음
4. 각 예문에 한국어 번역 포함
5. 해당 상황에서 일어날 법한 상황극 시나리오 1개 생성 (3-4번의 대화 주고받기)

응답 형식:
{
  "generatedExamples": [
    {
      "english": "영어 예문",
      "korean": "한국어 번역",
      "situation": "사용 상황 설명",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "scenario": {
    "title": "시나리오 제목",
    "situation": "시나리오 상황 설명",
    "dialogue": [
      {
        "speaker": "Customer|Staff|Person A|Person B 등",
        "english": "영어 대사",
        "korean": "한국어 번역"
      }
    ]
  }
}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('예문 생성 응답이 비어있습니다');
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('예문 생성 응답에서 JSON을 찾을 수 없습니다');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        generatedExamples: result.generatedExamples || [],
        scenario: result.scenario || {
          title: "기본 상황극",
          situation: "일반적인 상황",
          dialogue: [
            {
              speaker: "Person A",
              english: "Hello, how are you?",
              korean: "안녕하세요, 어떻게 지내세요?"
            },
            {
              speaker: "Person B", 
              english: "I'm fine, thank you.",
              korean: "잘 지내고 있습니다, 감사해요."
            }
          ]
        }
      };
    } catch (error) {
      console.error('예문 생성 결과 파싱 오류:', error);
      
      // 기본 예문 반환
      return {
        generatedExamples: [
          {
            english: "This looks interesting.",
            korean: "이것은 흥미로워 보입니다.",
            situation: "일반적인 상황",
            difficulty: "beginner" as const
          }
        ],
        scenario: {
          title: "기본 상황극",
          situation: "일반적인 상황",
          dialogue: [
            {
              speaker: "Person A",
              english: "Hello, how are you?",
              korean: "안녕하세요, 어떻게 지내세요?"
            },
            {
              speaker: "Person B",
              english: "I'm fine, thank you.",
              korean: "잘 지내고 있습니다, 감사해요."
            }
          ]
        }
      };
    }
  }

  // 특정 상황에 대한 예문만 생성 (이미지 없이)
  async generateExamplesForSituation(situation: string): Promise<{
    generatedExamples: GeneratedExample[];
    scenario: Scenario;
    sampleData: any;
  }> {
    const learningContext = dataContextBuilder.buildLearningContext(situation);
    const sampleData = dataContextBuilder.getSampleDataForSituation(situation);

    const { generatedExamples, scenario } = await this.generateSituationalExamples(
      {
        situation,
        context: `${situation}과 관련된 상황`,
        relevantTopics: [situation]
      },
      [],
      learningContext
    );

    return {
      generatedExamples,
      scenario,
      sampleData
    };
  }
}

export const imageAnalysisService = new ImageAnalysisService();
