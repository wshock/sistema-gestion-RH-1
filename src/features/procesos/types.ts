export type TransferLogRow = {
  businessEntityId: number;
  employeeName: string;
  departmentName: string;
  shiftName: string;
  startDate: string;
  endDate: string | null;
};

export type SalaryLogRow = {
  businessEntityId: number;
  employeeName: string;
  rate: number;
  payFrequency: number;
  rateChangeDate: Date;
  current: boolean;
};
