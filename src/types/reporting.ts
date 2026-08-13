// ============================================================
// Advanced Reporting Types
// ============================================================

export interface ReportTemplate {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  report_type: 'campaign_performance' | 'influencer_analytics' | 'financial_summary' | 'collaboration_report' | 'custom';
  category?: 'marketing' | 'sales' | 'finance' | 'operations' | 'custom';
  template_config: Record<string, any>;
  is_system: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedReport {
  id: string;
  user_id: string;
  template_id?: string;
  report_name: string;
  report_type: string;
  parameters: Record<string, any>;
  data: Record<string, any>;
  row_count: number;
  status: 'generating' | 'completed' | 'failed';
  file_url?: string;
  file_format?: 'pdf' | 'xlsx' | 'csv';
  file_size_bytes?: number;
  generated_at?: string;
  expires_at: string;
  error_message?: string;
  created_at: string;
}

export interface ScheduledReport {
  id: string;
  user_id: string;
  template_id?: string;
  report_name: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule_config: Record<string, any>;
  parameters: Record<string, any>;
  output_format: 'pdf' | 'xlsx' | 'csv';
  delivery_method: 'email' | 'webhook' | 'both';
  recipients: string[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportShare {
  id: string;
  report_id: string;
  shared_by?: string;
  shared_with?: string;
  share_token?: string;
  share_type: 'user' | 'public_link' | 'email';
  permissions: Record<string, boolean>;
  expires_at?: string;
  access_count: number;
  last_accessed_at?: string;
  created_at: string;
}

export interface ReportFavorite {
  id: string;
  user_id: string;
  report_id: string;
  created_at: string;
}

export interface ReportParameters {
  period_start?: string;
  period_end?: string;
  filters?: Record<string, any>;
  group_by?: string[];
  columns?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ReportData {
  columns: string[];
  rows: any[];
  summary?: Record<string, any>;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
}
