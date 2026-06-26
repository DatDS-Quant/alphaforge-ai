import type {
  DataGenerateRequest,
  DataGenerateResponse,
  AlphaGenerateRequest,
  AlphaGenerateResponse,
  AlphaEvaluateRequest,
  AlphaEvaluateResponse,
  BacktestRunRequest,
  BacktestRunResponse,
  RiskEvaluateRequest,
  RiskEvaluateResponse,
  ReportGenerateRequest,
  ReportGenerateResponse,
  ExperimentSaveResponse,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorMessage = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorMessage = errorJson.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  async generateData(req: DataGenerateRequest): Promise<DataGenerateResponse> {
    return request<DataGenerateResponse>('/data/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async generateAlpha(req: AlphaGenerateRequest): Promise<AlphaGenerateResponse> {
    return request<AlphaGenerateResponse>('/alpha/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async evaluateAlpha(req: AlphaEvaluateRequest): Promise<AlphaEvaluateResponse> {
    return request<AlphaEvaluateResponse>('/alpha/evaluate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async runBacktest(req: BacktestRunRequest): Promise<BacktestRunResponse> {
    return request<BacktestRunResponse>('/backtest/run', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async evaluateRisk(req: RiskEvaluateRequest): Promise<RiskEvaluateResponse> {
    return request<RiskEvaluateResponse>('/risk/evaluate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async generateReport(req: ReportGenerateRequest): Promise<ReportGenerateResponse> {
    return request<ReportGenerateResponse>('/report/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async saveExperiment(req: ReportGenerateRequest): Promise<ExperimentSaveResponse> {
    return request<ExperimentSaveResponse>('/experiments/save', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
