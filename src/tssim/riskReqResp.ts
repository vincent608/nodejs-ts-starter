export interface RiskReq {
  uuid: string;
  pan: string;
  score: string;
  scoreType: string;
  startDate: string;
  endDate: string;
  portfolio: string;
}

export interface RiskResp {
  uuid: string;
  respCode: string;
}
