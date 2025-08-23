import type { Request, Response } from 'express';
import { imageAnalysisService } from './image-analysis-service';
import { logger } from '../../resources';

export const pingpong = async (req: Request, res: Response) => {
  res.json({ message: 'pong' });
};

export const analyzeImageWithLearning = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일이 제공되지 않았습니다.'
      });
    }

    // 이미지를 base64로 변환
    const imageBase64 = req.file.buffer.toString('base64');
    
    logger.info('이미지 분석 및 예문 생성 시작');
    
    // 이미지 분석 및 예문 생성 수행
    const result = await imageAnalysisService.analyzeImageAndGenerateExamples(imageBase64);
    
    logger.info('이미지 분석 및 예문 생성 완료', { 
      extractedWordsCount: result.extractedWords.length,
      generatedExamplesCount: result.generatedExamples.length,
      scenarioDialogueCount: result.scenario.dialogue.length
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('이미지 분석 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '이미지 분석 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
};



export const generateExamplesForSituation = async (req: Request, res: Response) => {
  try {
    const { situation } = req.body;
    
    if (!situation || typeof situation !== 'string') {
      return res.status(400).json({
        success: false,
        message: '상황 정보가 제공되지 않았습니다.'
      });
    }

    logger.info('상황별 예문 생성 시작', { situation });

    const result = await imageAnalysisService.generateExamplesForSituation(situation);
    
    logger.info('상황별 예문 생성 완료', { 
      examplesCount: result.generatedExamples.length,
      scenarioDialogueCount: result.scenario.dialogue.length
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('상황별 예문 생성 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '상황별 예문 생성 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
};
